using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace BuilderProAPI.Models;

public class Lead
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Source { get; set; } = ""; // Website, Channel Partner, Walk-in, Referral, Online Ad
    public int? ChannelPartnerId { get; set; }
    public ChannelPartner? ChannelPartner { get; set; }
    public string Stage { get; set; } = "New"; // New, Contacted, Site Visit, Negotiation, Booked
    public int? Score { get; set; }
    public string Interest { get; set; } = "";
    public string AssignedTo { get; set; } = "";
    public int? AgentId { get; set; }
    public User? Agent { get; set; }
    public decimal Budget { get; set; }
    public int? ProjectId { get; set; }
    public Project? Project { get; set; }
    public int? UnitId { get; set; }
    public Unit? Unit { get; set; }
    [NotMapped]
    public int? FlatId { get => UnitId; set => UnitId = value; }
    public string FlatNo { get; set; } = "";
    public DateTime? NextFollowUpDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<SiteVisit> SiteVisits { get; set; } = new List<SiteVisit>();
}
