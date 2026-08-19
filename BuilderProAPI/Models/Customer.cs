using System;

namespace BuilderProAPI.Models;

public class Customer
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string Phone { get; set; } = "";
    public string UnitNumber { get; set; } = "";
    public int ProjectId { get; set; }
    public Project? Project { get; set; }
    public DateTime BookingDate { get; set; }
    public string Status { get; set; } = "Active"; // Active, Overdue, Possession Given
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
