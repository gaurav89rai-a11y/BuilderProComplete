using System;

namespace BuilderProAPI.Models;

public class LeaveRequest
{
    public int Id { get; set; }
    public string LeaveCode { get; set; } = "";
    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }
    public string LeaveType { get; set; } = "Casual"; // Sick, Casual, Earned
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string Reason { get; set; } = "";
    public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected
}
