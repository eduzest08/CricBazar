using Xunit;
using CricketBazar.Application.DTOs;
using CricketBazar.Domain.Entities;

namespace CricketBazar.Tests.Unit;

/// <summary>
/// Unit tests for Brand DTOs
/// Tests DTO creation, validation, and mapping
/// </summary>
public class BrandDtoTests
{
    #region BrandDto Tests

    [Fact]
    public void BrandDto_CanBeCreated_WithAllProperties()
    {
        // Act
        var dto = new BrandDto
        {
            Id = 1,
            Name = "Nike",
            Slug = "nike",
            LogoUrl = "https://logo.png",
            IsActive = true
        };

        // Assert
        Assert.Equal(1, dto.Id);
        Assert.Equal("Nike", dto.Name);
        Assert.Equal("nike", dto.Slug);
        Assert.Equal("https://logo.png", dto.LogoUrl);
        Assert.True(dto.IsActive);
    }

    [Fact]
    public void BrandDto_CanHaveNullLogoUrl()
    {
        // Act
        var dto = new BrandDto
        {
            Id = 1,
            Name = "Brand",
            Slug = "brand",
            LogoUrl = null,
            IsActive = true
        };

        // Assert
        Assert.Null(dto.LogoUrl);
    }

    [Fact]
    public void BrandDto_CanMapFromEntity()
    {
        // Arrange
        var entity = new Brand
        {
            Id = 5,
            Name = "Adidas",
            Slug = "adidas",
            LogoUrl = "https://adidas.png",
            IsActive = true
        };

        // Act
        var dto = new BrandDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Slug = entity.Slug,
            LogoUrl = entity.LogoUrl,
            IsActive = entity.IsActive
        };

        // Assert
        Assert.Equal(entity.Id, dto.Id);
        Assert.Equal(entity.Name, dto.Name);
        Assert.Equal(entity.Slug, dto.Slug);
        Assert.Equal(entity.LogoUrl, dto.LogoUrl);
        Assert.Equal(entity.IsActive, dto.IsActive);
    }

    #endregion

    #region CreateBrandDto Tests

    [Fact]
    public void CreateBrandDto_CanBeCreated_WithAllProperties()
    {
        // Act
        var dto = new CreateBrandDto
        {
            Name = "Nike",
            Slug = "nike",
            LogoUrl = "https://logo.png"
        };

        // Assert
        Assert.Equal("Nike", dto.Name);
        Assert.Equal("nike", dto.Slug);
        Assert.Equal("https://logo.png", dto.LogoUrl);
    }

    [Fact]
    public void CreateBrandDto_LogoUrlIsOptional()
    {
        // Act
        var dto = new CreateBrandDto
        {
            Name = "Nike",
            Slug = "nike",
            LogoUrl = null
        };

        // Assert
        Assert.Null(dto.LogoUrl);
    }

    [Fact]
    public void CreateBrandDto_CanMapToEntity()
    {
        // Arrange
        var dto = new CreateBrandDto
        {
            Name = "Nike",
            Slug = "nike",
            LogoUrl = "https://logo.png"
        };

        // Act
        var entity = new Brand
        {
            Name = dto.Name,
            Slug = dto.Slug,
            LogoUrl = dto.LogoUrl,
            IsActive = true
        };

        // Assert
        Assert.Equal(dto.Name, entity.Name);
        Assert.Equal(dto.Slug, entity.Slug);
        Assert.Equal(dto.LogoUrl, entity.LogoUrl);
        Assert.True(entity.IsActive);
    }

    [Theory]
    [InlineData("Nike", "nike")]
    [InlineData("Adidas", "adidas")]
    [InlineData("Puma", "puma")]
    public void CreateBrandDto_AcceptsVariousNames(string name, string slug)
    {
        // Act
        var dto = new CreateBrandDto { Name = name, Slug = slug };

        // Assert
        Assert.Equal(name, dto.Name);
        Assert.Equal(slug, dto.Slug);
    }

    #endregion

    #region UpdateBrandDto Tests

    [Fact]
    public void UpdateBrandDto_CanBeCreated_WithAllProperties()
    {
        // Act
        var dto = new UpdateBrandDto
        {
            Name = "Updated Nike",
            Slug = "updated-nike",
            LogoUrl = "https://new-logo.png",
            IsActive = false
        };

        // Assert
        Assert.Equal("Updated Nike", dto.Name);
        Assert.Equal("updated-nike", dto.Slug);
        Assert.Equal("https://new-logo.png", dto.LogoUrl);
        Assert.False(dto.IsActive);
    }

    [Fact]
    public void UpdateBrandDto_LogoUrlIsOptional()
    {
        // Act
        var dto = new UpdateBrandDto
        {
            Name = "Brand",
            Slug = "brand",
            LogoUrl = null,
            IsActive = true
        };

        // Assert
        Assert.Null(dto.LogoUrl);
    }

    [Fact]
    public void UpdateBrandDto_CanDeactivateBrand()
    {
        // Act
        var dto = new UpdateBrandDto
        {
            Name = "Nike",
            Slug = "nike",
            IsActive = false
        };

        // Assert
        Assert.False(dto.IsActive);
    }

    [Fact]
    public void UpdateBrandDto_CanReactivateBrand()
    {
        // Act
        var dto = new UpdateBrandDto
        {
            Name = "Nike",
            Slug = "nike",
            IsActive = true
        };

        // Assert
        Assert.True(dto.IsActive);
    }

    [Fact]
    public void UpdateBrandDto_CanMapToEntity()
    {
        // Arrange
        var dto = new UpdateBrandDto
        {
            Name = "Updated",
            Slug = "updated",
            LogoUrl = "https://new.png",
            IsActive = false
        };
        var entity = new Brand
        {
            Id = 1,
            Name = "Old",
            Slug = "old",
            IsActive = true
        };

        // Act
        entity.Name = dto.Name;
        entity.Slug = dto.Slug;
        entity.LogoUrl = dto.LogoUrl;
        entity.IsActive = dto.IsActive;

        // Assert
        Assert.Equal(dto.Name, entity.Name);
        Assert.Equal(dto.Slug, entity.Slug);
        Assert.Equal(dto.LogoUrl, entity.LogoUrl);
        Assert.Equal(dto.IsActive, entity.IsActive);
    }

    #endregion

    #region DTO Equality and Comparison Tests

    [Fact]
    public void BrandDto_TwoDtosWithSameValues_AreNotEqualByReference()
    {
        // Arrange
        var dto1 = new BrandDto { Id = 1, Name = "Nike", Slug = "nike", IsActive = true };
        var dto2 = new BrandDto { Id = 1, Name = "Nike", Slug = "nike", IsActive = true };

        // Assert
        Assert.NotSame(dto1, dto2);
    }

    [Fact]
    public void BrandDto_PropertiesCanBeModified()
    {
        // Arrange
        var dto = new BrandDto { Id = 1, Name = "Nike", Slug = "nike", IsActive = true };

        // Act
        dto.Name = "Modified";
        dto.IsActive = false;

        // Assert
        Assert.Equal("Modified", dto.Name);
        Assert.False(dto.IsActive);
    }

    #endregion

    #region DTO Validation Tests

    [Theory]
    [InlineData("")]
    [InlineData("a")]
    [InlineData("ab-")]
    [InlineData("AB-CD")]
    public void CreateBrandDto_AcceptsVariousSlugFormats(string slug)
    {
        // Act
        var dto = new CreateBrandDto { Name = "Brand", Slug = slug };

        // Assert
        Assert.Equal(slug, dto.Slug);
    }

    [Fact]
    public void BrandDto_StringProperties_AreNotTrimmedAutomatically()
    {
        // Arrange & Act
        var dto = new BrandDto
        {
            Id = 1,
            Name = "  Nike  ",
            Slug = "  nike  ",
            IsActive = true
        };

        // Assert
        Assert.Equal("  Nike  ", dto.Name);
        Assert.Equal("  nike  ", dto.Slug);
    }

    #endregion

    #region DTO Collection Tests

    [Fact]
    public void BrandDtoList_CanBeCreatedAndManipulated()
    {
        // Arrange
        var brands = new List<BrandDto>
        {
            new BrandDto { Id = 1, Name = "Nike", Slug = "nike", IsActive = true },
            new BrandDto { Id = 2, Name = "Adidas", Slug = "adidas", IsActive = true },
            new BrandDto { Id = 3, Name = "Puma", Slug = "puma", IsActive = false }
        };

        // Act
        var activeBrands = brands.Where(b => b.IsActive).ToList();

        // Assert
        Assert.Equal(2, activeBrands.Count);
        Assert.All(activeBrands, b => Assert.True(b.IsActive));
    }

    [Fact]
    public void BrandDto_CanBeConvertedToJson()
    {
        // Arrange
        var dto = new BrandDto
        {
            Id = 1,
            Name = "Nike",
            Slug = "nike",
            LogoUrl = "https://logo.png",
            IsActive = true
        };

        // Act
        var json = System.Text.Json.JsonSerializer.Serialize(dto);

        // Assert
        Assert.Contains("Nike", json);
        Assert.Contains("nike", json);
        Assert.NotEmpty(json);
    }

    #endregion
}
