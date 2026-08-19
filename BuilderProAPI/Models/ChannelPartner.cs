using System;
using System.Collections.Generic;

namespace BuilderProAPI.Models;

public class ChannelPartner
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string ContactPerson { get; set; } = "";
    public string Email { get; set; } = "";
    public string Phone { get; set; } = "";
    public string City { get; set; } = "";
    public string Status { get; set; } = "Silver"; // Platinum, Gold, Silver
    public decimal Rating { get; set; } = 4.0m;
    public decimal CommissionRate { get; set; } = 3.0m;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<Commission> Commissions { get; set; } = new List<Commission>();
}
