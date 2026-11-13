using CricketBazar.Application;
using CricketBazar.Infrastructure;
using CricketBazar.Shared.Constants;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.RateLimiting;
using Serilog;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// Serilog Configuration
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Debug()
    .WriteTo.Console()
    .WriteTo.File("logs/app-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

try
{
    Log.Information("Starting Cricket Bazar API...");

    // Add services to the container
    builder.Services.AddControllersWithViews();
    builder.Services.AddAntiforgery(options =>
    {
        options.HeaderName = "X-CSRF-TOKEN";
        options.Cookie.Name = "CricBazar.Antiforgery";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Strict;
        options.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
            ? CookieSecurePolicy.SameAsRequest
            : CookieSecurePolicy.Always;
    });
    builder.Services
        .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
        .AddCookie(options =>
        {
            options.Cookie.Name = "CricBazar.CustomerSession";
            options.Cookie.HttpOnly = true;
            options.Cookie.SameSite = SameSiteMode.Strict;
            options.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
                ? CookieSecurePolicy.SameAsRequest
                : CookieSecurePolicy.Always;
            options.ExpireTimeSpan = TimeSpan.FromHours(12);
            options.SlidingExpiration = true;
            options.Events.OnRedirectToLogin = context =>
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                return Task.CompletedTask;
            };
            options.Events.OnRedirectToAccessDenied = context =>
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                return Task.CompletedTask;
            };
        });
    builder.Services.AddRateLimiter(options =>
    {
        options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
        options.AddPolicy("CustomerAccountAuth", context =>
            RateLimitPartition.GetFixedWindowLimiter(
                context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 10,
                    Window = TimeSpan.FromMinutes(1),
                    QueueLimit = 0,
                    AutoReplenishment = true
                }));
    });

    // CORS Configuration
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowAngular", policy =>
        {
            policy.WithOrigins("http://localhost:4200", "http://localhost:3000")
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        });
    });

    // Swagger/OpenAPI
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
        {
            Title = "Cricket Bazar API",
            Version = "v1",
            Description = "E-commerce API for Cricket Equipment",
            Contact = new Microsoft.OpenApi.Models.OpenApiContact
            {
                Name = "Development Team",
                Email = "dev@cricketbazar.com"
            }
        });

        // Include XML comments from controllers
        var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
        var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
        if (File.Exists(xmlPath))
        {
            c.IncludeXmlComments(xmlPath);
        }
    });

    // Add Application Services
    builder.Services.AddApplicationServices();

    // Add Infrastructure Services
    builder.Services.AddInfrastructureServices(builder.Configuration);

    var app = builder.Build();

    // Configure the HTTP request pipeline
    // Enable Swagger in all environments for development
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Cricket Bazar API v1");
        c.RoutePrefix = "swagger";
    });

    app.UseHttpsRedirection();

    // Serves uploaded files (e.g. brand logos) from wwwroot
    app.UseStaticFiles(new StaticFileOptions
    {
        OnPrepareResponse = context =>
        {
            if (context.Context.Request.Path.StartsWithSegments("/uploads/products") &&
                context.Context.Response.ContentType?.StartsWith("image/", StringComparison.OrdinalIgnoreCase) == true)
            {
                context.Context.Response.Headers.CacheControl = "public, max-age=86400";
            }
        }
    });

    app.UseCors("AllowAngular");

    app.UseRateLimiter();
    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers();

    // Health check endpoint
    app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }))
        .WithName("HealthCheck");

    // API Version endpoint
    app.MapGet("/api/version", () => Results.Ok(new { version = ApiConstants.ApiVersion }))
        .WithName("ApiVersion");

    // Open the Angular admin page automatically once the API is up (dev only)
    if (app.Environment.IsDevelopment())
    {
        app.Lifetime.ApplicationStarted.Register(() =>
        {
            try
            {
                var addresses = app.Services.GetRequiredService<IServer>().Features.Get<IServerAddressesFeature>()?.Addresses;
                var address = addresses?.FirstOrDefault();
                if (address is null)
                {
                    Log.Warning("Could not determine the API address. Visit http://localhost:4200/admin/products");
                    return;
                }
                var url = new UriBuilder(address) { Path = "/" };
                if (url.Host is "0.0.0.0" or "[::]" or "*" or "+") url.Host = "localhost";
                var launchUrl = url.Uri.ToString();
                var psi = OperatingSystem.IsMacOS() ? new System.Diagnostics.ProcessStartInfo("open", launchUrl)
                    : OperatingSystem.IsLinux() ? new System.Diagnostics.ProcessStartInfo("xdg-open", launchUrl)
                    : new System.Diagnostics.ProcessStartInfo(launchUrl) { UseShellExecute = true };
                System.Diagnostics.Process.Start(psi);
            }
            catch (Exception ex)
            {
                Log.Warning(ex, "Could not open the browser. Visit http://localhost:4200/admin/products");
            }
        });
    }

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
    Environment.ExitCode = 1;
}
finally
{
    Log.CloseAndFlush();
}

public partial class Program { }
