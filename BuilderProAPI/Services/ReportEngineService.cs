using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using BuilderProAPI.Data;
using BuilderProAPI.Models;

namespace BuilderProAPI.Services;

public class ReportEngineService : IReportEngineService
{
    static ReportEngineService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }
    private readonly BuilderProDbContext _db;
    private readonly ISSRSReportService _ssrs;
    private readonly SSRSConfig _config;
    private readonly ILogger<ReportEngineService> _logger;

    public ReportEngineService(
        BuilderProDbContext db,
        ISSRSReportService ssrs,
        IOptions<SSRSConfig> config,
        ILogger<ReportEngineService> logger)
    {
        _db = db;
        _ssrs = ssrs;
        _config = config.Value;
        _logger = logger;
    }

    public List<ReportCategory> GetCategories()
    {
        return new List<ReportCategory>
        {
            new() { Id = "dashboard", Name = "Executive & Dashboard", Description = "High-level portfolio performance, revenue velocity and operational indicators.", Icon = "LayoutDashboard" },
            new() { Id = "sales", Name = "Sales & CRM Reports", Description = "Lead progression, conversion funnel, site visit tracking and sales representative activity.", Icon = "Target" },
            new() { Id = "financial", Name = "Financial & Accounts", Description = "Collections realization, payment ledgers, receivables aging and project revenue analysis.", Icon = "DollarSign" },
            new() { Id = "partners", Name = "Channel Partner Reports", Description = "Partner deal closures, commission calculations, payout statuses and sourcing rankings.", Icon = "Handshake" },
            new() { Id = "operations", Name = "Operational & Inventory", Description = "Unit inventory matrix, availability by project/typology and construction progress.", Icon = "Building2" },
            new() { Id = "governance", Name = "Security & Governance", Description = "User accounts, role permission mappings, access control matrix and system audit logs.", Icon = "Shield" }
        };
    }

    private static readonly List<ReportDefinition> AllReports = new()
    {
        new ReportDefinition
        {
            Id = "executive-summary",
            Title = "Executive Portfolio & Financial Summary",
            Description = "Comprehensive overview of construction projects, unit availability, total booked revenue, realized collections, and outstanding receivables.",
            CategoryId = "dashboard",
            StoredProcedure = "sp_Rpt_ExecutiveSummary",
            RdlReportName = "ExecutiveSummaryReport",
            AllowedRoles = new() { "Super Admin", "Manager", "Sales Manager", "Accounts", "Accountant" },
            Parameters = new()
            {
                new() { Name = "ProjectId", Label = "Select Project", Type = "select" },
                new() { Name = "FromDate", Label = "From Date", Type = "date" },
                new() { Name = "ToDate", Label = "To Date", Type = "date" }
            }
        },
        new ReportDefinition
        {
            Id = "lead-pipeline",
            Title = "Lead Conversion & Sales Pipeline Funnel",
            Description = "Detailed lead progression audit analyzing lead sources, current stages, budget qualification, assigned sales agents, and conversion outcomes.",
            CategoryId = "sales",
            StoredProcedure = "sp_Rpt_LeadConversionPipeline",
            RdlReportName = "LeadPipelineReport",
            AllowedRoles = new() { "Super Admin", "Manager", "Sales Manager", "Sales Agent" },
            Parameters = new()
            {
                new() { Name = "ProjectId", Label = "Project", Type = "select" },
                new() { Name = "Stage", Label = "Lead Stage", Type = "select" },
                new() { Name = "AssignedTo", Label = "Assigned Sales Agent", Type = "select" },
                new() { Name = "FromDate", Label = "From Date", Type = "date" },
                new() { Name = "ToDate", Label = "To Date", Type = "date" },
                new() { Name = "Search", Label = "Search Prospect / Contact", Type = "text" }
            }
        },
        new ReportDefinition
        {
            Id = "site-visits",
            Title = "Site Visits & Prospect Engagement Log",
            Description = "Audit of scheduled, completed, and missed on-site customer visits, interest levels, notes, and representative interactions.",
            CategoryId = "sales",
            StoredProcedure = "sp_Rpt_SiteVisits",
            RdlReportName = "SiteVisitsReport",
            AllowedRoles = new() { "Super Admin", "Manager", "Sales Manager", "Sales Agent" },
            Parameters = new()
            {
                new() { Name = "ProjectId", Label = "Project", Type = "select" },
                new() { Name = "Status", Label = "Visit Status", Type = "select" },
                new() { Name = "AssignedAgent", Label = "Assigned Agent", Type = "select" },
                new() { Name = "FromDate", Label = "From Date", Type = "date" },
                new() { Name = "ToDate", Label = "To Date", Type = "date" }
            }
        },
        new ReportDefinition
        {
            Id = "financial-collections",
            Title = "Collections & Financial Realization Ledger",
            Description = "Detailed payment receipt transactions, payment instruments (NEFT, Cheque, Cash), linked customers, and realization status.",
            CategoryId = "financial",
            StoredProcedure = "sp_Rpt_FinancialCollections",
            RdlReportName = "FinancialCollectionsReport",
            AllowedRoles = new() { "Super Admin", "Manager", "Accounts", "Accountant" },
            Parameters = new()
            {
                new() { Name = "ProjectId", Label = "Project", Type = "select" },
                new() { Name = "PaymentMode", Label = "Payment Mode", Type = "select" },
                new() { Name = "Status", Label = "Payment Status", Type = "select" },
                new() { Name = "FromDate", Label = "From Date", Type = "date" },
                new() { Name = "ToDate", Label = "To Date", Type = "date" },
                new() { Name = "Search", Label = "Search Customer / Receipt", Type = "text" }
            }
        },
        new ReportDefinition
        {
            Id = "customer-receivables",
            Title = "Customer Receivables & Outstanding Aging",
            Description = "Customer payment balances, collection percentages, payment history, and aging analysis of pending installments.",
            CategoryId = "financial",
            StoredProcedure = "sp_Rpt_CustomerReceivables",
            RdlReportName = "CustomerReceivablesReport",
            AllowedRoles = new() { "Super Admin", "Manager", "Accounts", "Accountant" },
            Parameters = new()
            {
                new() { Name = "ProjectId", Label = "Project", Type = "select" },
                new() { Name = "Status", Label = "Customer Status", Type = "select" },
                new() { Name = "Search", Label = "Search Customer / Unit", Type = "text" }
            }
        },
        new ReportDefinition
        {
            Id = "partner-commission",
            Title = "Channel Partner Performance & Commission Ledger",
            Description = "Channel partner sourcing productivity, booked transactions, contracted commission rates, paid disbursements, and payable balances.",
            CategoryId = "partners",
            StoredProcedure = "sp_Rpt_ChannelPartnerCommission",
            RdlReportName = "ChannelPartnerCommissionReport",
            AllowedRoles = new() { "Super Admin", "Manager", "Sales Manager", "Accounts", "Channel Partner" },
            Parameters = new()
            {
                new() { Name = "PartnerId", Label = "Channel Partner Firm", Type = "select" },
                new() { Name = "Status", Label = "Commission Status", Type = "select" },
                new() { Name = "FromDate", Label = "From Date", Type = "date" },
                new() { Name = "ToDate", Label = "To Date", Type = "date" }
            }
        },
        new ReportDefinition
        {
            Id = "unit-inventory",
            Title = "Unit Inventory & Availability Matrix",
            Description = "Project unit matrix covering typology (1BHK/2BHK/3BHK), carpet area, base pricing, floor level, and booking availability status.",
            CategoryId = "operations",
            StoredProcedure = "sp_Rpt_UnitInventoryStatus",
            RdlReportName = "UnitInventoryReport",
            AllowedRoles = new() { "Super Admin", "Manager", "Sales Manager", "Sales Agent" },
            Parameters = new()
            {
                new() { Name = "ProjectId", Label = "Project", Type = "select" },
                new() { Name = "Status", Label = "Unit Status", Type = "select" },
                new() { Name = "UnitType", Label = "Unit Typology", Type = "select" }
            }
        },
        new ReportDefinition
        {
            Id = "user-role-audit",
            Title = "User Security, Roles & Permissions Audit",
            Description = "Enterprise security directory documenting active user accounts, system role assignments, granular permissions, and channel partner associations.",
            CategoryId = "governance",
            StoredProcedure = "sp_Rpt_UserRoleAudit",
            RdlReportName = "UserRoleAuditReport",
            AllowedRoles = new() { "Super Admin" },
            Parameters = new()
            {
                new() { Name = "Role", Label = "System Role", Type = "select" },
                new() { Name = "Search", Label = "Search User / Email", Type = "text" }
            }
        }
    };

    public List<ReportDefinition> GetCatalogForRole(string role, int? channelPartnerId)
    {
        var cleanRole = role?.Trim() ?? "Sales Agent";
        if (cleanRole == "Super Admin")
        {
            return AllReports;
        }

        return AllReports.Where(r => r.AllowedRoles.Any(ar => string.Equals(ar, cleanRole, StringComparison.OrdinalIgnoreCase))).ToList();
    }

    public async Task<List<ReportParameterDef>> GetPopulatedParametersAsync(string reportId, string role, int? channelPartnerId)
    {
        var report = AllReports.FirstOrDefault(r => r.Id == reportId);
        if (report == null) throw new KeyNotFoundException($"Report '{reportId}' was not found.");

        var parametersCopy = new List<ReportParameterDef>();

        // Fetch dynamic lookup lists from DB
        var projects = await _db.Projects.OrderBy(p => p.Name).Select(p => new { p.Id, p.Name }).ToListAsync();
        var users = await _db.Users.OrderBy(u => u.Name).Select(u => new { u.Id, u.Name, u.Role }).ToListAsync();
        var partners = await _db.ChannelPartners.OrderBy(p => p.Name).Select(p => new { p.Id, p.Name, p.City }).ToListAsync();

        foreach (var param in report.Parameters)
        {
            var pDef = new ReportParameterDef
            {
                Name = param.Name,
                Label = param.Label,
                Type = param.Type,
                Required = param.Required,
                DefaultValue = param.DefaultValue,
                DependsOn = param.DependsOn,
                Options = new List<ReportParameterOption>()
            };

            if (param.Name == "ProjectId")
            {
                pDef.Options.Add(new ReportParameterOption { Value = "", Label = "-- All Projects --" });
                foreach (var p in projects)
                {
                    pDef.Options.Add(new ReportParameterOption { Value = p.Id.ToString(), Label = p.Name });
                }
            }
            else if (param.Name == "PartnerId")
            {
                if (role == "Channel Partner" && channelPartnerId.HasValue)
                {
                    // Restrict to caller's own partner entity
                    var cp = partners.FirstOrDefault(x => x.Id == channelPartnerId.Value);
                    pDef.Options.Add(new ReportParameterOption { Value = channelPartnerId.Value.ToString(), Label = cp?.Name ?? "My Partner Account" });
                    pDef.DefaultValue = channelPartnerId.Value.ToString();
                }
                else
                {
                    pDef.Options.Add(new ReportParameterOption { Value = "", Label = "-- All Channel Partners --" });
                    foreach (var cp in partners)
                    {
                        pDef.Options.Add(new ReportParameterOption { Value = cp.Id.ToString(), Label = $"{cp.Name} ({cp.City})" });
                    }
                }
            }
            else if (param.Name == "AssignedTo" || param.Name == "AssignedAgent")
            {
                pDef.Options.Add(new ReportParameterOption { Value = "", Label = "-- All Sales Agents --" });
                foreach (var u in users.Where(u => u.Role != "Channel Partner"))
                {
                    pDef.Options.Add(new ReportParameterOption { Value = u.Name, Label = $"{u.Name} ({u.Role})" });
                }
            }
            else if (param.Name == "Stage")
            {
                pDef.Options.AddRange(new[]
                {
                    new ReportParameterOption { Value = "", Label = "-- All Stages --" },
                    new ReportParameterOption { Value = "New", Label = "New Lead" },
                    new ReportParameterOption { Value = "Contacted", Label = "Contacted" },
                    new ReportParameterOption { Value = "Site Visit Scheduled", Label = "Site Visit Scheduled" },
                    new ReportParameterOption { Value = "Site Visit Done", Label = "Site Visit Done" },
                    new ReportParameterOption { Value = "Negotiation", Label = "Negotiation" },
                    new ReportParameterOption { Value = "Booked", Label = "Booked" },
                    new ReportParameterOption { Value = "Lost", Label = "Lost" }
                });
            }
            else if (param.Name == "Status" && reportId == "site-visits")
            {
                pDef.Options.AddRange(new[]
                {
                    new ReportParameterOption { Value = "", Label = "-- All Statuses --" },
                    new ReportParameterOption { Value = "Scheduled", Label = "Scheduled" },
                    new ReportParameterOption { Value = "Completed", Label = "Completed" },
                    new ReportParameterOption { Value = "Cancelled", Label = "Cancelled" }
                });
            }
            else if (param.Name == "PaymentMode")
            {
                pDef.Options.AddRange(new[]
                {
                    new ReportParameterOption { Value = "", Label = "-- All Payment Modes --" },
                    new ReportParameterOption { Value = "NEFT", Label = "NEFT / RTGS" },
                    new ReportParameterOption { Value = "Cheque", Label = "Cheque" },
                    new ReportParameterOption { Value = "UPI", Label = "UPI / Online" },
                    new ReportParameterOption { Value = "Cash", Label = "Cash" }
                });
            }
            else if (param.Name == "Status" && reportId == "financial-collections")
            {
                pDef.Options.AddRange(new[]
                {
                    new ReportParameterOption { Value = "", Label = "-- All Statuses --" },
                    new ReportParameterOption { Value = "Received", Label = "Received" },
                    new ReportParameterOption { Value = "Pending", Label = "Pending Clearing" },
                    new ReportParameterOption { Value = "Bounced", Label = "Bounced" }
                });
            }
            else if (param.Name == "Status" && reportId == "customer-receivables")
            {
                pDef.Options.AddRange(new[]
                {
                    new ReportParameterOption { Value = "", Label = "-- All Customer Statuses --" },
                    new ReportParameterOption { Value = "Active", Label = "Active" },
                    new ReportParameterOption { Value = "Overdue", Label = "Overdue" },
                    new ReportParameterOption { Value = "Possession Given", Label = "Possession Given" }
                });
            }
            else if (param.Name == "Status" && reportId == "partner-commission")
            {
                pDef.Options.AddRange(new[]
                {
                    new ReportParameterOption { Value = "", Label = "-- All Payout Statuses --" },
                    new ReportParameterOption { Value = "Paid", Label = "Paid Out" },
                    new ReportParameterOption { Value = "Payable", Label = "Payable (Approved)" },
                    new ReportParameterOption { Value = "Pending Approval", Label = "Pending Approval" }
                });
            }
            else if (param.Name == "Status" && reportId == "unit-inventory")
            {
                pDef.Options.AddRange(new[]
                {
                    new ReportParameterOption { Value = "", Label = "-- All Statuses --" },
                    new ReportParameterOption { Value = "Available", Label = "Available" },
                    new ReportParameterOption { Value = "Booked", Label = "Booked" },
                    new ReportParameterOption { Value = "Sold", Label = "Sold" },
                    new ReportParameterOption { Value = "Held", Label = "Held / Blocked" }
                });
            }
            else if (param.Name == "UnitType")
            {
                pDef.Options.AddRange(new[]
                {
                    new ReportParameterOption { Value = "", Label = "-- All Typologies --" },
                    new ReportParameterOption { Value = "1 BHK", Label = "1 BHK" },
                    new ReportParameterOption { Value = "2 BHK", Label = "2 BHK" },
                    new ReportParameterOption { Value = "3 BHK", Label = "3 BHK" },
                    new ReportParameterOption { Value = "4 BHK", Label = "4 BHK" },
                    new ReportParameterOption { Value = "Penthouse", Label = "Penthouse" },
                    new ReportParameterOption { Value = "Retail Shop", Label = "Retail Shop" }
                });
            }
            else if (param.Name == "Role")
            {
                pDef.Options.AddRange(new[]
                {
                    new ReportParameterOption { Value = "", Label = "-- All Roles --" },
                    new ReportParameterOption { Value = "Super Admin", Label = "Super Admin" },
                    new ReportParameterOption { Value = "Manager", Label = "Manager" },
                    new ReportParameterOption { Value = "Sales Manager", Label = "Sales Manager" },
                    new ReportParameterOption { Value = "Sales Agent", Label = "Sales Agent" },
                    new ReportParameterOption { Value = "Accounts", Label = "Accounts" },
                    new ReportParameterOption { Value = "Channel Partner", Label = "Channel Partner" }
                });
            }

            parametersCopy.Add(pDef);
        }

        return parametersCopy;
    }

    private void AuthorizeAndSanitizeReportRequest(ReportDefinition report, Dictionary<string, string?> parameters, string role, int? channelPartnerId)
    {
        var cleanRole = role?.Trim() ?? "Sales Agent";
        if (cleanRole != "Super Admin" && !report.AllowedRoles.Any(ar => string.Equals(ar, cleanRole, StringComparison.OrdinalIgnoreCase)))
        {
            throw new UnauthorizedAccessException($"Access Denied: The role '{cleanRole}' is not permitted to access report '{report.Title}'.");
        }

        // Strict Channel Partner isolation
        if (cleanRole == "Channel Partner")
        {
            if (report.Id != "partner-commission")
            {
                throw new UnauthorizedAccessException("Channel Partner users are strictly limited to their own commission and sourcing reports.");
            }

            if (!channelPartnerId.HasValue || channelPartnerId.Value <= 0)
            {
                throw new UnauthorizedAccessException("Channel Partner context is missing or invalid.");
            }

            // Force PartnerId to caller's authenticated ID
            parameters["PartnerId"] = channelPartnerId.Value.ToString();
        }
    }

    public async Task<ReportResult> ExecuteReportDataAsync(string reportId, Dictionary<string, string?> parameters, string role, int? channelPartnerId)
    {
        var report = AllReports.FirstOrDefault(r => r.Id == reportId);
        if (report == null) throw new KeyNotFoundException($"Report '{reportId}' was not found.");

        AuthorizeAndSanitizeReportRequest(report, parameters, role, channelPartnerId);

        var result = new ReportResult
        {
            ReportId = report.Id,
            ReportTitle = report.Title,
            Category = report.CategoryId,
            GeneratedAt = DateTime.UtcNow,
            ExecutionEngine = _config.Enabled ? "Enterprise SQL Engine (SSRS Integrated)" : "Enterprise SQL Engine",
            ParametersApplied = new Dictionary<string, string?>(parameters)
        };

        // Open direct ADO.NET connection to execute the report stored procedure
        var connection = _db.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
        {
            await connection.OpenAsync();
        }

        using var command = connection.CreateCommand();
        command.CommandType = CommandType.StoredProcedure;
        command.CommandText = report.StoredProcedure;
        command.CommandTimeout = 60;

        // Bind Stored Procedure parameters
        foreach (var pDef in report.Parameters)
        {
            var pVal = parameters.ContainsKey(pDef.Name) ? parameters[pDef.Name] : null;
            var dbParam = command.CreateParameter();
            dbParam.ParameterName = "@" + pDef.Name;

            if (string.IsNullOrWhiteSpace(pVal))
            {
                dbParam.Value = DBNull.Value;
            }
            else if (pDef.Type == "date" && DateTime.TryParse(pVal, out var dt))
            {
                dbParam.Value = dt;
            }
            else if (int.TryParse(pVal, out var intVal) && (pDef.Name.EndsWith("Id") || pDef.Type == "number"))
            {
                dbParam.Value = intVal;
            }
            else
            {
                dbParam.Value = pVal.Trim();
            }

            command.Parameters.Add(dbParam);
        }

        using var reader = await command.ExecuteReaderAsync();

        // If report has multiple resultsets (like sp_Rpt_ExecutiveSummary), process first for KPI summary, second for details
        if (reportId == "executive-summary")
        {
            if (await reader.ReadAsync())
            {
                var plannedUnits = reader["PlannedUnits"] != DBNull.Value ? Convert.ToInt32(reader["PlannedUnits"]) : 0;
                var totalUnits = reader["TotalActualUnits"] != DBNull.Value ? Convert.ToInt32(reader["TotalActualUnits"]) : 0;
                var availUnits = reader["AvailableUnits"] != DBNull.Value ? Convert.ToInt32(reader["AvailableUnits"]) : 0;
                var soldUnits = reader["SoldUnits"] != DBNull.Value ? Convert.ToInt32(reader["SoldUnits"]) : 0;
                var totalRevenue = reader["TotalBookedRevenue"] != DBNull.Value ? Convert.ToDecimal(reader["TotalBookedRevenue"]) : 0m;
                var collections = reader["TotalCollectionsRealized"] != DBNull.Value ? Convert.ToDecimal(reader["TotalCollectionsRealized"]) : 0m;
                var pending = reader["TotalOutstandingReceivables"] != DBNull.Value ? Convert.ToDecimal(reader["TotalOutstandingReceivables"]) : 0m;

                result.Kpis.Add(new ReportKpiSummary { Label = "Collections Realized", Value = FormatCurrencyCr(collections), Subtext = $"{collections:C0} received", Color = "teal" });
                result.Kpis.Add(new ReportKpiSummary { Label = "Pending Receivables", Value = FormatCurrencyCr(pending), Subtext = "Balance to be collected", Color = "gold" });
                result.Kpis.Add(new ReportKpiSummary { Label = "Total Units", Value = totalUnits > 0 ? totalUnits.ToString() : plannedUnits.ToString(), Subtext = $"{soldUnits} Sold | {availUnits} Available", Color = "blue" });
                result.Kpis.Add(new ReportKpiSummary { Label = "Booked Portfolio Value", Value = FormatCurrencyCr(totalRevenue), Subtext = "Total contract value", Color = "teal" });
            }

            // Move to second resultset for project details
            if (await reader.NextResultAsync())
            {
                ReadDataRows(reader, result);
            }
        }
        else
        {
            ReadDataRows(reader, result);
            BuildComputedKpis(result, reportId);
        }

        result.TotalRows = result.Rows.Count;
        return result;
    }

    private static void ReadDataRows(DbDataReader reader, ReportResult result)
    {
        var schema = reader.GetColumnSchema();
        foreach (var col in schema)
        {
            var colDef = new ReportColumnDef
            {
                Key = col.ColumnName,
                Label = SplitCamelCase(col.ColumnName),
                DataType = DetermineDataType(col.DataType, col.ColumnName),
                Align = DetermineAlignment(col.DataType, col.ColumnName)
            };
            result.Columns.Add(colDef);
        }

        while (reader.Read())
        {
            var row = new Dictionary<string, object?>();
            for (int i = 0; i < reader.FieldCount; i++)
            {
                var val = reader.IsDBNull(i) ? null : reader.GetValue(i);
                row[reader.GetName(i)] = val;
            }
            result.Rows.Add(row);
        }
    }

    private static void BuildComputedKpis(ReportResult result, string reportId)
    {
        switch (reportId)
        {
            case "lead-pipeline":
                var totalLeads = result.Rows.Count;
                var converted = result.Rows.Count(r => (r["Stage"]?.ToString() ?? "") == "Booked");
                var active = result.Rows.Count(r => (r["ConversionStatus"]?.ToString() ?? "") == "Active Pipeline");
                var totalBudget = result.Rows.Sum(r => r["Budget"] != null ? Convert.ToDecimal(r["Budget"]) : 0m);

                result.Kpis.Add(new ReportKpiSummary { Label = "Total Prospects", Value = totalLeads.ToString(), Subtext = "In selected timeframe", Color = "blue" });
                result.Kpis.Add(new ReportKpiSummary { Label = "Active Pipeline", Value = active.ToString(), Subtext = "In-progress negotiations", Color = "gold" });
                result.Kpis.Add(new ReportKpiSummary { Label = "Converted Deals", Value = converted.ToString(), Subtext = totalLeads > 0 ? $"{(converted * 100.0 / totalLeads):F1}% conversion" : "0%", Color = "teal" });
                result.Kpis.Add(new ReportKpiSummary { Label = "Pipeline Value", Value = FormatCurrencyCr(totalBudget), Subtext = "Total prospective budget", Color = "teal" });
                break;

            case "financial-collections":
                var totalReceipts = result.Rows.Count;
                var sumAmount = result.Rows.Sum(r => r["Amount"] != null ? Convert.ToDecimal(r["Amount"]) : 0m);
                var receivedCount = result.Rows.Count(r => (r["PaymentStatus"]?.ToString() ?? "Received") == "Received");

                result.Kpis.Add(new ReportKpiSummary { Label = "Total Realized Amount", Value = FormatCurrencyCr(sumAmount), Subtext = $"₹{sumAmount:N2}", Color = "teal" });
                result.Kpis.Add(new ReportKpiSummary { Label = "Total Receipts", Value = totalReceipts.ToString(), Subtext = $"{receivedCount} confirmed cleared", Color = "blue" });
                result.Kpis.Add(new ReportKpiSummary { Label = "Avg. Transaction Value", Value = totalReceipts > 0 ? FormatCurrencyCr(sumAmount / totalReceipts) : "₹0", Subtext = "Per receipt average", Color = "gold" });
                break;

            case "customer-receivables":
                var totalReceivables = result.Rows.Sum(r => r["OutstandingBalance"] != null ? Convert.ToDecimal(r["OutstandingBalance"]) : 0m);
                var totalContractValue = result.Rows.Sum(r => r["TotalContractValue"] != null ? Convert.ToDecimal(r["TotalContractValue"]) : 0m);
                var totalPaid = result.Rows.Sum(r => r["TotalPaid"] != null ? Convert.ToDecimal(r["TotalPaid"]) : 0m);
                var overdueCount = result.Rows.Count(r => (r["CustomerStatus"]?.ToString() ?? "") == "Overdue");

                result.Kpis.Add(new ReportKpiSummary { Label = "Total Receivables Outstanding", Value = FormatCurrencyCr(totalReceivables), Subtext = "Balance due across customers", Color = "gold" });
                result.Kpis.Add(new ReportKpiSummary { Label = "Total Realized Collections", Value = FormatCurrencyCr(totalPaid), Subtext = totalContractValue > 0 ? $"{(totalPaid * 100.0m / totalContractValue):F1}% of contract value" : "100%", Color = "teal" });
                result.Kpis.Add(new ReportKpiSummary { Label = "Overdue Accounts", Value = overdueCount.ToString(), Subtext = "Requires urgent reminder", Color = overdueCount > 0 ? "red" : "teal" });
                break;

            case "partner-commission":
                var totalEarned = result.Rows.Sum(r => r["TotalCommissionEarned"] != null ? Convert.ToDecimal(r["TotalCommissionEarned"]) : 0m);
                var paidOut = result.Rows.Sum(r => r["CommissionPaidOut"] != null ? Convert.ToDecimal(r["CommissionPaidOut"]) : 0m);
                var pendingPayout = result.Rows.Sum(r => r["CommissionPending"] != null ? Convert.ToDecimal(r["CommissionPending"]) : 0m);
                var totalDeals = result.Rows.Sum(r => r["TotalDealsBooked"] != null ? Convert.ToInt32(r["TotalDealsBooked"]) : 0);

                result.Kpis.Add(new ReportKpiSummary { Label = "Total Commission Earned", Value = FormatCurrencyCr(totalEarned), Subtext = $"{totalDeals} bookings sourced", Color = "blue" });
                result.Kpis.Add(new ReportKpiSummary { Label = "Disbursed / Paid Out", Value = FormatCurrencyCr(paidOut), Subtext = "Completed payments", Color = "teal" });
                result.Kpis.Add(new ReportKpiSummary { Label = "Pending Payout", Value = FormatCurrencyCr(pendingPayout), Subtext = "Approved / Payable balance", Color = "gold" });
                break;

            case "unit-inventory":
                var allUnits = result.Rows.Count;
                var available = result.Rows.Count(r => (r["UnitStatus"]?.ToString() ?? "") == "Available");
                var booked = result.Rows.Count(r => (r["UnitStatus"]?.ToString() ?? "") == "Booked");
                var sold = result.Rows.Count(r => (r["UnitStatus"]?.ToString() ?? "") == "Sold");
                var totalInventoryValue = result.Rows.Sum(r => r["UnitPrice"] != null ? Convert.ToDecimal(r["UnitPrice"]) : 0m);

                result.Kpis.Add(new ReportKpiSummary { Label = "Total Units", Value = allUnits.ToString(), Subtext = $"{available} Units Available", Color = "blue" });
                result.Kpis.Add(new ReportKpiSummary { Label = "Available Inventory", Value = available.ToString(), Subtext = allUnits > 0 ? $"{(available * 100.0 / allUnits):F1}% of portfolio" : "0%", Color = "teal" });
                result.Kpis.Add(new ReportKpiSummary { Label = "Sold & Booked", Value = (sold + booked).ToString(), Subtext = $"{sold} Sold, {booked} Booked", Color = "gold" });
                result.Kpis.Add(new ReportKpiSummary { Label = "Total Inventory Value", Value = FormatCurrencyCr(totalInventoryValue), Subtext = "Base price valuation", Color = "teal" });
                break;
        }
    }

    public async Task<ReportExportFile> ExportReportAsync(string reportId, Dictionary<string, string?> parameters, string format, string role, int? channelPartnerId)
    {
        var report = AllReports.FirstOrDefault(r => r.Id == reportId);
        if (report == null) throw new KeyNotFoundException($"Report '{reportId}' was not found.");

        AuthorizeAndSanitizeReportRequest(report, parameters, role, channelPartnerId);

        var normFormat = (format ?? "PDF").ToUpperInvariant();
        var dateStamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmm");
        var baseFileName = $"BuilderPro_{report.RdlReportName}_{dateStamp}";

        // Step 1: Try SSRS Report Server if enabled
        if (_config.Enabled && !string.IsNullOrWhiteSpace(_config.ReportServerUrl))
        {
            try
            {
                var ssrsBytes = await _ssrs.RenderReportAsync(report.RdlReportName, parameters, normFormat);
                if (ssrsBytes != null && ssrsBytes.Length > 0)
                {
                    var (ext, mime) = GetFormatMeta(normFormat);
                    return new ReportExportFile
                    {
                        Data = ssrsBytes,
                        FileName = $"{baseFileName}.{ext}",
                        ContentType = mime
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "SSRS rendering failed for report {ReportId}. Using Enterprise fallback engine.", reportId);
            }
        }

        // Step 2: Use Enterprise In-Memory Report Generator Fallback
        var dataResult = await ExecuteReportDataAsync(reportId, parameters, role, channelPartnerId);

        return normFormat switch
        {
            "CSV" => GenerateCsvFile(dataResult, baseFileName),
            "EXCEL" or "XLSX" => GenerateExcelXmlFile(dataResult, baseFileName),
            "WORD" or "DOCX" => GenerateWordHtmlFile(dataResult, baseFileName),
            _ => GenerateQuestPdf(dataResult, baseFileName)
        };
    }

    private static (string extension, string mime) GetFormatMeta(string format)
    {
        return format switch
        {
            "EXCEL" or "XLSX" => ("xls", "application/vnd.ms-excel"),
            "WORD" or "DOCX" => ("doc", "application/msword"),
            "CSV" => ("csv", "text/csv; charset=utf-8"),
            _ => ("pdf", "application/pdf")
        };
    }

    private static ReportExportFile GenerateCsvFile(ReportResult r, string baseFileName)
    {
        var sb = new StringBuilder();
        // UTF-8 BOM
        sb.Append('\uFEFF');

        // Title and Metadata header
        sb.AppendLine($"\"{r.ReportTitle}\"");
        sb.AppendLine($"\"Generated on: {r.GeneratedAt:yyyy-MM-dd HH:mm:ss UTC}\"");
        sb.AppendLine($"\"Engine: {r.ExecutionEngine}\"");
        sb.AppendLine();

        // Column Headers
        sb.AppendLine(string.Join(",", r.Columns.Select(c => $"\"{c.Label.Replace("\"", "\"\"")}\"")));

        // Rows
        foreach (var row in r.Rows)
        {
            var line = r.Columns.Select(c =>
            {
                var val = row.ContainsKey(c.Key) ? row[c.Key] : null;
                if (val == null) return "\"\"";
                if (val is DateTime dt) return $"\"{dt:dd-MMM-yyyy}\"";
                if (val is decimal dec) return $"\"{dec:N2}\"";
                return $"\"{val.ToString()?.Replace("\"", "\"\"")}\"";
            });
            sb.AppendLine(string.Join(",", line));
        }

        return new ReportExportFile
        {
            Data = Encoding.UTF8.GetBytes(sb.ToString()),
            FileName = $"{baseFileName}.csv",
            ContentType = "text/csv; charset=utf-8"
        };
    }

    private static ReportExportFile GenerateExcelXmlFile(ReportResult r, string baseFileName)
    {
        // Generates Microsoft Excel XML Spreadsheet 2003 / OpenXML compatible workbook
        var sb = new StringBuilder();
        sb.AppendLine("<?xml version=\"1.0\"?>");
        sb.AppendLine("<?mso-application progid=\"Excel.Sheet\"?>");
        sb.AppendLine("<Workbook xmlns=\"urn:schemas-microsoft-com:office:spreadsheet\"");
        sb.AppendLine(" xmlns:o=\"urn:schemas-microsoft-com:office:office\"");
        sb.AppendLine(" xmlns:x=\"urn:schemas-microsoft-com:office:excel\"");
        sb.AppendLine(" xmlns:ss=\"urn:schemas-microsoft-com:office:spreadsheet\"");
        sb.AppendLine(" xmlns:html=\"http://www.w3.org/TR/REC-html40\">");

        // Styles
        sb.AppendLine("<Styles>");
        sb.AppendLine("<Style ss:ID=\"Default\" ss:Name=\"Normal\"><Font ss:FontName=\"Segoe UI\" ss:Size=\"10\"/></Style>");
        sb.AppendLine("<Style ss:ID=\"TitleStyle\"><Font ss:FontName=\"Segoe UI\" ss:Size=\"14\" ss:Bold=\"1\" ss:Color=\"#B8860B\"/></Style>");
        sb.AppendLine("<Style ss:ID=\"HeaderStyle\"><Font ss:FontName=\"Segoe UI\" ss:Size=\"10\" ss:Bold=\"1\" ss:Color=\"#FFFFFF\"/><Interior ss:Color=\"#1A1D24\" ss:Pattern=\"Solid\"/><Borders><Border ss:Position=\"Bottom\" ss:LineStyle=\"Continuous\" ss:Weight=\"1\" ss:Color=\"#B8860B\"/></Borders></Style>");
        sb.AppendLine("<Style ss:ID=\"CurrencyStyle\"><NumberFormat ss:Format=\"&quot;₹&quot;#,##0.00\"/></Style>");
        sb.AppendLine("<Style ss:ID=\"DateStyle\"><NumberFormat ss:Format=\"dd-mmm-yyyy\"/></Style>");
        sb.AppendLine("</Styles>");

        sb.AppendLine("<Worksheet ss:Name=\"Report\">");
        sb.AppendLine("<Table>");

        // Title row
        sb.AppendLine("<Row><Cell ss:StyleID=\"TitleStyle\"><Data ss:Type=\"String\">" + WebUtility.HtmlEncode(r.ReportTitle) + "</Data></Cell></Row>");
        sb.AppendLine("<Row><Cell><Data ss:Type=\"String\">Generated on: " + r.GeneratedAt.ToString("dd-MMM-yyyy HH:mm") + " | BuilderPro ERP</Data></Cell></Row>");
        sb.AppendLine("<Row></Row>");

        // Header Row
        sb.AppendLine("<Row>");
        foreach (var c in r.Columns)
        {
            sb.AppendLine($"<Cell ss:StyleID=\"HeaderStyle\"><Data ss:Type=\"String\">{WebUtility.HtmlEncode(c.Label)}</Data></Cell>");
        }
        sb.AppendLine("</Row>");

        // Data Rows
        foreach (var row in r.Rows)
        {
            sb.AppendLine("<Row>");
            foreach (var c in r.Columns)
            {
                var val = row.ContainsKey(c.Key) ? row[c.Key] : null;
                if (val == null)
                {
                    sb.AppendLine("<Cell><Data ss:Type=\"String\"></Data></Cell>");
                }
                else if (val is decimal dec)
                {
                    sb.AppendLine($"<Cell ss:StyleID=\"CurrencyStyle\"><Data ss:Type=\"Number\">{dec.ToString(CultureInfo.InvariantCulture)}</Data></Cell>");
                }
                else if (val is int i)
                {
                    sb.AppendLine($"<Cell><Data ss:Type=\"Number\">{i}</Data></Cell>");
                }
                else if (val is DateTime dt)
                {
                    sb.AppendLine($"<Cell ss:StyleID=\"DateStyle\"><Data ss:Type=\"DateTime\">{dt:yyyy-MM-ddTHH:mm:ss.fff}</Data></Cell>");
                }
                else
                {
                    sb.AppendLine($"<Cell><Data ss:Type=\"String\">{WebUtility.HtmlEncode(val.ToString())}</Data></Cell>");
                }
            }
            sb.AppendLine("</Row>");
        }

        sb.AppendLine("</Table>");
        sb.AppendLine("</Worksheet>");
        sb.AppendLine("</Workbook>");

        return new ReportExportFile
        {
            Data = Encoding.UTF8.GetBytes(sb.ToString()),
            FileName = $"{baseFileName}.xls",
            ContentType = "application/vnd.ms-excel"
        };
    }

    private static ReportExportFile GenerateWordHtmlFile(ReportResult r, string baseFileName)
    {
        var sb = new StringBuilder();
        sb.AppendLine("<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>");
        sb.AppendLine("<head><meta charset='utf-8'><title>" + WebUtility.HtmlEncode(r.ReportTitle) + "</title>");
        sb.AppendLine("<style>");
        sb.AppendLine("body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; margin: 20px; color: #222; }");
        sb.AppendLine("h1 { color: #B8860B; font-size: 18pt; margin-bottom: 4px; }");
        sb.AppendLine(".meta { color: #666; font-size: 9pt; margin-bottom: 20px; }");
        sb.AppendLine("table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 9.5pt; }");
        sb.AppendLine("th { background-color: #1A1D24; color: #ffffff; padding: 8px 10px; border: 1px solid #333; text-align: left; }");
        sb.AppendLine("td { padding: 6px 10px; border: 1px solid #ddd; }");
        sb.AppendLine("tr:nth-child(even) { background-color: #f9f9f9; }");
        sb.AppendLine(".text-right { text-align: right; }");
        sb.AppendLine(".text-center { text-align: center; }");
        sb.AppendLine(".kpi-bar { display: flex; gap: 15px; margin-bottom: 20px; }");
        sb.AppendLine(".kpi-card { border: 1px solid #ddd; border-radius: 6px; padding: 10px; width: 22%; background: #fdfdfd; }");
        sb.AppendLine(".kpi-val { font-size: 14pt; font-weight: bold; color: #B8860B; }");
        sb.AppendLine("</style></head><body>");

        sb.AppendLine($"<h1>{WebUtility.HtmlEncode(r.ReportTitle)}</h1>");
        sb.AppendLine($"<div class='meta'>Generated on: {r.GeneratedAt:dd-MMM-yyyy hh:mm tt} | Abhay Buildcon ERP — SSRS Reporting Suite</div>");

        // KPI summary table
        if (r.Kpis.Count > 0)
        {
            sb.AppendLine("<table style='margin-bottom: 20px; background: #fafafa;'><tr>");
            foreach (var kpi in r.Kpis)
            {
                sb.AppendLine($"<td style='border: 1px solid #ccc; padding: 10px;'><div style='font-size: 8pt; color: #777; text-transform: uppercase;'>{WebUtility.HtmlEncode(kpi.Label)}</div><div style='font-size: 14pt; font-weight: bold; color: #B8860B; margin: 4px 0;'>{WebUtility.HtmlEncode(kpi.Value)}</div><div style='font-size: 8pt; color: #999;'>{WebUtility.HtmlEncode(kpi.Subtext)}</div></td>");
            }
            sb.AppendLine("</tr></table>");
        }

        // Main Table
        sb.AppendLine("<table>");
        sb.AppendLine("<thead><tr>");
        foreach (var col in r.Columns)
        {
            var alignClass = col.Align == "right" ? " class='text-right'" : (col.Align == "center" ? " class='text-center'" : "");
            sb.AppendLine($"<th{alignClass}>{WebUtility.HtmlEncode(col.Label)}</th>");
        }
        sb.AppendLine("</tr></thead><tbody>");

        foreach (var row in r.Rows)
        {
            sb.AppendLine("<tr>");
            foreach (var col in r.Columns)
            {
                var val = row.ContainsKey(col.Key) ? row[col.Key] : null;
                var alignClass = col.Align == "right" ? " class='text-right'" : (col.Align == "center" ? " class='text-center'" : "");
                var formatted = FormatValue(val, col.DataType);
                sb.AppendLine($"<td{alignClass}>{WebUtility.HtmlEncode(formatted)}</td>");
            }
            sb.AppendLine("</tr>");
        }

        sb.AppendLine("</tbody></table>");
        sb.AppendLine("<div style='margin-top: 30px; font-size: 8pt; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 10px;'>Confidentially generated for authorized Abhay Buildcon leadership. All rights reserved.</div>");
        sb.AppendLine("</body></html>");

        return new ReportExportFile
        {
            Data = Encoding.UTF8.GetBytes(sb.ToString()),
            FileName = $"{baseFileName}.doc",
            ContentType = "application/msword"
        };
    }

    private static ReportExportFile GenerateQuestPdf(ReportResult r, string baseFileName)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        var pdfBytes = QuestPDF.Fluent.Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(r.Columns.Count > 6 ? PageSizes.A4.Landscape() : PageSizes.A4);
                page.Margin(28);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(8.5f).FontFamily(Fonts.Arial).FontColor(Colors.Grey.Darken3));

                // Page Header
                page.Header().Column(col =>
                {
                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Column(titleCol =>
                        {
                            titleCol.Item().Text("ABHAY BUILDCON ERP").FontSize(14).Bold().FontColor(Colors.Amber.Darken3);
                            titleCol.Item().Text(r.ReportTitle).FontSize(11).Bold().FontColor(Colors.Grey.Darken4);
                        });

                        row.RelativeItem().AlignRight().Column(metaCol =>
                        {
                            metaCol.Item().Text($"Generated: {r.GeneratedAt:dd-MMM-yyyy hh:mm tt}").FontSize(8).FontColor(Colors.Grey.Medium);
                            metaCol.Item().Text($"Engine: {r.ExecutionEngine}").FontSize(8).FontColor(Colors.Grey.Darken1);
                            metaCol.Item().Text($"Total Records: {r.TotalRows}").FontSize(8).Bold().FontColor(Colors.Amber.Darken3);
                        });
                    });

                    col.Item().PaddingTop(6).LineHorizontal(1.5f).LineColor(Colors.Amber.Darken3);
                });

                // Content
                page.Content().PaddingTop(10).Column(col =>
                {
                    // KPI summary cards
                    if (r.Kpis.Count > 0)
                    {
                        col.Item().Row(kpiRow =>
                        {
                            foreach (var kpi in r.Kpis)
                            {
                                kpiRow.RelativeItem().Border(1).BorderColor(Colors.Grey.Lighten2).Background(Colors.Grey.Lighten5).Padding(6).Column(kc =>
                                {
                                    kc.Item().Text(kpi.Label.ToUpper()).FontSize(7).Bold().FontColor(Colors.Grey.Medium);
                                    kc.Item().Text(kpi.Value).FontSize(12).Bold().FontColor(Colors.Amber.Darken3);
                                    kc.Item().Text(kpi.Subtext).FontSize(6.5f).FontColor(Colors.Grey.Darken1);
                                });
                                kpiRow.ConstantItem(6);
                            }
                        });

                        col.Item().Height(10);
                    }

                    // Main Tabular Report
                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(cols =>
                        {
                            foreach (var c in r.Columns)
                            {
                                if (c.DataType == "currency" || c.DataType == "date")
                                    cols.RelativeColumn(1.3f);
                                else if (c.Key.ToLower().Contains("name") || c.Key.ToLower().Contains("title") || c.Key.ToLower().Contains("location"))
                                    cols.RelativeColumn(1.8f);
                                else if (c.DataType == "number" || c.DataType == "badge")
                                    cols.RelativeColumn(0.9f);
                                else
                                    cols.RelativeColumn(1.1f);
                            }
                        });

                        table.Header(header =>
                        {
                            foreach (var c in r.Columns)
                            {
                                var cell = header.Cell().Background(Colors.Grey.Darken4).PaddingVertical(5).PaddingHorizontal(4);
                                if (c.Align == "right")
                                {
                                    cell.AlignRight().Text(c.Label).FontSize(7.5f).Bold().FontColor(Colors.White);
                                }
                                else if (c.Align == "center")
                                {
                                    cell.AlignCenter().Text(c.Label).FontSize(7.5f).Bold().FontColor(Colors.White);
                                }
                                else
                                {
                                    cell.AlignLeft().Text(c.Label).FontSize(7.5f).Bold().FontColor(Colors.White);
                                }
                            }
                        });

                        for (int i = 0; i < r.Rows.Count; i++)
                        {
                            var row = r.Rows[i];
                            var bgColor = i % 2 == 0 ? Colors.White : Colors.Grey.Lighten4;

                            foreach (var c in r.Columns)
                            {
                                var val = row.ContainsKey(c.Key) ? row[c.Key] : null;
                                var cell = table.Cell().Background(bgColor).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).PaddingVertical(4).PaddingHorizontal(4);
                                var formatted = FormatValue(val, c.DataType);

                                if (c.Align == "right")
                                {
                                    cell.AlignRight().Text(formatted).FontSize(7.5f);
                                }
                                else if (c.Align == "center")
                                {
                                    cell.AlignCenter().Text(formatted).FontSize(7.5f);
                                }
                                else
                                {
                                    cell.AlignLeft().Text(formatted).FontSize(7.5f);
                                }
                            }
                        }
                    });
                });

                // Page Footer
                page.Footer().Row(footerRow =>
                {
                    footerRow.RelativeItem().Text("Confidential — Abhay Buildcon ERP Reporting Suite").FontSize(7.5f).FontColor(Colors.Grey.Medium);
                    footerRow.RelativeItem().AlignRight().Text(x =>
                    {
                        x.Span("Page ");
                        x.CurrentPageNumber();
                        x.Span(" of ");
                        x.TotalPages();
                    });
                });
            });
        }).GeneratePdf();

        return new ReportExportFile
        {
            Data = pdfBytes,
            FileName = $"{baseFileName}.pdf",
            ContentType = "application/pdf"
        };
    }

    private static string FormatValue(object? val, string dataType)
    {
        if (val == null) return "-";
        return dataType switch
        {
            "currency" when decimal.TryParse(val.ToString(), out var d) => $"₹{d:N2}",
            "date" when DateTime.TryParse(val.ToString(), out var dt) => dt.ToString("dd-MMM-yyyy"),
            "number" when decimal.TryParse(val.ToString(), out var num) => num.ToString("N0"),
            _ => val.ToString() ?? "-"
        };
    }

    private static string FormatCurrencyCr(decimal amount)
    {
        if (Math.Abs(amount) >= 10000000m)
        {
            return $"₹{(amount / 10000000m):F2} Cr";
        }
        if (Math.Abs(amount) >= 100000m)
        {
            return $"₹{(amount / 100000m):F2} L";
        }
        return $"₹{amount:N0}";
    }

    private static string DetermineDataType(Type? type, string colName)
    {
        var lower = colName.ToLowerInvariant();
        if (lower.Contains("date") || lower.Contains("time")) return "date";
        if (lower.Contains("amount") || lower.Contains("price") || lower.Contains("value") || lower.Contains("revenue") || lower.Contains("collection") || lower.Contains("receivable") || lower.Contains("commission") || lower.Contains("budget")) return "currency";
        if (lower.Contains("status") || lower.Contains("tier") || lower.Contains("stage")) return "badge";
        if (type == typeof(int) || type == typeof(long) || type == typeof(short) || lower.Contains("count") || lower.Contains("units")) return "number";
        if (type == typeof(decimal) || type == typeof(double) || type == typeof(float)) return "number";
        return "string";
    }

    private static string DetermineAlignment(Type? type, string colName)
    {
        var lower = colName.ToLowerInvariant();
        if (lower.Contains("status") || lower.Contains("tier") || lower.Contains("stage") || lower.Contains("type") || lower.Contains("date")) return "center";
        if (type == typeof(decimal) || type == typeof(double) || type == typeof(int) || lower.Contains("amount") || lower.Contains("price") || lower.Contains("budget") || lower.Contains("value")) return "right";
        return "left";
    }

    private static string SplitCamelCase(string str)
    {
        if (string.IsNullOrEmpty(str)) return "";
        var sb = new StringBuilder();
        foreach (char c in str)
        {
            if (char.IsUpper(c) && sb.Length > 0 && sb[^1] != ' ')
            {
                sb.Append(' ');
            }
            sb.Append(c);
        }
        return sb.ToString();
    }
}
