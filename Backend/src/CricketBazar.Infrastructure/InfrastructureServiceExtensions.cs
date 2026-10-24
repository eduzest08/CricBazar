namespace CricketBazar.Infrastructure;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using CricketBazar.Domain.Interfaces;
using Data;
using Repositories;

public static class InfrastructureServiceExtensions
{
    /// <summary>
    /// Adds infrastructure services including Dapper repositories and SQL connection factory.
    /// Supports both SQL Server connection string from configuration and Azure Key Vault.
    /// </summary>
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Register SQL Connection Factory for Dapper
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrEmpty(connectionString))
            throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured");

        services.AddSingleton<ISqlConnectionFactory>(new SqlConnectionFactory(connectionString));

        // Register Dapper Repositories
        services.AddScoped<IProductRepository, DapperProductRepository>();
        services.AddScoped<ICategoryRepository, DapperCategoryRepository>();
        services.AddScoped<IBrandRepository, DapperBrandRepository>();
        services.AddScoped<IReviewRepository, DapperReviewRepository>();
        services.AddScoped<IUserRepository, DapperUserRepository>();
        services.AddScoped<ICartRepository, DapperCartRepository>();
        services.AddScoped<IOrderRepository, DapperOrderRepository>();
        services.AddScoped<IWishlistRepository, DapperWishlistRepository>();
        services.AddScoped<ICustomBatRequestRepository, DapperCustomBatRequestRepository>();

        return services;
    }

    /// <summary>
    /// Adds infrastructure services with Azure Key Vault support.
    /// This method allows credentials to be fetched from Azure Key Vault instead of configuration.
    /// </summary>
    public static IServiceCollection AddInfrastructureServicesWithKeyVault(
        this IServiceCollection services, 
        IConfiguration configuration,
        string? keyVaultConnectionStringKey = "SqlConnectionString")
    {
        // In the future, retrieve connection string from Azure Key Vault
        // var connectionString = await GetFromKeyVault(keyVaultConnectionStringKey);
        
        // For now, use the standard configuration
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrEmpty(connectionString))
            throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured");

        services.AddSingleton<ISqlConnectionFactory>(new SqlConnectionFactory(connectionString));

        // Register Dapper Repositories
        services.AddScoped<IProductRepository, DapperProductRepository>();
        services.AddScoped<ICategoryRepository, DapperCategoryRepository>();
        services.AddScoped<IBrandRepository, DapperBrandRepository>();
        services.AddScoped<IReviewRepository, DapperReviewRepository>();
        services.AddScoped<IUserRepository, DapperUserRepository>();
        services.AddScoped<ICartRepository, DapperCartRepository>();
        services.AddScoped<IOrderRepository, DapperOrderRepository>();
        services.AddScoped<IWishlistRepository, DapperWishlistRepository>();
        services.AddScoped<ICustomBatRequestRepository, DapperCustomBatRequestRepository>();

        return services;
    }
}
