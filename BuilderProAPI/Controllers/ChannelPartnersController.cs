using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BuilderProAPI.Data;
using BuilderProAPI.Models;

namespace BuilderProAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChannelPartnersController : ControllerBase
{
    private readonly BuilderProDbContext _db;
    public ChannelPartnersController(BuilderProDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var partners = await _db.ChannelPartners
            .Select(p => new {
                p.Id, p.Name, p.ContactPerson, p.Email, p.Phone, p.City,
                p.Status, p.Rating, p.CommissionRate, p.CreatedAt,
                Leads = _db.Leads.Count(l => l.AssignedTo == p.Name),
                Bookings = _db.Commissions.Count(c => c.PartnerId == p.Id),
                TotalCommission = _db.Commissions.Where(c => c.PartnerId == p.Id).Sum(c => c.Amount)
            })
            .ToListAsync();
        return Ok(partners);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var p = await _db.ChannelPartners.Include(x => x.Commissions).FirstOrDefaultAsync(x => x.Id == id);
        if (p == null) return NotFound();
        return Ok(p);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ChannelPartner partner)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        partner.CreatedAt = DateTime.UtcNow;
        _db.ChannelPartners.Add(partner);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = partner.Id }, partner);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] ChannelPartner partner)
    {
        if (id != partner.Id) return BadRequest();
        var existing = await _db.ChannelPartners.FindAsync(id);
        if (existing == null) return NotFound();
        existing.Name = partner.Name;
        existing.ContactPerson = partner.ContactPerson;
        existing.Email = partner.Email;
        existing.Phone = partner.Phone;
        existing.City = partner.City;
        existing.Status = partner.Status;
        existing.Rating = partner.Rating;
        existing.CommissionRate = partner.CommissionRate;
        await _db.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var p = await _db.ChannelPartners.FindAsync(id);
        if (p == null) return NotFound();
        _db.ChannelPartners.Remove(p);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
