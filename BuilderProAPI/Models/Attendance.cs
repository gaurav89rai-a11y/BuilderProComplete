using System;

namespace BuilderProAPI.Models;

public class Attendance
{
    public int Id { get; set; }
    public string AttendanceCode { get; set; } = "";
    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }
    public DateTime Date { get; set; }
    public string CheckIn { get; set; } = "";
    public string CheckOut { get; set; } = "";
    public string Status { get; set; } = "Present"; // Present, Absent, Half-Day, On Leave
}
