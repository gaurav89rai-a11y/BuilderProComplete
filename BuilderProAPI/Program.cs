using Microsoft.EntityFrameworkCore;
using BuilderProAPI.Data;
using BuilderProAPI.Repositories;
using BuilderProAPI.Services;
using BuilderProAPI.Middlewares;
using System.Data;
using System.IO;
using System.Text.RegularExpressions;
using Npgsql;

// Disable configuration reload on change to prevent inotify instance limits issues in Linux containers
Environment.SetEnvironmentVariable("DOTNET_HOSTBUILDER__RELOADCONFIGONCHANGE", "false");

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

// Database configuration with dynamic provider detection and URL parsing
string workingConnectionString = null;
bool isPostgres = false;

// 1. Try DATABASE_URL first if it is set and connectable
string dbUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
if (!string.IsNullOrEmpty(dbUrl))
{
    if (dbUrl.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) ||
        dbUrl.Contains("Host=") || dbUrl.Contains("Port=") || dbUrl.Contains("Username=") || dbUrl.Contains("SslMode="))
    {
        string pgConn = dbUrl.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) 
            ? ConvertPostgresUrlToConnectionString(dbUrl) 
            : dbUrl;
        try
        {
            using (var connection = new NpgsqlConnection(pgConn))
            {
                connection.Open();
                workingConnectionString = pgConn;
                isPostgres = true;
                Console.WriteLine("✅ Database connection test succeeded (DATABASE_URL - PostgreSQL).");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"ℹ️ DATABASE_URL (PostgreSQL) connection test failed: {ex.Message.Split('\n')[0].Trim()}");
        }
    }
    else
    {
        try
        {
            using (var connection = new Microsoft.Data.SqlClient.SqlConnection(dbUrl))
            {
                connection.Open();
                workingConnectionString = dbUrl;
                isPostgres = false;
                Console.WriteLine("✅ Database connection test succeeded (DATABASE_URL - SQL Server).");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"ℹ️ DATABASE_URL (SQL Server) connection test failed: {ex.Message.Split('\n')[0].Trim()}");
        }
    }
}

// 2. Try DefaultConnection from appsettings.json
if (workingConnectionString == null)
{
    string defaultConn = builder.Configuration.GetConnectionString("DefaultConnection");
    if (!string.IsNullOrEmpty(defaultConn))
    {
        try
        {
            using (var connection = new Microsoft.Data.SqlClient.SqlConnection(defaultConn))
            {
                connection.Open();
                workingConnectionString = defaultConn;
                isPostgres = false;
                Console.WriteLine($"✅ Database connection test succeeded (DefaultConnection - SQL Server): {defaultConn}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"ℹ️ DefaultConnection connection test failed: {ex.Message.Split('\n')[0].Trim()}");
        }
    }
}

// 3. Fallback to local SQL Server auto-discovery if no connection is established yet
if (workingConnectionString == null)
{
    var connectionStringsToTry = new List<string> {
        "Server=localhost\\SQLEXPRESS;Database=BuilderProDB;Trusted_Connection=True;TrustServerCertificate=True;Connect Timeout=2;",
        "Server=.\\SQLEXPRESS;Database=BuilderProDB;Trusted_Connection=True;TrustServerCertificate=True;Connect Timeout=2;",
        "Server=(localdb)\\MSSQLLocalDB;Database=BuilderProDB;Trusted_Connection=True;TrustServerCertificate=True;Connect Timeout=2;",
        "Server=localhost;Database=BuilderProDB;Trusted_Connection=True;TrustServerCertificate=True;Connect Timeout=2;"
    };

    foreach (var connStr in connectionStringsToTry)
    {
        try
        {
            using (var connection = new Microsoft.Data.SqlClient.SqlConnection(connStr))
            {
                connection.Open();
                workingConnectionString = connStr;
                isPostgres = false;
                Console.WriteLine($"✅ Local SQL Server auto-discovery succeeded: {connStr}");
                break;
            }
        }
        catch
        {
            // Ignore auto-discovery failures
        }
    }
}

if (workingConnectionString == null)
{
    workingConnectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
        ?? "Server=localhost\\SQLEXPRESS;Database=BuilderProDB;Trusted_Connection=True;TrustServerCertificate=True;";
    isPostgres = false;
    Console.WriteLine($"⚠️ No database connection succeeded. Falling back to default: {workingConnectionString}");
}

Console.WriteLine($"ℹ️ Active Database Provider: {(isPostgres ? "PostgreSQL" : "SQL Server")}");

builder.Services.AddDbContext<BuilderProDbContext>(options =>
{
    if (isPostgres)
    {
        options.UseNpgsql(workingConnectionString);
    }
    else
    {
        options.UseSqlServer(workingConnectionString);
    }
});

// Dependency Injection Scopes
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IBookingService, BookingService>();

// CORS - allow React frontend (restricted to production GitHub Pages and development localhosts)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var allowedOrigins = new List<string> { "https://gaurav89rai-a11y.github.io" };
        
        allowedOrigins.Add("http://localhost:5173");
        allowedOrigins.Add("http://localhost:3000");
        allowedOrigins.Add("https://localhost:5173");
        allowedOrigins.Add("http://127.0.0.1:5173");

        policy.WithOrigins(allowedOrigins.ToArray())
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Bind to the port provided by the hosting environment (e.g. Render) or default to 8080
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.UseUrls($"http://*:{port}");

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
            bool dbIsPostgres = conn.GetType().Name.Contains("Npgsql");

            try
            {
                using (var cmd = conn.CreateCommand())
                {
                    if (dbIsPostgres)
                    {
                        cmd.CommandText = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'dbo' AND table_name = 'material_master'";
                    }
                    else
                    {
                        cmd.CommandText = "SELECT COUNT(*) FROM sysobjects WHERE name='material_master' AND xtype='U'";
                    }
                    if (conn.State != ConnectionState.Open) conn.Open();
                    var res = cmd.ExecuteScalar();
                    hasMaterialMaster = res != null && Convert.ToInt32(res) > 0;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ℹ️ Table check warning: {ex.Message}");
            }

            if (!hasMaterialMaster)
            {
                string scriptFilename = dbIsPostgres 
                    ? "BuilderProComplete_MaterialMaster_5000_pg.sql" 
                    : "BuilderProComplete_MaterialMaster_5000.sql";

                Console.WriteLine($"📦 Creating Material Master and OMS Tables from {scriptFilename}...");
                string[] pathsToCheck = new string[]
                {
                    Path.Combine(Directory.GetCurrentDirectory(), scriptFilename),
                    Path.Combine(Directory.GetCurrentDirectory(), "..", scriptFilename),
                    Path.Combine(AppDomain.CurrentDomain.BaseDirectory, scriptFilename),
                    Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", scriptFilename)
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
                    if (dbIsPostgres)
                    {
                        // In PostgreSQL, execute the entire script as a single batch
                        using (var cmd = conn.CreateCommand())
                        {
                            cmd.CommandText = scriptContent;
                            if (conn.State != ConnectionState.Open) conn.Open();
                            cmd.ExecuteNonQuery();
                        }
                    }
                    else
                    {
                        // Split the script by GO statement (case-insensitive, on new lines) for SQL Server
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
                                
                                if (sql.StartsWith("USE ", StringComparison.OrdinalIgnoreCase)) continue;

                                cmd.CommandText = sql;
                                cmd.ExecuteNonQuery();
                            }
                        }
                    }
                    Console.WriteLine($"✅ Material Master tables and 5,000+ items seeded successfully ({(dbIsPostgres ? "PostgreSQL" : "SQL Server")}).");
                }
                else
                {
                    Console.WriteLine($"⚠️ Material Master SQL setup script ({scriptFilename}) not found in any of the search paths.");
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"⚠️ Warning seeding Material Master tables: {ex.Message}");
        }
    } catch (Exception ex) {
        Console.WriteLine($"⚠️ DB initialization warning: {ex.Message}");
    }
}

app.UseSwagger();
app.UseSwaggerUI(c => {
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "BuilderPro API v1");
    c.RoutePrefix = "swagger";
});

app.UseCors("AllowFrontend");
app.UseAuthorization();
app.MapControllers();

// Health check
app.MapGet("/", () => new { status = "BuilderPro API Running", version = "v2.4.1", timestamp = DateTime.UtcNow });
app.MapGet("/health", async (BuilderProDbContext db) => {
    bool databaseConnected = false;
    string errorMessage = null;
    try
    {
        databaseConnected = await db.Database.CanConnectAsync();
    }
    catch (Exception ex)
    {
        errorMessage = ex.Message;
        Console.Error.WriteLine($"⚠️ Health check database connection failed: {ex.Message}");
    }

    string connStr = db.Database.GetDbConnection()?.ConnectionString ?? "";
    string maskedConnStr = System.Text.RegularExpressions.Regex.Replace(
        connStr, 
        @"(Password|pwd|pwd|User ID|uid|User)=\s*[^;]+", 
        "$1=****", 
        System.Text.RegularExpressions.RegexOptions.IgnoreCase
    );

    return Results.Ok(new {
        healthy = true,
        database = databaseConnected ? "connected" : "disconnected",
        provider = db.Database.ProviderName,
        connectionString = maskedConnStr,
        error = errorMessage
    });
});

app.Run();

// Helper functions at the bottom of the file
static string ConvertPostgresUrlToConnectionString(string url)
{
    if (string.IsNullOrEmpty(url) || !url.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase))
    {
        return url;
    }

    try
    {
        var uri = new Uri(url);
        var userInfo = uri.UserInfo.Split(':');
        var username = userInfo[0];
        var password = userInfo.Length > 1 ? userInfo[1] : "";
        var host = uri.Host;
        var port = uri.Port > 0 ? uri.Port : 5432;
        var database = uri.AbsolutePath.TrimStart('/');

        return $"Host={host};Port={port};Database={database};Username={username};Password={password};SslMode=Require;Trust Server Certificate=true;";
    }
    catch (Exception ex)
    {
        Console.WriteLine($"⚠️ Error parsing PostgreSQL URL: {ex.Message}");
        return url;
    }
}
