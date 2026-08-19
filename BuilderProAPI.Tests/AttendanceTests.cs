using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BuilderProAPI.Controllers;
using BuilderProAPI.Data;
using BuilderProAPI.Models;
using Xunit;

namespace BuilderProAPI.Tests;

public class AttendanceTests
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
    public async Task GetAll_ReturnsAttendanceLogs()
    {
        // Arrange
        var db = GetDbContext("GetAll_ReturnsAttendanceLogs");
        var controller = new AttendancesController(db);

        // Act
        var result = await controller.GetAll(null, null);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var logs = Assert.IsAssignableFrom<IEnumerable<Attendance>>(okResult.Value);
        Assert.NotEmpty(logs);
    }

    [Fact]
    public async Task LogAttendance_SavesRecord()
    {
        // Arrange
        var db = GetDbContext("LogAttendance_SavesRecord");
        var controller = new AttendancesController(db);
        var attendance = new Attendance
        {
            EmployeeId = 1,
            Date = DateTime.Today,
            CheckIn = "09:00 AM",
            CheckOut = "",
            Status = "Present"
        };

        // Act
        var result = await controller.LogAttendance(attendance);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var created = Assert.IsType<Attendance>(okResult.Value);
        Assert.Equal("Present", created.Status);
        Assert.True(created.Id > 0);
        Assert.StartsWith("ATT-", created.AttendanceCode);
        Assert.Equal(15, created.AttendanceCode.Length);

        var dbRecord = await db.Attendances.FindAsync(created.Id);
        Assert.NotNull(dbRecord);
        Assert.Equal("09:00 AM", dbRecord.CheckIn);
        Assert.StartsWith("ATT-", dbRecord.AttendanceCode);
    }
}
