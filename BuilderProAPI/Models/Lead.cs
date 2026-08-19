using System;
using System.Collections.Generic;

namespace BuilderProAPI.Models;

public class Lead
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Source { get; set; } = ""; // Website, Channel Partner, Walk-in, Referral, Online Ad
    public string Stage { get; set; } = "New"; // New, Contacted, Site Visit, Negotiation, Booked
    public int Score { get; set; } = 50;
    public string Interest { get; set; } = "";
    public string AssignedTo { get; set; } = "";
    public decimal Budget { get; set; }
    public int? ProjectId { get; set; }
    public Project? Project { get; set; }
    public DateTime? NextFollowUpDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<SiteVisit> SiteVisits { get; set; } = new List<SiteVisit>();
}
