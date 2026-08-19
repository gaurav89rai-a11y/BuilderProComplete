using System;

namespace BuilderProAPI.Models;

public class LeadAuditLog
{
    public int Id { get; set; }
    public int LeadId { get; set; }
    public Lead? Lead { get; set; }
    public string ActivityIcon { get; set; } = "🎯";
    public string ActivityType { get; set; } = "";
    public string PrevStage { get; set; } = "";
    public string NewStage { get; set; } = "";
    public string UserName { get; set; } = "System";
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string Comments { get; set; } = "";
    public string IpAddress { get; set; } = "127.0.0.1";
}
