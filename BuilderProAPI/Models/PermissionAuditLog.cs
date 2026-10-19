using System;

namespace BuilderProAPI.Models;

public class PermissionAuditLog
{
    public int Id { get; set; }
    public int? ChangedByUserId { get; set; }
    public string ChangedByName { get; set; } = "System Admin";
    public string TargetType { get; set; } = "Role"; // "Role" or "User"
    public int TargetId { get; set; }
    public string TargetName { get; set; } = string.Empty;
    public string PermissionCode { get; set; } = string.Empty;
    public string PreviousState { get; set; } = string.Empty;
    public string NewState { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
