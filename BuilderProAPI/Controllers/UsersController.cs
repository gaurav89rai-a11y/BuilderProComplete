using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BuilderProAPI.Data;
using BuilderProAPI.Models;

namespace BuilderProAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly BuilderProDbContext _db;
    public UsersController(BuilderProDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await _db.Users.Include(u => u.ChannelPartner).ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var user = await _db.Users.Include(u => u.ChannelPartner).FirstOrDefaultAsync(u => u.Id == id);
        if (user == null) return NotFound();
        return Ok(user);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] User user)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        user.CreatedAt = DateTime.UtcNow;
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] User user)
    {
        if (id != user.Id) return BadRequest();
        var existing = await _db.Users.FindAsync(id);
        if (existing == null) return NotFound();
        existing.Name = user.Name;
        existing.Email = user.Email;
        existing.Role = user.Role;
        existing.Permissions = user.Permissions;
        existing.ChannelPartnerId = user.ChannelPartnerId;
        await _db.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();
        _db.Users.Remove(user);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
