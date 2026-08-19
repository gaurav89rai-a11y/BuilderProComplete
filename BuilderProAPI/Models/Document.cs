using System;

namespace BuilderProAPI.Models;

public class Document
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string DocumentType { get; set; } = ""; // Agreement, RERA, Finance, Allotment, NOC
    public int? ProjectId { get; set; }
    public Project? Project { get; set; }
    public int? CustomerId { get; set; }
    public Customer? Customer { get; set; }
    public string FilePath { get; set; } = "";
    public string FileSize { get; set; } = "";
    public string Status { get; set; } = "Pending"; // Signed, Active, Sent, Pending
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
