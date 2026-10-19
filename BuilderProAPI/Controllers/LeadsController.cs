using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BuilderProAPI.Data;
using BuilderProAPI.Models;
using BuilderProAPI.Middlewares;

namespace BuilderProAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LeadsController : ControllerBase
{
    private readonly BuilderProDbContext _db;
    public LeadsController(BuilderProDbContext db) => _db = db;

    [HttpGet]
    [RequirePermission("crm.leads.view")]
    public async Task<IActionResult> GetAll([FromQuery] string? stage, [FromQuery] string? assigned, [FromQuery] int? channelPartnerId)
    {
        var role = Request.Headers["X-User-Role"].FirstOrDefault();
        var userIdHeader = Request.Headers["X-User-Id"].FirstOrDefault();
        var userNameHeader = Request.Headers["X-User-Name"].FirstOrDefault();
        int? userId = int.TryParse(userIdHeader, out int uid) ? uid : null;

        var cpHeader = Request.Headers["X-Channel-Partner-Id"].FirstOrDefault();
        int? cpId = channelPartnerId;
        if (!cpId.HasValue && int.TryParse(cpHeader, out int parsedCp)) cpId = parsedCp;

        if (string.Equals(role, "Accounts", StringComparison.OrdinalIgnoreCase) || string.Equals(role, "Accountant", StringComparison.OrdinalIgnoreCase))
        {
            return Forbid();
        }

        var query = _db.Leads.Include(l => l.Project).Include(l => l.ChannelPartner).Include(l => l.Agent).Include(l => l.Unit).AsQueryable();

        // Enforce Channel Partner role restriction: Access only their own submitted leads
        if (string.Equals(role, "Channel Partner", StringComparison.OrdinalIgnoreCase) && cpId.HasValue)
        {
            query = query.Where(l => l.ChannelPartnerId == cpId.Value);
        }
        else if (cpId.HasValue)
        {
            query = query.Where(l => l.ChannelPartnerId == cpId.Value);
        }

        // Enforce Sales Agent role restriction: Access only assigned leads
        if (string.Equals(role, "Sales Agent", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(l => (userId.HasValue && l.AgentId == userId.Value) || (!string.IsNullOrEmpty(userNameHeader) && l.AssignedTo == userNameHeader));
        }

        if (!string.IsNullOrEmpty(stage)) query = query.Where(l => l.Stage == stage);
        if (!string.IsNullOrEmpty(assigned)) query = query.Where(l => l.AssignedTo == assigned || (l.AgentId.HasValue && l.AgentId.ToString() == assigned));
        return Ok(await query.OrderByDescending(l => l.CreatedAt).ToListAsync());
    }

    [HttpGet("{id}")]
    [RequirePermission("crm.leads.view")]
    public async Task<IActionResult> GetById(int id)
    {
        var role = Request.Headers["X-User-Role"].FirstOrDefault();
        var userIdHeader = Request.Headers["X-User-Id"].FirstOrDefault();
        var userNameHeader = Request.Headers["X-User-Name"].FirstOrDefault();
        int? userId = int.TryParse(userIdHeader, out int uid) ? uid : null;

        var cpHeader = Request.Headers["X-Channel-Partner-Id"].FirstOrDefault();
        int? cpId = null;
        if (int.TryParse(cpHeader, out int parsedCp)) cpId = parsedCp;

        if (string.Equals(role, "Accounts", StringComparison.OrdinalIgnoreCase) || string.Equals(role, "Accountant", StringComparison.OrdinalIgnoreCase))
        {
            return Forbid();
        }

        var lead = await _db.Leads.Include(l => l.Project).Include(l => l.SiteVisits).Include(l => l.ChannelPartner).Include(l => l.Agent).Include(l => l.Unit).FirstOrDefaultAsync(l => l.Id == id);
        if (lead == null) return NotFound();

        if (string.Equals(role, "Channel Partner", StringComparison.OrdinalIgnoreCase) && cpId.HasValue)
        {
            if (lead.ChannelPartnerId != cpId.Value) return Forbid();
        }

        if (string.Equals(role, "Sales Agent", StringComparison.OrdinalIgnoreCase))
        {
            bool isAssigned = (userId.HasValue && lead.AgentId == userId.Value) || (!string.IsNullOrEmpty(userNameHeader) && lead.AssignedTo == userNameHeader);
            if (!isAssigned) return Forbid();
        }

        return Ok(lead);
    }

    [HttpPost]
    [RequirePermission("crm.leads.create")]
    public async Task<IActionResult> Create([FromBody] Lead lead)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        lead.CreatedAt = DateTime.UtcNow;

        var role = Request.Headers["X-User-Role"].FirstOrDefault();
        var cpHeader = Request.Headers["X-Channel-Partner-Id"].FirstOrDefault();
        if (string.Equals(role, "Channel Partner", StringComparison.OrdinalIgnoreCase) && int.TryParse(cpHeader, out int parsedCp))
        {
            lead.ChannelPartnerId = parsedCp;
            lead.Source = "Channel Partner";
        }
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

        // Validate flat selection and availability
        if (lead.UnitId.HasValue && lead.UnitId.Value > 0)
        {
            var unit = await _db.Units.FindAsync(lead.UnitId.Value);
            if (unit == null)
            {
                return BadRequest(new { message = $"Selected flat (ID: {lead.UnitId.Value}) does not exist." });
            }
            if (lead.ProjectId.HasValue && unit.ProjectId != lead.ProjectId.Value)
            {
                return BadRequest(new { message = $"Selected flat {unit.UnitNumber} does not belong to the selected project." });
            }
            if (!lead.ProjectId.HasValue)
            {
                lead.ProjectId = unit.ProjectId;
            }

            var hasActiveBooking = await _db.Bookings.AnyAsync(b => b.UnitId == lead.UnitId.Value && b.Status != "Cancelled");
            if (unit.Status == "Sold" || unit.Status == "Booked" || hasActiveBooking)
            {
                return Conflict(new { message = $"Flat {unit.UnitNumber} is no longer available. Please select another flat." });
            }

            lead.FlatNo = unit.UnitNumber;
        }

        // Resolve Agent
        if (lead.AgentId.HasValue)
        {
            var user = await _db.Users.FindAsync(lead.AgentId.Value);
            if (user != null && string.IsNullOrEmpty(lead.AssignedTo))
            {
                lead.AssignedTo = user.Name;
            }
        }
        else if (!string.IsNullOrEmpty(lead.AssignedTo))
        {
            if (int.TryParse(lead.AssignedTo, out int parsedId))
            {
                lead.AgentId = parsedId;
                var user = await _db.Users.FindAsync(parsedId);
                if (user != null) lead.AssignedTo = user.Name;
            }
            else
            {
                var user = await _db.Users.FirstOrDefaultAsync(u => u.Name == lead.AssignedTo);
                if (user != null) lead.AgentId = user.Id;
            }
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
        if (!string.IsNullOrEmpty(lead.AssignedTo) || lead.AgentId.HasValue)
        {
            var agentName = lead.AssignedTo;
            if (string.IsNullOrEmpty(agentName) && lead.AgentId.HasValue)
            {
                var agentUser = await _db.Users.FindAsync(lead.AgentId.Value);
                agentName = agentUser?.Name ?? lead.AgentId.ToString();
            }

            _db.LeadAuditLogs.Add(new LeadAuditLog
            {
                LeadId = lead.Id,
                ActivityIcon = "👤",
                ActivityType = "Lead Assigned",
                PrevStage = lead.Stage,
                NewStage = lead.Stage,
                UserName = "System",
                Timestamp = DateTime.UtcNow,
                Comments = $"Assigned to sales representative {agentName}."
            });
        }
        // Auto-sync Lead as Customer so they are immediately available in Customer & Booking registries
        var existingCust = await _db.Customers.FirstOrDefaultAsync(c => c.Phone == lead.Phone || (!string.IsNullOrEmpty(lead.Email) && c.Email == lead.Email));
        if (existingCust == null)
        {
            _db.Customers.Add(new Customer
            {
                Name = lead.Name,
                Email = lead.Email ?? "",
                Phone = lead.Phone,
                UnitNumber = !string.IsNullOrEmpty(lead.FlatNo) ? lead.FlatNo : (!string.IsNullOrEmpty(lead.Interest) ? lead.Interest : "Pending Allocation"),
                ProjectId = lead.ProjectId ?? 1,
                BookingDate = DateTime.UtcNow,
                Status = "Active",
                TotalAmount = lead.Budget,
                PaidAmount = 0,
                CreatedAt = DateTime.UtcNow
            });
            await _db.SaveChangesAsync();
        }

        return CreatedAtAction(nameof(GetById), new { id = lead.Id }, lead);
    }

    [HttpPut("{id}")]
    [RequirePermission("crm.leads.edit")]
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
        existing.ChannelPartnerId = lead.ChannelPartnerId;
        existing.Stage = lead.Stage;
        existing.Interest = lead.Interest;
        existing.Budget = lead.Budget;
        existing.ProjectId = lead.ProjectId;

        // Flat / Unit selection and availability validation
        if (lead.UnitId.HasValue && lead.UnitId.Value > 0)
        {
            var unit = await _db.Units.FindAsync(lead.UnitId.Value);
            if (unit == null)
            {
                return BadRequest(new { message = $"Selected flat (ID: {lead.UnitId.Value}) does not exist." });
            }
            if (lead.ProjectId.HasValue && unit.ProjectId != lead.ProjectId.Value)
            {
                return BadRequest(new { message = $"Selected flat {unit.UnitNumber} does not belong to the selected project." });
            }

            if (existing.UnitId != lead.UnitId.Value)
            {
                var hasActiveBooking = await _db.Bookings.AnyAsync(b => b.UnitId == lead.UnitId.Value && b.Status != "Cancelled");
                if (unit.Status == "Sold" || unit.Status == "Booked" || hasActiveBooking)
                {
                    return Conflict(new { message = $"Flat {unit.UnitNumber} is no longer available. Please select another flat." });
                }
            }

            existing.UnitId = lead.UnitId.Value;
            existing.FlatNo = unit.UnitNumber;
        }
        else if (lead.UnitId == null || lead.UnitId == 0)
        {
            existing.UnitId = null;
            if (!string.IsNullOrEmpty(lead.FlatNo)) existing.FlatNo = lead.FlatNo;
            else existing.FlatNo = "";
        }

        // Resolve Agent
        if (lead.AgentId.HasValue)
        {
            existing.AgentId = lead.AgentId;
            var user = await _db.Users.FindAsync(lead.AgentId.Value);
            if (user != null) existing.AssignedTo = user.Name;
            else if (!string.IsNullOrEmpty(lead.AssignedTo)) existing.AssignedTo = lead.AssignedTo;
        }
        else if (!string.IsNullOrEmpty(lead.AssignedTo))
        {
            if (int.TryParse(lead.AssignedTo, out int parsedId))
            {
                existing.AgentId = parsedId;
                var user = await _db.Users.FindAsync(parsedId);
                if (user != null) existing.AssignedTo = user.Name;
                else existing.AssignedTo = lead.AssignedTo;
            }
            else
            {
                existing.AssignedTo = lead.AssignedTo;
                var user = await _db.Users.FirstOrDefaultAsync(u => u.Name == lead.AssignedTo);
                if (user != null) existing.AgentId = user.Id;
            }
        }
        await _db.SaveChangesAsync();

        // Keep Customer record in sync
        var custToUpdate = await _db.Customers.FirstOrDefaultAsync(c => c.Phone == existing.Phone || (!string.IsNullOrEmpty(existing.Email) && c.Email == existing.Email));
        if (custToUpdate != null)
        {
            custToUpdate.Name = lead.Name;
            custToUpdate.Email = lead.Email ?? "";
            custToUpdate.Phone = lead.Phone;
            if (lead.ProjectId.HasValue) custToUpdate.ProjectId = lead.ProjectId.Value;
            custToUpdate.TotalAmount = lead.Budget;
            await _db.SaveChangesAsync();
        }

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
    [RequirePermission("crm.leads.change_status")]
    public async Task<IActionResult> UpdateStage(int id, [FromBody] StageUpdateDto dto)
    {
        var lead = await _db.Leads.FindAsync(id);
        if (lead == null) return NotFound();

        var prevStage = lead.Stage;
        var role = Request.Headers["X-User-Role"].FirstOrDefault() ?? "Sales Agent";
        var name = Request.Headers["X-User-Name"].FirstOrDefault() ?? "Sales Executive";
        var cpHeader = Request.Headers["X-Channel-Partner-Id"].FirstOrDefault();
        int? cpId = null;
        if (int.TryParse(cpHeader, out int parsedCp)) cpId = parsedCp;

        // Channel Partner access restriction
        if (string.Equals(role, "Channel Partner", StringComparison.OrdinalIgnoreCase) && cpId.HasValue)
        {
            if (lead.ChannelPartnerId != cpId.Value)
            {
                return Forbid();
            }
            if (dto.Stage == "Closed Won" || dto.Stage == "Closed Lost" || dto.Stage == "Cancelled")
            {
                return BadRequest(new { message = "Channel Partners are not authorized to close or cancel leads directly. Please coordinate with your Sales Manager." });
            }
        }

        // Validate Roles & Permissions
        if ((dto.Stage == "Closed Won" || dto.Stage == "Closed Lost") && role != "Super Admin" && role != "Manager" && role != "Sales Manager")
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
            if (nextIdx - prevIdx > 3 && role != "Super Admin" && role != "Manager" && role != "Sales Manager")
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
                    UnitNumber = !string.IsNullOrEmpty(lead.FlatNo) ? lead.FlatNo : (!string.IsNullOrEmpty(lead.Interest) ? lead.Interest : "A-101")
                };
                _db.Customers.Add(customer);
                await _db.SaveChangesAsync();
            }

            var booking = await _db.Bookings.FirstOrDefaultAsync(b => b.CustomerId == customer.Id);
            if (booking == null)
            {
                var allBookings = await _db.Bookings.ToListAsync();
                var assignedUnitId = lead.UnitId ?? (await _db.Units.Where(u => u.ProjectId == customer.ProjectId && u.Status == "Available").Select(u => (int?)u.Id).FirstOrDefaultAsync()) ?? 1;
                booking = new Booking
                {
                    BookingNumber = $"BK{DateTime.Now.Year}{(allBookings.Count + 1):D3}",
                    CustomerId = customer.Id,
                    UnitId = assignedUnitId,
                    BookingDate = DateTime.UtcNow,
                    TotalAmount = lead.Budget,
                    TokenAmount = lead.Budget * 0.05m,
                    Status = "Confirmed",
                    AssignedAgent = lead.AssignedTo ?? "System"
                };
                _db.Bookings.Add(booking);

                var bookedUnit = await _db.Units.FindAsync(assignedUnitId);
                if (bookedUnit != null)
                {
                    bookedUnit.Status = "Booked";
                }
                await _db.SaveChangesAsync();
            }
        }

        return Ok(lead);
    }

    [HttpDelete("{id}")]
    [RequirePermission("crm.leads.delete")]
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

        var lead = await _db.Leads.FindAsync(id);
        if (lead == null) return NotFound();

        var audits = _db.LeadAuditLogs.Where(a => a.LeadId == id);
        _db.LeadAuditLogs.RemoveRange(audits);

        var visits = _db.SiteVisits.Where(v => v.LeadId == id);
        _db.SiteVisits.RemoveRange(visits);

        _db.Leads.Remove(lead);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("kanban")]
    [RequirePermission("crm.leads.view")]
    public async Task<IActionResult> GetKanban([FromQuery] int? channelPartnerId)
    {
        var role = Request.Headers["X-User-Role"].FirstOrDefault();
        var userIdHeader = Request.Headers["X-User-Id"].FirstOrDefault();
        var userNameHeader = Request.Headers["X-User-Name"].FirstOrDefault();
        int? userId = int.TryParse(userIdHeader, out int uid) ? uid : null;

        var cpHeader = Request.Headers["X-Channel-Partner-Id"].FirstOrDefault();
        int? cpId = channelPartnerId;
        if (!cpId.HasValue && int.TryParse(cpHeader, out int parsedCp)) cpId = parsedCp;

        if (string.Equals(role, "Accounts", StringComparison.OrdinalIgnoreCase) || string.Equals(role, "Accountant", StringComparison.OrdinalIgnoreCase))
        {
            return Forbid();
        }

        var stages = await _db.SystemConfigs
            .Where(c => c.Category == "LeadStage")
            .OrderBy(c => c.SortOrder)
            .Select(c => c.Value)
            .ToArrayAsync();

        var query = _db.Leads
            .Include(l => l.Project)
            .Include(l => l.SiteVisits)
            .Include(l => l.ChannelPartner)
            .Include(l => l.Agent)
            .Include(l => l.Unit)
            .AsQueryable();

        // Enforce Channel Partner role restriction on kanban: Access only their own submitted leads
        if (string.Equals(role, "Channel Partner", StringComparison.OrdinalIgnoreCase) && cpId.HasValue)
        {
            query = query.Where(l => l.ChannelPartnerId == cpId.Value);
        }
        else if (cpId.HasValue)
        {
            query = query.Where(l => l.ChannelPartnerId == cpId.Value);
        }

        // Enforce Sales Agent role restriction on kanban: Access only assigned leads
        if (string.Equals(role, "Sales Agent", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(l => (userId.HasValue && l.AgentId == userId.Value) || (!string.IsNullOrEmpty(userNameHeader) && l.AssignedTo == userNameHeader));
        }

        var leads = await query.ToListAsync();

        // Normalize legacy or mismatched stages to prevent leads disappearing from the kanban board
        var stageSet = new HashSet<string>(stages, StringComparer.OrdinalIgnoreCase);
        foreach (var lead in leads)
        {
            if (string.Equals(lead.Stage, "Booking", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(lead.Stage, "Booked", StringComparison.OrdinalIgnoreCase))
            {
                lead.Stage = "Booking Confirmed";
            }
            else if (!stageSet.Contains(lead.Stage))
            {
                lead.Stage = stages.FirstOrDefault() ?? "New Lead";
            }
        }

        var kanban = stages.ToDictionary(s => s, s => leads.Where(l => l.Stage == s).OrderByDescending(l => l.CreatedAt).ToList());
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
