using Microsoft.AspNetCore.Http;
using System;
using System.Text.Json;
using System.Threading.Tasks;

namespace BuilderProAPI.Middlewares;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;

    public ExceptionHandlingMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;

        // Log the actual technical error server-side for diagnostics
        Console.Error.WriteLine($"🔴 [ERROR] {DateTime.UtcNow}: {exception.ToString()}");

        string clientMessage = "An unexpected error occurred on the server.";
        
        // Check if the exception might contain database details
        var exceptionTypeName = exception.GetType().Name;
        if (exceptionTypeName.Contains("SqlException") || 
            exceptionTypeName.Contains("NpgsqlException") || 
            exceptionTypeName.Contains("DbUpdateException") ||
            exception.Message.Contains("database", StringComparison.OrdinalIgnoreCase) ||
            exception.Message.Contains("connection", StringComparison.OrdinalIgnoreCase))
        {
            clientMessage = "A database connection or query error occurred. Please verify database connectivity.";
        }

        var response = new
        {
            success = false,
            message = clientMessage,
            data = (object?)null,
            errors = new[] { clientMessage }
        };

        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        var json = JsonSerializer.Serialize(response, options);
        return context.Response.WriteAsync(json);
    }
}
