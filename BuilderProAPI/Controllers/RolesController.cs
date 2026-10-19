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
public class RolesController : ControllerBase
{
    private readonly BuilderProDbContext _db;
    private readonly IPermissionService _permService;

    public RolesController(BuilderProDbContext db, IPermissionService permService)
    {
        _db = db;
        _permService = permService;
    }

    [HttpGet]
    [RequirePermission("administration.roles.view")]
    public async Task<IActionResult> GetAll()
    {
        var roles = await _db.Roles
            .Select(r => new
            {
                r.Id,
                r.Name,
                r.Description,
                r.Color,
                r.IsSystemRole,
                r.CreatedAt,
                r.UpdatedAt,
                UsersCount = _db.Users.Count(u => u.RoleId == r.Id || u.Role == r.Name),
                PermissionsCount = _db.RolePermissions.Count(rp => rp.RoleId == r.Id && rp.IsGranted)
            })
            .OrderBy(r => r.Id)
            .ToListAsync();

        return Ok(roles);
    }

    [HttpGet("{id}")]
    [RequirePermission("administration.roles.view")]
    public async Task<IActionResult> GetById(int id)
    {
        var role = await _db.Roles
            .Include(r => r.RolePermissions)
            .ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (role == null) return NotFound(new { error = "Role not found." });

        return Ok(new
        {
            role.Id,
            role.Name,
            role.Description,
            role.Color,
            role.IsSystemRole,
            role.CreatedAt,
            role.UpdatedAt,
            UsersCount = await _db.Users.CountAsync(u => u.RoleId == role.Id || u.Role == role.Name),
            GrantedPermissions = role.RolePermissions.Where(rp => rp.IsGranted).Select(rp => rp.Permission!.Code).ToList()
        });
    }

    [HttpPost]
    [RequirePermission("administration.roles.create")]
    public async Task<IActionResult> Create([FromBody] Role model)
    {
        if (string.IsNullOrWhiteSpace(model.Name))
            return BadRequest(new { error = "Role name is required." });

        string cleanName = model.Name.Trim();
        if (await _db.Roles.AnyAsync(r => r.Name.ToLower() == cleanName.ToLower()))
            return Conflict(new { error = $"A role with the name '{cleanName}' already exists." });

        var currentUser = await _permService.GetCurrentUserAsync(HttpContext);

        var newRole = new Role
        {
            Name = cleanName,
            Description = model.Description?.Trim(),
            Color = string.IsNullOrWhiteSpace(model.Color) ? "blue" : model.Color,
            IsSystemRole = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Roles.Add(newRole);
        await _db.SaveChangesAsync();

        // Also add to SystemConfig UserRole category for system dropdowns
        var existingConfig = await _db.SystemConfigs.FirstOrDefaultAsync(sc => sc.Category == "UserRole" && sc.Value.ToLower() == cleanName.ToLower());
        if (existingConfig == null)
        {
            _db.SystemConfigs.Add(new SystemConfig
            {
                Category = "UserRole",
                Value = cleanName,
                Label = cleanName,
                Color = newRole.Color,
                IsDefault = false,
                SortOrder = 10
            });
            await _db.SaveChangesAsync();
        }

        await _permService.LogAuditAsync(
            currentUser?.Id,
            currentUser?.Name ?? "Admin",
            "Role",
            newRole.Id,
            newRole.Name,
            "administration.roles.create",
            "None",
            "Created",
            $"Created role '{newRole.Name}'"
        );

        return CreatedAtAction(nameof(GetById), new { id = newRole.Id }, newRole);
    }

    [HttpPut("{id}")]
    [RequirePermission("administration.roles.edit")]
    public async Task<IActionResult> Update(int id, [FromBody] Role model)
    {
        var existing = await _db.Roles.FindAsync(id);
        if (existing == null) return NotFound(new { error = "Role not found." });

        var currentUser = await _permService.GetCurrentUserAsync(HttpContext);

        // System roles cannot have their core name changed
        if (existing.IsSystemRole && !string.Equals(existing.Name, model.Name, StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { error = $"System role '{existing.Name}' name cannot be renamed." });
        }

        if (!existing.IsSystemRole && !string.IsNullOrWhiteSpace(model.Name))
        {
            string cleanName = model.Name.Trim();
            if (await _db.Roles.AnyAsync(r => r.Id != id && r.Name.ToLower() == cleanName.ToLower()))
            {
                return Conflict(new { error = $"Another role with name '{cleanName}' already exists." });
            }
            existing.Name = cleanName;
        }

        existing.Description = model.Description?.Trim();
        if (!string.IsNullOrWhiteSpace(model.Color)) existing.Color = model.Color;
        existing.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        await _permService.LogAuditAsync(
            currentUser?.Id,
            currentUser?.Name ?? "Admin",
            "Role",
            existing.Id,
            existing.Name,
            "administration.roles.edit",
            "Modified",
            "Updated",
            $"Updated role '{existing.Name}'"
        );

        return Ok(existing);
    }

    [HttpDelete("{id}")]
    [RequirePermission("administration.roles.delete")]
    public async Task<IActionResult> Delete(int id)
    {
        var role = await _db.Roles.FindAsync(id);
        if (role == null) return NotFound(new { error = "Role not found." });

        if (role.IsSystemRole)
        {
            return BadRequest(new { error = $"Protected system role '{role.Name}' cannot be deleted." });
        }

        int assignedUsers = await _db.Users.CountAsync(u => u.RoleId == id || u.Role == role.Name);
        if (assignedUsers > 0)
        {
            return BadRequest(new { error = $"Cannot delete role '{role.Name}' because {assignedUsers} user(s) are assigned to it. Reassign these users first." });
        }

        var currentUser = await _permService.GetCurrentUserAsync(HttpContext);

        _db.Roles.Remove(role);
        await _db.SaveChangesAsync();

        await _permService.LogAuditAsync(
            currentUser?.Id,
            currentUser?.Name ?? "Admin",
            "Role",
            id,
            role.Name,
            "administration.roles.delete",
            "Active",
            "Deleted",
            $"Deleted custom role '{role.Name}'"
        );

        return NoContent();
    }
}
