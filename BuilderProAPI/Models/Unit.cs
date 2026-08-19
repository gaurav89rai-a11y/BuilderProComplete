using System;

namespace BuilderProAPI.Models;

public class Unit
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public Project? Project { get; set; }
    public string UnitNumber { get; set; } = "";
    public int Floor { get; set; }
    public string UnitType { get; set; } = ""; // 2BHK, 3BHK, 4BHK
    public decimal Area { get; set; }
    public decimal Price { get; set; }
    public string Status { get; set; } = "Available"; // Available, Booked, Sold, Held
    public string View { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
