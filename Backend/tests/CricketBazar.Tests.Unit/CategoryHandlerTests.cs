using Moq;
using Xunit;
using AutoMapper;
using CricketBazar.Application.DTOs;
using CricketBazar.Application.Commands.Categories;
using CricketBazar.Application.Queries.Categories;
using CricketBazar.Domain.Entities;
using CricketBazar.Domain.Interfaces;

namespace CricketBazar.Tests.Unit;

/// <summary>
/// Unit tests for Category command and query handlers
/// Tests business logic in isolation using mocked repositories
/// </summary>
public class CategoryHandlerTests
{
    private readonly Mock<ICategoryRepository> _mockRepository;
    private readonly Mock<IMapper> _mockMapper;

    public CategoryHandlerTests()
    {
        _mockRepository = new Mock<ICategoryRepository>();
        _mockMapper = new Mock<IMapper>();
    }

    #region GetCategoriesListQueryHandler Tests

    [Fact]
    public async Task GetCategoriesListQuery_WithOnlyActiveTrue_ReturnsActiveCategoriesAsync()
    {
        // Arrange
        var categories = new List<Category>
        {
            new Category { Id = 1, Name = "Active 1", Slug = "active-1", IsActive = true },
            new Category { Id = 2, Name = "Active 2", Slug = "active-2", IsActive = true }
        };
        var categoryDtos = new List<CategoryDto>
        {
            new() { Id = 1, Name = "Active 1", Slug = "active-1", IsActive = true },
            new() { Id = 2, Name = "Active 2", Slug = "active-2", IsActive = true }
        };
        _mockRepository.Setup(r => r.GetActiveCategoriesAsync()).ReturnsAsync(categories);
        _mockMapper.Setup(m => m.Map<List<CategoryDto>>(categories)).Returns(categoryDtos);

        var handler = new GetCategoriesListQueryHandler(_mockRepository.Object, _mockMapper.Object);

        // Act
        var query = new GetCategoriesListQuery { OnlyActive = true };
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        _mockRepository.Verify(r => r.GetActiveCategoriesAsync(), Times.Once);
    }

    [Fact]
    public async Task GetCategoriesListQuery_WithOnlyActiveFalse_ReturnsAllCategories()
    {
        // Arrange
        var categories = new List<Category>
        {
            new Category { Id = 1, Name = "Active", Slug = "active", IsActive = true },
            new Category { Id = 2, Name = "Inactive", Slug = "inactive", IsActive = false }
        };
        var categoryDtos = new List<CategoryDto>
        {
            new() { Id = 1, Name = "Active", Slug = "active", IsActive = true },
            new() { Id = 2, Name = "Inactive", Slug = "inactive", IsActive = false }
        };
        _mockRepository.Setup(r => r.GetAllAsync()).ReturnsAsync(categories);
        _mockMapper.Setup(m => m.Map<List<CategoryDto>>(categories)).Returns(categoryDtos);

        var handler = new GetCategoriesListQueryHandler(_mockRepository.Object, _mockMapper.Object);

        // Act
        var query = new GetCategoriesListQuery { OnlyActive = false };
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        _mockRepository.Verify(r => r.GetAllAsync(), Times.Once);
    }

    [Fact]
    public async Task GetCategoriesListQuery_WithEmptyResult_ReturnsEmptyList()
    {
        // Arrange
        _mockRepository.Setup(r => r.GetActiveCategoriesAsync()).ReturnsAsync(new List<Category>());
        _mockMapper.Setup(m => m.Map<List<CategoryDto>>(It.IsAny<List<Category>>())).Returns(new List<CategoryDto>());

        var handler = new GetCategoriesListQueryHandler(_mockRepository.Object, _mockMapper.Object);

        // Act
        var query = new GetCategoriesListQuery { OnlyActive = true };
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    #endregion

    #region GetCategoryByIdQueryHandler Tests

    [Fact]
    public async Task GetCategoryByIdQuery_WithValidId_ReturnsCategory()
    {
        // Arrange
        var categoryId = 1;
        var category = new Category { Id = categoryId, Name = "Test", Slug = "test", IsActive = true };
        var categoryDto = new CategoryDto { Id = categoryId, Name = "Test", Slug = "test", IsActive = true };

        _mockRepository.Setup(r => r.GetByIdAsync(categoryId)).ReturnsAsync(category);
        _mockMapper.Setup(m => m.Map<CategoryDto?>(category)).Returns(categoryDto);

        var handler = new GetCategoryByIdQueryHandler(_mockRepository.Object, _mockMapper.Object);

        // Act
        var query = new GetCategoryByIdQuery(categoryId);
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(categoryId, result.Id);
        Assert.Equal("Test", result.Name);
        _mockRepository.Verify(r => r.GetByIdAsync(categoryId), Times.Once);
    }

    [Fact]
    public async Task GetCategoryByIdQuery_WithInvalidId_ReturnsNull()
    {
        // Arrange
        _mockRepository.Setup(r => r.GetByIdAsync(It.IsAny<int>())).ReturnsAsync((Category?)null);
        _mockMapper.Setup(m => m.Map<CategoryDto?>(null)).Returns((CategoryDto?)null);

        var handler = new GetCategoryByIdQueryHandler(_mockRepository.Object, _mockMapper.Object);

        // Act
        var query = new GetCategoryByIdQuery(99999);
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.Null(result);
    }

    #endregion

    #region GetCategoryBySlugQueryHandler Tests

    [Fact]
    public async Task GetCategoryBySlugQuery_WithValidSlug_ReturnsCategory()
    {
        // Arrange
        var slug = "test-category";
        var category = new Category { Id = 1, Name = "Test", Slug = slug, IsActive = true };
        var categoryDto = new CategoryDto { Id = 1, Name = "Test", Slug = slug, IsActive = true };

        _mockRepository.Setup(r => r.GetBySlugAsync(slug)).ReturnsAsync(category);
        _mockMapper.Setup(m => m.Map<CategoryDto?>(category)).Returns(categoryDto);

        var handler = new GetCategoryBySlugQueryHandler(_mockRepository.Object, _mockMapper.Object);

        // Act
        var query = new GetCategoryBySlugQuery(slug);
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(slug, result.Slug);
        _mockRepository.Verify(r => r.GetBySlugAsync(slug), Times.Once);
    }

    [Fact]
    public async Task GetCategoryBySlugQuery_WithInvalidSlug_ReturnsNull()
    {
        // Arrange
        _mockRepository.Setup(r => r.GetBySlugAsync(It.IsAny<string>())).ReturnsAsync((Category?)null);
        _mockMapper.Setup(m => m.Map<CategoryDto?>(null)).Returns((CategoryDto?)null);

        var handler = new GetCategoryBySlugQueryHandler(_mockRepository.Object, _mockMapper.Object);

        // Act
        var query = new GetCategoryBySlugQuery("nonexistent");
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.Null(result);
    }

    #endregion

    #region CreateCategoryCommandHandler Tests

    [Fact]
    public async Task CreateCategoryCommand_WithValidData_CreatesAndReturnsCategory()
    {
        // Arrange
        var createDto = new CreateCategoryDto { Name = "New Category", Slug = "new", SortOrder = 1 };
        var category = new Category { Id = 1, Name = "New Category", Slug = "new", SortOrder = 1, IsActive = true };
        var categoryDto = new CategoryDto { Id = 1, Name = "New Category", Slug = "new", SortOrder = 1, IsActive = true };

        _mockMapper.Setup(m => m.Map<Category>(createDto)).Returns(category);
        _mockRepository.Setup(r => r.AddAsync(It.IsAny<Category>())).ReturnsAsync(1);
        _mockMapper.Setup(m => m.Map<CategoryDto>(category)).Returns(categoryDto);

        var handler = new CreateCategoryCommandHandler(_mockRepository.Object, _mockMapper.Object);

        // Act
        var command = new CreateCategoryCommand { Category = createDto };
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("New Category", result.Name);
        Assert.True(result.IsActive);
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<Category>()), Times.Once);
    }

    [Fact]
    public async Task CreateCategoryCommand_SetsIsActiveToTrue()
    {
        // Arrange
        var createDto = new CreateCategoryDto { Name = "Test", Slug = "test" };
        var category = new Category { Name = "Test", Slug = "test", IsActive = false };
        var categoryDto = new CategoryDto { Id = 1, Name = "Test", Slug = "test", IsActive = true };

        _mockMapper.Setup(m => m.Map<Category>(createDto)).Returns(category);
        _mockRepository.Setup(r => r.AddAsync(It.IsAny<Category>())).ReturnsAsync(1);
        _mockMapper.Setup(m => m.Map<CategoryDto>(It.IsAny<Category>())).Returns(categoryDto);

        var handler = new CreateCategoryCommandHandler(_mockRepository.Object, _mockMapper.Object);

        // Act
        var command = new CreateCategoryCommand { Category = createDto };
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsActive);
    }

    #endregion

    #region UpdateCategoryCommandHandler Tests

    [Fact]
    public async Task UpdateCategoryCommand_WithValidId_UpdatesAndReturnsCategory()
    {
        // Arrange
        var categoryId = 1;
        var updateDto = new UpdateCategoryDto { Name = "Updated", Slug = "updated", IsActive = true };
        var category = new Category { Id = categoryId, Name = "Old", Slug = "old" };
        var categoryDto = new CategoryDto { Id = categoryId, Name = "Updated", Slug = "updated", IsActive = true };

        _mockRepository.Setup(r => r.GetByIdAsync(categoryId)).ReturnsAsync(category);
        _mockMapper.Setup(m => m.Map(updateDto, category)).Callback<UpdateCategoryDto, Category>((src, dest) =>
        {
            dest.Name = src.Name;
            dest.Slug = src.Slug;
            dest.IsActive = src.IsActive;
        }).Returns(category);
        _mockRepository.Setup(r => r.UpdateAsync(It.IsAny<Category>())).ReturnsAsync(true);
        _mockMapper.Setup(m => m.Map<CategoryDto>(It.IsAny<Category>())).Returns(categoryDto);

        var handler = new UpdateCategoryCommandHandler(_mockRepository.Object, _mockMapper.Object);

        // Act
        var command = new UpdateCategoryCommand { Id = categoryId, Category = updateDto };
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Updated", result.Name);
        _mockRepository.Verify(r => r.GetByIdAsync(categoryId), Times.Once);
        _mockRepository.Verify(r => r.UpdateAsync(It.IsAny<Category>()), Times.Once);
    }

    [Fact]
    public async Task UpdateCategoryCommand_WithInvalidId_ThrowsKeyNotFoundException()
    {
        // Arrange
        _mockRepository.Setup(r => r.GetByIdAsync(It.IsAny<int>())).ReturnsAsync((Category?)null);

        var handler = new UpdateCategoryCommandHandler(_mockRepository.Object, _mockMapper.Object);

        // Act & Assert
        var command = new UpdateCategoryCommand 
        { 
            Id = 99999, 
            Category = new UpdateCategoryDto { Name = "Test", Slug = "test" }
        };
        await Assert.ThrowsAsync<KeyNotFoundException>(() => handler.Handle(command, CancellationToken.None));
    }

    #endregion

    #region DeleteCategoryCommandHandler Tests

    [Fact]
    public async Task DeleteCategoryCommand_WithValidId_ReturnsTrue()
    {
        // Arrange
        var categoryId = 1;
        var category = new Category { Id = categoryId, Name = "Test", Slug = "test" };

        _mockRepository.Setup(r => r.GetByIdAsync(categoryId)).ReturnsAsync(category);
        _mockRepository.Setup(r => r.DeleteAsync(categoryId)).ReturnsAsync(true);

        var handler = new DeleteCategoryCommandHandler(_mockRepository.Object);

        // Act
        var command = new DeleteCategoryCommand(categoryId);
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result);
        _mockRepository.Verify(r => r.DeleteAsync(categoryId), Times.Once);
    }

    [Fact]
    public async Task DeleteCategoryCommand_WithInvalidId_ReturnsFalse()
    {
        // Arrange
        _mockRepository.Setup(r => r.GetByIdAsync(It.IsAny<int>())).ReturnsAsync((Category?)null);

        var handler = new DeleteCategoryCommandHandler(_mockRepository.Object);

        // Act
        var command = new DeleteCategoryCommand(99999);
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result);
        _mockRepository.Verify(r => r.DeleteAsync(It.IsAny<int>()), Times.Never);
    }

    #endregion

    #region Hierarchy Tests

    [Fact]
    public async Task CategoryHierarchy_ParentChildRelationship_HandledCorrectly()
    {
        // Arrange
        var parentId = 1;
        var childId = 2;
        var parentCategory = new Category { Id = parentId, Name = "Parent", Slug = "parent", IsActive = true };
        var childCategory = new Category { Id = childId, Name = "Child", Slug = "child", ParentId = parentId, IsActive = true };

        var parentDto = new CategoryDto { Id = parentId, Name = "Parent", Slug = "parent", IsActive = true };
        var childDto = new CategoryDto { Id = childId, Name = "Child", Slug = "child", ParentId = parentId, IsActive = true };

        _mockRepository.Setup(r => r.GetByIdAsync(parentId)).ReturnsAsync(parentCategory);
        _mockRepository.Setup(r => r.GetByIdAsync(childId)).ReturnsAsync(childCategory);
        _mockMapper.Setup(m => m.Map<CategoryDto>(parentCategory)).Returns(parentDto);
        _mockMapper.Setup(m => m.Map<CategoryDto>(childCategory)).Returns(childDto);

        var handlerParent = new GetCategoryByIdQueryHandler(_mockRepository.Object, _mockMapper.Object);
        var handlerChild = new GetCategoryByIdQueryHandler(_mockRepository.Object, _mockMapper.Object);

        // Act
        var parentResult = await handlerParent.Handle(new GetCategoryByIdQuery(parentId), CancellationToken.None);
        var childResult = await handlerChild.Handle(new GetCategoryByIdQuery(childId), CancellationToken.None);

        // Assert
        Assert.NotNull(parentResult);
        Assert.NotNull(childResult);
        Assert.Null(parentResult.ParentId);
        Assert.Equal(parentId, childResult.ParentId);
    }

    #endregion
}
