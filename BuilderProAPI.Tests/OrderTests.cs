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

public class OrderTests
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
    public async Task GetAll_ReturnsAllOrders()
    {
        // Arrange
        var db = GetDbContext("GetAll_ReturnsAllOrders");
        var controller = new OrdersController(db);

        // Act
        var result = await controller.GetAll(null);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var orders = Assert.IsAssignableFrom<IEnumerable<Order>>(okResult.Value);
        Assert.NotEmpty(orders);
    }

    [Fact]
    public async Task Create_SavesOrderWithItemsAndCalculatesTotal()
    {
        // Arrange
        var db = GetDbContext("Create_SavesOrderWithItemsAndCalculatesTotal");
        var controller = new OrdersController(db);

        var order = new Order
        {
            ProjectId = 1,
            VendorName = "Acme Cement Corp",
            Status = "Pending",
            OrderItems = new List<OrderItem>
            {
                new OrderItem { ItemName = "Cement Bags", Quantity = 100, UnitPrice = 400m },
                new OrderItem { ItemName = "Steel Rods", Quantity = 5, UnitPrice = 1000m }
            }
        };

        // Act
        var result = await controller.Create(order);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result);
        var created = Assert.IsType<Order>(createdResult.Value);
        Assert.Equal("Pending", created.Status);
        Assert.StartsWith("PO-", created.OrderNumber);
        Assert.Equal(14, created.OrderNumber.Length);
        Assert.Equal(45000m, created.TotalAmount);

        var dbOrder = await db.Orders.Include(o => o.OrderItems).FirstOrDefaultAsync(o => o.Id == created.Id);
        Assert.NotNull(dbOrder);
        Assert.Equal(2, dbOrder.OrderItems.Count);
        Assert.Equal(45000m, dbOrder.TotalAmount);
    }
}
