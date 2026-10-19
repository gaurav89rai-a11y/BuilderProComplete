using System;
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
public class UsersController : ControllerBase
{
    private readonly BuilderProDbContext _db;
    private readonly IPermissionService _permService;

    public UsersController(BuilderProDbContext db, IPermissionService permService)
    {
        _db = db;
        _permService = permService;
    }

    [HttpGet]
    [RequirePermission("administration.users.view")]
    public async Task<IActionResult> GetAll()
    {
        var users = await _db.Users
            .Include(u => u.UserRole)
            .Include(u => u.ChannelPartner)
            .OrderBy(u => u.Id)
            .ToListAsync();

        return Ok(users);
    }

    [HttpGet("{id}")]
    [RequirePermission("administration.users.view")]
    public async Task<IActionResult> GetById(int id)
    {
        var user = await _db.Users
            .Include(u => u.UserRole)
            .Include(u => u.ChannelPartner)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null) return NotFound(new { error = "User not found." });
        return Ok(user);
    }

    [HttpPost]
    [RequirePermission("administration.users.create")]
    public async Task<IActionResult> Create([FromBody] User user)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        if (string.IsNullOrWhiteSpace(user.Name) || string.IsNullOrWhiteSpace(user.Email))
        {
            return BadRequest(new { error = "Name and Email are required." });
        }

        string cleanEmail = user.Email.Trim().ToLower();
        if (await _db.Users.AnyAsync(u => u.Email.ToLower() == cleanEmail))
        {
            return Conflict(new { error = $"A user with email '{cleanEmail}' already exists." });
        }

        var currentUser = await _permService.GetCurrentUserAsync(HttpContext);
        string currentRoleName = currentUser?.UserRole?.Name ?? currentUser?.Role ?? "";

        // Only Super Admin can create Super Admin users
        if (string.Equals(user.Role, "Super Admin", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(currentRoleName, "Super Admin", StringComparison.OrdinalIgnoreCase))
        {
            return Forbid();
        }

        // Resolve RoleId
        if (!user.RoleId.HasValue && !string.IsNullOrEmpty(user.Role))
        {
            var role = await _db.Roles.FirstOrDefaultAsync(r => r.Name.ToLower() == user.Role.ToLower());
            if (role != null)
            {
                user.RoleId = role.Id;
                user.Role = role.Name;
            }
        }
        else if (user.RoleId.HasValue)
        {
            var role = await _db.Roles.FindAsync(user.RoleId.Value);
            if (role != null) user.Role = role.Name;
        }

        user.CreatedAt = DateTime.UtcNow;
        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        await _permService.LogAuditAsync(
            currentUser?.Id,
            currentUser?.Name ?? "Admin",
            "User",
            user.Id,
            user.Name,
            "administration.users.create",
            "None",
            "Created",
            $"Created user '{user.Name}' with role '{user.Role}'"
        );

        return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
    }

    [HttpPut("{id}")]
    [RequirePermission("administration.users.edit")]
    public async Task<IActionResult> Update(int id, [FromBody] User user)
    {
        if (id != user.Id) return BadRequest(new { error = "ID mismatch." });
        var existing = await _db.Users.Include(u => u.UserRole).FirstOrDefaultAsync(u => u.Id == id);
        if (existing == null) return NotFound(new { error = "User not found." });

        var currentUser = await _permService.GetCurrentUserAsync(HttpContext);
        string currentRoleName = currentUser?.UserRole?.Name ?? currentUser?.Role ?? "";

        // Protect Super Admin accounts: cannot be demoted or modified by non-SuperAdmin
        if ((existing.Role == "Super Admin" || existing.UserRole?.Name == "Super Admin") &&
            !string.Equals(currentRoleName, "Super Admin", StringComparison.OrdinalIgnoreCase))
        {
            return Forbid();
        }

        // Cannot promote to Super Admin unless caller is Super Admin
        if (string.Equals(user.Role, "Super Admin", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(currentRoleName, "Super Admin", StringComparison.OrdinalIgnoreCase))
        {
            return Forbid();
        }

        string prevRole = existing.Role;
        existing.Name = user.Name.Trim();
        existing.Email = user.Email.Trim();

        // Resolve Role
        if (user.RoleId.HasValue)
        {
            var role = await _db.Roles.FindAsync(user.RoleId.Value);
            if (role != null)
            {
                existing.RoleId = role.Id;
                existing.Role = role.Name;
            }
        }
        else if (!string.IsNullOrEmpty(user.Role))
        {
            var role = await _db.Roles.FirstOrDefaultAsync(r => r.Name.ToLower() == user.Role.ToLower());
            if (role != null)
            {
                existing.RoleId = role.Id;
                existing.Role = role.Name;
            }
            else
            {
                existing.Role = user.Role;
            }
        }

        existing.Permissions = user.Permissions;
        existing.ChannelPartnerId = user.ChannelPartnerId;
        await _db.SaveChangesAsync();

        await _permService.LogAuditAsync(
            currentUser?.Id,
            currentUser?.Name ?? "Admin",
            "User",
            existing.Id,
            existing.Name,
            "administration.users.edit",
            prevRole,
            existing.Role,
            $"Updated user profile and role for '{existing.Name}'"
        );

        return Ok(existing);
    }

    [HttpDelete("{id}")]
    [RequirePermission("administration.users.delete")]
    public async Task<IActionResult> Delete(int id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound(new { error = "User not found." });

        // System root admin cannot be deleted
        if (id == 1 || string.Equals(user.Role, "Super Admin", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { error = "System Super Admin root accounts cannot be deleted." });
        }

        var currentUser = await _permService.GetCurrentUserAsync(HttpContext);

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();

        await _permService.LogAuditAsync(
            currentUser?.Id,
            currentUser?.Name ?? "Admin",
            "User",
            id,
            user.Name,
            "administration.users.delete",
            "Active",
            "Deleted",
            $"Deleted user account '{user.Name}'"
        );

        return NoContent();
    }
}
