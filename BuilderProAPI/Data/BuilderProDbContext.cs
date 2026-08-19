using Microsoft.EntityFrameworkCore;
using BuilderProAPI.Models;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace BuilderProAPI.Data;

public class BuilderProDbContext : DbContext
{
    public BuilderProDbContext(DbContextOptions<BuilderProDbContext> options) : base(options) { }

    public override int SaveChanges()
    {
        LogEntityChanges();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        LogEntityChanges();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void LogEntityChanges()
    {
        try
        {
            var entries = ChangeTracker.Entries()
                .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified || e.State == EntityState.Deleted)
                .ToList();

            foreach (var entry in entries)
            {
                var entityName = entry.Entity.GetType().Name;
                var state = entry.State.ToString();
                var primaryKey = entry.Properties.FirstOrDefault(p => p.Metadata.IsPrimaryKey())?.CurrentValue;

                Console.WriteLine($"🔍 [DB CHANGE] Entity: {entityName} | State: {state} | Primary Key: {primaryKey}");

                if (entry.State == EntityState.Modified)
                {
                    foreach (var prop in entry.Properties.Where(p => p.IsModified))
                    {
                        Console.WriteLine($"   ➜ Property: {prop.Metadata.Name} | Original: '{prop.OriginalValue}' ➜ Current: '{prop.CurrentValue}'");
                    }
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"⚠️ Warning in DB Change Logging: {ex.Message}");
        }
    }

    public DbSet<Project> Projects => Set<Project>();
    public DbSet<Unit> Units => Set<Unit>();
    public DbSet<Lead> Leads => Set<Lead>();
    public DbSet<ChannelPartner> ChannelPartners => Set<ChannelPartner>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<SiteVisit> SiteVisits => Set<SiteVisit>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Commission> Commissions => Set<Commission>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<ServiceTicket> ServiceTickets => Set<ServiceTicket>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Attendance> Attendances => Set<Attendance>();
    public DbSet<LeaveRequest> LeaveRequests => Set<LeaveRequest>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<SystemConfig> SystemConfigs => Set<SystemConfig>();
    public DbSet<LeadAuditLog> LeadAuditLogs => Set<LeadAuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Project>().Property(p => p.TotalValue).HasColumnType("decimal(18,2)");
        modelBuilder.Entity<Unit>().Property(u => u.Price).HasColumnType("decimal(18,2)");
        modelBuilder.Entity<Unit>().Property(u => u.Area).HasColumnType("decimal(10,2)");
        modelBuilder.Entity<Lead>().Property(l => l.Budget).HasColumnType("decimal(18,2)");
        modelBuilder.Entity<ChannelPartner>().Property(cp => cp.Rating).HasColumnType("decimal(3,1)");
        modelBuilder.Entity<ChannelPartner>().Property(cp => cp.CommissionRate).HasColumnType("decimal(5,2)");
        modelBuilder.Entity<Customer>().Property(c => c.TotalAmount).HasColumnType("decimal(18,2)");
        modelBuilder.Entity<Customer>().Property(c => c.PaidAmount).HasColumnType("decimal(18,2)");
        modelBuilder.Entity<Booking>().Property(b => b.TotalAmount).HasColumnType("decimal(18,2)");
        modelBuilder.Entity<Booking>().Property(b => b.TokenAmount).HasColumnType("decimal(18,2)");
        modelBuilder.Entity<Payment>().Property(p => p.Amount).HasColumnType("decimal(18,2)");
        modelBuilder.Entity<Commission>().Property(c => c.Amount).HasColumnType("decimal(18,2)");
        modelBuilder.Entity<Commission>().Property(c => c.Rate).HasColumnType("decimal(5,2)");
        modelBuilder.Entity<Employee>().Property(e => e.Salary).HasColumnType("decimal(18,2)");
        modelBuilder.Entity<Order>().Property(o => o.TotalAmount).HasColumnType("decimal(18,2)");
        modelBuilder.Entity<OrderItem>().Property(oi => oi.UnitPrice).HasColumnType("decimal(18,2)");
        modelBuilder.Entity<OrderItem>().Property(oi => oi.TotalPrice).HasColumnType("decimal(18,2)");

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var foreignKey in entityType.GetForeignKeys())
            {
                foreignKey.DeleteBehavior = DeleteBehavior.Restrict;
            }
        }

        // Seed Data
        modelBuilder.Entity<Project>().HasData(
            new Project { Id=1, Name="Skyline Heights", Location="Bandra West, Mumbai", ReraNumber="P51900034682", Status="Active", Type="Residential", TotalUnits=240, ConstructionPct=78, TotalValue=4850000000m },
            new Project { Id=2, Name="Green Valley Township", Location="Panvel, Navi Mumbai", ReraNumber="P51900029841", Status="Active", Type="Township", TotalUnits=520, ConstructionPct=52, TotalValue=6800000000m },
            new Project { Id=3, Name="Meridian Business Park", Location="BKC, Mumbai", ReraNumber="P51900041236", Status="Nearing Handover", Type="Commercial", TotalUnits=80, ConstructionPct=95, TotalValue=4200000000m },
            new Project { Id=4, Name="Pearl Residences", Location="Thane West", ReraNumber="P51900051890", Status="Pre-launch", Type="Residential", TotalUnits=180, ConstructionPct=12, TotalValue=2900000000m }
        );

        modelBuilder.Entity<Unit>().HasData(
            new Unit { Id=1, ProjectId=1, UnitNumber="A-101", Floor=1, UnitType="2BHK", Area=987, Price=12500000m, Status="Available", View="Garden" },
            new Unit { Id=2, ProjectId=1, UnitNumber="A-102", Floor=1, UnitType="3BHK", Area=1350, Price=17200000m, Status="Sold", View="Road" },
            new Unit { Id=3, ProjectId=1, UnitNumber="B-201", Floor=2, UnitType="2BHK", Area=1010, Price=13100000m, Status="Booked", View="Pool" },
            new Unit { Id=4, ProjectId=1, UnitNumber="B-202", Floor=2, UnitType="4BHK", Area=1980, Price=28500000m, Status="Available", View="Sea" },
            new Unit { Id=5, ProjectId=1, UnitNumber="C-301", Floor=3, UnitType="3BHK", Area=1450, Price=18900000m, Status="Held", View="Garden" },
            new Unit { Id=6, ProjectId=1, UnitNumber="C-302", Floor=3, UnitType="2BHK", Area=950, Price=12100000m, Status="Sold", View="Road" },
            new Unit { Id=7, ProjectId=1, UnitNumber="D-401", Floor=4, UnitType="4BHK", Area=2100, Price=32000000m, Status="Available", View="Sea" },
            new Unit { Id=8, ProjectId=1, UnitNumber="D-402", Floor=4, UnitType="3BHK", Area=1380, Price=17800000m, Status="Booked", View="City" }
        );

        modelBuilder.Entity<Lead>().HasData(
            new Lead { Id=1, Name="Rahul Sharma", Email="rahul.s@email.com", Phone="9800000001", Source="Website", Stage="New Lead", Score=85, Interest="Skyline Heights 3BHK", AssignedTo="Priya M.", Budget=18000000m, ProjectId=1, NextFollowUpDate = new DateTime(2026, 7, 7, 12, 0, 0) },
            new Lead { Id=2, Name="Anjali Patel", Email="anjali.p@email.com", Phone="9800000002", Source="Channel Partner", Stage="Contacted", Score=72, Interest="Green Valley 2BHK", AssignedTo="Amit K.", Budget=12000000m, ProjectId=2, NextFollowUpDate = new DateTime(2026, 7, 6, 15, 0, 0) },
            new Lead { Id=3, Name="Suresh Kumar", Email="suresh.k@email.com", Phone="9800000003", Source="Walk-in", Stage="Site Visit Completed", Score=91, Interest="Skyline Heights 4BHK", AssignedTo="Priya M.", Budget=32000000m, ProjectId=1, NextFollowUpDate = new DateTime(2026, 7, 8, 11, 0, 0) },
            new Lead { Id=4, Name="Meera Iyer", Email="meera.i@email.com", Phone="9800000004", Source="Referral", Stage="Negotiation", Score=88, Interest="Meridian Business Park", AssignedTo="Vikram S.", Budget=45000000m, ProjectId=3, NextFollowUpDate = null },
            new Lead { Id=5, Name="Arun Mehta", Email="arun.m@email.com", Phone="9800000005", Source="Online Ad", Stage="Booking Confirmed", Score=95, Interest="Pearl Residences 3BHK", AssignedTo="Amit K.", Budget=21000000m, ProjectId=4, NextFollowUpDate = null }
        );

        modelBuilder.Entity<ChannelPartner>().HasData(
            new ChannelPartner { Id=1, Name="PropNest Realty", ContactPerson="Sanjay Bhatt", Email="sanjay@propnest.com", Phone="9900000001", City="Mumbai", Status="Platinum", Rating=4.8m, CommissionRate=3.0m },
            new ChannelPartner { Id=2, Name="HomeFinder Associates", ContactPerson="Rekha Nair", Email="rekha@homefinder.com", Phone="9900000002", City="Pune", Status="Gold", Rating=4.5m, CommissionRate=2.5m },
            new ChannelPartner { Id=3, Name="DreamKey Properties", ContactPerson="Farhan Khan", Email="farhan@dreamkey.com", Phone="9900000003", City="Thane", Status="Silver", Rating=4.2m, CommissionRate=2.0m }
        );

        modelBuilder.Entity<Customer>().HasData(
            new Customer { Id=1, Name="Rajesh Verma", Email="rajesh.v@gmail.com", Phone="9700000001", UnitNumber="B-201", ProjectId=1, BookingDate=new DateTime(2023,8,15), Status="Active", TotalAmount=13100000m, PaidAmount=8515000m },
            new Customer { Id=2, Name="Sunita Agarwal", Email="sunita.a@gmail.com", Phone="9700000002", UnitNumber="A-102", ProjectId=1, BookingDate=new DateTime(2023,6,22), Status="Possession Given", TotalAmount=17200000m, PaidAmount=17200000m },
            new Customer { Id=3, Name="Mohan Das", Email="mohan.d@gmail.com", Phone="9700000003", UnitNumber="D-402", ProjectId=1, BookingDate=new DateTime(2023,10,5), Status="Active", TotalAmount=17800000m, PaidAmount=9078000m },
            new Customer { Id=4, Name="Lakshmi Krishnan", Email="lakshmi.k@gmail.com", Phone="9700000004", UnitNumber="C-301", ProjectId=1, BookingDate=new DateTime(2023,9,18), Status="Overdue", TotalAmount=18900000m, PaidAmount=7560000m }
        );

        modelBuilder.Entity<Booking>().HasData(
            new Booking { Id = 1, BookingNumber = "BK-2026-000001", CustomerId = 1, UnitId = 3, BookingDate = new DateTime(2023, 8, 15), TotalAmount = 13100000m, TokenAmount = 500000m, Status = "Confirmed", AssignedAgent = "Priya Mehta" },
            new Booking { Id = 2, BookingNumber = "BK-2026-000002", CustomerId = 3, UnitId = 8, BookingDate = new DateTime(2023, 10, 5), TotalAmount = 17800000m, TokenAmount = 1000000m, Status = "Agreement Signed", AssignedAgent = "Amit Kumar" }
        );
        
        modelBuilder.Entity<User>().HasData(
            new User { Id=1, Name="Arjun Kapoor", Email="arjun@builderpro.com", Role="Super Admin", Permissions="all" },
            new User { Id=2, Name="Priya Mehta", Email="priya@builderpro.com", Role="Sales Agent", Permissions="view_dashboard,manage_leads,manage_visits" },
            new User { Id=3, Name="Amit Kumar", Email="amit@builderpro.com", Role="Manager", Permissions="view_dashboard,manage_projects,manage_inventory,manage_leads,manage_partners,manage_customers,manage_visits,manage_bookings,manage_hrms,manage_oms" },
            new User { Id=4, Name="Vikram Sen", Email="vikram@builderpro.com", Role="Support Agent", Permissions="view_dashboard,manage_support" }
        );

        modelBuilder.Entity<Employee>().HasData(
            new Employee { Id = 1, EmployeeCode = "EMP-2026-000001", Name = "Raj Patel", Email = "raj@builderpro.com", Phone = "9812345671", Department = "HR", Designation = "HR Manager", Status = "Active", DateOfJoining = new DateTime(2024, 1, 15), Salary = 75000m },
            new Employee { Id = 2, EmployeeCode = "EMP-2026-000002", Name = "Sunil Sharma", Email = "sunil@builderpro.com", Phone = "9812345672", Department = "Construction", Designation = "Construction Supervisor", Status = "Active", DateOfJoining = new DateTime(2024, 3, 10), Salary = 60000m },
            new Employee { Id = 3, EmployeeCode = "EMP-2026-000003", Name = "Pooja Sen", Email = "pooja@builderpro.com", Phone = "9812345673", Department = "Sales", Designation = "Sales Lead", Status = "Active", DateOfJoining = new DateTime(2024, 2, 1), Salary = 65000m }
        );

        modelBuilder.Entity<Attendance>().HasData(
            new Attendance { Id = 1, AttendanceCode = "ATT-2026-000001", EmployeeId = 1, Date = new DateTime(2026, 7, 3), CheckIn = "09:15 AM", CheckOut = "06:05 PM", Status = "Present" },
            new Attendance { Id = 2, AttendanceCode = "ATT-2026-000002", EmployeeId = 2, Date = new DateTime(2026, 7, 3), CheckIn = "08:50 AM", CheckOut = "05:30 PM", Status = "Present" },
            new Attendance { Id = 3, AttendanceCode = "ATT-2026-000003", EmployeeId = 3, Date = new DateTime(2026, 7, 3), CheckIn = "09:00 AM", CheckOut = "06:00 PM", Status = "Present" }
        );

        modelBuilder.Entity<LeaveRequest>().HasData(
            new LeaveRequest { Id = 1, LeaveCode = "LE-2026-000001", EmployeeId = 2, LeaveType = "Sick", StartDate = new DateTime(2026, 7, 10), EndDate = new DateTime(2026, 7, 12), Reason = "Fever", Status = "Pending" },
            new LeaveRequest { Id = 2, LeaveCode = "LE-2026-000002", EmployeeId = 3, LeaveType = "Casual", StartDate = new DateTime(2026, 6, 5), EndDate = new DateTime(2026, 6, 6), Reason = "Family function", Status = "Approved" }
        );

        modelBuilder.Entity<Order>().HasData(
            new Order { Id = 1, OrderNumber = "PO-2026-000001", ProjectId = 1, VendorName = "Ultratech Cement Ltd", OrderDate = new DateTime(2026, 6, 20), DeliveryDate = new DateTime(2026, 6, 25), TotalAmount = 250000m, Status = "Delivered" },
            new Order { Id = 2, OrderNumber = "PO-2026-000002", ProjectId = 2, VendorName = "Tata Steel Ltd", OrderDate = new DateTime(2026, 7, 1), DeliveryDate = null, TotalAmount = 450000m, Status = "Pending" }
        );

        modelBuilder.Entity<OrderItem>().HasData(
            new OrderItem { Id = 1, OrderId = 1, ItemName = "OPC 53 Grade Cement (bags)", Quantity = 500, UnitPrice = 500m, TotalPrice = 250000m },
            new OrderItem { Id = 2, OrderId = 2, ItemName = "TMT Steel Bars (tons)", Quantity = 10, UnitPrice = 45000m, TotalPrice = 450000m }
        );

        modelBuilder.Entity<SystemConfig>().HasData(
            // ProjectStatus
            new SystemConfig { Id = 1, Category = "ProjectStatus", Value = "Pre-launch", Label = "Pre-launch", Color = "blue", IsDefault = true, SortOrder = 1 },
            new SystemConfig { Id = 2, Category = "ProjectStatus", Value = "Active", Label = "Active", Color = "teal", IsDefault = false, SortOrder = 2 },
            new SystemConfig { Id = 3, Category = "ProjectStatus", Value = "Nearing Handover", Label = "Nearing Handover", Color = "teal", IsDefault = false, SortOrder = 3 },
            new SystemConfig { Id = 4, Category = "ProjectStatus", Value = "Completed", Label = "Completed", Color = "teal", IsDefault = false, SortOrder = 4 },

            // ProjectType
            new SystemConfig { Id = 5, Category = "ProjectType", Value = "Residential", Label = "Residential", IsDefault = true, SortOrder = 1 },
            new SystemConfig { Id = 6, Category = "ProjectType", Value = "Commercial", Label = "Commercial", IsDefault = false, SortOrder = 2 },
            new SystemConfig { Id = 7, Category = "ProjectType", Value = "Township", Label = "Township", IsDefault = false, SortOrder = 3 },

            // PaymentMode
            new SystemConfig { Id = 8, Category = "PaymentMode", Value = "NEFT", Label = "NEFT", IsDefault = true, SortOrder = 1 },
            new SystemConfig { Id = 9, Category = "PaymentMode", Value = "RTGS", Label = "RTGS", IsDefault = false, SortOrder = 2 },
            new SystemConfig { Id = 10, Category = "PaymentMode", Value = "Cheque", Label = "Cheque", IsDefault = false, SortOrder = 3 },
            new SystemConfig { Id = 11, Category = "PaymentMode", Value = "Cash", Label = "Cash", IsDefault = false, SortOrder = 4 },
            new SystemConfig { Id = 12, Category = "PaymentMode", Value = "UPI", Label = "UPI", IsDefault = false, SortOrder = 5 },
            new SystemConfig { Id = 13, Category = "PaymentMode", Value = "DD", Label = "DD", IsDefault = false, SortOrder = 6 },

            // PaymentStatus
            new SystemConfig { Id = 14, Category = "PaymentStatus", Value = "Received", Label = "Received", Color = "teal", IsDefault = true, SortOrder = 1 },
            new SystemConfig { Id = 15, Category = "PaymentStatus", Value = "Pending", Label = "Pending", Color = "amb", IsDefault = false, SortOrder = 2 },

            // PartnerStatus
            new SystemConfig { Id = 16, Category = "PartnerStatus", Value = "Platinum", Label = "Platinum", Color = "gold", IsDefault = false, SortOrder = 1 },
            new SystemConfig { Id = 17, Category = "PartnerStatus", Value = "Gold", Label = "Gold", Color = "amb", IsDefault = false, SortOrder = 2 },
            new SystemConfig { Id = 18, Category = "PartnerStatus", Value = "Silver", Label = "Silver", Color = "mute", IsDefault = true, SortOrder = 3 },

            // OrderStatus
            new SystemConfig { Id = 19, Category = "OrderStatus", Value = "Pending", Label = "Pending", Color = "amb", IsDefault = true, SortOrder = 1 },
            new SystemConfig { Id = 20, Category = "OrderStatus", Value = "Shipped", Label = "Shipped", Color = "blue", IsDefault = false, SortOrder = 2 },
            new SystemConfig { Id = 21, Category = "OrderStatus", Value = "Delivered", Label = "Delivered", Color = "teal", IsDefault = false, SortOrder = 3 },
            new SystemConfig { Id = 22, Category = "OrderStatus", Value = "Cancelled", Label = "Cancelled", Color = "red", IsDefault = false, SortOrder = 4 },

            // LeadStage
            new SystemConfig { Id = 23, Category = "LeadStage", Value = "New Lead", Label = "New Lead", Color = "sub", IsDefault = true, SortOrder = 1 },
            new SystemConfig { Id = 24, Category = "LeadStage", Value = "Contacted", Label = "Contacted", Color = "blue", IsDefault = false, SortOrder = 2 },
            new SystemConfig { Id = 25, Category = "LeadStage", Value = "Follow-up", Label = "Follow-up", Color = "amb", IsDefault = false, SortOrder = 3 },
            new SystemConfig { Id = 26, Category = "LeadStage", Value = "Site Visit Scheduled", Label = "Site Visit Scheduled", Color = "blue", IsDefault = false, SortOrder = 4 },
            new SystemConfig { Id = 27, Category = "LeadStage", Value = "Site Visit Completed", Label = "Site Visit Completed", Color = "teal", IsDefault = false, SortOrder = 5 },
            new SystemConfig { Id = 251, Category = "LeadStage", Value = "Quotation Sent", Label = "Quotation Sent", Color = "gold", IsDefault = false, SortOrder = 6 },
            new SystemConfig { Id = 252, Category = "LeadStage", Value = "Negotiation", Label = "Negotiation", Color = "amb", IsDefault = false, SortOrder = 7 },
            new SystemConfig { Id = 253, Category = "LeadStage", Value = "Booking Token Received", Label = "Booking Token Received", Color = "gold", IsDefault = false, SortOrder = 8 },
            new SystemConfig { Id = 254, Category = "LeadStage", Value = "Booking Confirmed", Label = "Booking Confirmed", Color = "teal", IsDefault = false, SortOrder = 9 },
            new SystemConfig { Id = 255, Category = "LeadStage", Value = "Documentation", Label = "Documentation", Color = "blue", IsDefault = false, SortOrder = 10 },
            new SystemConfig { Id = 256, Category = "LeadStage", Value = "Agreement Signed", Label = "Agreement Signed", Color = "blue", IsDefault = false, SortOrder = 11 },
            new SystemConfig { Id = 257, Category = "LeadStage", Value = "Home Loan Processing", Label = "Home Loan Processing", Color = "amb", IsDefault = false, SortOrder = 12 },
            new SystemConfig { Id = 258, Category = "LeadStage", Value = "Registration", Label = "Registration", Color = "blue", IsDefault = false, SortOrder = 13 },
            new SystemConfig { Id = 259, Category = "LeadStage", Value = "Closed Won", Label = "Closed Won", Color = "teal", IsDefault = false, SortOrder = 14 },
            new SystemConfig { Id = 260, Category = "LeadStage", Value = "Closed Lost", Label = "Closed Lost", Color = "red", IsDefault = false, SortOrder = 15 },

            // LeadSource
            new SystemConfig { Id = 28, Category = "LeadSource", Value = "Website", Label = "Website", IsDefault = true, SortOrder = 1 },
            new SystemConfig { Id = 29, Category = "LeadSource", Value = "Channel Partner", Label = "Channel Partner", IsDefault = false, SortOrder = 2 },
            new SystemConfig { Id = 30, Category = "LeadSource", Value = "Walk-in", Label = "Walk-in", IsDefault = false, SortOrder = 3 },
            new SystemConfig { Id = 31, Category = "LeadSource", Value = "Referral", Label = "Referral", IsDefault = false, SortOrder = 4 },
            new SystemConfig { Id = 32, Category = "LeadSource", Value = "Online Ad", Label = "Online Ad", IsDefault = false, SortOrder = 5 },

            // UnitType
            new SystemConfig { Id = 33, Category = "UnitType", Value = "1BHK", Label = "1BHK", IsDefault = false, SortOrder = 1 },
            new SystemConfig { Id = 34, Category = "UnitType", Value = "2BHK", Label = "2BHK", IsDefault = true, SortOrder = 2 },
            new SystemConfig { Id = 35, Category = "UnitType", Value = "3BHK", Label = "3BHK", IsDefault = false, SortOrder = 3 },
            new SystemConfig { Id = 36, Category = "UnitType", Value = "4BHK", Label = "4BHK", IsDefault = false, SortOrder = 4 },
            new SystemConfig { Id = 37, Category = "UnitType", Value = "Studio", Label = "Studio", IsDefault = false, SortOrder = 5 },
            new SystemConfig { Id = 38, Category = "UnitType", Value = "Shop", Label = "Shop", IsDefault = false, SortOrder = 6 },
            new SystemConfig { Id = 39, Category = "UnitType", Value = "Office", Label = "Office", IsDefault = false, SortOrder = 7 },

            // UnitStatus
            new SystemConfig { Id = 40, Category = "UnitStatus", Value = "Available", Label = "Available", Color = "teal", IsDefault = true, SortOrder = 1 },
            new SystemConfig { Id = 41, Category = "UnitStatus", Value = "Booked", Label = "Booked", Color = "amb", IsDefault = false, SortOrder = 2 },
            new SystemConfig { Id = 42, Category = "UnitStatus", Value = "Sold", Label = "Sold", Color = "red", IsDefault = false, SortOrder = 3 },
            new SystemConfig { Id = 43, Category = "UnitStatus", Value = "Held", Label = "Held", Color = "blue", IsDefault = false, SortOrder = 4 },

            // Department
            new SystemConfig { Id = 44, Category = "Department", Value = "Construction", Label = "Construction", IsDefault = true, SortOrder = 1 },
            new SystemConfig { Id = 45, Category = "Department", Value = "HR", Label = "HR", IsDefault = false, SortOrder = 2 },
            new SystemConfig { Id = 46, Category = "Department", Value = "Sales", Label = "Sales", IsDefault = false, SortOrder = 3 },
            new SystemConfig { Id = 47, Category = "Department", Value = "Finance", Label = "Finance", IsDefault = false, SortOrder = 4 },

            // EmployeeStatus
            new SystemConfig { Id = 48, Category = "EmployeeStatus", Value = "Active", Label = "Active", IsDefault = true, SortOrder = 1 },
            new SystemConfig { Id = 49, Category = "EmployeeStatus", Value = "On Leave", Label = "On Leave", IsDefault = false, SortOrder = 2 },
            new SystemConfig { Id = 50, Category = "EmployeeStatus", Value = "Terminated", Label = "Terminated", IsDefault = false, SortOrder = 3 },

            // AttendanceStatus
            new SystemConfig { Id = 51, Category = "AttendanceStatus", Value = "Present", Label = "Present", IsDefault = true, SortOrder = 1 },
            new SystemConfig { Id = 52, Category = "AttendanceStatus", Value = "Absent", Label = "Absent", IsDefault = false, SortOrder = 2 },
            new SystemConfig { Id = 53, Category = "AttendanceStatus", Value = "Half-Day", Label = "Half-Day", IsDefault = false, SortOrder = 3 },
            new SystemConfig { Id = 54, Category = "AttendanceStatus", Value = "On Leave", Label = "On Leave", IsDefault = false, SortOrder = 4 },

            // LeaveType
            new SystemConfig { Id = 55, Category = "LeaveType", Value = "Casual", Label = "Casual", IsDefault = true, SortOrder = 1 },
            new SystemConfig { Id = 56, Category = "LeaveType", Value = "Sick", Label = "Sick", IsDefault = false, SortOrder = 2 },
            new SystemConfig { Id = 57, Category = "LeaveType", Value = "Earned", Label = "Earned", IsDefault = false, SortOrder = 3 },

            // LeaveStatus
            new SystemConfig { Id = 58, Category = "LeaveStatus", Value = "Pending", Label = "Pending", Color = "amb", IsDefault = true, SortOrder = 1 },
            new SystemConfig { Id = 59, Category = "LeaveStatus", Value = "Approved", Label = "Approved", Color = "teal", IsDefault = false, SortOrder = 2 },
            new SystemConfig { Id = 60, Category = "LeaveStatus", Value = "Rejected", Label = "Rejected", Color = "red", IsDefault = false, SortOrder = 3 },

            // DocumentType
            new SystemConfig { Id = 61, Category = "DocumentType", Value = "Agreement", Label = "Agreement", IsDefault = true, SortOrder = 1 },
            new SystemConfig { Id = 62, Category = "DocumentType", Value = "RERA", Label = "RERA", IsDefault = false, SortOrder = 2 },
            new SystemConfig { Id = 63, Category = "DocumentType", Value = "Finance", Label = "Finance", IsDefault = false, SortOrder = 3 },
            new SystemConfig { Id = 64, Category = "DocumentType", Value = "Allotment", Label = "Allotment", IsDefault = false, SortOrder = 4 },
            new SystemConfig { Id = 65, Category = "DocumentType", Value = "NOC", Label = "NOC", IsDefault = false, SortOrder = 5 },
            new SystemConfig { Id = 66, Category = "DocumentType", Value = "Other", Label = "Other", IsDefault = false, SortOrder = 6 },

            // DocumentStatus
            new SystemConfig { Id = 67, Category = "DocumentStatus", Value = "Pending", Label = "Pending", Color = "amb", IsDefault = true, SortOrder = 1 },
            new SystemConfig { Id = 68, Category = "DocumentStatus", Value = "Signed", Label = "Signed", Color = "teal", IsDefault = false, SortOrder = 2 },
            new SystemConfig { Id = 69, Category = "DocumentStatus", Value = "Active", Label = "Active", Color = "teal", IsDefault = false, SortOrder = 3 },
            new SystemConfig { Id = 70, Category = "DocumentStatus", Value = "Sent", Label = "Sent", Color = "blue", IsDefault = false, SortOrder = 4 },

            // CustomerStatus
            new SystemConfig { Id = 71, Category = "CustomerStatus", Value = "Active", Label = "Active", Color = "teal", IsDefault = true, SortOrder = 1 },
            new SystemConfig { Id = 72, Category = "CustomerStatus", Value = "Overdue", Label = "Overdue", Color = "red", IsDefault = false, SortOrder = 2 },
            new SystemConfig { Id = 73, Category = "CustomerStatus", Value = "Possession Given", Label = "Possession Given", Color = "gold", IsDefault = false, SortOrder = 3 },

            // BookingStatus
            new SystemConfig { Id = 74, Category = "BookingStatus", Value = "Confirmed", Label = "Confirmed", Color = "teal", IsDefault = true, SortOrder = 1 },
            new SystemConfig { Id = 75, Category = "BookingStatus", Value = "Agreement Pending", Label = "Agreement Pending", Color = "amb", IsDefault = false, SortOrder = 2 },
            new SystemConfig { Id = 76, Category = "BookingStatus", Value = "Agreement Signed", Label = "Agreement Signed", Color = "blue", IsDefault = false, SortOrder = 3 },

            // UserRole
            new SystemConfig { Id = 77, Category = "UserRole", Value = "Super Admin", Label = "Super Admin", IsDefault = false, SortOrder = 1 },
            new SystemConfig { Id = 78, Category = "UserRole", Value = "Manager", Label = "Manager", IsDefault = false, SortOrder = 2 },
            new SystemConfig { Id = 79, Category = "UserRole", Value = "Sales Agent", Label = "Sales Agent", IsDefault = true, SortOrder = 3 },
            new SystemConfig { Id = 80, Category = "UserRole", Value = "Support Agent", Label = "Support Agent", IsDefault = false, SortOrder = 4 },

            // SupportCategory
            new SystemConfig { Id = 81, Category = "SupportCategory", Value = "Maintenance", Label = "Maintenance", IsDefault = true, SortOrder = 1 },
            new SystemConfig { Id = 82, Category = "SupportCategory", Value = "Documentation", Label = "Documentation", IsDefault = false, SortOrder = 2 },
            new SystemConfig { Id = 83, Category = "SupportCategory", Value = "General", Label = "General", IsDefault = false, SortOrder = 3 },
            new SystemConfig { Id = 84, Category = "SupportCategory", Value = "Finance", Label = "Finance", IsDefault = false, SortOrder = 4 },
            new SystemConfig { Id = 85, Category = "SupportCategory", Value = "Legal", Label = "Legal", IsDefault = false, SortOrder = 5 },

            // SupportPriority
            new SystemConfig { Id = 86, Category = "SupportPriority", Value = "Critical", Label = "Critical", Color = "red", IsDefault = false, SortOrder = 1 },
            new SystemConfig { Id = 87, Category = "SupportPriority", Value = "High", Label = "High", Color = "amb", IsDefault = false, SortOrder = 2 },
            new SystemConfig { Id = 88, Category = "SupportPriority", Value = "Medium", Label = "Medium", Color = "amb", IsDefault = true, SortOrder = 3 },
            new SystemConfig { Id = 89, Category = "SupportPriority", Value = "Low", Label = "Low", Color = "teal", IsDefault = false, SortOrder = 4 },

            // AIReply
            new SystemConfig { Id = 90, Category = "AIReply", Value = "Based on current data, Skyline Heights has the best ROI at 32% with 78% construction complete.", Label = "Skyline Heights ROI Reply", IsDefault = false, SortOrder = 1 },
            new SystemConfig { Id = 91, Category = "AIReply", Value = "Your lead pipeline shows 91 leads in active stages. I recommend following up with the Negotiation stage leads first.", Label = "Lead Pipeline Reply", IsDefault = false, SortOrder = 2 },
            new SystemConfig { Id = 92, Category = "AIReply", Value = "Green Valley Township has 154 available units — consider a targeted campaign for 2BHK inventory.", Label = "Green Valley Inventory Reply", IsDefault = false, SortOrder = 3 },
            new SystemConfig { Id = 93, Category = "AIReply", Value = "Payment collection efficiency is at 72% this quarter. Lakshmi Krishnan's account requires immediate attention.", Label = "Collection Efficiency Reply", IsDefault = false, SortOrder = 4 },

            // SiteVisitStatus
            new SystemConfig { Id = 94, Category = "SiteVisitStatus", Value = "Scheduled", Label = "Scheduled", Color = "blue", IsDefault = true, SortOrder = 1 },
            new SystemConfig { Id = 95, Category = "SiteVisitStatus", Value = "Completed", Label = "Completed", Color = "teal", IsDefault = false, SortOrder = 2 },
            new SystemConfig { Id = 96, Category = "SiteVisitStatus", Value = "Cancelled", Label = "Cancelled", Color = "red", IsDefault = false, SortOrder = 3 },

            // SupportStatus
            new SystemConfig { Id = 97, Category = "SupportStatus", Value = "Open", Label = "Open", Color = "red", IsDefault = true, SortOrder = 1 },
            new SystemConfig { Id = 98, Category = "SupportStatus", Value = "In Progress", Label = "In Progress", Color = "amb", IsDefault = false, SortOrder = 2 },
            new SystemConfig { Id = 99, Category = "SupportStatus", Value = "Resolved", Label = "Resolved", Color = "teal", IsDefault = false, SortOrder = 3 },

            // CommissionStatus
            new SystemConfig { Id = 100, Category = "CommissionStatus", Value = "Pending Approval", Label = "Pending Approval", Color = "blue", IsDefault = true, SortOrder = 1 },
            new SystemConfig { Id = 101, Category = "CommissionStatus", Value = "Payable", Label = "Payable", Color = "amb", IsDefault = false, SortOrder = 2 },
            new SystemConfig { Id = 102, Category = "CommissionStatus", Value = "Paid", Label = "Paid", Color = "teal", IsDefault = false, SortOrder = 3 },

            // SystemSettings for Business Logics
            new SystemConfig { Id = 103, Category = "SystemSetting", Value = "ActiveProjectStatus", Label = "Active", IsDefault = false, SortOrder = 1 },
            new SystemConfig { Id = 104, Category = "SystemSetting", Value = "SoldUnitStatus", Label = "Sold", IsDefault = false, SortOrder = 2 },
            new SystemConfig { Id = 105, Category = "SystemSetting", Value = "AvailableUnitStatus", Label = "Available", IsDefault = false, SortOrder = 3 },
            new SystemConfig { Id = 106, Category = "SystemSetting", Value = "BookedUnitStatus", Label = "Booked", IsDefault = false, SortOrder = 4 },
            new SystemConfig { Id = 107, Category = "SystemSetting", Value = "BookedLeadStage", Label = "Booked", IsDefault = false, SortOrder = 5 },
            new SystemConfig { Id = 108, Category = "SystemSetting", Value = "OverdueCustomerStatus", Label = "Overdue", IsDefault = false, SortOrder = 6 },
            new SystemConfig { Id = 109, Category = "SystemSetting", Value = "OpenSupportStatus", Label = "Open", IsDefault = false, SortOrder = 7 },
            new SystemConfig { Id = 110, Category = "SystemSetting", Value = "PendingCommissionStatus", Label = "Pending Approval", IsDefault = false, SortOrder = 8 },
            new SystemConfig { Id = 111, Category = "SystemSetting", Value = "ScheduledSiteVisitStatus", Label = "Scheduled", IsDefault = false, SortOrder = 9 },
            new SystemConfig { Id = 112, Category = "SystemSetting", Value = "NewLeadStage", Label = "New Lead", IsDefault = false, SortOrder = 10 },
            new SystemConfig { Id = 113, Category = "SystemSetting", Value = "ContactedLeadStage", Label = "Contacted", IsDefault = false, SortOrder = 11 },
            new SystemConfig { Id = 114, Category = "SystemSetting", Value = "SiteVisitLeadStage", Label = "Site Visit Scheduled", IsDefault = false, SortOrder = 12 },
            new SystemConfig { Id = 115, Category = "SystemSetting", Value = "DefaultSiteVisitStatus", Label = "Scheduled", IsDefault = false, SortOrder = 13 },
            new SystemConfig { Id = 116, Category = "SystemSetting", Value = "DefaultSupportStatus", Label = "Open", IsDefault = false, SortOrder = 14 },
            new SystemConfig { Id = 117, Category = "SystemSetting", Value = "ApproveCommissionStatus", Label = "Payable", IsDefault = false, SortOrder = 15 },
            new SystemConfig { Id = 118, Category = "SystemSetting", Value = "PayCommissionStatus", Label = "Paid", IsDefault = false, SortOrder = 16 },
            new SystemConfig { Id = 119, Category = "SystemSetting", Value = "ConfirmedBookingStatus", Label = "Confirmed", IsDefault = false, SortOrder = 17 },
            new SystemConfig { Id = 120, Category = "SystemSetting", Value = "SignedBookingStatus", Label = "Agreement Signed", IsDefault = false, SortOrder = 18 }
        );

        modelBuilder.Entity<LeadAuditLog>().HasData(
            new LeadAuditLog { Id = 1, LeadId = 1, ActivityIcon = "🎯", ActivityType = "Lead Created", PrevStage = "", NewStage = "New Lead", UserName = "System", Timestamp = new DateTime(2026, 7, 6, 10, 0, 0), Comments = "Lead created via Website with interest in Skyline Heights." },
            new LeadAuditLog { Id = 2, LeadId = 1, ActivityIcon = "👤", ActivityType = "Lead Assigned", PrevStage = "New Lead", NewStage = "New Lead", UserName = "Admin", Timestamp = new DateTime(2026, 7, 6, 10, 15, 0), Comments = "Assigned to sales representative Priya M." },
            
            new LeadAuditLog { Id = 3, LeadId = 2, ActivityIcon = "🎯", ActivityType = "Lead Created", PrevStage = "", NewStage = "New Lead", UserName = "System", Timestamp = new DateTime(2026, 7, 5, 9, 30, 0), Comments = "Lead created via Channel Partner." },
            new LeadAuditLog { Id = 4, LeadId = 2, ActivityIcon = "📞", ActivityType = "Call Logged", PrevStage = "New Lead", NewStage = "Contacted", UserName = "Amit K.", Timestamp = new DateTime(2026, 7, 5, 11, 0, 0), Comments = "Spoke with client. Highly interested in 2BHK units." },
            
            new LeadAuditLog { Id = 5, LeadId = 3, ActivityIcon = "🎯", ActivityType = "Lead Created", PrevStage = "", NewStage = "New Lead", UserName = "System", Timestamp = new DateTime(2026, 7, 4, 14, 0, 0), Comments = "Lead created via Walk-in." },
            new LeadAuditLog { Id = 6, LeadId = 3, ActivityIcon = "📅", ActivityType = "Site Visit Scheduled", PrevStage = "New Lead", NewStage = "Site Visit Scheduled", UserName = "Priya M.", Timestamp = new DateTime(2026, 7, 5, 10, 0, 0), Comments = "Scheduled site visit to Tower A on 2026-07-10." },
            new LeadAuditLog { Id = 7, LeadId = 3, ActivityIcon = "✅", ActivityType = "Site Visit Completed", PrevStage = "Site Visit Scheduled", NewStage = "Site Visit Completed", UserName = "Priya M.", Timestamp = new DateTime(2026, 7, 6, 15, 30, 0), Comments = "Customer visited unit A-502. Layout liked." }
        );
    }
}
