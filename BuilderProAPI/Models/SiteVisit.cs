using System;

namespace BuilderProAPI.Models;

public class SiteVisit
{
    public int Id { get; set; }
    public int LeadId { get; set; }
    public Lead? Lead { get; set; }
    public int ProjectId { get; set; }
    public Project? Project { get; set; }
    public DateTime VisitDate { get; set; }
    public string VisitTime { get; set; } = "";
    public string AssignedAgent { get; set; } = "";
    public string Status { get; set; } = "Scheduled"; // Scheduled, Completed, Cancelled
    public string Interest { get; set; } = "";
    public string Notes { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
