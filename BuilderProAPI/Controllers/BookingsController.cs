using Microsoft.AspNetCore.Mvc;
using BuilderProAPI.Models;
using BuilderProAPI.Services;
using System.Threading.Tasks;

namespace BuilderProAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BookingsController : ControllerBase
{
    private readonly IBookingService _bookingService;
    public BookingsController(IBookingService bookingService) => _bookingService = bookingService;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status)
    {
        return Ok(await _bookingService.GetAllBookingsAsync(status));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var b = await _bookingService.GetBookingByIdAsync(id);
        if (b == null) return NotFound();
        return Ok(b);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Booking booking)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var created = await _bookingService.CreateBookingAsync(booking);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Booking booking)
    {
        if (id != booking.Id) return BadRequest();
        var updated = await _bookingService.UpdateBookingAsync(id, booking);
        if (updated == null) return NotFound();
        return Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await _bookingService.DeleteBookingAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        return Ok(await _bookingService.GetBookingStatsAsync());
    }
}
