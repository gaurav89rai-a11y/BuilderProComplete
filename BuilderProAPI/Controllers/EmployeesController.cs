using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BuilderProAPI.Data;
using BuilderProAPI.Models;
using System.Threading.Tasks;

namespace BuilderProAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmployeesController : ControllerBase
{
    private readonly BuilderProDbContext _db;
    public EmployeesController(BuilderProDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await _db.Employees.ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var emp = await _db.Employees.FindAsync(id);
        if (emp == null) return NotFound();
        return Ok(emp);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Employee employee)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        
        var count = await _db.Employees.CountAsync();
        employee.EmployeeCode = $"EMP-{DateTime.UtcNow.Year}-{(count + 1):D6}";
        
        _db.Employees.Add(employee);

        // Auto user provisioning flow
        var user = new User
        {
            Name = employee.Name,
            Email = employee.Email,
            Role = employee.Designation.Contains("Manager", System.StringComparison.OrdinalIgnoreCase) ? "Manager" : "Sales Agent",
            Permissions = employee.Designation.Contains("Manager", System.StringComparison.OrdinalIgnoreCase) 
                ? "view_dashboard,manage_projects,manage_inventory,manage_leads,manage_partners,manage_customers,manage_visits,manage_bookings,manage_hrms,manage_oms" 
                : "view_dashboard,manage_leads,manage_visits",
            CreatedAt = DateTime.UtcNow
        };
        _db.Users.Add(user);

        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = employee.Id }, employee);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Employee employee)
    {
        if (id != employee.Id) return BadRequest();
        var existing = await _db.Employees.FindAsync(id);
        if (existing == null) return NotFound();

        existing.Name = employee.Name;
        existing.Email = employee.Email;
        existing.Phone = employee.Phone;
        existing.Department = employee.Department;
        existing.Designation = employee.Designation;
        existing.Status = employee.Status;
        existing.Salary = employee.Salary;

        await _db.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var emp = await _db.Employees.FindAsync(id);
        if (emp == null) return NotFound();
        _db.Employees.Remove(emp);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
