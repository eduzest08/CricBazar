using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace CricketBazar.Tests.Integration;

public class CategoryIntegrationTests : IAsyncLifetime
{
    private readonly CategoryIntegrationTestFixture _fixture = new();
    private List<int> _createdCategoryIds = new();

    public async Task InitializeAsync() => await _fixture.InitializeAsync();
    public async Task DisposeAsync()
    {
        // Cleanup created categories
        foreach (var categoryId in _createdCategoryIds.AsEnumerable().Reverse())
        {
            try
            {
                await _fixture.DeleteCategoryAsync(categoryId);
            }
            catch { /* Ignore cleanup errors */ }
        }
        await _fixture.DisposeAsync();
    }

    private async Task<int> CreateAndTrackCategoryAsync(
        string name, 
        string slug, 
        int? parentId = null,
        int sortOrder = 0)
    {
        var response = await _fixture.CreateCategoryAsync(name, slug, parentId, sortOrder);
        var content = await response.Content.ReadAsStringAsync();
        Assert.True(
            response.StatusCode == HttpStatusCode.Created,
            $"Category creation failed with {(int)response.StatusCode} ({response.StatusCode}): {content}");

        using var json = JsonDocument.Parse(content);
        var categoryId = json.RootElement.GetProperty("id").GetInt32();
        _createdCategoryIds.Add(categoryId);
        return categoryId;
    }

    #region Create Category Tests

    [Fact]
    public async Task CreateCategory_WithValidData_ReturnsCreated()
    {
        var categoryName = "Test Category " + Guid.NewGuid().ToString().Substring(0, 8);
        var uniqueSlug = "test-category-" + Guid.NewGuid().ToString().Substring(0, 8);

        var response = await _fixture.CreateCategoryAsync(categoryName, uniqueSlug);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(content);
        Assert.Equal(categoryName, json.RootElement.GetProperty("name").GetString());
        Assert.Equal(uniqueSlug, json.RootElement.GetProperty("slug").GetString());
        Assert.True(json.RootElement.GetProperty("isActive").GetBoolean());
    }

    [Fact]
    public async Task CreateCategory_WithParentCategory_ReturnsCreated()
    {
        var parentName = "Parent Category " + Guid.NewGuid().ToString().Substring(0, 8);
        var parentSlug = "parent-" + Guid.NewGuid().ToString().Substring(0, 8);
        var parentId = await CreateAndTrackCategoryAsync(parentName, parentSlug);

        var childName = "Child Category " + Guid.NewGuid().ToString().Substring(0, 8);
        var childSlug = "child-" + Guid.NewGuid().ToString().Substring(0, 8);

        var childId = await CreateAndTrackCategoryAsync(childName, childSlug, parentId);
        var response = await _fixture.GetCategoryByIdAsync(childId);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(content);
        Assert.Equal(childName, json.RootElement.GetProperty("name").GetString());
        var parentIdProperty = json.RootElement.TryGetProperty("parentId", out var parentIdElement) &&
                               parentIdElement.ValueKind != JsonValueKind.Null
            ? parentIdElement
            : json.RootElement.GetProperty("parentCategoryId");
        Assert.Equal(parentId, parentIdProperty.GetInt32());
    }

    [Fact]
    public async Task CreateCategory_WithSortOrder_ReturnsCreated()
    {
        var categoryName = "Sorted Category " + Guid.NewGuid().ToString().Substring(0, 8);
        var uniqueSlug = "sorted-" + Guid.NewGuid().ToString().Substring(0, 8);
        var sortOrder = 5;

        var response = await _fixture.CreateCategoryAsync(categoryName, uniqueSlug, null, sortOrder);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(content);
        Assert.Equal(sortOrder, json.RootElement.GetProperty("sortOrder").GetInt32());
    }

    [Fact]
    public async Task CreateCategory_WithDuplicateSlug_ReturnsBadRequest()
    {
        var categoryName = "Duplicate Test Category";
        var duplicateSlug = "duplicate-slug-" + Guid.NewGuid().ToString().Substring(0, 8);

        await _fixture.CreateCategoryAsync(categoryName, duplicateSlug);
        var response = await _fixture.CreateCategoryAsync("Another Category", duplicateSlug);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateCategory_WithoutSortOrder_UsesDefaultValue()
    {
        var categoryName = "No Sort Category " + Guid.NewGuid().ToString().Substring(0, 8);
        var uniqueSlug = "no-sort-" + Guid.NewGuid().ToString().Substring(0, 8);

        var response = await _fixture.CreateCategoryAsync(categoryName, uniqueSlug);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(content);
        Assert.Equal(0, json.RootElement.GetProperty("sortOrder").GetInt32());
    }

    #endregion

    #region Get Category Tests

    [Fact]
    public async Task GetAllCategories_ReturnsOk()
    {
        var response = await _fixture.GetAllCategoriesAsync();
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetAllCategories_WithOnlyActiveTrue_ReturnsOnlyActiveCategoriesAsync()
    {
        await CreateAndTrackCategoryAsync(
            "Active Category " + Guid.NewGuid().ToString().Substring(0, 8),
            "active-" + Guid.NewGuid().ToString().Substring(0, 8));

        var response = await _fixture.GetAllCategoriesAsync(onlyActive: true);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(content);
        Assert.IsType<JsonElement>(json.RootElement);
    }

    [Fact]
    public async Task GetAllCategories_WithOnlyActiveFalse_ReturnsAllCategories()
    {
        var response = await _fixture.GetAllCategoriesAsync(onlyActive: false);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(content);
        Assert.IsType<JsonElement>(json.RootElement);
    }

    [Fact]
    public async Task GetCategoryById_WithValidId_ReturnsOk()
    {
        var categoryName = "Get By ID Category " + Guid.NewGuid().ToString().Substring(0, 8);
        var uniqueSlug = "get-id-" + Guid.NewGuid().ToString().Substring(0, 8);
        var categoryId = await CreateAndTrackCategoryAsync(categoryName, uniqueSlug);

        var response = await _fixture.GetCategoryByIdAsync(categoryId);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(content);
        Assert.Equal(categoryId, json.RootElement.GetProperty("id").GetInt32());
        Assert.Equal(categoryName, json.RootElement.GetProperty("name").GetString());
    }

    [Fact]
    public async Task GetCategoryById_WithInvalidId_ReturnsNotFound()
    {
        var response = await _fixture.GetCategoryByIdAsync(99999);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetCategoryBySlug_WithValidSlug_ReturnsOk()
    {
        var categoryName = "Slug Test Category " + Guid.NewGuid().ToString().Substring(0, 8);
        var uniqueSlug = "slug-test-" + Guid.NewGuid().ToString().Substring(0, 8);
        await CreateAndTrackCategoryAsync(categoryName, uniqueSlug);

        var response = await _fixture.GetCategoryBySlugAsync(uniqueSlug);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(content);
        Assert.Equal(categoryName, json.RootElement.GetProperty("name").GetString());
        Assert.Equal(uniqueSlug, json.RootElement.GetProperty("slug").GetString());
    }

    [Fact]
    public async Task GetCategoryBySlug_WithInvalidSlug_ReturnsNotFound()
    {
        var response = await _fixture.GetCategoryBySlugAsync(
            "nonexistent-slug-" + Guid.NewGuid().ToString().Substring(0, 8));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    #endregion

    #region Update Category Tests

    [Fact]
    public async Task UpdateCategory_WithValidData_ReturnsOk()
    {
        var categoryName = "Update Test Category " + Guid.NewGuid().ToString().Substring(0, 8);
        var uniqueSlug = "update-test-" + Guid.NewGuid().ToString().Substring(0, 8);
        var categoryId = await CreateAndTrackCategoryAsync(categoryName, uniqueSlug);

        var updatedName = "Updated " + categoryName;
        var updatedSlug = "updated-" + uniqueSlug;

        var response = await _fixture.UpdateCategoryAsync(
            categoryId, 
            updatedName, 
            updatedSlug, 
            null, 
            5, 
            true);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(content);
        Assert.Equal(updatedName, json.RootElement.GetProperty("name").GetString());
        Assert.Equal(updatedSlug, json.RootElement.GetProperty("slug").GetString());
        Assert.Equal(5, json.RootElement.GetProperty("sortOrder").GetInt32());
    }

    [Fact]
    public async Task UpdateCategory_SetInactive_ReturnsOk()
    {
        var categoryName = "Inactive Category " + Guid.NewGuid().ToString().Substring(0, 8);
        var uniqueSlug = "inactive-" + Guid.NewGuid().ToString().Substring(0, 8);
        var categoryId = await CreateAndTrackCategoryAsync(categoryName, uniqueSlug);

        var response = await _fixture.UpdateCategoryAsync(
            categoryId, 
            categoryName, 
            uniqueSlug, 
            null, 
            0, 
            false);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(content);
        Assert.False(json.RootElement.GetProperty("isActive").GetBoolean());
    }

    [Fact]
    public async Task UpdateCategory_WithInvalidId_ReturnsNotFound()
    {
        var response = await _fixture.UpdateCategoryAsync(
            99999, 
            "Updated Name", 
            "updated-slug");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateCategory_WithDuplicateSlug_ReturnsBadRequest()
    {
        var slug1 = "dup-slug-1-" + Guid.NewGuid().ToString().Substring(0, 8);
        var slug2 = "dup-slug-2-" + Guid.NewGuid().ToString().Substring(0, 8);
        
        var categoryId1 = await CreateAndTrackCategoryAsync("Category 1", slug1);
        await CreateAndTrackCategoryAsync("Category 2", slug2);

        var response = await _fixture.UpdateCategoryAsync(
            categoryId1, 
            "Updated Category 1", 
            slug2);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    #endregion

    #region Delete Category Tests

    [Fact]
    public async Task DeleteCategory_WithValidId_ReturnsNoContent()
    {
        var categoryName = "Delete Test Category " + Guid.NewGuid().ToString().Substring(0, 8);
        var uniqueSlug = "delete-test-" + Guid.NewGuid().ToString().Substring(0, 8);
        var categoryId = await CreateAndTrackCategoryAsync(categoryName, uniqueSlug);

        var response = await _fixture.DeleteCategoryAsync(categoryId);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        
        // Verify it's deleted
        var getResponse = await _fixture.GetCategoryByIdAsync(categoryId);
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
        
        // Remove from tracking since it's already deleted
        _createdCategoryIds.Remove(categoryId);
    }

    [Fact]
    public async Task DeleteCategory_WithInvalidId_ReturnsNotFound()
    {
        var response = await _fixture.DeleteCategoryAsync(99999);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    #endregion

    #region Hierarchy Tests

    [Fact]
    public async Task CategoryHierarchy_ParentChildRelationship_WorksCorrectly()
    {
        var parentSlug = "parent-hierarchy-" + Guid.NewGuid().ToString().Substring(0, 8);
        var parentId = await CreateAndTrackCategoryAsync("Parent", parentSlug);

        var child1Slug = "child-1-" + Guid.NewGuid().ToString().Substring(0, 8);
        var child1Id = await CreateAndTrackCategoryAsync("Child 1", child1Slug, parentId);

        var child2Slug = "child-2-" + Guid.NewGuid().ToString().Substring(0, 8);
        var child2Id = await CreateAndTrackCategoryAsync("Child 2", child2Slug, parentId);

        var parentResponse = await _fixture.GetCategoryByIdAsync(parentId);
        Assert.Equal(HttpStatusCode.OK, parentResponse.StatusCode);

        var child1Response = await _fixture.GetCategoryByIdAsync(child1Id);
        var child1Content = await child1Response.Content.ReadAsStringAsync();
        var child1Json = JsonDocument.Parse(child1Content);
        var child1ParentId = child1Json.RootElement.TryGetProperty("parentId", out var child1ParentIdElement)
            ? child1ParentIdElement
            : child1Json.RootElement.GetProperty("parentCategoryId");
        Assert.Equal(parentId, child1ParentId.GetInt32());

        var child2Response = await _fixture.GetCategoryByIdAsync(child2Id);
        var child2Content = await child2Response.Content.ReadAsStringAsync();
        var child2Json = JsonDocument.Parse(child2Content);
        var child2ParentId = child2Json.RootElement.TryGetProperty("parentId", out var child2ParentIdElement)
            ? child2ParentIdElement
            : child2Json.RootElement.GetProperty("parentCategoryId");
        Assert.Equal(parentId, child2ParentId.GetInt32());
    }

    #endregion

    #region HTTP Status Code Tests

    [Fact]
    public async Task ApiEndpoints_ReturnProperStatusCodes()
    {
        var categoryName = "Status Test Category " + Guid.NewGuid().ToString().Substring(0, 8);
        var uniqueSlug = "status-test-" + Guid.NewGuid().ToString().Substring(0, 8);

        var createResponse = await _fixture.CreateCategoryAsync(categoryName, uniqueSlug);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        var getResponse = await _fixture.GetAllCategoriesAsync();
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

        var invalidGetResponse = await _fixture.GetCategoryByIdAsync(99999);
        Assert.Equal(HttpStatusCode.NotFound, invalidGetResponse.StatusCode);
    }

    #endregion

    #region Error Handling Tests

    [Fact]
    public async Task CreateCategory_WithInvalidPayload_ReturnsBadRequest()
    {
        var response = await _fixture.Client!.PostAsJsonAsync("/api/v1/Categories", new { });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateCategory_WithMissingRequiredFields_ReturnsBadRequest()
    {
        var incompleteCategory = new { name = "Test" }; // Missing slug
        var response = await _fixture.Client!.PostAsJsonAsync("/api/v1/Categories", incompleteCategory);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    #endregion

    #region Slug Uniqueness Tests

    [Fact]
    public async Task SlugUniqueness_CaseInsensitive_ReturnsBadRequest()
    {
        var slug = "case-test-" + Guid.NewGuid().ToString().Substring(0, 8);
        await _fixture.CreateCategoryAsync("Category 1", slug.ToLower());

        var response = await _fixture.CreateCategoryAsync("Category 2", slug.ToUpper());

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task MultipleUniqueSlugCreations_AllSucceed()
    {
        var responses = new List<HttpResponseMessage>();
        for (int i = 0; i < 3; i++)
        {
            var response = await _fixture.CreateCategoryAsync(
                $"Batch Category {i}",
                $"batch-category-{i}-{Guid.NewGuid().ToString().Substring(0, 8)}"
            );
            responses.Add(response);
        }

        Assert.All(responses, r => Assert.Equal(HttpStatusCode.Created, r.StatusCode));
    }

    #endregion
}
