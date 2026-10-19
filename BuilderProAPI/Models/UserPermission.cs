using System;
using System.Text.Json.Serialization;

namespace BuilderProAPI.Models;

public class UserPermission
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User? User { get; set; }
    public int PermissionId { get; set; }
    public Permission? Permission { get; set; }
    public bool IsGranted { get; set; } = true; // true = Override Grant, false = Override Deny
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
