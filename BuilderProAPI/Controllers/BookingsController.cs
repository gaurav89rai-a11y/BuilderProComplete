using Microsoft.AspNetCore.Mvc;
using BuilderProAPI.Models;
using BuilderProAPI.Services;
using BuilderProAPI.Middlewares;
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
    [RequirePermission("crm.bookings.view")]
    public async Task<IActionResult> GetAll([FromQuery] string? status, [FromQuery] int? channelPartnerId)
    {
        var role = Request.Headers["X-User-Role"].FirstOrDefault();
        var cpHeader = Request.Headers["X-Channel-Partner-Id"].FirstOrDefault();
        var userIdHeader = Request.Headers["X-User-Id"].FirstOrDefault();
        var userNameHeader = Request.Headers["X-User-Name"].FirstOrDefault();
        int? userId = int.TryParse(userIdHeader, out int uid) ? uid : null;

        int? cpId = channelPartnerId;
        if (!cpId.HasValue && int.TryParse(cpHeader, out int parsedCp)) cpId = parsedCp;

        return Ok(await _bookingService.GetAllBookingsAsync(status, cpId, role, userId, userNameHeader));
    }

    [HttpGet("{id}")]
    [RequirePermission("crm.bookings.view")]
    public async Task<IActionResult> GetById(int id)
    {
        var role = Request.Headers["X-User-Role"].FirstOrDefault();
        var cpHeader = Request.Headers["X-Channel-Partner-Id"].FirstOrDefault();
        var userIdHeader = Request.Headers["X-User-Id"].FirstOrDefault();
        var userNameHeader = Request.Headers["X-User-Name"].FirstOrDefault();
        int? userId = int.TryParse(userIdHeader, out int uid) ? uid : null;

        int? cpId = null;
        if (int.TryParse(cpHeader, out int parsedCp)) cpId = parsedCp;

        var b = await _bookingService.GetBookingByIdAsync(id, cpId, role, userId, userNameHeader);
        if (b == null) return NotFound();
        return Ok(b);
    }

    [HttpPost]
    [RequirePermission("crm.bookings.create")]
    public async Task<IActionResult> Create([FromBody] Booking booking)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        try
        {
            var created = await _bookingService.CreateBookingAsync(booking);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    [RequirePermission("crm.bookings.edit")]
    public async Task<IActionResult> Update(int id, [FromBody] Booking booking)
    {
        if (id != booking.Id) return BadRequest();
        var role = Request.Headers["X-User-Role"].FirstOrDefault();
        var cpHeader = Request.Headers["X-Channel-Partner-Id"].FirstOrDefault();
        var userIdHeader = Request.Headers["X-User-Id"].FirstOrDefault();
        var userNameHeader = Request.Headers["X-User-Name"].FirstOrDefault();
        int? userId = int.TryParse(userIdHeader, out int uid) ? uid : null;

        int? cpId = null;
        if (int.TryParse(cpHeader, out int parsedCp)) cpId = parsedCp;

        try
        {
            var updated = await _bookingService.UpdateBookingAsync(id, booking, cpId, role, userId, userNameHeader);
            if (updated == null) return NotFound();
            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpDelete("{id}")]
    [RequirePermission("crm.bookings.delete")]
    public async Task<IActionResult> Delete(int id)
    {
        var role = Request.Headers["X-User-Role"].FirstOrDefault();
        var success = await _bookingService.DeleteBookingAsync(id, role);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpGet("stats")]
    [RequirePermission("crm.bookings.view")]
    public async Task<IActionResult> GetStats()
    {
        return Ok(await _bookingService.GetBookingStatsAsync());
    }

    [HttpPost("{id}/agreement/upload")]
    [RequirePermission("crm.bookings.upload_download")]
    [RequestSizeLimit(30 * 1024 * 1024)] // 30 MB limit
    public async Task<IActionResult> UploadAgreement(int id, IFormFile file)
    {
        _logger.LogInformation("Agreement upload requested for booking ID: {BookingId}", id);
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "No file was provided." });
        }

        var booking = await _bookingService.GetBookingByIdAsync(id);
        if (booking == null)
        {
            return NotFound(new { message = $"Booking with ID {id} not found." });
        }

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var allowedExtensions = new[] { ".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png" };
        if (!allowedExtensions.Contains(ext))
        {
            return BadRequest(new { message = "Only PDF, Word, and Image files (.pdf, .doc, .docx, .jpg, .png) are permitted." });
        }

        try
        {
            // Secure storage path outside web root
            var storageDir = Path.Combine(AppContext.BaseDirectory, "Storage", "Agreements");
            if (!Directory.Exists(storageDir))
            {
                Directory.CreateDirectory(storageDir);
            }

            // Remove existing file if present
            if (!string.IsNullOrEmpty(booking.AgreementPath) && System.IO.File.Exists(booking.AgreementPath))
            {
                try { System.IO.File.Delete(booking.AgreementPath); } catch { }
            }

            // Generate sanitized unique file name
            var safeBookingNo = string.Join("_", booking.BookingNumber.Split(Path.GetInvalidFileNameChars()));
            var uniqueFileName = $"Agreement_{safeBookingNo}_{Guid.NewGuid():N}{ext}";
            var fullPath = Path.Combine(storageDir, uniqueFileName);

            using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            booking.AgreementPath = fullPath;
            booking.AgreementFileName = Path.GetFileName(file.FileName);
            booking.AgreementUploadedAt = DateTime.UtcNow;
            if (booking.Status == "Agreement Pending" || booking.Status == "Confirmed")
            {
                booking.Status = "Agreement Signed";
            }

            await _bookingService.UpdateBookingAsync(id, booking);
            _logger.LogInformation("Agreement uploaded successfully for booking {BookingNumber}", booking.BookingNumber);

            return Ok(new
            {
                message = "Agreement uploaded successfully.",
                fileName = booking.AgreementFileName,
                uploadedAt = booking.AgreementUploadedAt,
                status = booking.Status
            });
        }
        catch (System.Exception ex)
        {
            _logger.LogError(ex, "Error uploading agreement for booking ID {BookingId}", id);
            return StatusCode(500, new { message = "Error uploading agreement: " + ex.Message });
        }
    }

    [HttpGet("{id}/agreement/view")]
    [RequirePermission("crm.bookings.view")]
    public async Task<IActionResult> ViewAgreement(int id)
    {
        var booking = await _bookingService.GetBookingByIdAsync(id);
        if (booking == null) return NotFound(new { message = $"Booking with ID {id} not found." });

        if (!string.IsNullOrEmpty(booking.AgreementPath) && System.IO.File.Exists(booking.AgreementPath))
        {
            var ext = Path.GetExtension(booking.AgreementPath).ToLowerInvariant();
            var contentType = ext switch
            {
                ".pdf" => "application/pdf",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".doc" => "application/msword",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                _ => "application/octet-stream"
            };

            Response.Headers["Content-Disposition"] = $"inline; filename=\"{booking.AgreementFileName ?? "agreement" + ext}\"";
            return PhysicalFile(booking.AgreementPath, contentType);
        }

        // Fallback to generated PDF view
        var pdfBytes = await _bookingService.GenerateAgreementPdfAsync(id);
        if (pdfBytes != null && pdfBytes.Length > 0)
        {
            Response.Headers["Content-Disposition"] = $"inline; filename=\"Agreement_{booking.BookingNumber}.pdf\"";
            return File(pdfBytes, "application/pdf");
        }

        return NotFound(new { message = "No agreement found for this booking." });
    }

    [HttpDelete("{id}/agreement")]
    [RequirePermission("crm.bookings.delete")]
    public async Task<IActionResult> DeleteAgreement(int id)
    {
        var booking = await _bookingService.GetBookingByIdAsync(id);
        if (booking == null) return NotFound(new { message = $"Booking with ID {id} not found." });

        if (!string.IsNullOrEmpty(booking.AgreementPath) && System.IO.File.Exists(booking.AgreementPath))
        {
            try { System.IO.File.Delete(booking.AgreementPath); } catch { }
        }

        booking.AgreementPath = null;
        booking.AgreementFileName = null;
        booking.AgreementUploadedAt = null;
        await _bookingService.UpdateBookingAsync(id, booking);

        return Ok(new { message = "Uploaded agreement removed successfully." });
    }

    [HttpGet("{id}/agreement")]
    [RequirePermission("crm.bookings.upload_download")]
    public async Task<IActionResult> DownloadAgreement(int id)
    {
        _logger.LogInformation("Agreement download requested for booking ID: {BookingId}", id);
        try
        {
            var booking = await _bookingService.GetBookingByIdAsync(id);
            if (booking == null)
            {
                _logger.LogWarning("Booking with ID {BookingId} not found", id);
                return NotFound(new { message = $"Booking with ID {id} not found." });
            }

            // If an uploaded agreement exists, return that file directly
            if (!string.IsNullOrEmpty(booking.AgreementPath) && System.IO.File.Exists(booking.AgreementPath))
            {
                var ext = Path.GetExtension(booking.AgreementPath).ToLowerInvariant();
                var contentType = ext switch
                {
                    ".pdf" => "application/pdf",
                    ".jpg" or ".jpeg" => "image/jpeg",
                    ".png" => "image/png",
                    ".doc" => "application/msword",
                    ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    _ => "application/octet-stream"
                };

                var dlName = booking.AgreementFileName ?? $"Agreement_{booking.BookingNumber}{ext}";
                return PhysicalFile(booking.AgreementPath, contentType, dlName);
            }

            // Otherwise, generate agreement via report service
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
