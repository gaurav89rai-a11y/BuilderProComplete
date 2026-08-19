using System;

namespace BuilderProAPI.Models;

public class Payment
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public Customer? Customer { get; set; }
    public int? BookingId { get; set; }
    public Booking? Booking { get; set; }
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; }
    public string PaymentMode { get; set; } = ""; // Cheque, NEFT, Cash
    public string Status { get; set; } = "Received"; // Received, Pending, Overdue
    public string Remarks { get; set; } = "";
    public string AttachmentUrl { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
