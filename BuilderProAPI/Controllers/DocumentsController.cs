using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BuilderProAPI.Data;
using BuilderProAPI.Models;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace BuilderProAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DocumentsController : ControllerBase
{
    private readonly BuilderProDbContext _db;
    public DocumentsController(BuilderProDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? projectId, [FromQuery] int? customerId)
    {
        var query = _db.Documents.Include(d => d.Project).Include(d => d.Customer).AsQueryable();
        if (projectId.HasValue) query = query.Where(d => d.ProjectId == projectId.Value);
        if (customerId.HasValue) query = query.Where(d => d.CustomerId == customerId.Value);
        return Ok(await query.OrderByDescending(d => d.CreatedAt).ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var d = await _db.Documents.Include(x => x.Project).Include(x => x.Customer).FirstOrDefaultAsync(x => x.Id == id);
        if (d == null) return NotFound();
        return Ok(d);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Document doc)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        doc.CreatedAt = DateTime.UtcNow;
        _db.Documents.Add(doc);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = doc.Id }, doc);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var d = await _db.Documents.FindAsync(id);
        if (d == null) return NotFound();
        _db.Documents.Remove(d);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
