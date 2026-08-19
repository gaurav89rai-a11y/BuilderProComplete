using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BuilderProAPI.Controllers;
using BuilderProAPI.Data;
using BuilderProAPI.Models;
using Xunit;

namespace BuilderProAPI.Tests;

public class EmployeeTests
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
    public async Task GetAll_ReturnsAllEmployees()
    {
        // Arrange
        var db = GetDbContext("GetAll_ReturnsAllEmployees");
        var controller = new EmployeesController(db);

        // Act
        var result = await controller.GetAll();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var emps = Assert.IsAssignableFrom<IEnumerable<Employee>>(okResult.Value);
        Assert.NotEmpty(emps);
    }

    [Fact]
    public async Task Create_AddsEmployeeToDatabase()
    {
        // Arrange
        var db = GetDbContext("Create_AddsEmployeeToDatabase");
        var controller = new EmployeesController(db);
        var newEmp = new Employee
        {
            Name = "John Doe",
            Email = "john.doe@email.com",
            Phone = "9999999999",
            Department = "Engineering",
            Designation = "Senior Dev",
            Salary = 90000m,
            Status = "Active"
        };

        // Act
        var result = await controller.Create(newEmp);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result);
        var emp = Assert.IsType<Employee>(createdResult.Value);
        Assert.Equal("John Doe", emp.Name);
        Assert.True(emp.Id > 0);
        Assert.StartsWith("EMP-", emp.EmployeeCode);
        Assert.Equal(15, emp.EmployeeCode.Length);

        var dbEmp = await db.Employees.FindAsync(emp.Id);
        Assert.NotNull(dbEmp);
        Assert.Equal("john.doe@email.com", dbEmp.Email);
        Assert.StartsWith("EMP-", dbEmp.EmployeeCode);

        // Verify auto user provisioning
        var dbUser = await db.Users.FirstOrDefaultAsync(u => u.Email == emp.Email);
        Assert.NotNull(dbUser);
        Assert.Equal(emp.Name, dbUser.Name);
        Assert.Equal("Sales Agent", dbUser.Role);
    }
}
