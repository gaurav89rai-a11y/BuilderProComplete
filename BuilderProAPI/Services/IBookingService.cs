using BuilderProAPI.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BuilderProAPI.Services;

public interface IBookingService
{
    Task<IEnumerable<Booking>> GetAllBookingsAsync(string? status, int? channelPartnerId = null, string? role = null, int? userId = null, string? userName = null);
    Task<Booking?> GetBookingByIdAsync(int id, int? channelPartnerId = null, string? role = null, int? userId = null, string? userName = null);
    Task<Booking> CreateBookingAsync(Booking booking);
    Task<Booking?> UpdateBookingAsync(int id, Booking booking, int? channelPartnerId = null, string? role = null, int? userId = null, string? userName = null);
    Task<bool> DeleteBookingAsync(int id, string? role = null);
    Task<object> GetBookingStatsAsync();
    Task<byte[]?> GenerateAgreementPdfAsync(int id);
}
