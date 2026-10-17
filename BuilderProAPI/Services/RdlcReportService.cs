using System;
using System.Data;
using System.IO;
using Microsoft.Reporting.NETCore;
using BuilderProAPI.Models;

namespace BuilderProAPI.Services;

public class RdlcReportService
{
    public static byte[] GenerateAgreementPdf(Booking booking)
    {
        var customer = booking.Customer;
        var unit = booking.Unit;
        var project = unit?.Project ?? customer?.Project;

        decimal basePrice = unit?.Price ?? (booking.TotalAmount > 0 ? booking.TotalAmount * 0.9523m : 0);
        decimal gst = Math.Round(basePrice * 0.05m);
        decimal total = booking.TotalAmount > 0 ? booking.TotalAmount : (basePrice + gst);
        decimal token = booking.TokenAmount;
        decimal balance = total - token;

        // 1. Prepare DataTable for RDLC AgreementDataSet
        var dataTable = new DataTable("AgreementDataSet");
        dataTable.Columns.Add("BookingNumber", typeof(string));
        dataTable.Columns.Add("BookingDate", typeof(string));
        dataTable.Columns.Add("BookingStatus", typeof(string));
        dataTable.Columns.Add("CustomerName", typeof(string));
        dataTable.Columns.Add("CustomerPhone", typeof(string));
        dataTable.Columns.Add("CustomerEmail", typeof(string));
        dataTable.Columns.Add("CustomerStatus", typeof(string));
        dataTable.Columns.Add("ProjectName", typeof(string));
        dataTable.Columns.Add("ProjectLocation", typeof(string));
        dataTable.Columns.Add("ProjectReraNumber", typeof(string));
        dataTable.Columns.Add("UnitNumber", typeof(string));
        dataTable.Columns.Add("UnitType", typeof(string));
        dataTable.Columns.Add("UnitArea", typeof(string));
        dataTable.Columns.Add("UnitFloor", typeof(string));
        dataTable.Columns.Add("BasePrice", typeof(string));
        dataTable.Columns.Add("GstAmount", typeof(string));
        dataTable.Columns.Add("TotalAmount", typeof(string));
        dataTable.Columns.Add("TokenAmount", typeof(string));
        dataTable.Columns.Add("BalanceAmount", typeof(string));
        dataTable.Columns.Add("AssignedAgent", typeof(string));

        var row = dataTable.NewRow();
        row["BookingNumber"] = booking.BookingNumber ?? "N/A";
        row["BookingDate"] = booking.BookingDate.ToString("dd-MMM-yyyy");
        row["BookingStatus"] = booking.Status ?? "Confirmed";
        row["CustomerName"] = customer?.Name ?? "Client";
        row["CustomerPhone"] = customer?.Phone ?? "N/A";
        row["CustomerEmail"] = customer?.Email ?? "N/A";
        row["CustomerStatus"] = customer?.Status ?? "Active";
        row["ProjectName"] = project?.Name ?? "Skyline Heights";
        row["ProjectLocation"] = project?.Location ?? "Bandra West, Mumbai";
        row["ProjectReraNumber"] = string.IsNullOrEmpty(project?.ReraNumber) ? "P51900034682" : project.ReraNumber;
        row["UnitNumber"] = unit?.UnitNumber ?? "Pending Allocation";
        row["UnitType"] = unit?.UnitType ?? "Residential Apartment";
        row["UnitArea"] = unit?.Area > 0 ? $"{unit.Area:N0} Sq. Ft." : "1,200 Sq. Ft.";
        row["UnitFloor"] = unit?.Floor > 0 ? $"Floor {unit.Floor}" : "Standard Floor";
        row["BasePrice"] = $"INR {basePrice:N2}";
        row["GstAmount"] = $"INR {gst:N2}";
        row["TotalAmount"] = $"INR {total:N2}";
        row["TokenAmount"] = $"INR {token:N2}";
        row["BalanceAmount"] = $"INR {balance:N2}";
        row["AssignedAgent"] = booking.AssignedAgent ?? "Arjun Kapoor";
        dataTable.Rows.Add(row);

        // 2. Locate the RDLC Report Definition file
        string rdlcPath = Path.Combine(AppContext.BaseDirectory, "Reports", "AgreementReport.rdlc");
        if (!File.Exists(rdlcPath))
        {
            rdlcPath = Path.Combine(Directory.GetCurrentDirectory(), "Reports", "AgreementReport.rdlc");
        }

        if (!File.Exists(rdlcPath))
        {
            throw new FileNotFoundException($"RDLC report definition file not found at: {rdlcPath}");
        }

        // 3. Initialize Microsoft LocalReport and render to PDF
        var localReport = new LocalReport();
        using var reportDefinition = File.OpenRead(rdlcPath);
        localReport.LoadReportDefinition(reportDefinition);
        localReport.DataSources.Clear();
        localReport.DataSources.Add(new ReportDataSource("AgreementDataSet", dataTable));

        byte[] pdfBytes = localReport.Render("PDF");
        return pdfBytes;
    }
}
