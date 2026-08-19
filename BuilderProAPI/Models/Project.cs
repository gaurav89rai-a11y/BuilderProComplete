using System;
using System.Collections.Generic;

namespace BuilderProAPI.Models;

public class Project
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Location { get; set; } = "";
    public string ReraNumber { get; set; } = "";
    public string Status { get; set; } = "Pre-launch"; // Active, Pre-launch, Nearing Handover, Completed
    public string Type { get; set; } = "Residential";  // Residential, Commercial, Township
    public int TotalUnits { get; set; }
    public int ConstructionPct { get; set; }
    public decimal TotalValue { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<Unit> Units { get; set; } = new List<Unit>();
    public ICollection<Lead> Leads { get; set; } = new List<Lead>();
}
