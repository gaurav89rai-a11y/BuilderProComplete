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
public class ServiceTicketsController : ControllerBase
{
    private readonly BuilderProDbContext _db;
    public ServiceTicketsController(BuilderProDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status, [FromQuery] string? priority)
    {
        var query = _db.ServiceTickets.Include(t => t.Customer).AsQueryable();
        if (!string.IsNullOrEmpty(status)) query = query.Where(t => t.Status == status);
        if (!string.IsNullOrEmpty(priority)) query = query.Where(t => t.Priority == priority);
        return Ok(await query.OrderByDescending(t => t.CreatedAt).ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var t = await _db.ServiceTickets.Include(x => x.Customer).FirstOrDefaultAsync(x => x.Id == id);
        if (t == null) return NotFound();
        return Ok(t);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ServiceTicket ticket)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        ticket.CreatedAt = DateTime.UtcNow;
        if (string.IsNullOrEmpty(ticket.Status))
        {
            ticket.Status = await _db.SystemConfigs.Where(c => c.Category == "SystemSetting" && c.Value == "DefaultSupportStatus").Select(c => c.Label).FirstOrDefaultAsync()
                            ?? await _db.SystemConfigs.Where(c => c.Category == "SupportStatus" && c.IsDefault).Select(c => c.Value).FirstOrDefaultAsync()
                            ?? await _db.SystemConfigs.Where(c => c.Category == "SupportStatus").OrderBy(c => c.SortOrder).Select(c => c.Value).FirstOrDefaultAsync()
                            ?? "";
        }
        var count = await _db.ServiceTickets.CountAsync();
        ticket.TicketNumber = $"TKT{(count + 1):D3}";
        _db.ServiceTickets.Add(ticket);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = ticket.Id }, ticket);
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] TicketStatusDto dto)
    {
        var t = await _db.ServiceTickets.FindAsync(id);
        if (t == null) return NotFound();
        t.Status = dto.Status;
        await _db.SaveChangesAsync();
        return Ok(t);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var t = await _db.ServiceTickets.FindAsync(id);
        if (t == null) return NotFound();
        _db.ServiceTickets.Remove(t);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record TicketStatusDto(string Status);
