using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BuilderProAPI.Data;
using BuilderProAPI.Models;
using System.Threading.Tasks;

namespace BuilderProAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LeaveRequestsController : ControllerBase
{
    private readonly BuilderProDbContext _db;
    public LeaveRequestsController(BuilderProDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await _db.LeaveRequests.Include(l => l.Employee).ToListAsync());
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] LeaveRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        
        var count = await _db.LeaveRequests.CountAsync();
        request.LeaveCode = $"LE-{DateTime.UtcNow.Year}-{(count + 1):D6}";
        
        _db.LeaveRequests.Add(request);
        await _db.SaveChangesAsync();
        
        var created = await _db.LeaveRequests.Include(l => l.Employee).FirstOrDefaultAsync(l => l.Id == request.Id);
        return Ok(created);
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] LeaveStatusUpdateDto dto)
    {
        var existing = await _db.LeaveRequests.FindAsync(id);
        if (existing == null) return NotFound();

        existing.Status = dto.Status;
        await _db.SaveChangesAsync();

        var updated = await _db.LeaveRequests.Include(l => l.Employee).FirstOrDefaultAsync(l => l.Id == id);
        return Ok(updated);
    }
}

public class LeaveStatusUpdateDto
{
    public string Status { get; set; } = "";
}
