using BuilderProAPI.Repositories;
using BuilderProAPI.Models;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BuilderProAPI.Services;

public class BookingService : IBookingService
{
    private readonly IUnitOfWork _uow;
    private readonly ISSRSReportService? _ssrsReportService;
    private readonly ILogger<BookingService>? _logger;

    public BookingService(IUnitOfWork uow, ISSRSReportService? ssrsReportService = null, ILogger<BookingService>? logger = null)
    {
        _uow = uow;
        _ssrsReportService = ssrsReportService;
        _logger = logger;
    }

    public async Task<IEnumerable<Booking>> GetAllBookingsAsync(string? status)
    {
        return await _uow.Bookings.GetAllAsync(
            b => string.IsNullOrEmpty(status) || b.Status == status,
            orderBy: q => q.OrderByDescending(b => b.BookingDate),
            includeProperties: "Customer,Customer.Project,Unit,Unit.Project,Agent"
        );
    }

    public async Task<Booking?> GetBookingByIdAsync(int id)
    {
        return await _uow.Bookings.GetFirstOrDefaultAsync(
            x => x.Id == id,
            includeProperties: "Customer,Customer.Project,Unit,Unit.Project,Agent"
        );
    }

    public async Task<Booking> CreateBookingAsync(Booking booking)
    {
        booking.CreatedAt = DateTime.UtcNow;
        var all = await _uow.Bookings.GetAllAsync();
        var count = all.Count();
        booking.BookingNumber = $"BK{DateTime.Now.Year}{(count + 1):D3}";
        
        // Resolve Agent
        if (booking.AgentId.HasValue)
        {
            var user = await _uow.Users.GetByIdAsync(booking.AgentId.Value);
            if (user != null && string.IsNullOrEmpty(booking.AssignedAgent))
            {
                booking.AssignedAgent = user.Name;
            }
        }
        else if (!string.IsNullOrEmpty(booking.AssignedAgent))
        {
            if (int.TryParse(booking.AssignedAgent, out int parsedId))
            {
                booking.AgentId = parsedId;
                var user = await _uow.Users.GetByIdAsync(parsedId);
                if (user != null) booking.AssignedAgent = user.Name;
            }
            else
            {
                var user = (await _uow.Users.GetAllAsync(u => u.Name == booking.AssignedAgent)).FirstOrDefault();
                if (user != null) booking.AgentId = user.Id;
            }
        }

        // Validate flat availability to prevent duplicate bookings and concurrent booking conflicts
        var unit = await _uow.Units.GetByIdAsync(booking.UnitId);
        if (unit == null)
        {
            throw new InvalidOperationException($"Unit with ID {booking.UnitId} does not exist.");
        }
        if (unit.Status == "Sold" || unit.Status == "Booked")
        {
            throw new InvalidOperationException($"Flat {unit.UnitNumber} is no longer available (Status: {unit.Status}).");
        }
        var activeBooking = (await _uow.Bookings.GetAllAsync(b => b.UnitId == booking.UnitId && b.Status != "Cancelled")).FirstOrDefault();
        if (activeBooking != null)
        {
            throw new InvalidOperationException($"Flat {unit.UnitNumber} already has an active booking ({activeBooking.BookingNumber}).");
        }

        await _uow.Bookings.AddAsync(booking);

        // Mark unit as booked
        var bookedStatus = (await _uow.SystemConfigs.GetAllAsync(c => c.Category == "SystemSetting" && c.Value == "BookedUnitStatus")).Select(c => c.Label).FirstOrDefault()
                           ?? (await _uow.SystemConfigs.GetAllAsync(c => c.Category == "UnitStatus" && c.Value == "Booked")).Select(c => c.Value).FirstOrDefault()
                           ?? "Booked";
        unit.Status = bookedStatus;
        _uow.Units.Update(unit);

        // Link to customer and sync details (Unit, Project, TotalAmount, Token Paid)
        var customer = await _uow.Customers.GetFirstOrDefaultAsync(c => c.Id == booking.CustomerId, includeProperties: "Project");
        if (customer != null)
        {
            customer.UnitNumber = unit.UnitNumber;
            customer.ProjectId = unit.ProjectId;
            customer.TotalAmount = booking.TotalAmount;
            if (customer.PaidAmount == 0)
            {
                customer.PaidAmount = booking.TokenAmount;
            }
            customer.Status = "Active";
            _uow.Customers.Update(customer);

            // Link to lead if matching customer email/phone exists
            var lead = (await _uow.Leads.GetAllAsync(l => l.Email == customer.Email || l.Phone == customer.Phone)).FirstOrDefault();
            if (lead != null)
            {
                var bookedStage = (await _uow.SystemConfigs.GetAllAsync(c => c.Category == "SystemSetting" && c.Value == "BookedLeadStage")).Select(c => c.Label).FirstOrDefault()
                                   ?? (await _uow.SystemConfigs.GetAllAsync(c => c.Category == "LeadStage" && c.Value == "Booking Confirmed")).Select(c => c.Value).FirstOrDefault()
                                   ?? "Booking Confirmed";
                var prevStage = lead.Stage;
                lead.Stage = bookedStage;
                lead.UnitId = unit.Id;
                lead.FlatNo = unit.UnitNumber;
                lead.ProjectId = unit.ProjectId;
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
        var prevStatus = existing.Status;
        existing.Status = booking.Status;
        existing.TokenAmount = booking.TokenAmount;

        if (booking.Status == "Cancelled" && prevStatus != "Cancelled")
        {
            var unit = await _uow.Units.GetByIdAsync(existing.UnitId);
            if (unit != null && unit.Status == "Booked")
            {
                unit.Status = "Available";
                _uow.Units.Update(unit);
            }
        }

        // Resolve Agent
        if (booking.AgentId.HasValue)
        {
            existing.AgentId = booking.AgentId;
            var user = await _uow.Users.GetByIdAsync(booking.AgentId.Value);
            if (user != null) existing.AssignedAgent = user.Name;
            else if (!string.IsNullOrEmpty(booking.AssignedAgent)) existing.AssignedAgent = booking.AssignedAgent;
        }
        else if (!string.IsNullOrEmpty(booking.AssignedAgent))
        {
            if (int.TryParse(booking.AssignedAgent, out int parsedId))
            {
                existing.AgentId = parsedId;
                var user = await _uow.Users.GetByIdAsync(parsedId);
                if (user != null) existing.AssignedAgent = user.Name;
                else existing.AssignedAgent = booking.AssignedAgent;
            }
            else
            {
                existing.AssignedAgent = booking.AssignedAgent;
                var user = (await _uow.Users.GetAllAsync(u => u.Name == booking.AssignedAgent)).FirstOrDefault();
                if (user != null) existing.AgentId = user.Id;
            }
        }

        if (!string.IsNullOrEmpty(booking.AgreementPath))
        {
            existing.AgreementPath = booking.AgreementPath;
            existing.AgreementFileName = booking.AgreementFileName;
            existing.AgreementUploadedAt = booking.AgreementUploadedAt;
        }

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

    public async Task<byte[]?> GenerateAgreementPdfAsync(int id)
    {
        var booking = await _uow.Bookings.GetFirstOrDefaultAsync(
            x => x.Id == id,
            includeProperties: "Customer,Customer.Project,Unit,Unit.Project"
        );
        if (booking == null) return null;

        // 1. Generate via Microsoft RDLC SSRS LocalReport engine
        try
        {
            _logger?.LogInformation("Generating agreement PDF using Microsoft RDLC format for booking {BookingNumber}", booking.BookingNumber);
            var rdlcBytes = RdlcReportService.GenerateAgreementPdf(booking);
            if (rdlcBytes != null && rdlcBytes.Length > 0)
            {
                _logger?.LogInformation("Successfully generated agreement PDF from RDLC report ({ByteCount} bytes)", rdlcBytes.Length);
                return rdlcBytes;
            }
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "RDLC report generation failed for booking {BookingNumber}. Attempting alternative engines.", booking.BookingNumber);
        }

        // 2. Attempt rendering via SSRS Report Server if available
        if (_ssrsReportService != null)
        {
            try
            {
                var ssrsBytes = await _ssrsReportService.RenderReportPdfAsync(booking);
                if (ssrsBytes != null && ssrsBytes.Length > 0)
                {
                    _logger?.LogInformation("Successfully generated agreement PDF from SSRS Report Server for booking {BookingNumber}", booking.BookingNumber);
                    return ssrsBytes;
                }
            }
            catch (Exception ex)
            {
                _logger?.LogWarning(ex, "SSRS rendering failed for booking {BookingNumber}.", booking.BookingNumber);
            }
        }

        // 3. Fallback to embedded agreement generator
        _logger?.LogInformation("Using fallback agreement generator for booking {BookingNumber}", booking.BookingNumber);
        return AgreementReportService.GenerateAgreementPdf(booking);
    }
}
