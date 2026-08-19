using Microsoft.AspNetCore.Mvc;
using BuilderProAPI.Services;
using System.Threading.Tasks;

namespace BuilderProAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;
    public DashboardController(IDashboardService dashboardService) => _dashboardService = dashboardService;

    [HttpGet]
    public async Task<IActionResult> GetStats([FromQuery] int? projectId = null)
    {
        var stats = await _dashboardService.GetDashboardStatsAsync(projectId);
        if (stats == null)
            return NotFound(new { message = "Project not found" });
        return Ok(stats);
    }
}
