using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;
using BuilderProAPI.Services;

namespace BuilderProAPI.Middlewares;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true, Inherited = true)]
public class RequirePermissionAttribute : Attribute, IAsyncActionFilter
{
    private readonly string _permissionCode;

    public RequirePermissionAttribute(string permissionCode)
    {
        _permissionCode = permissionCode;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var permissionService = context.HttpContext.RequestServices.GetRequiredService<IPermissionService>();
        var currentUser = await permissionService.GetCurrentUserAsync(context.HttpContext);

        if (currentUser == null)
        {
            context.Result = new ObjectResult(new
            {
                error = "Unauthenticated",
                message = "Valid user identity is required to perform this action. Missing or invalid user headers."
            })
            {
                StatusCode = StatusCodes.Status401Unauthorized
            };
            return;
        }

        bool hasAccess = await permissionService.HasPermissionAsync(currentUser, _permissionCode);
        if (!hasAccess)
        {
            context.Result = new ObjectResult(new
            {
                error = "Forbidden",
                message = $"Access denied. Your role or account lacks the required permission: '{_permissionCode}'.",
                requiredPermission = _permissionCode,
                user = currentUser.Name,
                role = currentUser.UserRole?.Name ?? currentUser.Role
            })
            {
                StatusCode = StatusCodes.Status403Forbidden
            };
            return;
        }

        context.HttpContext.Items["CurrentUser"] = currentUser;
        await next();
    }
}
