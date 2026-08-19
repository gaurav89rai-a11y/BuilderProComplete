using System;

namespace BuilderProAPI.Models;

public class Commission
{
    public int Id { get; set; }
    public int PartnerId { get; set; }
    public ChannelPartner? Partner { get; set; }
    public int BookingId { get; set; }
    public Booking? Booking { get; set; }
    public decimal Amount { get; set; }
    public decimal Rate { get; set; }
    public string Status { get; set; } = "Pending Approval"; // Payable, Pending Approval, Paid
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
