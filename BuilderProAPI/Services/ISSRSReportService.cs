using System.Collections.Generic;
using System.Threading.Tasks;
using BuilderProAPI.Models;

namespace BuilderProAPI.Services;

public class SSRSHealthResult
{
    public bool IsConnected { get; set; }
    public string ServerUrl { get; set; } = "";
    public string Message { get; set; } = "";
    public long ResponseTimeMs { get; set; }
    public bool IsFallbackActive { get; set; }
}

public interface ISSRSReportService
{
    Task<byte[]?> RenderReportPdfAsync(Booking booking);
    Task<byte[]?> RenderReportAsync(string reportName, IDictionary<string, string?> parameters, string format = "PDF");
    Task<SSRSHealthResult> CheckHealthAsync();
}
