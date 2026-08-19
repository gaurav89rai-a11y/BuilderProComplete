using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BuilderProAPI.Data;
using BuilderProAPI.Models;
using System.Threading.Tasks;
using System.Linq;

namespace BuilderProAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SystemConfigsController : ControllerBase
{
    private readonly BuilderProDbContext _db;
    public SystemConfigsController(BuilderProDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var configs = await _db.SystemConfigs
            .OrderBy(c => c.SortOrder)
            .ToListAsync();

        var grouped = configs
            .GroupBy(c => c.Category)
            .ToDictionary(
                g => char.ToLower(g.Key[0]) + g.Key.Substring(1), // camelCase for JS frontend
                g => g.Select(c => new {
                    value = c.Value,
                    label = c.Label,
                    color = c.Color,
                    isDefault = c.IsDefault
                })
            );

        return Ok(grouped);
    }
}
