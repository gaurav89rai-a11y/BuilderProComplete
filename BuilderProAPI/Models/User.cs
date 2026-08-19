using System;

namespace BuilderProAPI.Models;

public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string Role { get; set; } = "Sales Agent"; // Super Admin, Manager, Sales Agent, Support Agent
    public string Permissions { get; set; } = ""; // Comma-separated list of permission keys or "all"
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
