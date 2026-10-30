using CricketBazar.Application;
using CricketBazar.Infrastructure;
using CricketBazar.Shared.Constants;
using Serilog;

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
    builder.Services.AddControllers();

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
    app.UseStaticFiles();

    app.UseCors("AllowAngular");

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
            const string adminUrl = "http://localhost:4200/admin/products";
            try
            {
                var psi = OperatingSystem.IsMacOS() ? new System.Diagnostics.ProcessStartInfo("open", adminUrl)
                    : OperatingSystem.IsLinux() ? new System.Diagnostics.ProcessStartInfo("xdg-open", adminUrl)
                    : new System.Diagnostics.ProcessStartInfo(adminUrl) { UseShellExecute = true };
                System.Diagnostics.Process.Start(psi);
            }
            catch (Exception ex)
            {
                Log.Warning(ex, "Could not open the browser. Visit {Url}", adminUrl);
            }
        });
    }

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
