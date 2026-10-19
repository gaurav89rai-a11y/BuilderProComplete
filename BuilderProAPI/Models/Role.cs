using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace BuilderProAPI.Models;

public class Role
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Color { get; set; } = "gold";
    public bool IsSystemRole { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();

    [JsonIgnore]
    public ICollection<User> Users { get; set; } = new List<User>();
}
