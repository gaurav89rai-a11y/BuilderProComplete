using BuilderProAPI.Repositories;
using BuilderProAPI.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BuilderProAPI.Services;

public class DashboardService : IDashboardService
{
    private readonly IUnitOfWork _uow;

    public DashboardService(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<object?> GetDashboardStatsAsync(int? projectId)
    {
        if (projectId.HasValue)
        {
            var proj = await _uow.Projects.GetByIdAsync(projectId.Value);
            if (proj == null) return null;
        }

        var allProjects = await _uow.Projects.GetAllAsync();
        var allUnits = await _uow.Units.GetAllAsync(u => !projectId.HasValue || u.ProjectId == projectId.Value);
        var allLeads = await _uow.Leads.GetAllAsync(l => !projectId.HasValue || l.ProjectId == projectId.Value);
        var allCustomers = await _uow.Customers.GetAllAsync(c => !projectId.HasValue || c.ProjectId == projectId.Value);
        var allBookings = await _uow.Bookings.GetAllAsync(
            b => !projectId.HasValue || b.Unit != null && b.Unit.ProjectId == projectId.Value,
            includeProperties: "Customer,Unit"
        );
        var allPartners = await _uow.ChannelPartners.GetAllAsync();
        var allTickets = await _uow.ServiceTickets.GetAllAsync();
        var allVisits = await _uow.SiteVisits.GetAllAsync(v => !projectId.HasValue || v.ProjectId == projectId.Value);
        var allCommissions = await _uow.Commissions.GetAllAsync();

        var activeProjectStatus = (await _uow.SystemConfigs.GetAllAsync(c => c.Category == "SystemSetting" && c.Value == "ActiveProjectStatus")).Select(c => c.Label).FirstOrDefault() ?? "";

        var activeProjects = projectId.HasValue
            ? allProjects.Count(p => p.Id == projectId.Value && p.Status == activeProjectStatus)
            : allProjects.Count(p => p.Status == activeProjectStatus);

        var totalRevenue = allCustomers.Sum(c => c.PaidAmount);

        // Retrieve configured lead sources to safely map/group them from database definitions
        var configuredSources = (await _uow.SystemConfigs.GetAllAsync(c => c.Category == "LeadSource")).Select(c => c.Value).ToHashSet();

        var leadSourceGroups = allLeads
            .GroupBy(l => l.Source)
            .Select(g => new { Source = g.Key, Count = g.Count() })
            .ToList();

        var totalLeadCount = leadSourceGroups.Sum(g => g.Count);
        var leadSources = leadSourceGroups
            .Select(g => new
            {
                name = string.IsNullOrWhiteSpace(g.Source) ? "Other" : (configuredSources.Contains(g.Source) ? g.Source : "Other"),
                value = totalLeadCount > 0 ? (int)Math.Round(g.Count * 100.0 / totalLeadCount) : 0
            })
            .GroupBy(x => x.name)
            .Select(g => new { name = g.Key, value = g.Sum(x => x.value) })
            .OrderByDescending(x => x.value)
            .ToList();

        var monthlyTargetCr = projectId.HasValue
            ? allProjects.Where(p => p.Id == projectId.Value).Sum(p => p.TotalValue) / 12m / 10000000m
            : allProjects.Sum(p => p.TotalValue) / 12m / 10000000m;

        var customerPayments = allCustomers
            .Select(c => new { c.BookingDate.Month, c.PaidAmount })
            .ToList();

        // Generate month abbreviations dynamically via System.DateTime formatting to avoid hardcoded month arrays
        var monthLabels = Enumerable.Range(1, 12).Select(m => new DateTime(2020, m, 1).ToString("MMM")).ToArray();
        var monthlyRevenue = monthLabels.Select((label, i) =>
        {
            var month = i + 1;
            var rev = customerPayments.Where(c => c.Month == month).Sum(c => c.PaidAmount) / 10000000m;
            return new
            {
                m = label,
                rev = Math.Round(rev, 1),
                tgt = Math.Round(monthlyTargetCr * month / 12m, 1)
            };
        }).ToList();

        Project? selectedProject = null;
        if (projectId.HasValue)
            selectedProject = allProjects.FirstOrDefault(p => p.Id == projectId.Value);

        // Fetch settings from database configurations table to avoid hardcoding business values
        var soldStatus = (await _uow.SystemConfigs.GetAllAsync(c => c.Category == "SystemSetting" && c.Value == "SoldUnitStatus")).Select(c => c.Label).FirstOrDefault() ?? "";
        var availableStatus = (await _uow.SystemConfigs.GetAllAsync(c => c.Category == "SystemSetting" && c.Value == "AvailableUnitStatus")).Select(c => c.Label).FirstOrDefault() ?? "";
        var bookedUnitStatus = (await _uow.SystemConfigs.GetAllAsync(c => c.Category == "SystemSetting" && c.Value == "BookedUnitStatus")).Select(c => c.Label).FirstOrDefault() ?? "";
        var bookedLeadStage = (await _uow.SystemConfigs.GetAllAsync(c => c.Category == "SystemSetting" && c.Value == "BookedLeadStage")).Select(c => c.Label).FirstOrDefault() ?? "";
        var overdueCustomerStatus = (await _uow.SystemConfigs.GetAllAsync(c => c.Category == "SystemSetting" && c.Value == "OverdueCustomerStatus")).Select(c => c.Label).FirstOrDefault() ?? "";
        var openTicketStatus = (await _uow.SystemConfigs.GetAllAsync(c => c.Category == "SystemSetting" && c.Value == "OpenSupportStatus")).Select(c => c.Label).FirstOrDefault() ?? "";
        var pendingCommissionStatus = (await _uow.SystemConfigs.GetAllAsync(c => c.Category == "SystemSetting" && c.Value == "PendingCommissionStatus")).Select(c => c.Label).FirstOrDefault() ?? "";
        var scheduledVisitStatus = (await _uow.SystemConfigs.GetAllAsync(c => c.Category == "SystemSetting" && c.Value == "ScheduledSiteVisitStatus")).Select(c => c.Label).FirstOrDefault() ?? "";

        var stats = new
        {
            activeProjects,
            totalRevenue,
            totalUnits = allUnits.Count(),
            soldUnits = allUnits.Count(u => u.Status == soldStatus),
            availableUnits = allUnits.Count(u => u.Status == availableStatus),
            bookedUnits = allUnits.Count(u => u.Status == bookedUnitStatus),
            activeLeads = allLeads.Count(l => l.Stage != bookedLeadStage),
            totalCustomers = allCustomers.Count(),
            overdueCustomers = allCustomers.Count(c => c.Status == overdueCustomerStatus),
            totalPartners = allPartners.Count(),
            openTickets = allTickets.Count(t => t.Status == openTicketStatus),
            totalBookings = allBookings.Count(),
            pendingCommissions = allCommissions.Where(c => c.Status == pendingCommissionStatus).Sum(c => c.Amount),
            scheduledVisits = allVisits.Count(v => v.Status == scheduledVisitStatus),
            selectedProject = selectedProject == null ? null : new
            {
                selectedProject.Id,
                selectedProject.Name,
                selectedProject.Location,
                selectedProject.Status,
                selectedProject.Type,
                selectedProject.ConstructionPct,
                selectedProject.TotalValue,
                selectedProject.TotalUnits
            },
            leadSources,
            monthlyRevenue,
            recentLeads = allLeads.OrderByDescending(l => l.CreatedAt).Take(5)
                .Select(l => new { l.Id, l.Name, l.Source, l.Stage, l.Score, l.Budget, l.AssignedTo }).ToList(),
            recentBookings = allBookings
                .OrderByDescending(b => b.BookingDate).Take(5)
                .Select(b => new { b.Id, b.BookingNumber, CustomerName = b.Customer?.Name ?? "", b.TotalAmount, b.Status }).ToList(),
        };
        return stats;
    }
}
