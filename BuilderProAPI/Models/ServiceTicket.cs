using System;

namespace BuilderProAPI.Models;

public class ServiceTicket
{
    public int Id { get; set; }
    public string TicketNumber { get; set; } = "";
    public int CustomerId { get; set; }
    public Customer? Customer { get; set; }
    public string Subject { get; set; } = "";
    public string Category { get; set; } = ""; // Maintenance, Documentation, General, Finance
    public string Status { get; set; } = "Open"; // Open, In Progress, Resolved
    public string Priority { get; set; } = "Medium"; // Critical, High, Medium, Low
    public string Notes { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
