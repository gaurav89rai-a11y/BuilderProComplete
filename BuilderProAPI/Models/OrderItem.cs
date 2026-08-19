using System;

namespace BuilderProAPI.Models;

public class OrderItem
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public string ItemName { get; set; } = "";
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
}
