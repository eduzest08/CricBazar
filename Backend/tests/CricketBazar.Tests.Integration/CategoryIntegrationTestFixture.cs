using Microsoft.AspNetCore.Mvc.Testing;
using CricketBazar.API;
using System.Net.Http.Json;
using Xunit;

namespace CricketBazar.Tests.Integration;

/// <summary>
/// Base fixture for Category API integration tests
/// Provides common setup and helper methods
/// </summary>
public class CategoryIntegrationTestFixture : IAsyncLifetime
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
    /// Helper method to create a category via API
    /// </summary>
    public async Task<HttpResponseMessage> CreateCategoryAsync(
        string name, 
        string slug,
        int? parentId = null,
        int sortOrder = 0)
    {
        var createCategoryDto = new
        {
            name,
            slug,
            parentId,
            sortOrder
        };

        return await Client!.PostAsJsonAsync("/api/v1/Categories", createCategoryDto);
    }

    /// <summary>
    /// Helper method to get a category by ID
    /// </summary>
    public async Task<HttpResponseMessage> GetCategoryByIdAsync(int id)
    {
        return await Client!.GetAsync($"/api/v1/Categories/{id}");
    }

    /// <summary>
    /// Helper method to get a category by slug
    /// </summary>
    public async Task<HttpResponseMessage> GetCategoryBySlugAsync(string slug)
    {
        return await Client!.GetAsync($"/api/v1/Categories/slug/{slug}");
    }

    /// <summary>
    /// Helper method to get all categories
    /// </summary>
    public async Task<HttpResponseMessage> GetAllCategoriesAsync(bool? onlyActive = true)
    {
        var url = "/api/v1/Categories";
        if (onlyActive.HasValue)
            url += $"?onlyActive={onlyActive}";
        
        return await Client!.GetAsync(url);
    }

    /// <summary>
    /// Helper method to update a category
    /// </summary>
    public async Task<HttpResponseMessage> UpdateCategoryAsync(
        int id,
        string name,
        string slug,
        int? parentId = null,
        int sortOrder = 0,
        bool isActive = true)
    {
        var updateCategoryDto = new
        {
            name,
            slug,
            parentId,
            sortOrder,
            isActive
        };

        return await Client!.PutAsJsonAsync($"/api/v1/Categories/{id}", updateCategoryDto);
    }

    /// <summary>
    /// Helper method to delete a category
    /// </summary>
    public async Task<HttpResponseMessage> DeleteCategoryAsync(int id)
    {
        return await Client!.DeleteAsync($"/api/v1/Categories/{id}");
    }
}
