using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace CricketBazar.Tests.Integration;

public class ProductIntegrationTests : IClassFixture<ProductApiFactory>
{
    private const string Url = "/api/v1/Products";
    private readonly HttpClient _client;
    private readonly ProductApiFactory _factory;

    public ProductIntegrationTests(ProductApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private static string Uniq() => Guid.NewGuid().ToString("N")[..8];

    private object NewProduct(string name, string slug, string sku, decimal salePrice = 80m, int? categoryId = null) => new
    {
        name, slug, sku, categoryId = categoryId ?? _factory.CategoryId, brandId = _factory.BrandId,
        mrp = 100m, salePrice, stock = 10, isActive = true
    };

    private async Task<(int id, string slug, string name)> CreateAsync(string? name = null, decimal salePrice = 80m,
        int? categoryId = null)
    {
        var u = Uniq();
        name ??= "Bat " + u;
        var slug = "bat-" + u;
        var response = await _client.PostAsJsonAsync(Url, NewProduct(name, slug, "SKU-" + u, salePrice, categoryId));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var id = json.GetProperty("id").GetInt32();
        _factory.Track(id);
        return (id, slug, name);
    }

    [Fact]
    public async Task Create_ValidProduct_ReturnsCreatedWithLocationAndBody()
    {
        var u = Uniq();
        var response = await _client.PostAsJsonAsync(Url, NewProduct("Bat " + u, "bat-" + u, "SKU-" + u));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var id = json.GetProperty("id").GetInt32();
        _factory.Track(id);
        Assert.True(id > 0);
        Assert.Equal("bat-" + u, json.GetProperty("slug").GetString());
        Assert.EndsWith($"{Url}/{id}", response.Headers.Location!.AbsolutePath, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Create_EmptyPayload_ReturnsBadRequest()
    {
        var response = await _client.PostAsJsonAsync(Url, new { });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetById_Existing_ReturnsProduct()
    {
        var (id, slug, name) = await CreateAsync();

        var response = await _client.GetAsync($"{Url}/{id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(id, json.GetProperty("id").GetInt32());
        Assert.Equal(name, json.GetProperty("name").GetString());
        Assert.Equal(slug, json.GetProperty("slug").GetString());
    }

    [Fact]
    public async Task GetById_Missing_ReturnsNotFound()
    {
        var response = await _client.GetAsync($"{Url}/99999");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetById_NonNumeric_ReturnsNotFoundOrBadRequest()
    {
        var response = await _client.GetAsync($"{Url}/abc");
        Assert.True(response.StatusCode is HttpStatusCode.NotFound or HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetBySlug_Existing_ReturnsProduct()
    {
        var (id, slug, _) = await CreateAsync();

        var response = await _client.GetAsync($"{Url}/slug/{slug}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(id, json.GetProperty("id").GetInt32());
    }

    [Fact]
    public async Task GetBySlug_Missing_ReturnsNotFound()
    {
        var response = await _client.GetAsync($"{Url}/slug/missing-{Uniq()}");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetAll_ReturnsPagedEnvelope()
    {
        await CreateAsync();

        var response = await _client.GetAsync(Url);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(json.GetProperty("items").GetArrayLength() >= 1);
        Assert.True(json.GetProperty("totalCount").GetInt32() >= 1);
        Assert.Equal(1, json.GetProperty("pageNumber").GetInt32());
        Assert.Equal(20, json.GetProperty("pageSize").GetInt32());
    }

    [Fact]
    public async Task GetAll_Pagination_LimitsPageSize()
    {
        for (var i = 0; i < 3; i++) await CreateAsync(categoryId: _factory.OtherCategoryId);

        var response = await _client.GetAsync($"{Url}?categoryId={_factory.OtherCategoryId}&pageNumber=1&pageSize=2");

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(2, json.GetProperty("items").GetArrayLength());
        Assert.True(json.GetProperty("totalCount").GetInt32() >= 3);
        Assert.Equal(2, json.GetProperty("pageSize").GetInt32());
    }

    [Fact]
    public async Task GetAll_FilterByCategoryAndBrand_ReturnsOnlyMatches()
    {
        var (id, _, _) = await CreateAsync(categoryId: _factory.CategoryId);
        var (otherId, _, _) = await CreateAsync(categoryId: _factory.OtherCategoryId);

        var response = await _client.GetAsync($"{Url}?categoryId={_factory.CategoryId}&brandId={_factory.BrandId}&pageSize=100");

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var items = json.GetProperty("items");
        var ids = items.EnumerateArray().Select(x => x.GetProperty("id").GetInt32()).ToList();
        Assert.Contains(id, ids);
        Assert.DoesNotContain(otherId, ids);
        Assert.All(items.EnumerateArray(), x => Assert.Equal(_factory.CategoryId, x.GetProperty("categoryId").GetInt32()));
    }

    [Fact]
    public async Task GetAll_FilterByPriceRange_ReturnsOnlyMatches()
    {
        var (id, _, _) = await CreateAsync(salePrice: 5555m, categoryId: _factory.OtherCategoryId);
        await CreateAsync(salePrice: 9999m, categoryId: _factory.OtherCategoryId);

        var response = await _client.GetAsync($"{Url}?categoryId={_factory.OtherCategoryId}&minPrice=5000&maxPrice=6000");

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var items = json.GetProperty("items");
        Assert.Equal(1, items.GetArrayLength());
        Assert.Equal(id, items[0].GetProperty("id").GetInt32());
    }

    [Fact]
    public async Task GetAll_SearchTerm_ReturnsOnlyMatches()
    {
        var token = "Zephyr" + Uniq();
        var (id, _, _) = await CreateAsync(name: token + " Pro");
        await CreateAsync();

        var response = await _client.GetAsync($"{Url}?searchTerm={token}");

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var items = json.GetProperty("items");
        Assert.Equal(1, items.GetArrayLength());
        Assert.Equal(id, items[0].GetProperty("id").GetInt32());
    }

    [Fact]
    public async Task Update_Existing_ReturnsUpdatedProduct()
    {
        var (id, _, _) = await CreateAsync();
        var u = Uniq();

        var response = await _client.PutAsJsonAsync($"{Url}/{id}", NewProduct("Updated " + u, "updated-" + u, "SKU-U" + u, 120m));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Updated " + u, json.GetProperty("name").GetString());
        Assert.Equal(120m, json.GetProperty("salePrice").GetDecimal());

        var get = await _client.GetFromJsonAsync<JsonElement>($"{Url}/{id}");
        Assert.Equal("updated-" + u, get.GetProperty("slug").GetString());
    }

    [Fact]
    public async Task Update_Missing_ReturnsNotFound()
    {
        var response = await _client.PutAsJsonAsync($"{Url}/99999", NewProduct("n", "n", "n"));
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Update_InvalidPayload_ReturnsBadRequest()
    {
        var (id, _, _) = await CreateAsync();
        var response = await _client.PutAsJsonAsync($"{Url}/{id}", new { });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Delete_Existing_ReturnsNoContent_ThenNotFound()
    {
        var (id, _, _) = await CreateAsync();

        var delete = await _client.DeleteAsync($"{Url}/{id}");
        var get = await _client.GetAsync($"{Url}/{id}");

        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, get.StatusCode);
    }

    [Fact]
    public async Task Delete_Missing_ReturnsNotFound()
    {
        var response = await _client.DeleteAsync($"{Url}/99999");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task AddImage_ExistingProduct_ReturnsCreated()
    {
        var (id, _, _) = await CreateAsync();

        var response = await _client.PostAsJsonAsync($"{Url}/{id}/images", new { url = "https://example.com/a.png", sortOrder = 1 });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("https://example.com/a.png", json.GetProperty("url").GetString());
    }

    [Fact]
    public async Task AddImage_MissingProduct_ReturnsNotFound()
    {
        var response = await _client.PostAsJsonAsync($"{Url}/99999/images", new { url = "https://example.com/a.png" });
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task AddVariant_ExistingProduct_ReturnsCreated()
    {
        var (id, _, _) = await CreateAsync();

        var response = await _client.PostAsJsonAsync($"{Url}/{id}/variants", new { size = "L", color = "Red", hand = "Right", stock = 3 });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("L", json.GetProperty("size").GetString());
    }

    [Fact]
    public async Task AddVariant_MissingProduct_ReturnsNotFound()
    {
        var response = await _client.PostAsJsonAsync($"{Url}/99999/variants", new { size = "L" });
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
