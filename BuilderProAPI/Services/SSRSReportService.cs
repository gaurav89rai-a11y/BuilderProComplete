using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using BuilderProAPI.Models;

namespace BuilderProAPI.Services;

public class SSRSReportService : ISSRSReportService
{
    private readonly SSRSConfig _config;
    private readonly ILogger<SSRSReportService> _logger;

    public SSRSReportService(IOptions<SSRSConfig> config, ILogger<SSRSReportService> logger)
    {
        _config = config.Value;
        _logger = logger;
    }

    private HttpClient CreateHttpClient()
    {
        var handler = new HttpClientHandler();

        if (_config.UseDefaultCredentials)
        {
            handler.UseDefaultCredentials = true;
        }
        else if (!string.IsNullOrEmpty(_config.Username))
        {
            handler.Credentials = new NetworkCredential(_config.Username, _config.Password ?? "", _config.Domain ?? "");
        }

        var client = new HttpClient(handler);
        client.Timeout = TimeSpan.FromSeconds(_config.TimeoutSeconds > 0 ? _config.TimeoutSeconds : 15);
        return client;
    }

    public async Task<SSRSHealthResult> CheckHealthAsync()
    {
        var result = new SSRSHealthResult
        {
            ServerUrl = _config.ReportServerUrl ?? "",
            IsConnected = false,
            IsFallbackActive = true
        };

        if (!_config.Enabled)
        {
            result.Message = "SSRS integration is disabled in configuration. High-Performance SQL Fallback Engine is active.";
            return result;
        }

        if (string.IsNullOrWhiteSpace(_config.ReportServerUrl))
        {
            result.Message = "SSRS ReportServerUrl is not configured in appsettings.json. High-Performance SQL Fallback Engine is active.";
            return result;
        }

        var sw = Stopwatch.StartNew();
        try
        {
            using var client = CreateHttpClient();
            var response = await client.GetAsync(_config.ReportServerUrl);
            sw.Stop();
            result.ResponseTimeMs = sw.ElapsedMilliseconds;

            if (response.IsSuccessStatusCode)
            {
                result.IsConnected = true;
                result.IsFallbackActive = false;
                result.Message = $"Connected to SSRS Report Server ({result.ResponseTimeMs}ms). Native SSRS rendering available.";
            }
            else
            {
                result.Message = $"SSRS responded with HTTP {(int)response.StatusCode} {response.ReasonPhrase}. High-Performance SQL Fallback Engine is active.";
            }
        }
        catch (HttpRequestException ex)
        {
            sw.Stop();
            result.ResponseTimeMs = sw.ElapsedMilliseconds;
            result.Message = $"SSRS Server unreachable at '{_config.ReportServerUrl}' ({ex.Message}). High-Performance SQL Fallback Engine is active.";
        }
        catch (TaskCanceledException)
        {
            sw.Stop();
            result.ResponseTimeMs = sw.ElapsedMilliseconds;
            result.Message = $"SSRS Server request timed out after {_config.TimeoutSeconds}s. High-Performance SQL Fallback Engine is active.";
        }
        catch (Exception ex)
        {
            sw.Stop();
            result.ResponseTimeMs = sw.ElapsedMilliseconds;
            result.Message = $"Error connecting to SSRS: {ex.Message}. High-Performance SQL Fallback Engine is active.";
        }

        return result;
    }

    public async Task<byte[]?> RenderReportAsync(string reportName, IDictionary<string, string?> parameters, string format = "PDF")
    {
        if (!_config.Enabled)
        {
            _logger.LogInformation("SSRS integration is disabled in configuration.");
            return null;
        }

        if (string.IsNullOrWhiteSpace(_config.ReportServerUrl))
        {
            _logger.LogWarning("SSRS ReportServerUrl is not configured.");
            return null;
        }

        // Map format parameter to SSRS URL access format specifier
        var ssrsFormat = format.ToUpperInvariant() switch
        {
            "EXCEL" or "XLSX" => "EXCELOPENXML",
            "WORD" or "DOCX" => "WORDOPENXML",
            "CSV" => "CSV",
            "HTML" or "HTML5" => "HTML5",
            _ => "PDF"
        };

        var requestUrl = _config.BuildReportUrl(reportName, parameters, ssrsFormat);
        _logger.LogInformation("Attempting to render report via SSRS Report Server: {Url}", requestUrl);

        try
        {
            using var client = CreateHttpClient();

            switch (ssrsFormat)
            {
                case "EXCELOPENXML":
                    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
                    break;
                case "WORDOPENXML":
                    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.openxmlformats-officedocument.wordprocessingml.document"));
                    break;
                case "CSV":
                    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("text/csv"));
                    break;
                default:
                    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/pdf"));
                    break;
            }

            var response = await client.GetAsync(requestUrl);

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("SSRS returned HTTP {StatusCode}: {ErrorBody}. Falling back to internal reporting engine.",
                    response.StatusCode, errorBody.Length > 200 ? errorBody.Substring(0, 200) : errorBody);
                return null;
            }

            var renderedBytes = await response.Content.ReadAsByteArrayAsync();

            // Validate that we received non-empty binary payload
            if (renderedBytes != null && renderedBytes.Length > 0)
            {
                _logger.LogInformation("Successfully rendered report '{ReportName}' via SSRS ({ByteCount} bytes).", reportName, renderedBytes.Length);
                return renderedBytes;
            }

            _logger.LogWarning("SSRS Report Server returned empty response payload. Falling back to internal reporting engine.");
            return null;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "SSRS Report Server at '{ReportServerUrl}' is currently unreachable: {Message}. Falling back to internal reporting engine.", _config.ReportServerUrl, ex.Message);
            return null;
        }
        catch (TaskCanceledException ex)
        {
            _logger.LogWarning(ex, "SSRS Report Server request timed out after {Timeout} seconds. Falling back to internal reporting engine.", _config.TimeoutSeconds);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error communicating with SSRS Report Server. Falling back to internal reporting engine.");
            return null;
        }
    }

    public async Task<byte[]?> RenderReportPdfAsync(Booking booking)
    {
        var parameters = new Dictionary<string, string?>
        {
            ["BookingId"] = booking.Id.ToString(),
            ["BookingNumber"] = booking.BookingNumber ?? ""
        };

        var reportName = Path.GetFileNameWithoutExtension(_config.ReportPath ?? "AgreementReport");
        return await RenderReportAsync(reportName, parameters, "PDF");
    }
}
