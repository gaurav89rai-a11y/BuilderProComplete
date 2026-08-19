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
public class PaymentsController : ControllerBase
{
    private readonly BuilderProDbContext _db;
    public PaymentsController(BuilderProDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? customerId)
    {
        var query = _db.Payments.Include(p => p.Customer).Include(p => p.Booking).AsQueryable();
        if (customerId.HasValue) query = query.Where(p => p.CustomerId == customerId.Value);
        return Ok(await query.OrderByDescending(p => p.PaymentDate).ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var p = await _db.Payments.Include(x => x.Customer).Include(x => x.Booking).FirstOrDefaultAsync(x => x.Id == id);
        if (p == null) return NotFound();
        return Ok(p);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Payment payment)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        payment.CreatedAt = DateTime.UtcNow;
        _db.Payments.Add(payment);
        
        // Update customer paid amount
        var customer = await _db.Customers.FindAsync(payment.CustomerId);
        if (customer != null)
        {
            customer.PaidAmount += payment.Amount;

            // Log corresponding audit trail inside lead
            var lead = await _db.Leads.FirstOrDefaultAsync(l => l.Email == customer.Email || l.Phone == customer.Phone);
            if (lead != null)
            {
                var paymentStage = await _db.SystemConfigs.Where(c => c.Category == "LeadStage" && (c.Value == "Payment" || c.Value == "Payments")).Select(c => c.Value).FirstOrDefaultAsync() ?? lead.Stage;
                var prevStage = lead.Stage;
                lead.Stage = paymentStage;

                _db.LeadAuditLogs.Add(new LeadAuditLog
                {
                    LeadId = lead.Id,
                    ActivityIcon = "💳",
                    ActivityType = "Payment Received",
                    PrevStage = prevStage,
                    NewStage = paymentStage,
                    UserName = lead.AssignedTo ?? "System",
                    Timestamp = DateTime.UtcNow,
                    Comments = $"Payment of {payment.Amount:C} received via {payment.PaymentMode}. Status: {payment.Status}. Remarks: {payment.Remarks}"
                });
            }
        }
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = payment.Id }, payment);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var p = await _db.Payments.FindAsync(id);
        if (p == null) return NotFound();
        _db.Payments.Remove(p);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var stats = new {
            TotalCollected = await _db.Payments.Where(p => p.Status == "Received").SumAsync(p => p.Amount),
            Pending = await _db.Customers.SumAsync(c => c.TotalAmount - c.PaidAmount),
            Overdue = await _db.Customers.Where(c => c.Status == "Overdue").SumAsync(c => c.TotalAmount - c.PaidAmount),
        };
        return Ok(stats);
    }
}
