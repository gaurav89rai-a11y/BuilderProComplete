using System.Threading.Tasks;
using BuilderProAPI.Models;

namespace BuilderProAPI.Services;

public interface ISSRSReportService
{
    Task<byte[]?> RenderReportPdfAsync(Booking booking);
}
