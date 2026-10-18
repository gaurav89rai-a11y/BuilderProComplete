using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BuilderProAPI.Data;
using BuilderProAPI.Models;

namespace BuilderProAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SiteVisitsController : ControllerBase
{
    private readonly BuilderProDbContext _db;
    public SiteVisitsController(BuilderProDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status)
    {
        var role = Request.Headers["X-User-Role"].FirstOrDefault();
        var userIdHeader = Request.Headers["X-User-Id"].FirstOrDefault();
        var userNameHeader = Request.Headers["X-User-Name"].FirstOrDefault();
        int? userId = int.TryParse(userIdHeader, out int uid) ? uid : null;

        if (string.Equals(role, "Accounts", StringComparison.OrdinalIgnoreCase) || string.Equals(role, "Accountant", StringComparison.OrdinalIgnoreCase))
        {
            return Forbid();
        }

        var query = _db.SiteVisits.Include(v => v.Lead).Include(v => v.Project).Include(v => v.Agent).AsQueryable();

        if (string.Equals(role, "Sales Agent", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(v => (userId.HasValue && v.AgentId == userId.Value) || 
                                     (!string.IsNullOrEmpty(userNameHeader) && v.AssignedAgent == userNameHeader) ||
                                     (v.Lead != null && ((userId.HasValue && v.Lead.AgentId == userId.Value) || (!string.IsNullOrEmpty(userNameHeader) && v.Lead.AssignedTo == userNameHeader))));
        }

        if (!string.IsNullOrEmpty(status)) query = query.Where(v => v.Status == status);
        return Ok(await query.OrderByDescending(v => v.VisitDate).ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var role = Request.Headers["X-User-Role"].FirstOrDefault();
        var userIdHeader = Request.Headers["X-User-Id"].FirstOrDefault();
        var userNameHeader = Request.Headers["X-User-Name"].FirstOrDefault();
        int? userId = int.TryParse(userIdHeader, out int uid) ? uid : null;

        if (string.Equals(role, "Accounts", StringComparison.OrdinalIgnoreCase) || string.Equals(role, "Accountant", StringComparison.OrdinalIgnoreCase))
        {
            return Forbid();
        }

        var v = await _db.SiteVisits.Include(x => x.Lead).Include(x => x.Project).Include(x => x.Agent).FirstOrDefaultAsync(x => x.Id == id);
        if (v == null) return NotFound();

        if (string.Equals(role, "Sales Agent", StringComparison.OrdinalIgnoreCase))
        {
            bool isAssigned = (userId.HasValue && v.AgentId == userId.Value) || 
                              (!string.IsNullOrEmpty(userNameHeader) && v.AssignedAgent == userNameHeader) ||
                              (v.Lead != null && ((userId.HasValue && v.Lead.AgentId == userId.Value) || (!string.IsNullOrEmpty(userNameHeader) && v.Lead.AssignedTo == userNameHeader)));
            if (!isAssigned) return Forbid();
        }

        return Ok(v);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SiteVisit visit)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        visit.CreatedAt = DateTime.UtcNow;

        // Resolve Agent
        if (visit.AgentId.HasValue)
        {
            var user = await _db.Users.FindAsync(visit.AgentId.Value);
            if (user != null && string.IsNullOrEmpty(visit.AssignedAgent))
            {
                visit.AssignedAgent = user.Name;
            }
        }
        else if (!string.IsNullOrEmpty(visit.AssignedAgent))
        {
            if (int.TryParse(visit.AssignedAgent, out int parsedId))
            {
                visit.AgentId = parsedId;
                var user = await _db.Users.FindAsync(parsedId);
                if (user != null) visit.AssignedAgent = user.Name;
            }
            else
            {
                var user = await _db.Users.FirstOrDefaultAsync(u => u.Name == visit.AssignedAgent);
                if (user != null) visit.AgentId = user.Id;
            }
        }
        if (string.IsNullOrEmpty(visit.Status))
        {
            visit.Status = await _db.SystemConfigs.Where(c => c.Category == "SystemSetting" && c.Value == "DefaultSiteVisitStatus").Select(c => c.Label).FirstOrDefaultAsync()
                           ?? await _db.SystemConfigs.Where(c => c.Category == "SiteVisitStatus" && c.IsDefault).Select(c => c.Value).FirstOrDefaultAsync()
                           ?? await _db.SystemConfigs.Where(c => c.Category == "SiteVisitStatus").OrderBy(c => c.SortOrder).Select(c => c.Value).FirstOrDefaultAsync()
                           ?? "";
        }
        _db.SiteVisits.Add(visit);
        
        // Update lead stage
        var lead = await _db.Leads.FindAsync(visit.LeadId);
        string prevStage = "";
        string newStageStr = "";
        if (lead != null)
        {
            prevStage = lead.Stage;
            var newStage = await _db.SystemConfigs.Where(c => c.Category == "SystemSetting" && c.Value == "NewLeadStage").Select(c => c.Label).FirstOrDefaultAsync()
                           ?? await _db.SystemConfigs.Where(c => c.Category == "LeadStage" && c.Value == "New").Select(c => c.Value).FirstOrDefaultAsync()
                           ?? "";
            var contactedStage = await _db.SystemConfigs.Where(c => c.Category == "SystemSetting" && c.Value == "ContactedLeadStage").Select(c => c.Label).FirstOrDefaultAsync()
                                 ?? await _db.SystemConfigs.Where(c => c.Category == "LeadStage" && c.Value == "Contacted").Select(c => c.Value).FirstOrDefaultAsync()
                                 ?? "";
            var siteVisitStage = await _db.SystemConfigs.Where(c => c.Category == "SystemSetting" && c.Value == "SiteVisitLeadStage").Select(c => c.Label).FirstOrDefaultAsync()
                                 ?? await _db.SystemConfigs.Where(c => c.Category == "LeadStage" && c.Value == "Site Visit").Select(c => c.Value).FirstOrDefaultAsync()
                                 ?? "";

            if (lead.Stage == newStage || lead.Stage == contactedStage)
            {
                lead.Stage = siteVisitStage;
            }
            newStageStr = lead.Stage;
        }
        await _db.SaveChangesAsync();

        _db.LeadAuditLogs.Add(new LeadAuditLog
        {
            LeadId = visit.LeadId,
            ActivityIcon = "📅",
            ActivityType = "Site Visit Scheduled",
            PrevStage = prevStage,
            NewStage = newStageStr,
            UserName = visit.AssignedAgent ?? "System",
            Timestamp = DateTime.UtcNow,
            Comments = $"Site visit scheduled on {visit.VisitDate:dd-MMM-yyyy} at {visit.VisitTime}. Notes: {visit.Notes}"
        });
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = visit.Id }, visit);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] SiteVisit visit)
    {
        if (id != visit.Id) return BadRequest();
        var existing = await _db.SiteVisits.FindAsync(id);
        if (existing == null) return NotFound();
        existing.VisitDate = visit.VisitDate;
        existing.VisitTime = visit.VisitTime;
        existing.Status = visit.Status;
        existing.Interest = visit.Interest;
        existing.Notes = visit.Notes;

        // Resolve Agent
        if (visit.AgentId.HasValue)
        {
            existing.AgentId = visit.AgentId;
            var user = await _db.Users.FindAsync(visit.AgentId.Value);
            if (user != null) existing.AssignedAgent = user.Name;
            else if (!string.IsNullOrEmpty(visit.AssignedAgent)) existing.AssignedAgent = visit.AssignedAgent;
        }
        else if (!string.IsNullOrEmpty(visit.AssignedAgent))
        {
            if (int.TryParse(visit.AssignedAgent, out int parsedId))
            {
                existing.AgentId = parsedId;
                var user = await _db.Users.FindAsync(parsedId);
                if (user != null) existing.AssignedAgent = user.Name;
                else existing.AssignedAgent = visit.AssignedAgent;
            }
            else
            {
                existing.AssignedAgent = visit.AssignedAgent;
                var user = await _db.Users.FirstOrDefaultAsync(u => u.Name == visit.AssignedAgent);
                if (user != null) existing.AgentId = user.Id;
            }
        }
        await _db.SaveChangesAsync();

        var lead = await _db.Leads.FindAsync(existing.LeadId);
        string currentStage = lead?.Stage ?? "";
        _db.LeadAuditLogs.Add(new LeadAuditLog
        {
            LeadId = existing.LeadId,
            ActivityIcon = "✏️",
            ActivityType = "Site Visit Updated",
            PrevStage = currentStage,
            NewStage = currentStage,
            UserName = visit.AssignedAgent ?? "System",
            Timestamp = DateTime.UtcNow,
            Comments = $"Site visit details updated. Date: {visit.VisitDate:dd-MMM-yyyy}, Time: {visit.VisitTime}, Agent: {visit.AssignedAgent}."
        });
        await _db.SaveChangesAsync();

        return Ok(existing);
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] VisitStatusDto dto)
    {
        var visit = await _db.SiteVisits.FindAsync(id);
        if (visit == null) return NotFound();
        visit.Status = dto.Status;
        await _db.SaveChangesAsync();

        var lead = await _db.Leads.FindAsync(visit.LeadId);
        string currentStage = lead?.Stage ?? "";
        string icon = "🔄";
        string actType = "Site Visit Updated";
        if (dto.Status == "Completed") { icon = "✅"; actType = "Site Visit Completed"; }
        else if (dto.Status == "Cancelled") { icon = "❌"; actType = "Site Visit Cancelled"; }

        _db.LeadAuditLogs.Add(new LeadAuditLog
        {
            LeadId = visit.LeadId,
            ActivityIcon = icon,
            ActivityType = actType,
            PrevStage = currentStage,
            NewStage = currentStage,
            UserName = visit.AssignedAgent ?? "System",
            Timestamp = DateTime.UtcNow,
            Comments = $"Site visit marked as {dto.Status}. Notes: {visit.Notes}"
        });
        await _db.SaveChangesAsync();

        return Ok(visit);
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

        var v = await _db.SiteVisits.FindAsync(id);
        if (v == null) return NotFound();
        _db.SiteVisits.Remove(v);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record VisitStatusDto(string Status);
