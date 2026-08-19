using System;

namespace BuilderProAPI.Models;

public class Booking
{
    public int Id { get; set; }
    public string BookingNumber { get; set; } = "";
    public int CustomerId { get; set; }
    public Customer? Customer { get; set; }
    public int UnitId { get; set; }
    public Unit? Unit { get; set; }
    public DateTime BookingDate { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal TokenAmount { get; set; }
    public string Status { get; set; } = "Confirmed"; // Confirmed, Agreement Pending, Agreement Signed
    public string AssignedAgent { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
