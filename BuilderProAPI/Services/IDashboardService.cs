using System.Threading.Tasks;

namespace BuilderProAPI.Services;

public interface IDashboardService
{
    Task<object?> GetDashboardStatsAsync(int? projectId);
}
