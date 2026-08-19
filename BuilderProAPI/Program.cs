using Microsoft.EntityFrameworkCore;
using BuilderProAPI.Data;
using BuilderProAPI.Repositories;
using BuilderProAPI.Services;
using BuilderProAPI.Middlewares;
using System.Data;
using System.IO;
using System.Text.RegularExpressions;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c => {
    c.SwaggerDoc("v1", new() { Title = "BuilderPro API", Version = "v1", Description = "Real Estate ERP Platform API" });
});

// Database - use local SQL Server
builder.Services.AddDbContext<BuilderProDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    options.UseSqlServer(connectionString);
});

// Dependency Injection Scopes
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IBookingService, BookingService>();

// CORS - allow React frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();

// Global Exception Handler Middleware
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Auto migrate and seed on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<BuilderProDbContext>();
    try {
        db.Database.EnsureCreated();
        Console.WriteLine("✅ Database initialized successfully.");

        // Execute Material Master SQL script if tables don't exist
        try
        {
            var conn = db.Database.GetDbConnection();
            bool hasMaterialMaster = false;
            try
            {
                using (var cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT COUNT(*) FROM sysobjects WHERE name='material_master' AND xtype='U'";
                    if (conn.State != ConnectionState.Open) conn.Open();
                    var res = cmd.ExecuteScalar();
                    hasMaterialMaster = res != null && Convert.ToInt32(res) > 0;
                }
            }
            catch { }

            if (!hasMaterialMaster)
            {
                Console.WriteLine("📦 Creating Material Master and OMS Tables from SQL Setup Script...");
                string[] pathsToCheck = new string[]
                {
                    Path.Combine(Directory.GetCurrentDirectory(), "BuilderProComplete_MaterialMaster_5000.sql"),
                    Path.Combine(Directory.GetCurrentDirectory(), "..", "BuilderProComplete_MaterialMaster_5000.sql"),
                    Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "BuilderProComplete_MaterialMaster_5000.sql"),
                    Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "BuilderProComplete_MaterialMaster_5000.sql")
                };

                string sqlPath = null;
                foreach (var path in pathsToCheck)
                {
                    if (File.Exists(path))
                    {
                        sqlPath = path;
                        break;
                    }
                }

                if (sqlPath != null)
                {
                    string scriptContent = File.ReadAllText(sqlPath);
                    // Split the script by GO statement (case-insensitive, on new lines)
                    var batches = Regex.Split(
                        scriptContent,
                        @"^\s*GO\s*$",
                        RegexOptions.Multiline | RegexOptions.IgnoreCase
                    );

                    using (var cmd = conn.CreateCommand())
                    {
                        if (conn.State != ConnectionState.Open) conn.Open();
                        foreach (var batch in batches)
                        {
                            var sql = batch.Trim();
                            if (string.IsNullOrEmpty(sql)) continue;
                            
                            // Remove USE statement to avoid issues if DB is different
                            if (sql.StartsWith("USE ", StringComparison.OrdinalIgnoreCase)) continue;

                            cmd.CommandText = sql;
                            cmd.ExecuteNonQuery();
                        }
                    }
                    Console.WriteLine("✅ Material Master tables and 5,000+ items seeded successfully.");
                }
                else
                {
                    Console.WriteLine("⚠️ Material Master SQL setup script not found in any of the search paths.");
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"⚠️ Warning seeding Material Master tables: {ex.Message}");
        }
    } catch (Exception ex) {
        Console.WriteLine($"⚠️  DB initialization warning: {ex.Message}");
    }
}

app.UseSwagger();
app.UseSwaggerUI(c => {
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "BuilderPro API v1");
    c.RoutePrefix = "swagger";
});

app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

// Health check
app.MapGet("/", () => new { status = "BuilderPro API Running", version = "v2.4.1", timestamp = DateTime.UtcNow });
app.MapGet("/health", () => Results.Ok(new { healthy = true }));

app.Run();
