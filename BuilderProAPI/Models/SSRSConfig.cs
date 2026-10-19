namespace BuilderProAPI.Models;

public class SSRSConfig
{
    public bool Enabled { get; set; } = true;
    public string ReportServerUrl { get; set; } = "http://localhost/ReportServer";
    public string ReportFolder { get; set; } = "/BuilderPro";
    public string ReportPath { get; set; } = "/BuilderPro/AgreementReport";
    public string? Username { get; set; }
    public string? Password { get; set; }
    public string? Domain { get; set; }
    public bool UseDefaultCredentials { get; set; } = true;
    public int TimeoutSeconds { get; set; } = 15;

    public string BuildReportUrl(string reportName, IDictionary<string, string?> parameters, string format = "PDF")
    {
        var baseUrl = (ReportServerUrl ?? "").TrimEnd('/');
        var folder = (ReportFolder ?? "/BuilderPro").Trim('/');
        var cleanReportName = reportName.TrimStart('/');
        var fullPath = $"{folder}/{cleanReportName}";

        var qs = new List<string>
        {
            $"rs:Format={Uri.EscapeDataString(format)}",
            "rs:ClearSession=true"
        };

        foreach (var kvp in parameters)
        {
            if (!string.IsNullOrWhiteSpace(kvp.Value))
            {
                qs.Add($"{Uri.EscapeDataString(kvp.Key)}={Uri.EscapeDataString(kvp.Value)}");
            }
        }

        return $"{baseUrl}?/{fullPath}&{string.Join("&", qs)}";
    }
}

