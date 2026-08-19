using System;

namespace BuilderProAPI.Models;

public class Employee
{
    public int Id { get; set; }
    public string EmployeeCode { get; set; } = "";
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Department { get; set; } = ""; // HR, Sales, Construction, Finance
    public string Designation { get; set; } = "";
    public string Status { get; set; } = "Active"; // Active, Terminated, On Leave
    public DateTime DateOfJoining { get; set; } = DateTime.UtcNow;
    public decimal Salary { get; set; }
}
