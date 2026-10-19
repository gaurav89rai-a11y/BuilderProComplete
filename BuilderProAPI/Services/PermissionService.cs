using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using BuilderProAPI.Data;
using BuilderProAPI.Models;

namespace BuilderProAPI.Services;

public class PermissionService : IPermissionService
{
    private readonly BuilderProDbContext _db;

    public PermissionService(BuilderProDbContext db)
    {
        _db = db;
    }

    public async Task<User?> GetCurrentUserAsync(HttpContext context)
    {
        if (context.Items.TryGetValue("CurrentUser", out var cached) && cached is User cachedUser)
        {
            return cachedUser;
        }

        // 1. Try X-User-Id header first
        string? userIdHeader = context.Request.Headers["X-User-Id"].FirstOrDefault();
        if (int.TryParse(userIdHeader, out int userId))
        {
            var user = await _db.Users
                .Include(u => u.UserRole)
                .Include(u => u.ChannelPartner)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user != null)
            {
                context.Items["CurrentUser"] = user;
                return user;
            }
        }

        // 2. Try Authorization header: Bearer <id> or Bearer <email>
        string? authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
        if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            string token = authHeader.Substring("Bearer ".Length).Trim();
            if (int.TryParse(token, out int parsedAuthId))
            {
                var user = await _db.Users
                    .Include(u => u.UserRole)
                    .Include(u => u.ChannelPartner)
                    .FirstOrDefaultAsync(u => u.Id == parsedAuthId);
                if (user != null)
                {
                    context.Items["CurrentUser"] = user;
                    return user;
                }
            }
            else if (token.Contains('@'))
            {
                var user = await _db.Users
                    .Include(u => u.UserRole)
                    .Include(u => u.ChannelPartner)
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == token.ToLower());
                if (user != null)
                {
                    context.Items["CurrentUser"] = user;
                    return user;
                }
            }
        }

        // 3. Fallback: Lookup by X-User-Name if supplied
        string? userName = context.Request.Headers["X-User-Name"].FirstOrDefault();
        if (!string.IsNullOrEmpty(userName))
        {
            var user = await _db.Users
                .Include(u => u.UserRole)
                .Include(u => u.ChannelPartner)
                .FirstOrDefaultAsync(u => u.Name.ToLower() == userName.ToLower());
            if (user != null)
            {
                context.Items["CurrentUser"] = user;
                return user;
            }
        }

        // 4. Fallback: Lookup by X-User-Role if supplied
        string? userRole = context.Request.Headers["X-User-Role"].FirstOrDefault();
        if (!string.IsNullOrEmpty(userRole))
        {
            var user = await _db.Users
                .Include(u => u.UserRole)
                .Include(u => u.ChannelPartner)
                .FirstOrDefaultAsync(u => u.Role == userRole || (u.UserRole != null && u.UserRole.Name == userRole));
            if (user != null)
            {
                context.Items["CurrentUser"] = user;
                return user;
            }
        }

        // 5. Default fallback to primary active user (Super Admin)
        var defaultUser = await _db.Users
            .Include(u => u.UserRole)
            .Include(u => u.ChannelPartner)
            .OrderBy(u => u.Id)
            .FirstOrDefaultAsync();

        if (defaultUser != null)
        {
            context.Items["CurrentUser"] = defaultUser;
            return defaultUser;
        }

        return null;
    }

    public async Task<bool> HasPermissionAsync(User user, string permissionCode)
    {
        if (user == null) return false;

        // Super Admin always has full access
        string roleName = user.UserRole?.Name ?? user.Role;
        if (string.Equals(roleName, "Super Admin", StringComparison.OrdinalIgnoreCase) || user.Permissions == "all")
        {
            return true;
        }

        // 1. Check User-specific override
        var userOverride = await _db.UserPermissions
            .Include(up => up.Permission)
            .FirstOrDefaultAsync(up => up.UserId == user.Id && up.Permission != null && up.Permission.Code == permissionCode);

        if (userOverride != null)
        {
            return userOverride.IsGranted;
        }

        // 2. Resolve RoleId
        int? roleId = user.RoleId;
        if (!roleId.HasValue && !string.IsNullOrEmpty(roleName))
        {
            var role = await _db.Roles.FirstOrDefaultAsync(r => r.Name == roleName);
            if (role != null) roleId = role.Id;
        }

        if (!roleId.HasValue)
        {
            return false;
        }

        // 3. Check Role permission
        bool isGrantedInRole = await _db.RolePermissions
            .Include(rp => rp.Permission)
            .AnyAsync(rp => rp.RoleId == roleId.Value && rp.Permission != null && rp.Permission.Code == permissionCode && rp.IsGranted);

        return isGrantedInRole;
    }

    public async Task<List<string>> GetEffectivePermissionsAsync(int userId)
    {
        var user = await _db.Users.Include(u => u.UserRole).FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return new List<string>();

        string roleName = user.UserRole?.Name ?? user.Role;
        if (string.Equals(roleName, "Super Admin", StringComparison.OrdinalIgnoreCase) || user.Permissions == "all")
        {
            return await _db.Permissions.Select(p => p.Code).ToListAsync();
        }

        int? roleId = user.RoleId;
        if (!roleId.HasValue && !string.IsNullOrEmpty(roleName))
        {
            var role = await _db.Roles.FirstOrDefaultAsync(r => r.Name == roleName);
            if (role != null) roleId = role.Id;
        }

        // Fetch granted permissions for the role
        var rolePerms = new HashSet<string>();
        if (roleId.HasValue)
        {
            var perms = await _db.RolePermissions
                .Where(rp => rp.RoleId == roleId.Value && rp.IsGranted)
                .Select(rp => rp.Permission!.Code)
                .ToListAsync();
            foreach (var p in perms) rolePerms.Add(p);
        }

        // Fetch user overrides
        var userOverrides = await _db.UserPermissions
            .Where(up => up.UserId == userId)
            .Select(up => new { Code = up.Permission!.Code, up.IsGranted })
            .ToListAsync();

        foreach (var ov in userOverrides)
        {
            if (ov.IsGranted)
            {
                rolePerms.Add(ov.Code);
            }
            else
            {
                rolePerms.Remove(ov.Code);
            }
        }

        return rolePerms.ToList();
    }

    public async Task<Dictionary<string, bool>> GetEffectivePermissionMapAsync(int userId)
    {
        var allPermissions = await _db.Permissions.Select(p => p.Code).ToListAsync();
        var effectiveList = await GetEffectivePermissionsAsync(userId);
        var effectiveSet = new HashSet<string>(effectiveList);

        var map = new Dictionary<string, bool>();
        foreach (var code in allPermissions)
        {
            map[code] = effectiveSet.Contains(code);
        }
        return map;
    }

    public Task<bool> CanAccessRecordAsync<T>(User user, T record, string operation)
    {
        if (user == null || record == null) return Task.FromResult(false);

        string roleName = user.UserRole?.Name ?? user.Role;
        if (string.Equals(roleName, "Super Admin", StringComparison.OrdinalIgnoreCase))
        {
            return Task.FromResult(true);
        }

        // Record-level ownership validation
        if (record is Lead lead)
        {
            if (string.Equals(roleName, "Sales Manager", StringComparison.OrdinalIgnoreCase)) return Task.FromResult(true);
            if (string.Equals(roleName, "Sales Agent", StringComparison.OrdinalIgnoreCase))
            {
                bool isOwn = (lead.AgentId.HasValue && lead.AgentId.Value == user.Id) ||
                             string.Equals(lead.AssignedTo, user.Name, StringComparison.OrdinalIgnoreCase);
                return Task.FromResult(isOwn);
            }
            if (string.Equals(roleName, "Channel Partner", StringComparison.OrdinalIgnoreCase))
            {
                bool isOwnCp = (lead.ChannelPartnerId.HasValue && user.ChannelPartnerId.HasValue && lead.ChannelPartnerId.Value == user.ChannelPartnerId.Value) ||
                               string.Equals(lead.Source, "Channel Partner", StringComparison.OrdinalIgnoreCase);
                return Task.FromResult(isOwnCp);
            }
            if (string.Equals(roleName, "Accounts", StringComparison.OrdinalIgnoreCase))
            {
                // Accounts can view leads associated with confirmed bookings
                return Task.FromResult(operation == "view" || operation == "read");
            }
        }
        else if (record is Booking booking)
        {
            if (string.Equals(roleName, "Sales Manager", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(roleName, "Accounts", StringComparison.OrdinalIgnoreCase))
            {
                return Task.FromResult(true);
            }
            if (string.Equals(roleName, "Sales Agent", StringComparison.OrdinalIgnoreCase))
            {
                bool isOwn = (booking.AgentId.HasValue && booking.AgentId.Value == user.Id) ||
                             string.Equals(booking.AssignedAgent, user.Name, StringComparison.OrdinalIgnoreCase);
                return Task.FromResult(isOwn);
            }
            if (string.Equals(roleName, "Channel Partner", StringComparison.OrdinalIgnoreCase))
            {
                return Task.FromResult(true); // Filter applied in queries
            }
        }
        else if (record is Payment payment)
        {
            if (string.Equals(roleName, "Accounts", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(roleName, "Sales Manager", StringComparison.OrdinalIgnoreCase))
            {
                return Task.FromResult(true);
            }
            if (string.Equals(roleName, "Channel Partner", StringComparison.OrdinalIgnoreCase))
            {
                return Task.FromResult(operation == "view" || operation == "read");
            }
        }
        else if (record is SiteVisit visit)
        {
            if (string.Equals(roleName, "Sales Manager", StringComparison.OrdinalIgnoreCase)) return Task.FromResult(true);
            if (string.Equals(roleName, "Sales Agent", StringComparison.OrdinalIgnoreCase))
            {
                bool isOwn = (visit.AgentId.HasValue && visit.AgentId.Value == user.Id) ||
                             string.Equals(visit.AssignedAgent, user.Name, StringComparison.OrdinalIgnoreCase);
                return Task.FromResult(isOwn);
            }
        }
        else if (record is Commission commission)
        {
            if (string.Equals(roleName, "Accounts", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(roleName, "Sales Manager", StringComparison.OrdinalIgnoreCase))
            {
                return Task.FromResult(true);
            }
            if (string.Equals(roleName, "Channel Partner", StringComparison.OrdinalIgnoreCase))
            {
                bool isOwn = user.ChannelPartnerId.HasValue && commission.PartnerId == user.ChannelPartnerId.Value;
                return Task.FromResult(isOwn && (operation == "view" || operation == "read"));
            }
        }

        return Task.FromResult(true);
    }

    public async Task LogAuditAsync(int? changedByUserId, string changedByName, string targetType, int targetId, string targetName, string permissionCode, string prevState, string newState, string? reason)
    {
        try
        {
            var log = new PermissionAuditLog
            {
                ChangedByUserId = changedByUserId,
                ChangedByName = string.IsNullOrEmpty(changedByName) ? "System" : changedByName,
                TargetType = targetType,
                TargetId = targetId,
                TargetName = targetName,
                PermissionCode = permissionCode,
                PreviousState = prevState,
                NewState = newState,
                Reason = reason,
                Timestamp = DateTime.UtcNow
            };
            _db.PermissionAuditLogs.Add(log);
            await _db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[AUDIT ERROR] Failed to log permission audit: {ex.Message}");
        }
    }
}
