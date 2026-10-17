using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using BuilderProAPI.Models;
using System;

namespace BuilderProAPI.Services;

public class AgreementReportService
{
    static AgreementReportService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public static byte[] GenerateAgreementPdf(Booking booking)
    {
        var customer = booking.Customer;
        var unit = booking.Unit;
        var project = unit?.Project ?? customer?.Project;

        var doc = QuestPDF.Fluent.Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(36);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily(Fonts.Arial).FontColor(Colors.Grey.Darken3));

                // Page Header
                page.Header().Column(col =>
                {
                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Column(titleCol =>
                        {
                            titleCol.Item().Text("ABHAY BUILDCON ERP").FontSize(17).Bold().FontColor(Colors.Amber.Darken3);
                            titleCol.Item().Text("Real Estate Development & Infrastructure Platform").FontSize(8.5f).FontColor(Colors.Grey.Medium);
                            titleCol.Item().Text($"RERA Registration: {(string.IsNullOrEmpty(project?.ReraNumber) ? "P51900034682" : project.ReraNumber)}").FontSize(8f).FontColor(Colors.Grey.Darken1);
                        });

                        row.RelativeItem().AlignRight().Column(metaCol =>
                        {
                            metaCol.Item().Text("ALLOTMENT & SALE AGREEMENT").FontSize(11).Bold().FontColor(Colors.Grey.Darken4);
                            metaCol.Item().Text($"Ref: {booking.BookingNumber}").FontSize(10).Bold().FontColor(Colors.Amber.Darken3);
                            metaCol.Item().Text($"Date: {booking.BookingDate:dd-MMM-yyyy}").FontSize(8.5f);
                            metaCol.Item().Text($"Status: {booking.Status}").FontSize(8.5f).Bold().FontColor(Colors.Green.Darken2);
                        });
                    });

                    col.Item().PaddingTop(8).LineHorizontal(1.5f).LineColor(Colors.Amber.Darken3);
                });

                // Page Content
                page.Content().PaddingTop(14).Column(col =>
                {
                    // Preamble Banner
                    col.Item().Background(Colors.Grey.Lighten4).Padding(8).Column(c =>
                    {
                        c.Item().Text("STANDARD APARTMENT BUYER'S AGREEMENT").FontSize(10).Bold().FontColor(Colors.Grey.Darken4);
                        c.Item().Text("This Agreement for Sale (\"Agreement\") is entered into on the booking date specified between the Promoter and the Allottee, subject to terms and conditions set forth herein under Applicable Real Estate Regulation & Development Acts.")
                            .FontSize(8f).FontColor(Colors.Grey.Darken2);
                    });

                    col.Item().Height(10);

                    // 1. PARTIES SECTION
                    col.Item().Text("1. PARTIES TO THIS AGREEMENT").FontSize(10).Bold().FontColor(Colors.Grey.Darken4);
                    col.Item().Height(3);

                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Border(1).BorderColor(Colors.Grey.Lighten2).Padding(7).Column(c =>
                        {
                            c.Item().Text("PROMOTER / DEVELOPER").FontSize(8.5f).Bold().FontColor(Colors.Amber.Darken3);
                            c.Item().Text("Abhay Buildcon Developers Pvt. Ltd.").FontSize(9f).Bold();
                            c.Item().Text("Registered Office: Bandra West, Mumbai - 400050").FontSize(8f);
                            c.Item().Text("Corporate Identity: U45200MH2018PTC312459").FontSize(8f);
                            c.Item().Text($"Representative: {booking.AssignedAgent ?? "Arjun Kapoor"}").FontSize(8f);
                        });

                        row.ConstantItem(10);

                        row.RelativeItem().Border(1).BorderColor(Colors.Grey.Lighten2).Padding(7).Column(c =>
                        {
                            c.Item().Text("ALLOTTEE / PURCHASER").FontSize(8.5f).Bold().FontColor(Colors.Blue.Darken2);
                            c.Item().Text(customer?.Name ?? "Client").FontSize(9f).Bold();
                            c.Item().Text($"Phone: {customer?.Phone ?? "N/A"}").FontSize(8f);
                            c.Item().Text($"Email: {customer?.Email ?? "N/A"}").FontSize(8f);
                            c.Item().Text($"Customer Status: {customer?.Status ?? "Active"}").FontSize(8f);
                        });
                    });

                    col.Item().Height(10);

                    // 2. PROPERTY DETAILS
                    col.Item().Text("2. SCHEDULE OF APARTMENT / PROPERTY").FontSize(10).Bold().FontColor(Colors.Grey.Darken4);
                    col.Item().Height(3);

                    col.Item().Table(tbl =>
                    {
                        tbl.ColumnsDefinition(columns =>
                        {
                            columns.ConstantColumn(130);
                            columns.RelativeColumn();
                            columns.ConstantColumn(120);
                            columns.RelativeColumn();
                        });

                        tbl.Cell().Background(Colors.Grey.Lighten3).Padding(4).Text("Project Name").Bold().FontSize(8f);
                        tbl.Cell().Padding(4).Text(project?.Name ?? "Skyline Heights").FontSize(8f);

                        tbl.Cell().Background(Colors.Grey.Lighten3).Padding(4).Text("Unit Number").Bold().FontSize(8f);
                        tbl.Cell().Padding(4).Text(unit?.UnitNumber ?? "Pending Allocation").Bold().FontColor(Colors.Amber.Darken3).FontSize(8f);

                        tbl.Cell().Background(Colors.Grey.Lighten3).Padding(4).Text("Location").Bold().FontSize(8f);
                        tbl.Cell().Padding(4).Text(project?.Location ?? "Bandra West, Mumbai").FontSize(8f);

                        tbl.Cell().Background(Colors.Grey.Lighten3).Padding(4).Text("Unit Configuration").Bold().FontSize(8f);
                        tbl.Cell().Padding(4).Text(unit?.UnitType ?? "Residential Apartment").FontSize(8f);

                        tbl.Cell().Background(Colors.Grey.Lighten3).Padding(4).Text("Super Built-up Area").Bold().FontSize(8f);
                        tbl.Cell().Padding(4).Text(unit?.Area > 0 ? $"{unit.Area:N0} Sq. Ft." : "1,200 Sq. Ft.").FontSize(8f);

                        tbl.Cell().Background(Colors.Grey.Lighten3).Padding(4).Text("Floor Level").Bold().FontSize(8f);
                        tbl.Cell().Padding(4).Text(unit?.Floor > 0 ? $"Floor {unit.Floor}" : "Standard Floor").FontSize(8f);
                    });

                    col.Item().Height(10);

                    // 3. FINANCIAL CONSIDERATION & PAYMENT DETAILS
                    col.Item().Text("3. CONSIDERATION & PAYMENT DETAILS").FontSize(10).Bold().FontColor(Colors.Grey.Darken4);
                    col.Item().Height(3);

                    col.Item().Table(tbl =>
                    {
                        tbl.ColumnsDefinition(columns =>
                        {
                            columns.ConstantColumn(30);
                            columns.RelativeColumn();
                            columns.ConstantColumn(120);
                        });

                        tbl.Header(header =>
                        {
                            header.Cell().Background(Colors.Grey.Lighten2).Padding(4).Text("#").Bold().FontSize(8f);
                            header.Cell().Background(Colors.Grey.Lighten2).Padding(4).Text("Payment Description").Bold().FontSize(8f);
                            header.Cell().Background(Colors.Grey.Lighten2).Padding(4).AlignRight().Text("Amount (INR)").Bold().FontSize(8f);
                        });

                        decimal basePrice = unit?.Price ?? (booking.TotalAmount > 0 ? booking.TotalAmount * 0.9523m : 0);
                        decimal gst = Math.Round(basePrice * 0.05m);
                        decimal total = booking.TotalAmount > 0 ? booking.TotalAmount : (basePrice + gst);
                        decimal token = booking.TokenAmount;
                        decimal balance = total - token;

                        tbl.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(4).Text("1").FontSize(8f);
                        tbl.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(4).Text("Base Apartment Consideration Value").FontSize(8f);
                        tbl.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(4).AlignRight().Text($"₹ {basePrice:N2}").FontSize(8f);

                        tbl.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(4).Text("2").FontSize(8f);
                        tbl.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(4).Text("Estimated Statutory Taxes & GST (5%)").FontSize(8f);
                        tbl.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(4).AlignRight().Text($"₹ {gst:N2}").FontSize(8f);

                        tbl.Cell().BorderBottom(1).BorderColor(Colors.Grey.Medium).Padding(4).Text("").FontSize(8f);
                        tbl.Cell().BorderBottom(1).BorderColor(Colors.Grey.Medium).Padding(4).Text("TOTAL AGREEMENT CONSIDERATION").Bold().FontSize(8.5f);
                        tbl.Cell().BorderBottom(1).BorderColor(Colors.Grey.Medium).Padding(4).AlignRight().Text($"₹ {total:N2}").Bold().FontColor(Colors.Amber.Darken3).FontSize(8.5f);

                        tbl.Cell().Padding(4).Text("•").FontSize(8f);
                        tbl.Cell().Padding(4).Text("Earnest Money Deposit / Token Received").Bold().FontColor(Colors.Green.Darken2).FontSize(8f);
                        tbl.Cell().Padding(4).AlignRight().Text($"₹ {token:N2}").Bold().FontColor(Colors.Green.Darken2).FontSize(8f);

                        tbl.Cell().Background(Colors.Grey.Lighten4).Padding(4).Text("•").FontSize(8f);
                        tbl.Cell().Background(Colors.Grey.Lighten4).Padding(4).Text("Balance Payable as per Construction Milestones").Bold().FontSize(8.5f);
                        tbl.Cell().Background(Colors.Grey.Lighten4).Padding(4).AlignRight().Text($"₹ {balance:N2}").Bold().FontColor(Colors.Red.Darken2).FontSize(8.5f);
                    });

                    col.Item().Height(10);

                    // 4. STATUTORY TERMS
                    col.Item().Text("4. ESSENTIAL COVENANTS & RERA GUIDELINES").FontSize(10).Bold().FontColor(Colors.Grey.Darken4);
                    col.Item().Height(3);

                    col.Item().Column(terms =>
                    {
                        terms.Item().Text("a) The Allottee covenants to honor stage-wise payment demand letters strictly within specified timelines.")
                            .FontSize(7.5f).FontColor(Colors.Grey.Darken2);
                        terms.Item().Text("b) The Promoter covenants to construct the Apartment in conformity with approved architectural drawings and RERA guidelines.")
                            .FontSize(7.5f).FontColor(Colors.Grey.Darken2);
                        terms.Item().Text("c) Time is of the essence regarding financial obligations. Unpaid balances will accrue interest at the prescribed benchmark rate.")
                            .FontSize(7.5f).FontColor(Colors.Grey.Darken2);
                        terms.Item().Text("d) Possession will be formally handed over upon issuance of the Occupancy Certificate and completion of final clearance formalities.")
                            .FontSize(7.5f).FontColor(Colors.Grey.Darken2);
                    });

                    col.Item().Height(20);

                    // 5. SIGNATURE BLOCK
                    col.Item().Row(sigRow =>
                    {
                        sigRow.RelativeItem().Column(s =>
                        {
                            s.Item().LineHorizontal(1).LineColor(Colors.Grey.Medium);
                            s.Item().PaddingTop(3).Text("For ABHAY BUILDCON DEVELOPERS").Bold().FontSize(8f);
                            s.Item().Text("Authorized Signatory").FontSize(7.5f).FontColor(Colors.Grey.Medium);
                        });

                        sigRow.ConstantItem(50);

                        sigRow.RelativeItem().Column(s =>
                        {
                            s.Item().LineHorizontal(1).LineColor(Colors.Grey.Medium);
                            s.Item().PaddingTop(3).Text($"ALLOTTEE: {customer?.Name?.ToUpper()}").Bold().FontSize(8f);
                            s.Item().Text("Signature of the Purchaser(s)").FontSize(7.5f).FontColor(Colors.Grey.Medium);
                        });
                    });
                });

                // Page Footer
                page.Footer().Column(col =>
                {
                    col.Item().LineHorizontal(0.5f).LineColor(Colors.Grey.Lighten2);
                    col.Item().PaddingTop(3).Row(row =>
                    {
                        row.RelativeItem().Text($"Abhay Buildcon ERP · Document Generated {DateTime.UtcNow:dd-MM-yyyy HH:mm} UTC").FontSize(7f).FontColor(Colors.Grey.Medium);
                        row.RelativeItem().AlignRight().Text(x =>
                        {
                            x.Span("Page ");
                            x.CurrentPageNumber();
                            x.Span(" of ");
                            x.TotalPages();
                        });
                    });
                });
            });
        });

        return doc.GeneratePdf();
    }
}
