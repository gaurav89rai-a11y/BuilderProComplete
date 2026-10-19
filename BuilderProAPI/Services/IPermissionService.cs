using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using BuilderProAPI.Models;

namespace BuilderProAPI.Services;

public interface IPermissionService
{
    Task<User?> GetCurrentUserAsync(HttpContext context);
    Task<bool> HasPermissionAsync(User user, string permissionCode);
    Task<List<string>> GetEffectivePermissionsAsync(int userId);
    Task<Dictionary<string, bool>> GetEffectivePermissionMapAsync(int userId);
    Task<bool> CanAccessRecordAsync<T>(User user, T record, string operation);
    Task LogAuditAsync(int? changedByUserId, string changedByName, string targetType, int targetId, string targetName, string permissionCode, string prevState, string newState, string? reason);
}
