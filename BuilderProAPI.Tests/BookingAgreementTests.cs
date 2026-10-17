using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using BuilderProAPI.Controllers;
using BuilderProAPI.Data;
using BuilderProAPI.Models;
using BuilderProAPI.Repositories;
using BuilderProAPI.Services;
using Xunit;

namespace BuilderProAPI.Tests;

public class BookingAgreementTests
{
    private BuilderProDbContext GetDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<BuilderProDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;
        
        var db = new BuilderProDbContext(options);
        db.Database.EnsureDeleted();
        db.Database.EnsureCreated();
        return db;
    }

    [Fact]
    public void AgreementReportService_GeneratesValidPdfBytes()
    {
        // Arrange
        var project = new Project
        {
            Id = 1,
            Name = "Skyline Heights",
            Location = "Bandra West, Mumbai",
            ReraNumber = "P51900034682"
        };

        var customer = new Customer
        {
            Id = 1,
            Name = "Rajesh Verma",
            Email = "rajesh.v@gmail.com",
            Phone = "9700000001",
            Project = project
        };

        var unit = new Unit
        {
            Id = 3,
            UnitNumber = "B-201",
            Floor = 2,
            UnitType = "2BHK",
            Area = 1010,
            Price = 13100000,
            Project = project
        };

        var booking = new Booking
        {
            Id = 1,
            BookingNumber = "BK-2026-000001",
            BookingDate = DateTime.Today,
            TotalAmount = 13100000,
            TokenAmount = 500000,
            Status = "Confirmed",
            AssignedAgent = "Priya Mehta",
            Customer = customer,
            Unit = unit
        };

        // Act
        var pdfBytes = AgreementReportService.GenerateAgreementPdf(booking);

        // Assert
        Assert.NotNull(pdfBytes);
        Assert.True(pdfBytes.Length > 1000, "PDF should have substantive content");
        var header = System.Text.Encoding.ASCII.GetString(pdfBytes, 0, 4);
        Assert.Equal("%PDF", header);
    }

    [Fact]
    public void RdlcReportService_GeneratesValidPdfBytes()
    {
        // Arrange
        var project = new Project
        {
            Id = 1,
            Name = "Skyline Heights",
            Location = "Bandra West, Mumbai",
            ReraNumber = "P51900034682"
        };

        var customer = new Customer
        {
            Id = 1,
            Name = "Rajesh Verma",
            Email = "rajesh.v@gmail.com",
            Phone = "9700000001",
            Project = project
        };

        var unit = new Unit
        {
            Id = 3,
            UnitNumber = "B-201",
            Floor = 2,
            UnitType = "2BHK",
            Area = 1010,
            Price = 13100000,
            Project = project
        };

        var booking = new Booking
        {
            Id = 1,
            BookingNumber = "BK-2026-000001",
            BookingDate = DateTime.Today,
            TotalAmount = 13100000,
            TokenAmount = 500000,
            Status = "Confirmed",
            AssignedAgent = "Priya Mehta",
            Customer = customer,
            Unit = unit
        };

        // Act
        var pdfBytes = RdlcReportService.GenerateAgreementPdf(booking);

        // Assert
        Assert.NotNull(pdfBytes);
        Assert.True(pdfBytes.Length > 100, "RDLC PDF should have valid bytes");
        var header = System.Text.Encoding.ASCII.GetString(pdfBytes, 0, 4);
        Assert.Equal("%PDF", header);
    }

    [Fact]
    public async Task DownloadAgreement_ReturnsFileResult_WhenBookingExists()
    {
        // Arrange
        var db = GetDbContext("DownloadAgreement_Success");
        var uow = new UnitOfWork(db);
        var bookingService = new BookingService(uow);
        var controller = new BookingsController(bookingService, NullLogger<BookingsController>.Instance);

        // Seed booking if not already seeded
        var existingBooking = await db.Bookings.FirstOrDefaultAsync();
        Assert.NotNull(existingBooking);

        // Act
        var result = await controller.DownloadAgreement(existingBooking.Id);

        // Assert
        var fileResult = Assert.IsType<FileContentResult>(result);
        Assert.Equal("application/pdf", fileResult.ContentType);
        Assert.StartsWith("Agreement_", fileResult.FileDownloadName);
        Assert.True(fileResult.FileContents.Length > 0);
    }

    [Fact]
    public async Task DownloadAgreement_ReturnsNotFound_WhenBookingDoesNotExist()
    {
        // Arrange
        var db = GetDbContext("DownloadAgreement_NotFound");
        var uow = new UnitOfWork(db);
        var bookingService = new BookingService(uow);
        var controller = new BookingsController(bookingService, NullLogger<BookingsController>.Instance);

        // Act
        var result = await controller.DownloadAgreement(99999);

        // Assert
        Assert.IsType<NotFoundObjectResult>(result);
    }
}
