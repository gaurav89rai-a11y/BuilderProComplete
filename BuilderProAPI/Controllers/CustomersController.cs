using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BuilderProAPI.Data;
using BuilderProAPI.Models;

namespace BuilderProAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly BuilderProDbContext _db;
    public CustomersController(BuilderProDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status, [FromQuery] string? search, [FromQuery] int? channelPartnerId)
    {
        var role = Request.Headers["X-User-Role"].FirstOrDefault();
        var userIdHeader = Request.Headers["X-User-Id"].FirstOrDefault();
        var userNameHeader = Request.Headers["X-User-Name"].FirstOrDefault();
        int? userId = int.TryParse(userIdHeader, out int uid) ? uid : null;

        var cpHeader = Request.Headers["X-Channel-Partner-Id"].FirstOrDefault();
        int? cpId = channelPartnerId;
        if (!cpId.HasValue && int.TryParse(cpHeader, out int parsedCp)) cpId = parsedCp;

        var query = _db.Customers.Include(c => c.Project).AsQueryable();

        // Enforce Channel Partner role restriction: Access only associated customers
        if (string.Equals(role, "Channel Partner", StringComparison.OrdinalIgnoreCase) && cpId.HasValue)
        {
            var partnerLeadPhones = await _db.Leads
                .Where(l => l.ChannelPartnerId == cpId.Value && !string.IsNullOrEmpty(l.Phone))
                .Select(l => l.Phone)
                .Distinct()
                .ToListAsync();

            var partnerLeadEmails = await _db.Leads
                .Where(l => l.ChannelPartnerId == cpId.Value && !string.IsNullOrEmpty(l.Email))
                .Select(l => l.Email!)
                .Distinct()
                .ToListAsync();

            var partnerCustIds = await _db.Commissions
                .Where(c => c.PartnerId == cpId.Value)
                .Join(_db.Bookings, c => c.BookingId, b => b.Id, (c, b) => b.CustomerId)
                .Distinct()
                .ToListAsync();

            query = query.Where(c => 
                partnerLeadPhones.Contains(c.Phone) || 
                partnerLeadEmails.Contains(c.Email) || 
                partnerCustIds.Contains(c.Id));
        }

        // Enforce Sales Agent role restriction: Access only assigned customers
        if (string.Equals(role, "Sales Agent", StringComparison.OrdinalIgnoreCase))
        {
            var agentLeadPhones = await _db.Leads
                .Where(l => (userId.HasValue && l.AgentId == userId.Value) || (!string.IsNullOrEmpty(userNameHeader) && l.AssignedTo == userNameHeader))
                .Where(l => !string.IsNullOrEmpty(l.Phone))
                .Select(l => l.Phone)
                .Distinct()
                .ToListAsync();

            var agentLeadEmails = await _db.Leads
                .Where(l => (userId.HasValue && l.AgentId == userId.Value) || (!string.IsNullOrEmpty(userNameHeader) && l.AssignedTo == userNameHeader))
                .Where(l => !string.IsNullOrEmpty(l.Email))
                .Select(l => l.Email!)
                .Distinct()
                .ToListAsync();

            var agentBookingCustIds = await _db.Bookings
                .Where(b => (userId.HasValue && b.AgentId == userId.Value) || (!string.IsNullOrEmpty(userNameHeader) && b.AssignedAgent == userNameHeader))
                .Select(b => b.CustomerId)
                .Distinct()
                .ToListAsync();

            query = query.Where(c => 
                agentLeadPhones.Contains(c.Phone) || 
                agentLeadEmails.Contains(c.Email) || 
                agentBookingCustIds.Contains(c.Id));
        }

        if (!string.IsNullOrEmpty(status)) query = query.Where(c => c.Status == status);
        if (!string.IsNullOrEmpty(search))
            query = query.Where(c => c.Name.Contains(search) || c.UnitNumber.Contains(search) || c.Email.Contains(search));
        return Ok(await query.OrderByDescending(c => c.BookingDate).ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var role = Request.Headers["X-User-Role"].FirstOrDefault();
        var userIdHeader = Request.Headers["X-User-Id"].FirstOrDefault();
        var userNameHeader = Request.Headers["X-User-Name"].FirstOrDefault();
        int? userId = int.TryParse(userIdHeader, out int uid) ? uid : null;

        var cpHeader = Request.Headers["X-Channel-Partner-Id"].FirstOrDefault();
        int? cpId = null;
        if (int.TryParse(cpHeader, out int parsedCp)) cpId = parsedCp;

        var c = await _db.Customers.Include(x => x.Project).FirstOrDefaultAsync(x => x.Id == id);
        if (c == null) return NotFound();

        if (string.Equals(role, "Channel Partner", StringComparison.OrdinalIgnoreCase) && cpId.HasValue)
        {
            var isAssociated = await _db.Leads.AnyAsync(l => l.ChannelPartnerId == cpId.Value && (l.Phone == c.Phone || l.Email == c.Email)) ||
                               await _db.Commissions.Where(cm => cm.PartnerId == cpId.Value)
                                   .Join(_db.Bookings, cm => cm.BookingId, b => b.Id, (cm, b) => b.CustomerId)
                                   .AnyAsync(custId => custId == c.Id);
            if (!isAssociated) return Forbid();
        }

        if (string.Equals(role, "Sales Agent", StringComparison.OrdinalIgnoreCase))
        {
            var isAssigned = await _db.Leads.AnyAsync(l => ((userId.HasValue && l.AgentId == userId.Value) || (!string.IsNullOrEmpty(userNameHeader) && l.AssignedTo == userNameHeader)) && (l.Phone == c.Phone || l.Email == c.Email)) ||
                             await _db.Bookings.AnyAsync(b => ((userId.HasValue && b.AgentId == userId.Value) || (!string.IsNullOrEmpty(userNameHeader) && b.AssignedAgent == userNameHeader)) && b.CustomerId == c.Id);
            if (!isAssigned) return Forbid();
        }

        return Ok(c);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Customer customer)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        customer.CreatedAt = DateTime.UtcNow;
        _db.Customers.Add(customer);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = customer.Id }, customer);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Customer customer)
    {
        if (id != customer.Id) return BadRequest();
        var existing = await _db.Customers.FindAsync(id);
        if (existing == null) return NotFound();
        existing.Name = customer.Name;
        existing.Email = customer.Email;
        existing.Phone = customer.Phone;
        existing.UnitNumber = customer.UnitNumber;
        existing.ProjectId = customer.ProjectId;
        existing.BookingDate = customer.BookingDate;
        existing.Status = customer.Status;
        existing.TotalAmount = customer.TotalAmount;
        existing.PaidAmount = customer.PaidAmount;
        await _db.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var role = Request.Headers["X-User-Role"].FirstOrDefault();
        if (string.Equals(role, "Channel Partner", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(role, "Sales Agent", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(role, "Accounts", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(role, "Accountant", StringComparison.OrdinalIgnoreCase))
        {
            return Forbid();
        }

        var c = await _db.Customers.FindAsync(id);
        if (c == null) return NotFound();
        _db.Customers.Remove(c);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
