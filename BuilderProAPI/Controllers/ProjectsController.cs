using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BuilderProAPI.Data;
using BuilderProAPI.Models;

namespace BuilderProAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProjectsController : ControllerBase
{
    private readonly BuilderProDbContext _db;
    public ProjectsController(BuilderProDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var projects = await _db.Projects
            .Include(p => p.Units)
            .Select(p => new {
                p.Id, p.Name, p.Location, p.ReraNumber, p.Status, p.Type,
                p.TotalUnits, p.ConstructionPct, p.TotalValue, p.CreatedAt,
                Sold = p.Units.Count(u => u.Status == "Sold"),
                Booked = p.Units.Count(u => u.Status == "Booked"),
                Available = p.Units.Count(u => u.Status == "Available"),
                Held = p.Units.Count(u => u.Status == "Held")
            })
            .ToListAsync();
        return Ok(projects);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var p = await _db.Projects.Include(x => x.Units).FirstOrDefaultAsync(x => x.Id == id);
        if (p == null) return NotFound();
        return Ok(p);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Project project)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        project.CreatedAt = DateTime.UtcNow;
        _db.Projects.Add(project);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = project.Id }, project);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Project project)
    {
        if (id != project.Id) return BadRequest();
        var existing = await _db.Projects.FindAsync(id);
        if (existing == null) return NotFound();
        existing.Name = project.Name;
        existing.Location = project.Location;
        existing.ReraNumber = project.ReraNumber;
        existing.Status = project.Status;
        existing.Type = project.Type;
        existing.TotalUnits = project.TotalUnits;
        existing.ConstructionPct = project.ConstructionPct;
        existing.TotalValue = project.TotalValue;
        await _db.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var p = await _db.Projects.FindAsync(id);
        if (p == null) return NotFound();
        _db.Projects.Remove(p);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var stats = new {
            TotalProjects = await _db.Projects.CountAsync(),
            TotalValue = await _db.Projects.SumAsync(p => p.TotalValue),
            ActiveProjects = await _db.Projects.CountAsync(p => p.Status == "Active"),
            TotalUnits = await _db.Units.CountAsync(),
            SoldUnits = await _db.Units.CountAsync(u => u.Status == "Sold"),
            AvailableUnits = await _db.Units.CountAsync(u => u.Status == "Available"),
        };
        return Ok(stats);
    }
}
