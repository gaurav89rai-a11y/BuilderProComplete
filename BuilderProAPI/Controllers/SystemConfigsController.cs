using System.Threading.Tasks;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BuilderProAPI.Data;
using BuilderProAPI.Models;
using BuilderProAPI.Middlewares;

namespace BuilderProAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SystemConfigsController : ControllerBase
{
    private readonly BuilderProDbContext _db;
    public SystemConfigsController(BuilderProDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var configs = await _db.SystemConfigs
            .OrderBy(c => c.SortOrder)
            .ToListAsync();

        var grouped = configs
            .GroupBy(c => c.Category)
            .ToDictionary(
                g => char.ToLower(g.Key[0]) + g.Key.Substring(1), // camelCase for JS frontend
                g => g.Select(c => new {
                    id = c.Id,
                    value = c.Value,
                    label = c.Label,
                    color = c.Color,
                    isDefault = c.IsDefault,
                    sortOrder = c.SortOrder
                })
            );

        return Ok(grouped);
    }

    [HttpGet("raw")]
    [RequirePermission("administration.masters.view")]
    public async Task<IActionResult> GetRaw([FromQuery] string? category)
    {
        var query = _db.SystemConfigs.AsQueryable();
        if (!string.IsNullOrEmpty(category))
        {
            query = query.Where(c => c.Category.ToLower() == category.ToLower());
        }
        return Ok(await query.OrderBy(c => c.Category).ThenBy(c => c.SortOrder).ToListAsync());
    }

    [HttpPost]
    [RequirePermission("administration.masters.edit")]
    public async Task<IActionResult> Create([FromBody] SystemConfig config)
    {
        if (string.IsNullOrWhiteSpace(config.Category) || string.IsNullOrWhiteSpace(config.Value))
        {
            return BadRequest(new { error = "Category and Value are required." });
        }
        if (string.IsNullOrWhiteSpace(config.Label)) config.Label = config.Value;

        _db.SystemConfigs.Add(config);
        await _db.SaveChangesAsync();
        return Ok(config);
    }

    [HttpPut("{id}")]
    [RequirePermission("administration.masters.edit")]
    public async Task<IActionResult> Update(int id, [FromBody] SystemConfig config)
    {
        var existing = await _db.SystemConfigs.FindAsync(id);
        if (existing == null) return NotFound(new { error = "Config entry not found." });

        existing.Label = config.Label ?? existing.Label;
        existing.Color = config.Color ?? existing.Color;
        existing.IsDefault = config.IsDefault;
        existing.SortOrder = config.SortOrder;
        await _db.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    [RequirePermission("administration.masters.edit")]
    public async Task<IActionResult> Delete(int id)
    {
        var existing = await _db.SystemConfigs.FindAsync(id);
        if (existing == null) return NotFound(new { error = "Config entry not found." });

        _db.SystemConfigs.Remove(existing);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
