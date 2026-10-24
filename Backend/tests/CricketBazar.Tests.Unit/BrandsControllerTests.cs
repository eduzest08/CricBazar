using Moq;
using Xunit;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using CricketBazar.API.Controllers;
using CricketBazar.Application.DTOs;
using CricketBazar.Domain.Entities;
using CricketBazar.Domain.Interfaces;

namespace CricketBazar.Tests.Unit;

/// <summary>
/// Unit tests for BrandsController
/// Tests controller logic in isolation using mocked repository
/// </summary>
public class BrandsControllerTests
{
    private readonly Mock<IBrandRepository> _mockRepository;
    private readonly Mock<ILogger<BrandsController>> _mockLogger;
    private readonly BrandsController _controller;

    public BrandsControllerTests()
    {
        _mockRepository = new Mock<IBrandRepository>();
        _mockLogger = new Mock<ILogger<BrandsController>>();
        _controller = new BrandsController(_mockRepository.Object, _mockLogger.Object);
    }

    #region GetAll Tests

    [Fact]
    public async Task GetAll_WithOnlyActiveFalse_ReturnsAllBrands()
    {
        // Arrange
        var brands = new List<Brand>
        {
            new Brand { Id = 1, Name = "Nike", Slug = "nike", IsActive = true },
            new Brand { Id = 2, Name = "Adidas", Slug = "adidas", IsActive = false }
        };
        _mockRepository.Setup(r => r.GetAllAsync()).ReturnsAsync(brands);

        // Act
        var result = await _controller.GetAll(onlyActive: false);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedBrands = Assert.IsType<List<BrandDto>>(okResult.Value);
        Assert.Equal(2, returnedBrands.Count);
        _mockRepository.Verify(r => r.GetAllAsync(), Times.Once);
        _mockRepository.Verify(r => r.GetActiveBrandsAsync(), Times.Never);
    }

    [Fact]
    public async Task GetAll_WithOnlyActiveTrue_ReturnsOnlyActiveBrands()
    {
        // Arrange
        var brands = new List<Brand>
        {
            new Brand { Id = 1, Name = "Nike", Slug = "nike", IsActive = true },
            new Brand { Id = 2, Name = "Adidas", Slug = "adidas", IsActive = true }
        };
        _mockRepository.Setup(r => r.GetActiveBrandsAsync()).ReturnsAsync(brands);

        // Act
        var result = await _controller.GetAll(onlyActive: true);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedBrands = Assert.IsType<List<BrandDto>>(okResult.Value);
        Assert.Equal(2, returnedBrands.Count);
        Assert.All(returnedBrands, b => Assert.True(b.IsActive));
        _mockRepository.Verify(r => r.GetActiveBrandsAsync(), Times.Once);
    }

    [Fact]
    public async Task GetAll_WithDefaultParameter_ReturnsActiveBrands()
    {
        // Arrange
        var brands = new List<Brand>
        {
            new Brand { Id = 1, Name = "Nike", Slug = "nike", IsActive = true }
        };
        _mockRepository.Setup(r => r.GetActiveBrandsAsync()).ReturnsAsync(brands);

        // Act
        var result = await _controller.GetAll();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedBrands = Assert.IsType<List<BrandDto>>(okResult.Value);
        Assert.Single(returnedBrands);
        _mockRepository.Verify(r => r.GetActiveBrandsAsync(), Times.Once);
    }

    [Fact]
    public async Task GetAll_WithEmptyList_ReturnsEmptyList()
    {
        // Arrange
        _mockRepository.Setup(r => r.GetActiveBrandsAsync()).ReturnsAsync(new List<Brand>());

        // Act
        var result = await _controller.GetAll();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedBrands = Assert.IsType<List<BrandDto>>(okResult.Value);
        Assert.Empty(returnedBrands);
    }

    #endregion

    #region GetById Tests

    [Fact]
    public async Task GetById_WithValidId_ReturnsBrand()
    {
        // Arrange
        var brandId = 1;
        var brand = new Brand { Id = brandId, Name = "Nike", Slug = "nike", LogoUrl = "https://logo.png", IsActive = true };
        _mockRepository.Setup(r => r.GetByIdAsync(brandId)).ReturnsAsync(brand);

        // Act
        var result = await _controller.GetById(brandId);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedBrand = Assert.IsType<BrandDto>(okResult.Value);
        Assert.Equal(brandId, returnedBrand.Id);
        Assert.Equal("Nike", returnedBrand.Name);
        Assert.Equal("nike", returnedBrand.Slug);
        _mockRepository.Verify(r => r.GetByIdAsync(brandId), Times.Once);
    }

    [Fact]
    public async Task GetById_WithInvalidId_ReturnsNotFound()
    {
        // Arrange
        var brandId = 999;
        _mockRepository.Setup(r => r.GetByIdAsync(brandId)).ReturnsAsync((Brand?)null);

        // Act
        var result = await _controller.GetById(brandId);

        // Assert
        Assert.IsType<NotFoundObjectResult>(result.Result);
        _mockRepository.Verify(r => r.GetByIdAsync(brandId), Times.Once);
    }

    [Fact]
    public async Task GetById_VerifyDtoMapping_ContainsAllProperties()
    {
        // Arrange
        var brand = new Brand
        {
            Id = 5,
            Name = "Willow Sports",
            Slug = "willow-sports",
            LogoUrl = "https://willow.png",
            IsActive = true
        };
        _mockRepository.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(brand);

        // Act
        var result = await _controller.GetById(5);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var dto = Assert.IsType<BrandDto>(okResult.Value);
        Assert.Equal(brand.Id, dto.Id);
        Assert.Equal(brand.Name, dto.Name);
        Assert.Equal(brand.Slug, dto.Slug);
        Assert.Equal(brand.LogoUrl, dto.LogoUrl);
        Assert.Equal(brand.IsActive, dto.IsActive);
    }

    #endregion

    #region GetBySlug Tests

    [Fact]
    public async Task GetBySlug_WithValidSlug_ReturnsBrand()
    {
        // Arrange
        var slug = "nike";
        var brand = new Brand { Id = 1, Name = "Nike", Slug = slug, IsActive = true };
        _mockRepository.Setup(r => r.GetBySlugAsync(slug)).ReturnsAsync(brand);

        // Act
        var result = await _controller.GetBySlug(slug);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedBrand = Assert.IsType<BrandDto>(okResult.Value);
        Assert.Equal("Nike", returnedBrand.Name);
        Assert.Equal(slug, returnedBrand.Slug);
        _mockRepository.Verify(r => r.GetBySlugAsync(slug), Times.Once);
    }

    [Fact]
    public async Task GetBySlug_WithInvalidSlug_ReturnsNotFound()
    {
        // Arrange
        var slug = "nonexistent-brand";
        _mockRepository.Setup(r => r.GetBySlugAsync(slug)).ReturnsAsync((Brand?)null);

        // Act
        var result = await _controller.GetBySlug(slug);

        // Assert
        Assert.IsType<NotFoundObjectResult>(result.Result);
        _mockRepository.Verify(r => r.GetBySlugAsync(slug), Times.Once);
    }

    #endregion

    #region Create Tests

    [Fact]
    public async Task Create_WithValidUniqueSlug_ReturnsCreatedAtAction()
    {
        // Arrange
        var createDto = new CreateBrandDto
        {
            Name = "New Brand",
            Slug = "new-brand",
            LogoUrl = "https://logo.png"
        };
        _mockRepository.Setup(r => r.GetBySlugAsync("new-brand")).ReturnsAsync((Brand?)null);
        _mockRepository.Setup(r => r.AddAsync(It.IsAny<Brand>()))
            .Callback<Brand>(b => b.Id = 1)
            .Returns(Task.FromResult(1));

        // Act
        var result = await _controller.Create(createDto);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        Assert.Equal(nameof(BrandsController.GetById), createdResult.ActionName);
        var returnedBrand = Assert.IsType<BrandDto>(createdResult.Value);
        Assert.Equal("New Brand", returnedBrand.Name);
        Assert.Equal("new-brand", returnedBrand.Slug);
        _mockRepository.Verify(r => r.GetBySlugAsync("new-brand"), Times.Once);
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<Brand>()), Times.Once);
    }

    [Fact]
    public async Task Create_WithDuplicateSlug_ReturnsBadRequest()
    {
        // Arrange
        var createDto = new CreateBrandDto
        {
            Name = "New Brand",
            Slug = "existing-brand",
            LogoUrl = "https://logo.png"
        };
        var existingBrand = new Brand { Id = 1, Name = "Existing Brand", Slug = "existing-brand", IsActive = true };
        _mockRepository.Setup(r => r.GetBySlugAsync("existing-brand")).ReturnsAsync(existingBrand);

        // Act
        var result = await _controller.Create(createDto);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.NotNull(badRequestResult.Value);
        _mockRepository.Verify(r => r.GetBySlugAsync("existing-brand"), Times.Once);
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<Brand>()), Times.Never);
    }

    [Fact]
    public async Task Create_WithNullLogoUrl_CreatesSuccessfully()
    {
        // Arrange
        var createDto = new CreateBrandDto
        {
            Name = "No Logo Brand",
            Slug = "no-logo-brand",
            LogoUrl = null
        };
        _mockRepository.Setup(r => r.GetBySlugAsync("no-logo-brand")).ReturnsAsync((Brand?)null);
        _mockRepository.Setup(r => r.AddAsync(It.IsAny<Brand>()))
            .Callback<Brand>(b => b.Id = 2)
            .Returns(Task.FromResult(2));

        // Act
        var result = await _controller.Create(createDto);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var returnedBrand = Assert.IsType<BrandDto>(createdResult.Value);
        Assert.Null(returnedBrand.LogoUrl);
    }

    [Fact]
    public async Task Create_ProperlySetsIsActiveToTrue()
    {
        // Arrange
        var createDto = new CreateBrandDto
        {
            Name = "Active Brand",
            Slug = "active-brand"
        };
        Brand? capturedBrand = null;
        _mockRepository.Setup(r => r.GetBySlugAsync(It.IsAny<string>())).ReturnsAsync((Brand?)null);
        _mockRepository.Setup(r => r.AddAsync(It.IsAny<Brand>()))
            .Callback<Brand>(b =>
            {
                b.Id = 1;
                capturedBrand = b;
            })
            .Returns(Task.FromResult(1));

        // Act
        await _controller.Create(createDto);

        // Assert
        Assert.NotNull(capturedBrand);
        Assert.True(capturedBrand.IsActive);
    }

    #endregion

    #region Update Tests

    [Fact]
    public async Task Update_WithValidId_ReturnsOk()
    {
        // Arrange
        var brandId = 1;
        var updateDto = new UpdateBrandDto
        {
            Name = "Updated Brand",
            Slug = "updated-brand",
            IsActive = true
        };
        var existingBrand = new Brand { Id = brandId, Name = "Old Name", Slug = "old-slug", IsActive = true };
        _mockRepository.Setup(r => r.GetByIdAsync(brandId)).ReturnsAsync(existingBrand);
        _mockRepository.Setup(r => r.UpdateAsync(It.IsAny<Brand>())).ReturnsAsync(true);

        // Act
        var result = await _controller.Update(brandId, updateDto);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedBrand = Assert.IsType<BrandDto>(okResult.Value);
        Assert.Equal("Updated Brand", returnedBrand.Name);
        Assert.Equal("updated-brand", returnedBrand.Slug);
        _mockRepository.Verify(r => r.GetByIdAsync(brandId), Times.Once);
        _mockRepository.Verify(r => r.UpdateAsync(It.IsAny<Brand>()), Times.Once);
    }

    [Fact]
    public async Task Update_WithInvalidId_ReturnsNotFound()
    {
        // Arrange
        var brandId = 999;
        var updateDto = new UpdateBrandDto { Name = "Updated", Slug = "updated", IsActive = true };
        _mockRepository.Setup(r => r.GetByIdAsync(brandId)).ReturnsAsync((Brand?)null);

        // Act
        var result = await _controller.Update(brandId, updateDto);

        // Assert
        Assert.IsType<NotFoundObjectResult>(result.Result);
        _mockRepository.Verify(r => r.UpdateAsync(It.IsAny<Brand>()), Times.Never);
    }

    [Fact]
    public async Task Update_PreservesAllProperties()
    {
        // Arrange
        var brandId = 1;
        var updateDto = new UpdateBrandDto
        {
            Name = "Updated",
            Slug = "updated",
            LogoUrl = "https://new-logo.png",
            IsActive = false
        };
        var existingBrand = new Brand { Id = brandId, Name = "Old", Slug = "old", LogoUrl = "https://old.png", IsActive = true };
        Brand? capturedBrand = null;
        _mockRepository.Setup(r => r.GetByIdAsync(brandId)).ReturnsAsync(existingBrand);
        _mockRepository.Setup(r => r.UpdateAsync(It.IsAny<Brand>()))
            .Callback<Brand>(b => capturedBrand = b)
            .ReturnsAsync(true);

        // Act
        await _controller.Update(brandId, updateDto);

        // Assert
        Assert.NotNull(capturedBrand);
        Assert.Equal("Updated", capturedBrand.Name);
        Assert.Equal("updated", capturedBrand.Slug);
        Assert.Equal("https://new-logo.png", capturedBrand.LogoUrl);
        Assert.False(capturedBrand.IsActive);
    }

    #endregion

    #region Delete Tests

    [Fact]
    public async Task Delete_WithValidId_ReturnsNoContent()
    {
        // Arrange
        var brandId = 1;
        var brand = new Brand { Id = brandId, Name = "Nike", Slug = "nike", IsActive = true };
        _mockRepository.Setup(r => r.GetByIdAsync(brandId)).ReturnsAsync(brand);
        _mockRepository.Setup(r => r.DeleteAsync(brandId)).ReturnsAsync(true);

        // Act
        var result = await _controller.Delete(brandId);

        // Assert
        Assert.IsType<NoContentResult>(result);
        _mockRepository.Verify(r => r.GetByIdAsync(brandId), Times.Once);
        _mockRepository.Verify(r => r.DeleteAsync(brandId), Times.Once);
    }

    [Fact]
    public async Task Delete_WithInvalidId_ReturnsNotFound()
    {
        // Arrange
        var brandId = 999;
        _mockRepository.Setup(r => r.GetByIdAsync(brandId)).ReturnsAsync((Brand?)null);

        // Act
        var result = await _controller.Delete(brandId);

        // Assert
        Assert.IsType<NotFoundObjectResult>(result);
        _mockRepository.Verify(r => r.DeleteAsync(It.IsAny<int>()), Times.Never);
    }

    #endregion
}
