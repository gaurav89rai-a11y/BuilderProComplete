using BuilderProAPI.Models;
using System;
using System.Threading.Tasks;

namespace BuilderProAPI.Repositories;

public interface IUnitOfWork : IDisposable
{
    IRepository<Project> Projects { get; }
    IRepository<Unit> Units { get; }
    IRepository<Lead> Leads { get; }
    IRepository<ChannelPartner> ChannelPartners { get; }
    IRepository<Customer> Customers { get; }
    IRepository<SiteVisit> SiteVisits { get; }
    IRepository<Booking> Bookings { get; }
    IRepository<Payment> Payments { get; }
    IRepository<Commission> Commissions { get; }
    IRepository<Document> Documents { get; }
    IRepository<ServiceTicket> ServiceTickets { get; }
    IRepository<User> Users { get; }
    IRepository<Employee> Employees { get; }
    IRepository<Attendance> Attendances { get; }
    IRepository<LeaveRequest> LeaveRequests { get; }
    IRepository<Order> Orders { get; }
    IRepository<OrderItem> OrderItems { get; }
    IRepository<SystemConfig> SystemConfigs { get; }
    IRepository<LeadAuditLog> LeadAuditLogs { get; }

    Task SaveAsync();
}
