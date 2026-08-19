using System;
using System.Collections.Generic;

namespace BuilderProAPI.Models;

public class Order
{
    public int Id { get; set; }
    public string OrderNumber { get; set; } = "";
    public int ProjectId { get; set; }
    public Project? Project { get; set; }
    public string VendorName { get; set; } = "";
    public DateTime OrderDate { get; set; } = DateTime.UtcNow;
    public DateTime? DeliveryDate { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Shipped, Delivered, Cancelled
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}
