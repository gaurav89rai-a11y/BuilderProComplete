using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BuilderProAPI.Data;
using BuilderProAPI.Models;
using BuilderProAPI.Middlewares;
using BuilderProAPI.Services;

namespace BuilderProAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PermissionsController : ControllerBase
{
    private readonly BuilderProDbContext _db;
    private readonly IPermissionService _permService;

    public PermissionsController(BuilderProDbContext db, IPermissionService permService)
    {
        _db = db;
        _permService = permService;
    }

    /// <summary>
    /// Returns the complete hierarchy: Modules -> Submenus -> Actions and all 119 granular permissions.
    /// </summary>
    [HttpGet("matrix")]
    [RequirePermission("administration.permissions.view")]
    public async Task<IActionResult> GetMatrix()
    {
        var permissions = await _db.Permissions
            .OrderBy(p => p.SortOrder)
            .ThenBy(p => p.Module)
            .ThenBy(p => p.Submenu)
            .ToListAsync();

        var modules = permissions
            .GroupBy(p => p.Module)
            .Select(mGroup => new
            {
                Module = mGroup.Key,
                Submenus = mGroup
                    .GroupBy(p => p.Submenu)
                    .Select(sGroup => new
                    {
                        Submenu = sGroup.Key,
                        Permissions = sGroup.Select(p => new
                        {
                            p.Id,
                            p.Code,
                            p.Action,
                            p.Name,
                            p.Description,
                            p.Category,
                            p.IsSensitive,
                            p.SortOrder
                        }).ToList()
                    }).ToList()
            }).ToList();

        return Ok(new
        {
            TotalPermissions = permissions.Count,
            Modules = modules,
            FlatPermissions = permissions
        });
    }

    /// <summary>
    /// Returns permissions granted to a specific role.
    /// </summary>
    [HttpGet("role/{roleId}")]
    [RequirePermission("administration.permissions.view")]
    public async Task<IActionResult> GetRolePermissions(int roleId)
    {
        var role = await _db.Roles.FindAsync(roleId);
        if (role == null) return NotFound(new { error = "Role not found." });

        var grantedPermCodes = await _db.RolePermissions
            .Where(rp => rp.RoleId == roleId && rp.IsGranted)
            .Include(rp => rp.Permission)
            .Select(rp => rp.Permission!.Code)
            .ToListAsync();

        return Ok(new
        {
            RoleId = role.Id,
            RoleName = role.Name,
            IsSystemRole = role.IsSystemRole,
            GrantedPermissions = grantedPermCodes
        });
    }

    public class UpdateRolePermissionsDto
    {
        public List<string> Permissions { get; set; } = new();
        public string? Reason { get; set; }
    }

    /// <summary>
    /// Configures permissions for a role (SQL Server persistence, immediate effect).
    /// </summary>
    [HttpPost("role/{roleId}")]
    [RequirePermission("administration.permissions.manage")]
    public async Task<IActionResult> UpdateRolePermissions(int roleId, [FromBody] UpdateRolePermissionsDto dto)
    {
        var role = await _db.Roles.FindAsync(roleId);
        if (role == null) return NotFound(new { error = "Role not found." });

        var currentUser = await _permService.GetCurrentUserAsync(HttpContext);
        string currentRoleName = currentUser?.UserRole?.Name ?? currentUser?.Role ?? "";

        // Protection: Non-SuperAdmin cannot modify permissions of Super Admin role
        if (role.Name == "Super Admin" && !string.Equals(currentRoleName, "Super Admin", StringComparison.OrdinalIgnoreCase))
        {
            return Forbid();
        }

        // Super Admin must always retain all permissions
        if (role.Name == "Super Admin" && dto.Permissions.Count < await _db.Permissions.CountAsync())
        {
            return BadRequest(new { error = "Super Admin role must retain all system permissions." });
        }

        var allPerms = await _db.Permissions.ToListAsync();
        var permsMap = allPerms.ToDictionary(p => p.Code, p => p.Id);

        var existingRolePerms = await _db.RolePermissions
            .Where(rp => rp.RoleId == roleId)
            .ToListAsync();

        var requestedCodes = new HashSet<string>(dto.Permissions ?? new List<string>());
        var previousCodes = existingRolePerms.Where(rp => rp.IsGranted).Select(rp => rp.PermissionId).ToList();

        // Remove existing mappings
        _db.RolePermissions.RemoveRange(existingRolePerms);

        // Add newly requested mappings
        foreach (var code in requestedCodes)
        {
            if (permsMap.TryGetValue(code, out int permId))
            {
                _db.RolePermissions.Add(new RolePermission
                {
                    RoleId = roleId,
                    PermissionId = permId,
                    IsGranted = true,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        role.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        // Audit Trail
        await _permService.LogAuditAsync(
            currentUser?.Id,
            currentUser?.Name ?? "Admin",
            "Role",
            role.Id,
            role.Name,
            "administration.permissions.manage",
            $"{previousCodes.Count} granted",
            $"{requestedCodes.Count} granted",
            dto.Reason ?? $"Updated permissions for role '{role.Name}'"
        );

        return Ok(new
        {
            message = $"Permissions for role '{role.Name}' updated successfully.",
            roleId = role.Id,
            grantedCount = requestedCodes.Count
        });
    }

    /// <summary>
    /// Returns user-specific permissions (effective, inherited from role, and overrides).
    /// </summary>
    [HttpGet("user/{userId}")]
    [RequirePermission("administration.permissions.view")]
    public async Task<IActionResult> GetUserPermissions(int userId)
    {
        var user = await _db.Users
            .Include(u => u.UserRole)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null) return NotFound(new { error = "User not found." });

        int? roleId = user.RoleId;
        if (!roleId.HasValue && !string.IsNullOrEmpty(user.Role))
        {
            var r = await _db.Roles.FirstOrDefaultAsync(ro => ro.Name == user.Role);
            if (r != null) roleId = r.Id;
        }

        var rolePermissions = new List<string>();
        if (roleId.HasValue)
        {
            rolePermissions = await _db.RolePermissions
                .Where(rp => rp.RoleId == roleId.Value && rp.IsGranted)
                .Include(rp => rp.Permission)
                .Select(rp => rp.Permission!.Code)
                .ToListAsync();
        }

        var overrides = await _db.UserPermissions
            .Where(up => up.UserId == userId)
            .Include(up => up.Permission)
            .ToDictionaryAsync(up => up.Permission!.Code, up => up.IsGranted);

        var effective = await _permService.GetEffectivePermissionsAsync(userId);

        return Ok(new
        {
            UserId = user.Id,
            UserName = user.Name,
            RoleName = user.UserRole?.Name ?? user.Role,
            RoleId = roleId,
            InheritedFromRole = rolePermissions,
            UserOverrides = overrides,
            EffectivePermissions = effective
        });
    }

    public class UpdateUserPermissionsDto
    {
        // Dictionary of PermissionCode -> Boolean (true = grant override, false = deny override, null = reset to inherit)
        public Dictionary<string, bool?> Overrides { get; set; } = new();
        public string? Reason { get; set; }
    }

    /// <summary>
    /// Saves user-specific permission overrides (Grant or Deny).
    /// </summary>
    [HttpPost("user/{userId}")]
    [RequirePermission("administration.permissions.manage")]
    public async Task<IActionResult> UpdateUserPermissions(int userId, [FromBody] UpdateUserPermissionsDto dto)
    {
        var user = await _db.Users.Include(u => u.UserRole).FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return NotFound(new { error = "User not found." });

        var currentUser = await _permService.GetCurrentUserAsync(HttpContext);
        string currentRoleName = currentUser?.UserRole?.Name ?? currentUser?.Role ?? "";

        // Protection: Only Super Admin can change permissions of another Super Admin
        if ((user.UserRole?.Name == "Super Admin" || user.Role == "Super Admin") &&
            !string.Equals(currentRoleName, "Super Admin", StringComparison.OrdinalIgnoreCase))
        {
            return Forbid();
        }

        var allPerms = await _db.Permissions.ToListAsync();
        var permsMap = allPerms.ToDictionary(p => p.Code, p => p.Id);

        var existingOverrides = await _db.UserPermissions
            .Where(up => up.UserId == userId)
            .ToListAsync();

        _db.UserPermissions.RemoveRange(existingOverrides);

        int addedOverrides = 0;
        foreach (var kvp in dto.Overrides)
        {
            if (kvp.Value.HasValue && permsMap.TryGetValue(kvp.Key, out int permId))
            {
                _db.UserPermissions.Add(new UserPermission
                {
                    UserId = userId,
                    PermissionId = permId,
                    IsGranted = kvp.Value.Value,
                    CreatedAt = DateTime.UtcNow
                });
                addedOverrides++;
            }
        }

        await _db.SaveChangesAsync();

        await _permService.LogAuditAsync(
            currentUser?.Id,
            currentUser?.Name ?? "Admin",
            "User",
            user.Id,
            user.Name,
            "administration.permissions.manage",
            $"{existingOverrides.Count} overrides",
            $"{addedOverrides} overrides",
            dto.Reason ?? $"Configured custom permission overrides for user '{user.Name}'"
        );

        return Ok(new
        {
            message = $"User-specific permissions for '{user.Name}' updated successfully.",
            userId = user.Id,
            overrideCount = addedOverrides
        });
    }

    /// <summary>
    /// Returns the audit history of all permission and role changes.
    /// </summary>
    [HttpGet("audit")]
    [RequirePermission("administration.audit_logs.view")]
    public async Task<IActionResult> GetAuditLogs([FromQuery] int limit = 100)
    {
        var logs = await _db.PermissionAuditLogs
            .OrderByDescending(l => l.Timestamp)
            .Take(limit)
            .ToListAsync();

        return Ok(logs);
    }

    /// <summary>
    /// Returns the currently authenticated user's effective permissions map for frontend guards.
    /// </summary>
    [HttpGet("my-permissions")]
    public async Task<IActionResult> GetMyPermissions()
    {
        var currentUser = await _permService.GetCurrentUserAsync(HttpContext);
        if (currentUser == null)
        {
            return Unauthorized(new { error = "Unauthenticated user session." });
        }

        var effectiveList = await _permService.GetEffectivePermissionsAsync(currentUser.Id);
        var effectiveMap = await _permService.GetEffectivePermissionMapAsync(currentUser.Id);

        return Ok(new
        {
            User = new
            {
                currentUser.Id,
                currentUser.Name,
                currentUser.Email,
                Role = currentUser.UserRole?.Name ?? currentUser.Role,
                currentUser.RoleId,
                currentUser.ChannelPartnerId
            },
            PermissionsList = effectiveList,
            PermissionsMap = effectiveMap,
            IsSuperAdmin = string.Equals(currentUser.UserRole?.Name ?? currentUser.Role, "Super Admin", StringComparison.OrdinalIgnoreCase) || currentUser.Permissions == "all"
        });
    }
}
