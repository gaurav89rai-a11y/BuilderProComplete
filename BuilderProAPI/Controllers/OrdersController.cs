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
public class OrdersController : ControllerBase
{
    private readonly BuilderProDbContext _db;
    public OrdersController(BuilderProDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? projectId)
    {
        var query = _db.Orders.Include(o => o.Project).Include(o => o.OrderItems).AsQueryable();
        if (projectId.HasValue)
        {
            query = query.Where(o => o.ProjectId == projectId.Value);
        }
        return Ok(await query.OrderByDescending(o => o.OrderDate).ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var order = await _db.Orders
            .Include(o => o.Project)
            .Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.Id == id);
        
        if (order == null) return NotFound();
        return Ok(order);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Order order)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        
        var count = await _db.Orders.CountAsync();
        order.OrderNumber = $"PO-{DateTime.UtcNow.Year}-{(count + 1):D6}";
        order.OrderDate = DateTime.UtcNow;
        
        decimal total = 0;
        foreach (var item in order.OrderItems)
        {
            item.TotalPrice = item.Quantity * item.UnitPrice;
            total += item.TotalPrice;
        }
        order.TotalAmount = total;

        _db.Orders.Add(order);
        await _db.SaveChangesAsync();

        var created = await _db.Orders
            .Include(o => o.Project)
            .Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.Id == order.Id);

        return CreatedAtAction(nameof(GetById), new { id = order.Id }, created);
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] OrderStatusUpdateDto dto)
    {
        var existing = await _db.Orders.FindAsync(id);
        if (existing == null) return NotFound();

        existing.Status = dto.Status;
        if (dto.Status == "Delivered")
        {
            existing.DeliveryDate = DateTime.UtcNow;
        }
        else
        {
            existing.DeliveryDate = null;
        }

        await _db.SaveChangesAsync();
        
        var updated = await _db.Orders
            .Include(o => o.Project)
            .Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.Id == id);

        return Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var order = await _db.Orders.Include(o => o.OrderItems).FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound();

        _db.OrderItems.RemoveRange(order.OrderItems);
        _db.Orders.Remove(order);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}

public class OrderStatusUpdateDto
{
    public string Status { get; set; } = "";
}
