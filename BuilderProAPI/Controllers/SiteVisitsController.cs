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
        var query = _db.SiteVisits.Include(v => v.Lead).Include(v => v.Project).AsQueryable();
        if (!string.IsNullOrEmpty(status)) query = query.Where(v => v.Status == status);
        return Ok(await query.OrderByDescending(v => v.VisitDate).ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var v = await _db.SiteVisits.Include(x => x.Lead).Include(x => x.Project).FirstOrDefaultAsync(x => x.Id == id);
        if (v == null) return NotFound();
        return Ok(v);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SiteVisit visit)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        visit.CreatedAt = DateTime.UtcNow;
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
        existing.AssignedAgent = visit.AssignedAgent;
        existing.Status = visit.Status;
        existing.Interest = visit.Interest;
        existing.Notes = visit.Notes;
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
        var v = await _db.SiteVisits.FindAsync(id);
        if (v == null) return NotFound();
        _db.SiteVisits.Remove(v);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record VisitStatusDto(string Status);
