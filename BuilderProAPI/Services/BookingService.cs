using BuilderProAPI.Repositories;
using BuilderProAPI.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BuilderProAPI.Services;

public class BookingService : IBookingService
{
    private readonly IUnitOfWork _uow;

    public BookingService(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<IEnumerable<Booking>> GetAllBookingsAsync(string? status)
    {
        return await _uow.Bookings.GetAllAsync(
            b => string.IsNullOrEmpty(status) || b.Status == status,
            orderBy: q => q.OrderByDescending(b => b.BookingDate),
            includeProperties: "Customer,Customer.Project,Unit"
        );
    }

    public async Task<Booking?> GetBookingByIdAsync(int id)
    {
        return await _uow.Bookings.GetFirstOrDefaultAsync(
            x => x.Id == id,
            includeProperties: "Customer,Customer.Project,Unit"
        );
    }

    public async Task<Booking> CreateBookingAsync(Booking booking)
    {
        booking.CreatedAt = DateTime.UtcNow;
        var all = await _uow.Bookings.GetAllAsync();
        var count = all.Count();
        booking.BookingNumber = $"BK{DateTime.Now.Year}{(count + 1):D3}";
        
        await _uow.Bookings.AddAsync(booking);

        // Mark unit as booked
        var unit = await _uow.Units.GetByIdAsync(booking.UnitId);
        if (unit != null)
        {
            var bookedStatus = (await _uow.SystemConfigs.GetAllAsync(c => c.Category == "SystemSetting" && c.Value == "BookedUnitStatus")).Select(c => c.Label).FirstOrDefault()
                               ?? (await _uow.SystemConfigs.GetAllAsync(c => c.Category == "UnitStatus" && c.Value == "Booked")).Select(c => c.Value).FirstOrDefault()
                               ?? "";
            unit.Status = bookedStatus;
            _uow.Units.Update(unit);
        }

        // Link to lead if matching customer email/phone exists
        var customer = await _uow.Customers.GetFirstOrDefaultAsync(c => c.Id == booking.CustomerId, includeProperties: "Project");
        if (customer != null)
        {
            var lead = (await _uow.Leads.GetAllAsync(l => l.Email == customer.Email || l.Phone == customer.Phone)).FirstOrDefault();
            if (lead != null)
            {
                var bookedStage = (await _uow.SystemConfigs.GetAllAsync(c => c.Category == "LeadStage" && (c.Value == "Booking" || c.Value == "Booked"))).Select(c => c.Value).FirstOrDefault() ?? "Booking";
                var prevStage = lead.Stage;
                lead.Stage = bookedStage;
                _uow.Leads.Update(lead);

                await _uow.LeadAuditLogs.AddAsync(new LeadAuditLog
                {
                    LeadId = lead.Id,
                    ActivityIcon = "🏠",
                    ActivityType = "Booking Created",
                    PrevStage = prevStage,
                    NewStage = bookedStage,
                    UserName = booking.AssignedAgent ?? "System",
                    Timestamp = DateTime.UtcNow,
                    Comments = $"Booking #{booking.BookingNumber} created for unit {unit?.UnitNumber} (Project: {customer.Project?.Name ?? "General"}) with token amount {booking.TokenAmount:C}."
                });
            }
        }

        await _uow.SaveAsync();
        return booking;
    }

    public async Task<Booking?> UpdateBookingAsync(int id, Booking booking)
    {
        var existing = await _uow.Bookings.GetByIdAsync(id);
        if (existing == null) return null;

        existing.Status = booking.Status;
        existing.AssignedAgent = booking.AssignedAgent;
        existing.TokenAmount = booking.TokenAmount;

        _uow.Bookings.Update(existing);
        await _uow.SaveAsync();
        return existing;
    }

    public async Task<bool> DeleteBookingAsync(int id)
    {
        var b = await _uow.Bookings.GetByIdAsync(id);
        if (b == null) return false;

        _uow.Bookings.Remove(b);
        await _uow.SaveAsync();
        return true;
    }

    public async Task<object> GetBookingStatsAsync()
    {
        var all = await _uow.Bookings.GetAllAsync();
        var confirmedStatus = (await _uow.SystemConfigs.GetAllAsync(c => c.Category == "SystemSetting" && c.Value == "ConfirmedBookingStatus")).Select(c => c.Label).FirstOrDefault()
                              ?? (await _uow.SystemConfigs.GetAllAsync(c => c.Category == "BookingStatus" && c.Value == "Confirmed")).Select(c => c.Value).FirstOrDefault()
                              ?? "";
        var signedStatus = (await _uow.SystemConfigs.GetAllAsync(c => c.Category == "SystemSetting" && c.Value == "SignedBookingStatus")).Select(c => c.Label).FirstOrDefault()
                           ?? (await _uow.SystemConfigs.GetAllAsync(c => c.Category == "BookingStatus" && c.Value == "Agreement Signed")).Select(c => c.Value).FirstOrDefault()
                           ?? "";

        var stats = new {
            TotalBookings = all.Count(),
            TotalValue = all.Sum(b => b.TotalAmount),
            Confirmed = all.Count(b => b.Status == confirmedStatus),
            AgreementSigned = all.Count(b => b.Status == signedStatus),
        };
        return stats;
    }
}
