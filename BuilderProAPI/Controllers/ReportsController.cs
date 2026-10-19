using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using BuilderProAPI.Services;
using BuilderProAPI.Middlewares;

namespace BuilderProAPI.Controllers;

public class ReportRenderRequest
{
    public string ReportId { get; set; } = "";
    public Dictionary<string, string?> Parameters { get; set; } = new();
    public string Format { get; set; } = "JSON"; // JSON, PDF, EXCEL, WORD, CSV
}

[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly IReportEngineService _reportEngine;
    private readonly ISSRSReportService _ssrs;
    private readonly ILogger<ReportsController> _logger;

    public ReportsController(
        IReportEngineService reportEngine,
        ISSRSReportService ssrs,
        ILogger<ReportsController> logger)
    {
        _reportEngine = reportEngine;
        _ssrs = ssrs;
        _logger = logger;
    }

    private (string role, int? channelPartnerId) GetCallerContext()
    {
        var role = Request.Headers["X-User-Role"].ToString();
        if (string.IsNullOrWhiteSpace(role))
        {
            role = Request.Query["role"].ToString();
        }
        if (string.IsNullOrWhiteSpace(role))
        {
            role = "Super Admin";
        }

        int? partnerId = null;
        var partnerHeader = Request.Headers["X-Channel-Partner-Id"].ToString();
        if (string.IsNullOrWhiteSpace(partnerHeader))
        {
            partnerHeader = Request.Query["channelPartnerId"].ToString();
        }
        if (int.TryParse(partnerHeader, out var parsedId))
        {
            partnerId = parsedId;
        }

        return (role, partnerId);
    }

    [HttpGet("categories")]
    [RequirePermission("reports.bi.view")]
    public IActionResult GetCategories()
    {
        return Ok(_reportEngine.GetCategories());
    }

    [HttpGet("catalog")]
    [RequirePermission("reports.bi.view")]
    public IActionResult GetCatalog()
    {
        var (role, partnerId) = GetCallerContext();
        var catalog = _reportEngine.GetCatalogForRole(role, partnerId);
        return Ok(catalog);
    }

    [HttpGet("{id}/parameters")]
    [RequirePermission("reports.bi.view")]
    public async Task<IActionResult> GetParameters(string id)
    {
        var (role, partnerId) = GetCallerContext();
        try
        {
            var parameters = await _reportEngine.GetPopulatedParametersAsync(id, role, partnerId);
            return Ok(parameters);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpPost("render")]
    [RequirePermission("reports.bi.view")]
    public async Task<IActionResult> Render([FromBody] ReportRenderRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.ReportId))
        {
            return BadRequest(new { error = "ReportId is required." });
        }

        var (role, partnerId) = GetCallerContext();
        var format = (req.Format ?? "JSON").ToUpperInvariant();

        try
        {
            if (format == "JSON")
            {
                var result = await _reportEngine.ExecuteReportDataAsync(req.ReportId, req.Parameters ?? new(), role, partnerId);
                return Ok(result);
            }

            var exportFile = await _reportEngine.ExportReportAsync(req.ReportId, req.Parameters ?? new(), format, role, partnerId);
            return File(exportFile.Data, exportFile.ContentType, exportFile.FileName);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { error = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to render report '{ReportId}'", req.ReportId);
            return StatusCode(500, new { error = "An error occurred while generating the report.", details = ex.Message });
        }
    }

    [HttpGet("{id}/export")]
    [RequirePermission("reports.bi.export")]
    public async Task<IActionResult> Export(string id, [FromQuery] string format = "PDF")
    {
        var (role, partnerId) = GetCallerContext();
        var parameters = new Dictionary<string, string?>();

        foreach (var query in Request.Query)
        {
            var key = query.Key;
            if (!string.Equals(key, "format", StringComparison.OrdinalIgnoreCase)
                && !string.Equals(key, "role", StringComparison.OrdinalIgnoreCase)
                && !string.Equals(key, "channelPartnerId", StringComparison.OrdinalIgnoreCase))
            {
                parameters[key] = query.Value.ToString();
            }
        }

        try
        {
            var exportFile = await _reportEngine.ExportReportAsync(id, parameters, format, role, partnerId);
            Response.Headers["Content-Disposition"] = $"attachment; filename=\"{exportFile.FileName}\"";
            Response.Headers["Access-Control-Expose-Headers"] = "Content-Disposition";
            return File(exportFile.Data, exportFile.ContentType, exportFile.FileName);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { error = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to export report '{ReportId}' in format '{Format}'", id, format);
            return StatusCode(500, new { error = "An error occurred while exporting the report.", details = ex.Message });
        }
    }

    [HttpGet("health")]
    public async Task<IActionResult> GetHealth()
    {
        var health = await _ssrs.CheckHealthAsync();
        return Ok(health);
    }
}
