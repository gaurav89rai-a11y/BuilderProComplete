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
public class AttendancesController : ControllerBase
{
    private readonly BuilderProDbContext _db;
    public AttendancesController(BuilderProDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? date, [FromQuery] int? employeeId)
    {
        var query = _db.Attendances.Include(a => a.Employee).AsQueryable();
        
        if (!string.IsNullOrEmpty(date) && DateTime.TryParse(date, out var parsedDate))
        {
            query = query.Where(a => a.Date.Date == parsedDate.Date);
        }
        if (employeeId.HasValue)
        {
            query = query.Where(a => a.EmployeeId == employeeId.Value);
        }

        return Ok(await query.ToListAsync());
    }

    [HttpPost]
    public async Task<IActionResult> LogAttendance([FromBody] Attendance attendance)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        
        var count = await _db.Attendances.CountAsync();
        attendance.AttendanceCode = $"ATT-{DateTime.UtcNow.Year}-{(count + 1):D6}";
        
        _db.Attendances.Add(attendance);
        await _db.SaveChangesAsync();
        
        var created = await _db.Attendances.Include(a => a.Employee).FirstOrDefaultAsync(a => a.Id == attendance.Id);
        return Ok(created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAttendance(int id, [FromBody] Attendance attendance)
    {
        if (id != attendance.Id) return BadRequest();
        var existing = await _db.Attendances.FindAsync(id);
        if (existing == null) return NotFound();

        existing.CheckIn = attendance.CheckIn;
        existing.CheckOut = attendance.CheckOut;
        existing.Status = attendance.Status;

        await _db.SaveChangesAsync();
        
        var updated = await _db.Attendances.Include(a => a.Employee).FirstOrDefaultAsync(a => a.Id == id);
        return Ok(updated);
    }
}
