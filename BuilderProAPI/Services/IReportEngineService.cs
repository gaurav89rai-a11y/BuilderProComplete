using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BuilderProAPI.Services;

public class ReportCategory
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string Icon { get; set; } = "";
}

public class ReportParameterOption
{
    public string Value { get; set; } = "";
    public string Label { get; set; } = "";
    public string? ParentValue { get; set; }
}

public class ReportParameterDef
{
    public string Name { get; set; } = "";
    public string Label { get; set; } = "";
    public string Type { get; set; } = "string"; // date, text, select, number
    public bool Required { get; set; }
    public string? DefaultValue { get; set; }
    public string? DependsOn { get; set; }
    public List<ReportParameterOption> Options { get; set; } = new();
}

public class ReportDefinition
{
    public string Id { get; set; } = "";
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string CategoryId { get; set; } = "";
    public string StoredProcedure { get; set; } = "";
    public string RdlReportName { get; set; } = "";
    public List<string> AllowedRoles { get; set; } = new();
    public List<ReportParameterDef> Parameters { get; set; } = new();
}

public class ReportColumnDef
{
    public string Key { get; set; } = "";
    public string Label { get; set; } = "";
    public string DataType { get; set; } = "string"; // string, number, currency, date, badge
    public string Align { get; set; } = "left"; // left, center, right
}

public class ReportKpiSummary
{
    public string Label { get; set; } = "";
    public string Value { get; set; } = "";
    public string Subtext { get; set; } = "";
    public string? Color { get; set; }
}

public class ReportResult
{
    public string ReportId { get; set; } = "";
    public string ReportTitle { get; set; } = "";
    public string Category { get; set; } = "";
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    public string ExecutionEngine { get; set; } = "Enterprise SQL Engine";
    public List<ReportKpiSummary> Kpis { get; set; } = new();
    public List<ReportColumnDef> Columns { get; set; } = new();
    public List<Dictionary<string, object?>> Rows { get; set; } = new();
    public int TotalRows { get; set; }
    public Dictionary<string, string?> ParametersApplied { get; set; } = new();
}

public class ReportExportFile
{
    public byte[] Data { get; set; } = Array.Empty<byte>();
    public string FileName { get; set; } = "";
    public string ContentType { get; set; } = "";
}

public interface IReportEngineService
{
    List<ReportCategory> GetCategories();
    List<ReportDefinition> GetCatalogForRole(string role, int? channelPartnerId);
    Task<List<ReportParameterDef>> GetPopulatedParametersAsync(string reportId, string role, int? channelPartnerId);
    Task<ReportResult> ExecuteReportDataAsync(string reportId, Dictionary<string, string?> parameters, string role, int? channelPartnerId);
    Task<ReportExportFile> ExportReportAsync(string reportId, Dictionary<string, string?> parameters, string format, string role, int? channelPartnerId);
}
