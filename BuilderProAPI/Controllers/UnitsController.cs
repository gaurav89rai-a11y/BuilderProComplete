using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BuilderProAPI.Data;
using BuilderProAPI.Models;

namespace BuilderProAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UnitsController : ControllerBase
{
    private readonly BuilderProDbContext _db;
    public UnitsController(BuilderProDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? projectId, [FromQuery] string? status)
    {
        var query = _db.Units.Include(u => u.Project).AsQueryable();
        if (projectId.HasValue) query = query.Where(u => u.ProjectId == projectId.Value);
        if (!string.IsNullOrEmpty(status)) query = query.Where(u => u.Status == status);
        return Ok(await query.ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var unit = await _db.Units.Include(u => u.Project).FirstOrDefaultAsync(u => u.Id == id);
        if (unit == null) return NotFound();
        return Ok(unit);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Unit unit)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        unit.CreatedAt = DateTime.UtcNow;
        _db.Units.Add(unit);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = unit.Id }, unit);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Unit unit)
    {
        if (id != unit.Id) return BadRequest();
        var existing = await _db.Units.FindAsync(id);
        if (existing == null) return NotFound();
        existing.UnitNumber = unit.UnitNumber;
        existing.Floor = unit.Floor;
        existing.UnitType = unit.UnitType;
        existing.Area = unit.Area;
        existing.Price = unit.Price;
        existing.Status = unit.Status;
        existing.View = unit.View;
        await _db.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] StatusUpdateDto dto)
    {
        var unit = await _db.Units.FindAsync(id);
        if (unit == null) return NotFound();
        unit.Status = dto.Status;
        await _db.SaveChangesAsync();
        return Ok(unit);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var unit = await _db.Units.FindAsync(id);
        if (unit == null) return NotFound();
        _db.Units.Remove(unit);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record StatusUpdateDto(string Status);
