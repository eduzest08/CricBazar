using Microsoft.AspNetCore.Mvc.Testing;
using CricketBazar.API;
using System.Net.Http.Json;
using Xunit;

namespace CricketBazar.Tests.Integration;

/// <summary>
/// Base fixture for Brand API integration tests
/// Provides common setup and helper methods
/// </summary>
public class BrandIntegrationTestFixture : IAsyncLifetime
{
    private WebApplicationFactory<Program>? _factory;
    public HttpClient? Client { get; private set; }

    public async Task InitializeAsync()
    {
        _factory = new WebApplicationFactory<Program>();
        Client = _factory.CreateClient();
        
        // Verify API is healthy
        var healthResponse = await Client.GetAsync("/health");
        Assert.True(healthResponse.IsSuccessStatusCode, "API health check failed");
    }

    public async Task DisposeAsync()
    {
        Client?.Dispose();
        _factory?.Dispose();
        await Task.CompletedTask;
    }

    /// <summary>
    /// Helper method to create a brand via API
    /// </summary>
    public async Task<HttpResponseMessage> CreateBrandAsync(
        string name, 
        string slug, 
        string? logoUrl = null)
    {
        var createBrandDto = new
        {
            name,
            slug,
            logoUrl = logoUrl ?? "https://example.com/logo.png"
        };

        return await Client!.PostAsJsonAsync("/api/v1/Brands", createBrandDto);
    }

    /// <summary>
    /// Helper method to get a brand by slug
    /// </summary>
    public async Task<HttpResponseMessage> GetBrandBySlugAsync(string slug)
    {
        return await Client!.GetAsync($"/api/v1/Brands/slug/{slug}");
    }

    /// <summary>
    /// Helper method to get all brands
    /// </summary>
    public async Task<HttpResponseMessage> GetAllBrandsAsync()
    {
        return await Client!.GetAsync("/api/v1/Brands");
    }

    /// <summary>
    /// Helper method to get brand by ID
    /// </summary>
    public async Task<HttpResponseMessage> GetBrandByIdAsync(int id)
    {
        return await Client!.GetAsync($"/api/v1/Brands/{id}");
    }

    /// <summary>
    /// Helper method to update a brand
    /// </summary>
    public async Task<HttpResponseMessage> UpdateBrandAsync(
        int id,
        string name,
        string slug,
        string? logoUrl = null,
        bool isActive = true)
    {
        var updateBrandDto = new
        {
            name,
            slug,
            logoUrl = logoUrl ?? "https://example.com/logo.png",
            isActive
        };

        return await Client!.PutAsJsonAsync($"/api/v1/Brands/{id}", updateBrandDto);
    }

    /// <summary>
    /// Helper method to delete a brand
    /// </summary>
    public async Task<HttpResponseMessage> DeleteBrandAsync(int id)
    {
        return await Client!.DeleteAsync($"/api/v1/Brands/{id}");
    }
}
