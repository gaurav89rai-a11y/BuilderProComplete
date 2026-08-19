using BuilderProAPI.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BuilderProAPI.Services;

public interface IBookingService
{
    Task<IEnumerable<Booking>> GetAllBookingsAsync(string? status);
    Task<Booking?> GetBookingByIdAsync(int id);
    Task<Booking> CreateBookingAsync(Booking booking);
    Task<Booking?> UpdateBookingAsync(int id, Booking booking);
    Task<bool> DeleteBookingAsync(int id);
    Task<object> GetBookingStatsAsync();
}
