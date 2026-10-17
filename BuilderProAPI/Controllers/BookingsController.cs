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
    private readonly ILogger<BookingsController> _logger;

    public BookingsController(IBookingService bookingService, ILogger<BookingsController> logger)
    {
        _bookingService = bookingService;
        _logger = logger;
    }

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

    [HttpGet("{id}/agreement")]
    public async Task<IActionResult> DownloadAgreement(int id)
    {
        _logger.LogInformation("Agreement PDF download requested for booking ID: {BookingId}", id);
        try
        {
            var booking = await _bookingService.GetBookingByIdAsync(id);
            if (booking == null)
            {
                _logger.LogWarning("Booking with ID {BookingId} not found for agreement generation", id);
                return NotFound(new { message = $"Booking with ID {id} not found." });
            }

            var pdfBytes = await _bookingService.GenerateAgreementPdfAsync(id);
            if (pdfBytes == null || pdfBytes.Length == 0)
            {
                _logger.LogError("PDF generation returned null or empty byte array for booking ID {BookingId}", id);
                return StatusCode(500, new { message = "Failed to generate agreement PDF." });
            }

            var fileName = $"Agreement_{booking.BookingNumber}.pdf";
            _logger.LogInformation("Agreement PDF successfully generated for booking {BookingNumber} ({ByteCount} bytes)", booking.BookingNumber, pdfBytes.Length);
            return File(pdfBytes, "application/pdf", fileName);
        }
        catch (System.Exception ex)
        {
            _logger.LogError(ex, "Unexpected error generating agreement PDF for booking ID {BookingId}", id);
            return StatusCode(500, new { message = "An error occurred while generating the agreement PDF: " + ex.Message });
        }
    }
}
