namespace BuilderProAPI.Models;

public class SSRSConfig
{
    public bool Enabled { get; set; } = true;
    public string ReportServerUrl { get; set; } = "http://localhost/ReportServer";
    public string ReportPath { get; set; } = "/BuilderPro/AgreementReport";
    public string? Username { get; set; }
    public string? Password { get; set; }
    public string? Domain { get; set; }
    public bool UseDefaultCredentials { get; set; } = true;
    public int TimeoutSeconds { get; set; } = 30;
}
