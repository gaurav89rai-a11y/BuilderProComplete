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
public class CommissionsController : ControllerBase
{
    private readonly BuilderProDbContext _db;
    public CommissionsController(BuilderProDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status)
    {
        var query = _db.Commissions.Include(c => c.Partner).Include(c => c.Booking).AsQueryable();
        if (!string.IsNullOrEmpty(status)) query = query.Where(c => c.Status == status);
        return Ok(await query.OrderByDescending(c => c.CreatedAt).ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var c = await _db.Commissions.Include(x => x.Partner).Include(x => x.Booking).FirstOrDefaultAsync(x => x.Id == id);
        if (c == null) return NotFound();
        return Ok(c);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Commission commission)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        commission.CreatedAt = DateTime.UtcNow;
        _db.Commissions.Add(commission);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = commission.Id }, commission);
    }

    [HttpPatch("{id}/approve")]
    public async Task<IActionResult> Approve(int id)
    {
        var c = await _db.Commissions.FindAsync(id);
        if (c == null) return NotFound();
        c.Status = await _db.SystemConfigs.Where(cfg => cfg.Category == "SystemSetting" && cfg.Value == "ApproveCommissionStatus").Select(cfg => cfg.Label).FirstOrDefaultAsync()
                   ?? await _db.SystemConfigs.Where(cfg => cfg.Category == "CommissionStatus" && cfg.Value == "Payable").Select(cfg => cfg.Value).FirstOrDefaultAsync()
                   ?? "";
        await _db.SaveChangesAsync();
        return Ok(c);
    }

    [HttpPatch("{id}/pay")]
    public async Task<IActionResult> MarkPaid(int id)
    {
        var c = await _db.Commissions.FindAsync(id);
        if (c == null) return NotFound();
        c.Status = await _db.SystemConfigs.Where(cfg => cfg.Category == "SystemSetting" && cfg.Value == "PayCommissionStatus").Select(cfg => cfg.Label).FirstOrDefaultAsync()
                   ?? await _db.SystemConfigs.Where(cfg => cfg.Category == "CommissionStatus" && cfg.Value == "Paid").Select(cfg => cfg.Value).FirstOrDefaultAsync()
                   ?? "";
        await _db.SaveChangesAsync();
        return Ok(c);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var c = await _db.Commissions.FindAsync(id);
        if (c == null) return NotFound();
        _db.Commissions.Remove(c);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
