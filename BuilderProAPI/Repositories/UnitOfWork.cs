using BuilderProAPI.Data;
using BuilderProAPI.Models;
using System;
using System.Threading.Tasks;

namespace BuilderProAPI.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly BuilderProDbContext _db;

    public UnitOfWork(BuilderProDbContext db)
    {
        _db = db;
        Projects = new Repository<Project>(_db);
        Units = new Repository<Unit>(_db);
        Leads = new Repository<Lead>(_db);
        ChannelPartners = new Repository<ChannelPartner>(_db);
        Customers = new Repository<Customer>(_db);
        SiteVisits = new Repository<SiteVisit>(_db);
        Bookings = new Repository<Booking>(_db);
        Payments = new Repository<Payment>(_db);
        Commissions = new Repository<Commission>(_db);
        Documents = new Repository<Document>(_db);
        ServiceTickets = new Repository<ServiceTicket>(_db);
        Users = new Repository<User>(_db);
        Employees = new Repository<Employee>(_db);
        Attendances = new Repository<Attendance>(_db);
        LeaveRequests = new Repository<LeaveRequest>(_db);
        Orders = new Repository<Order>(_db);
        OrderItems = new Repository<OrderItem>(_db);
        SystemConfigs = new Repository<SystemConfig>(_db);
        LeadAuditLogs = new Repository<LeadAuditLog>(_db);
    }

    public IRepository<Project> Projects { get; private set; }
    public IRepository<Unit> Units { get; private set; }
    public IRepository<Lead> Leads { get; private set; }
    public IRepository<ChannelPartner> ChannelPartners { get; private set; }
    public IRepository<Customer> Customers { get; private set; }
    public IRepository<SiteVisit> SiteVisits { get; private set; }
    public IRepository<Booking> Bookings { get; private set; }
    public IRepository<Payment> Payments { get; private set; }
    public IRepository<Commission> Commissions { get; private set; }
    public IRepository<Document> Documents { get; private set; }
    public IRepository<ServiceTicket> ServiceTickets { get; private set; }
    public IRepository<User> Users { get; private set; }
    public IRepository<Employee> Employees { get; private set; }
    public IRepository<Attendance> Attendances { get; private set; }
    public IRepository<LeaveRequest> LeaveRequests { get; private set; }
    public IRepository<Order> Orders { get; private set; }
    public IRepository<OrderItem> OrderItems { get; private set; }
    public IRepository<SystemConfig> SystemConfigs { get; private set; }
    public IRepository<LeadAuditLog> LeadAuditLogs { get; private set; }

    public async Task SaveAsync()
    {
        await _db.SaveChangesAsync();
    }

    public void Dispose()
    {
        _db.Dispose();
    }
}
