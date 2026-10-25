using System.Collections.Concurrent;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace CricketBazar.Tests.Integration;

/// <summary>
/// Runs the real API against the real database. Creates the category and brand
/// that products require, and removes everything it created on dispose.
/// </summary>
public class ProductApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly ConcurrentBag<int> _productIds = new();
    private HttpClient _client = null!;
    private int[] _categoryIds = Array.Empty<int>();

    public int CategoryId => _categoryIds[0];
    public int OtherCategoryId => _categoryIds[1];
    public int BrandId { get; private set; }

    public void Track(int productId) => _productIds.Add(productId);

    public async Task InitializeAsync()
    {
        _client = CreateClient();
        var u = Guid.NewGuid().ToString("N")[..8];

        _categoryIds = new[]
        {
            await CreateCategoryAsync($"ProdTest Cat A {u}", $"prodtest-cat-a-{u}"),
            await CreateCategoryAsync($"ProdTest Cat B {u}", $"prodtest-cat-b-{u}")
        };

        var brandSlug = $"prodtest-brand-{u}";
        var brandResponse = await _client.PostAsJsonAsync("/api/v1/Brands", new { name = $"ProdTest Brand {u}", slug = brandSlug });
        brandResponse.EnsureSuccessStatusCode();
        var brand = await _client.GetFromJsonAsync<JsonElement>($"/api/v1/Brands/slug/{brandSlug}");
        BrandId = brand.GetProperty("id").GetInt32();
    }

    private async Task<int> CreateCategoryAsync(string name, string slug)
    {
        var response = await _client.PostAsJsonAsync("/api/v1/Categories", new { name, slug });
        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        return json.GetProperty("id").GetInt32();
    }

    async Task IAsyncLifetime.DisposeAsync()
    {
        foreach (var id in _productIds)
            await _client.DeleteAsync($"/api/v1/Products/{id}");
        foreach (var id in _categoryIds)
            await _client.DeleteAsync($"/api/v1/Categories/{id}");
        await _client.DeleteAsync($"/api/v1/Brands/{BrandId}");
    }
}
