using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BuilderProAPI.Data;
using BuilderProAPI.Models;

namespace BuilderProAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LeadsController : ControllerBase
{
    private readonly BuilderProDbContext _db;
    public LeadsController(BuilderProDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? stage, [FromQuery] string? assigned)
    {
        var query = _db.Leads.Include(l => l.Project).AsQueryable();
        if (!string.IsNullOrEmpty(stage)) query = query.Where(l => l.Stage == stage);
        if (!string.IsNullOrEmpty(assigned)) query = query.Where(l => l.AssignedTo == assigned);
        return Ok(await query.OrderByDescending(l => l.Score).ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var lead = await _db.Leads.Include(l => l.Project).Include(l => l.SiteVisits).FirstOrDefaultAsync(l => l.Id == id);
        if (lead == null) return NotFound();
        return Ok(lead);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Lead lead)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        lead.CreatedAt = DateTime.UtcNow;
        if (string.IsNullOrEmpty(lead.Stage))
        {
            lead.Stage = await _db.SystemConfigs.Where(c => c.Category == "LeadStage" && c.IsDefault).Select(c => c.Value).FirstOrDefaultAsync()
                         ?? await _db.SystemConfigs.Where(c => c.Category == "LeadStage").OrderBy(c => c.SortOrder).Select(c => c.Value).FirstOrDefaultAsync()
                         ?? "";
        }
        if (string.IsNullOrEmpty(lead.Source))
        {
            lead.Source = await _db.SystemConfigs.Where(c => c.Category == "LeadSource" && c.IsDefault).Select(c => c.Value).FirstOrDefaultAsync()
                           ?? await _db.SystemConfigs.Where(c => c.Category == "LeadSource").OrderBy(c => c.SortOrder).Select(c => c.Value).FirstOrDefaultAsync()
                           ?? "";
        }
        _db.Leads.Add(lead);
        await _db.SaveChangesAsync();

        // Write lead creation log
        _db.LeadAuditLogs.Add(new LeadAuditLog
        {
            LeadId = lead.Id,
            ActivityIcon = "🎯",
            ActivityType = "Lead Created",
            PrevStage = "",
            NewStage = lead.Stage,
            UserName = "System",
            Timestamp = DateTime.UtcNow,
            Comments = $"Lead created via {lead.Source} with interest in units: {lead.Interest}."
        });

        // Write initial assignment log if assigned
        if (!string.IsNullOrEmpty(lead.AssignedTo))
        {
            _db.LeadAuditLogs.Add(new LeadAuditLog
            {
                LeadId = lead.Id,
                ActivityIcon = "👤",
                ActivityType = "Lead Assigned",
                PrevStage = lead.Stage,
                NewStage = lead.Stage,
                UserName = "System",
                Timestamp = DateTime.UtcNow,
                Comments = $"Assigned to sales representative {lead.AssignedTo}."
            });
        }
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = lead.Id }, lead);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Lead lead)
    {
        if (id != lead.Id) return BadRequest();
        var existing = await _db.Leads.FindAsync(id);
        if (existing == null) return NotFound();

        var prevStage = existing.Stage;
        var prevAssigned = existing.AssignedTo;

        existing.Name = lead.Name;
        existing.Email = lead.Email;
        existing.Phone = lead.Phone;
        existing.Source = lead.Source;
        existing.Stage = lead.Stage;
        existing.Score = lead.Score;
        existing.Interest = lead.Interest;
        existing.AssignedTo = lead.AssignedTo;
        existing.Budget = lead.Budget;
        existing.ProjectId = lead.ProjectId;
        await _db.SaveChangesAsync();

        // Log stage updates
        if (prevStage != lead.Stage)
        {
            _db.LeadAuditLogs.Add(new LeadAuditLog
            {
                LeadId = lead.Id,
                ActivityIcon = "🔄",
                ActivityType = "Stage Changed",
                PrevStage = prevStage,
                NewStage = lead.Stage,
                UserName = "System",
                Timestamp = DateTime.UtcNow,
                Comments = $"Stage transitioned from '{prevStage}' to '{lead.Stage}'."
            });
        }

        // Log executive assignments
        if (prevAssigned != lead.AssignedTo)
        {
            _db.LeadAuditLogs.Add(new LeadAuditLog
            {
                LeadId = lead.Id,
                ActivityIcon = "👤",
                ActivityType = "Lead Assigned",
                PrevStage = lead.Stage,
                NewStage = lead.Stage,
                UserName = "System",
                Timestamp = DateTime.UtcNow,
                Comments = string.IsNullOrEmpty(prevAssigned)
                    ? $"Assigned to sales executive '{lead.AssignedTo}'."
                    : $"Reassigned from '{prevAssigned}' to '{lead.AssignedTo}'."
            });
        }

        // General modifications
        _db.LeadAuditLogs.Add(new LeadAuditLog
        {
            LeadId = lead.Id,
            ActivityIcon = "✏️",
            ActivityType = "Lead Updated",
            PrevStage = lead.Stage,
            NewStage = lead.Stage,
            UserName = "System",
            Timestamp = DateTime.UtcNow,
            Comments = "Lead profile details updated."
        });

        await _db.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpPatch("{id}/stage")]
    public async Task<IActionResult> UpdateStage(int id, [FromBody] StageUpdateDto dto)
    {
        var lead = await _db.Leads.FindAsync(id);
        if (lead == null) return NotFound();

        var prevStage = lead.Stage;
        var role = Request.Headers["X-User-Role"].FirstOrDefault() ?? "Sales Agent";
        var name = Request.Headers["X-User-Name"].FirstOrDefault() ?? "Sales Executive";

        // Validate Roles & Permissions
        if ((dto.Stage == "Closed Won" || dto.Stage == "Closed Lost") && role != "Super Admin" && role != "Manager")
        {
            return BadRequest(new { message = "Only Managers or Admins are authorized to close leads." });
        }

        // Fetch workflow order dynamically
        var stages = await _db.SystemConfigs
            .Where(c => c.Category == "LeadStage")
            .OrderBy(c => c.SortOrder)
            .Select(c => c.Value)
            .ToListAsync();

        int prevIdx = stages.IndexOf(prevStage);
        int nextIdx = stages.IndexOf(dto.Stage);

        // Prevent jumping ahead too far (more than 3 stages) for non-managers
        if (prevIdx != -1 && nextIdx != -1)
        {
            if (nextIdx - prevIdx > 3 && role != "Super Admin" && role != "Manager")
            {
                return BadRequest(new { message = $"Workflow jump from '{prevStage}' directly to '{dto.Stage}' is restricted. Transition step-by-step or contact your Manager." });
            }
        }

        // Validate Comment Requirements (closing, cancelled, or reverting)
        bool isReversion = prevIdx != -1 && nextIdx != -1 && nextIdx < prevIdx;
        bool isClosingOrCancelling = dto.Stage == "Closed Lost" || dto.Stage == "Cancelled";

        if ((isReversion || isClosingOrCancelling) && string.IsNullOrEmpty(dto.Comment))
        {
            return BadRequest(new { message = "A comment/reason is mandatory when reverting stages or closing a lead." });
        }

        lead.Stage = dto.Stage;
        if (dto.NextFollowUpDate.HasValue)
        {
            lead.NextFollowUpDate = dto.NextFollowUpDate.Value;
        }
        await _db.SaveChangesAsync();

        // Write to LeadAuditLogs
        _db.LeadAuditLogs.Add(new LeadAuditLog
        {
            LeadId = lead.Id,
            ActivityIcon = isReversion ? "🔄" : (dto.Stage == "Closed Won" ? "🏆" : (dto.Stage == "Closed Lost" ? "❌" : "🔄")),
            ActivityType = "Stage Changed",
            PrevStage = prevStage,
            NewStage = dto.Stage,
            UserName = name,
            Timestamp = DateTime.UtcNow,
            Comments = $"[{role}] Stage changed from '{prevStage}' to '{dto.Stage}'. Reason: {dto.Comment ?? "Updated via Lead Pipeline."}"
        });
        await _db.SaveChangesAsync();

        // Auto Booking Registry & Customer Sync: If stage becomes Booking Confirmed, automatically create Booking
        if (dto.Stage == "Booking Confirmed")
        {
            var customer = await _db.Customers.FirstOrDefaultAsync(c => c.Phone == lead.Phone || c.Email == lead.Email);
            if (customer == null)
            {
                customer = new Customer
                {
                    Name = lead.Name,
                    Email = lead.Email ?? "",
                    Phone = lead.Phone,
                    Status = "Active",
                    BookingDate = DateTime.UtcNow,
                    TotalAmount = lead.Budget,
                    PaidAmount = 0,
                    ProjectId = lead.ProjectId ?? 1,
                    UnitNumber = lead.Interest ?? "A-101"
                };
                _db.Customers.Add(customer);
                await _db.SaveChangesAsync();
            }

            var booking = await _db.Bookings.FirstOrDefaultAsync(b => b.CustomerId == customer.Id);
            if (booking == null)
            {
                var allBookings = await _db.Bookings.ToListAsync();
                booking = new Booking
                {
                    BookingNumber = $"BK{DateTime.Now.Year}{(allBookings.Count + 1):D3}",
                    CustomerId = customer.Id,
                    UnitId = 1,
                    BookingDate = DateTime.UtcNow,
                    TotalAmount = lead.Budget,
                    TokenAmount = lead.Budget * 0.05m,
                    Status = "Confirmed",
                    AssignedAgent = lead.AssignedTo ?? "System"
                };
                _db.Bookings.Add(booking);
                await _db.SaveChangesAsync();
            }
        }

        return Ok(lead);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var lead = await _db.Leads.FindAsync(id);
        if (lead == null) return NotFound();
        _db.Leads.Remove(lead);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("kanban")]
    public async Task<IActionResult> GetKanban()
    {
        var stages = await _db.SystemConfigs
            .Where(c => c.Category == "LeadStage")
            .OrderBy(c => c.SortOrder)
            .Select(c => c.Value)
            .ToArrayAsync();
        var leads = await _db.Leads.Include(l => l.Project).Include(l => l.SiteVisits).ToListAsync();
        var kanban = stages.ToDictionary(s => s, s => leads.Where(l => l.Stage == s).OrderByDescending(l => l.Score).ToList());
        return Ok(kanban);
    }

    [HttpGet("{id}/timeline")]
    public async Task<IActionResult> GetTimeline(int id)
    {
        var lead = await _db.Leads.Include(l => l.Project).FirstOrDefaultAsync(l => l.Id == id);
        if (lead == null) return NotFound();

        var logs = await _db.LeadAuditLogs
            .Where(x => x.LeadId == id)
            .OrderBy(x => x.Timestamp)
            .Select(x => new TimelineEntryDto(
                x.ActivityIcon,
                x.ActivityType,
                x.Timestamp,
                x.UserName,
                x.Comments
            ))
            .ToListAsync();

        if (logs.Count == 0)
        {
            var initialLog = new LeadAuditLog
            {
                LeadId = id,
                ActivityIcon = "🎯",
                ActivityType = "Lead Created",
                PrevStage = "",
                NewStage = lead.Stage,
                UserName = "System",
                Timestamp = lead.CreatedAt,
                Comments = $"Lead created via {lead.Source} with interest in project {lead.Project?.Name ?? "General"}."
            };
            _db.LeadAuditLogs.Add(initialLog);
            await _db.SaveChangesAsync();

            logs.Add(new TimelineEntryDto(
                initialLog.ActivityIcon,
                initialLog.ActivityType,
                initialLog.Timestamp,
                initialLog.UserName,
                initialLog.Comments
            ));
        }

        return Ok(logs);
    }
}

public record StageUpdateDto(string Stage, string? Comment, DateTime? NextFollowUpDate);
public record TimelineEntryDto(string Icon, string Activity, DateTime DateTime, string PerformedBy, string Comments);
