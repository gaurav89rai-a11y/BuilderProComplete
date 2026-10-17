using System;
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

    public async Task<byte[]?> RenderReportPdfAsync(Booking booking)
    {
        if (!_config.Enabled)
        {
            _logger.LogInformation("SSRS Report Server integration is disabled in configuration.");
            return null;
        }

        if (string.IsNullOrWhiteSpace(_config.ReportServerUrl) || string.IsNullOrWhiteSpace(_config.ReportPath))
        {
            _logger.LogWarning("SSRS Report Server URL or Report Path is not configured.");
            return null;
        }

        var baseUrl = _config.ReportServerUrl.TrimEnd('/');
        var reportPath = _config.ReportPath.TrimStart('/');
        var escapedBookingNumber = Uri.EscapeDataString(booking.BookingNumber ?? "");
        
        // Standard SQL Server Reporting Services (SSRS) URL Access command
        var requestUrl = $"{baseUrl}?/{reportPath}&BookingId={booking.Id}&BookingNumber={escapedBookingNumber}&rs:Format=PDF&rs:ClearSession=true";

        _logger.LogInformation("Attempting to render Agreement PDF via SSRS Report Server: {Url}", requestUrl);

        try
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

            using var client = new HttpClient(handler);
            client.Timeout = TimeSpan.FromSeconds(_config.TimeoutSeconds > 0 ? _config.TimeoutSeconds : 30);
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/pdf"));

            var response = await client.GetAsync(requestUrl);

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("SSRS Report Server returned HTTP {StatusCode}: {ErrorBody}. Falling back to embedded reporting engine.", 
                    response.StatusCode, errorBody.Length > 200 ? errorBody.Substring(0, 200) : errorBody);
                return null;
            }

            var pdfBytes = await response.Content.ReadAsByteArrayAsync();

            // Validate that the returned bytes form a valid PDF document (starts with %PDF)
            if (pdfBytes.Length > 4 && pdfBytes[0] == '%' && pdfBytes[1] == 'P' && pdfBytes[2] == 'D' && pdfBytes[3] == 'F')
            {
                _logger.LogInformation("Successfully rendered Agreement PDF via SSRS Report Server ({ByteCount} bytes).", pdfBytes.Length);
                return pdfBytes;
            }

            _logger.LogWarning("SSRS Report Server responded with non-PDF binary data. Falling back to embedded reporting engine.");
            return null;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "SSRS Report Server at '{ReportServerUrl}' is currently unreachable: {Message}. Falling back to embedded reporting engine.", _config.ReportServerUrl, ex.Message);
            return null;
        }
        catch (TaskCanceledException ex)
        {
            _logger.LogWarning(ex, "SSRS Report Server request timed out after {Timeout} seconds. Falling back to embedded reporting engine.", _config.TimeoutSeconds);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error communicating with SSRS Report Server. Falling back to embedded reporting engine.");
            return null;
        }
    }
}
