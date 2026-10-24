using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace CricketBazar.Tests.Integration;

public class BrandIntegrationTests : IAsyncLifetime
{
    private readonly BrandIntegrationTestFixture _fixture = new();
    private List<int> _createdBrandIds = new();

    public async Task InitializeAsync() => await _fixture.InitializeAsync();
    public async Task DisposeAsync()
    {
        // Cleanup created brands
        foreach (var brandId in _createdBrandIds)
        {
            try
            {
                await _fixture.DeleteBrandAsync(brandId);
            }
            catch { /* Ignore cleanup errors */ }
        }
        await _fixture.DisposeAsync();
    }

    private async Task<int> CreateAndTrackBrandAsync(string name, string slug, string? logoUrl = null)
    {
        var response = await _fixture.CreateBrandAsync(name, slug, logoUrl);
        if (response.StatusCode == HttpStatusCode.Created)
        {
            var content = await response.Content.ReadAsStringAsync();
            var json = JsonDocument.Parse(content);
            var brandId = json.RootElement.GetProperty("id").GetInt32();
            _createdBrandIds.Add(brandId);
            return brandId;
        }
        return -1;
    }

    #region Create Brand Tests

    [Fact]
    public async Task CreateBrand_WithValidUniqueSlug_ReturnsCreated()
    {
        var brandName = "Test Brand " + Guid.NewGuid().ToString().Substring(0, 8);
        var uniqueSlug = "test-brand-" + Guid.NewGuid().ToString().Substring(0, 8);

        var response = await _fixture.CreateBrandAsync(brandName, uniqueSlug);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(content);
        Assert.Equal(brandName, json.RootElement.GetProperty("name").GetString());
        Assert.Equal(uniqueSlug, json.RootElement.GetProperty("slug").GetString());
    }

    [Fact]
    public async Task CreateBrand_WithDuplicateSlug_ReturnsBadRequest()
    {
        var brandName = "Duplicate Test Brand";
        var duplicateSlug = "duplicate-slug-" + Guid.NewGuid().ToString().Substring(0, 8);

        await _fixture.CreateBrandAsync(brandName, duplicateSlug);
        var response = await _fixture.CreateBrandAsync("Another Brand", duplicateSlug);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateBrand_WithoutLogoUrl_CreatesSuccessfully()
    {
        var brandName = "No Logo Brand";
        var uniqueSlug = "no-logo-" + Guid.NewGuid().ToString().Substring(0, 8);

        var response = await _fixture.CreateBrandAsync(brandName, uniqueSlug, null);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task CreateBrand_WithValidLogoUrl_CreatesSuccessfully()
    {
        var brandName = "Logo Brand";
        var uniqueSlug = "logo-brand-" + Guid.NewGuid().ToString().Substring(0, 8);
        var logoUrl = "https://example.com/brand-logo.png";

        var response = await _fixture.CreateBrandAsync(brandName, uniqueSlug, logoUrl);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    #endregion

    #region Get Brand Tests

    [Fact]
    public async Task GetAllBrands_ReturnsOk()
    {
        var response = await _fixture.GetAllBrandsAsync();
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetBrandBySlug_WithValidSlug_ReturnsOk()
    {
        var brandName = "Slug Test Brand";
        var uniqueSlug = "slug-test-" + Guid.NewGuid().ToString().Substring(0, 8);
        await _fixture.CreateBrandAsync(brandName, uniqueSlug);

        var response = await _fixture.GetBrandBySlugAsync(uniqueSlug);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetBrandBySlug_WithInvalidSlug_ReturnsNotFound()
    {
        var response = await _fixture.GetBrandBySlugAsync("nonexistent-slug-" + Guid.NewGuid().ToString().Substring(0, 8));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetBrandById_WithInvalidId_ReturnsNotFound()
    {
        var response = await _fixture.GetBrandByIdAsync(99999);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    #endregion

    #region Update Brand Tests

    [Fact]
    public async Task UpdateBrand_WithInvalidId_ReturnsNotFound()
    {
        var response = await _fixture.UpdateBrandAsync(99999, "Updated", "updated-slug", null, true);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    #endregion

    #region Delete Brand Tests

    [Fact]
    public async Task DeleteBrand_WithInvalidId_ReturnsNotFound()
    {
        var response = await _fixture.DeleteBrandAsync(99999);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    #endregion

    #region Error Handling Tests

    [Fact]
    public async Task CreateBrand_WithInvalidPayload_ReturnsBadRequest()
    {
        var response = await _fixture.Client!.PostAsJsonAsync("/api/v1/Brands", new { });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    #endregion

    #region Slug Uniqueness Tests

    [Fact]
    public async Task SlugUniqueness_CaseInsensitive_ReturnsBadRequest()
    {
        var slug = "case-test-" + Guid.NewGuid().ToString().Substring(0, 8);
        await _fixture.CreateBrandAsync("Brand 1", slug.ToLower());

        var response = await _fixture.CreateBrandAsync("Brand 2", slug.ToUpper());

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task MultipleUniqueSlugCreations_AllSucceed()
    {
        var responses = new List<HttpResponseMessage>();
        for (int i = 0; i < 3; i++)
        {
            var response = await _fixture.CreateBrandAsync(
                $"Batch Brand {i}", 
                $"batch-brand-{i}-{Guid.NewGuid().ToString().Substring(0, 8)}"
            );
            responses.Add(response);
        }

        Assert.All(responses, r => Assert.Equal(HttpStatusCode.Created, r.StatusCode));
    }

    #endregion

    #region HTTP Status Code Tests

    [Fact]
    public async Task ApiEndpoints_ReturnProperStatusCodes()
    {
        var brandName = "Status Test Brand";
        var uniqueSlug = "status-test-" + Guid.NewGuid().ToString().Substring(0, 8);

        var createResponse = await _fixture.CreateBrandAsync(brandName, uniqueSlug);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        var getResponse = await _fixture.GetAllBrandsAsync();
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

        var invalidGetResponse = await _fixture.GetBrandByIdAsync(99999);
        Assert.Equal(HttpStatusCode.NotFound, invalidGetResponse.StatusCode);
    }

    #endregion
}
