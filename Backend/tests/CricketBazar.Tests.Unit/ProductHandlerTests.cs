using AutoMapper;
using Moq;
using Xunit;
using CricketBazar.Application.Commands.Products;
using CricketBazar.Application.DTOs;
using CricketBazar.Application.Queries.Products;
using CricketBazar.Domain.Entities;
using CricketBazar.Domain.Interfaces;

namespace CricketBazar.Tests.Unit;

public class ProductHandlerTests
{
    private readonly Mock<IProductRepository> _repo = new();
    private readonly Mock<IMapper> _mapper = new();

    private static Product NewProduct(int id = 1) => new() { Id = id, Name = "Bat", Slug = "bat", Sku = "SKU-1" };
    private static ProductDto NewDto(int id = 1) => new() { Id = id, Name = "Bat", Slug = "bat", Sku = "SKU-1" };

    [Fact]
    public async Task GetById_Existing_ReturnsMappedDto()
    {
        var product = NewProduct();
        _repo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(product);
        _mapper.Setup(m => m.Map<ProductDto?>(product)).Returns(NewDto());

        var result = await new GetProductByIdQueryHandler(_repo.Object, _mapper.Object)
            .Handle(new GetProductByIdQuery(1), CancellationToken.None);

        Assert.Equal(1, result!.Id);
    }

    [Fact]
    public async Task GetById_Missing_ReturnsNull()
    {
        _repo.Setup(r => r.GetByIdAsync(It.IsAny<int>())).ReturnsAsync((Product?)null);
        _mapper.Setup(m => m.Map<ProductDto?>(null)).Returns((ProductDto?)null);

        var result = await new GetProductByIdQueryHandler(_repo.Object, _mapper.Object)
            .Handle(new GetProductByIdQuery(9), CancellationToken.None);

        Assert.Null(result);
    }

    [Fact]
    public async Task GetBySlug_Existing_ReturnsMappedDto()
    {
        var product = NewProduct();
        _repo.Setup(r => r.GetBySlugAsync("bat")).ReturnsAsync(product);
        _mapper.Setup(m => m.Map<ProductDto?>(product)).Returns(NewDto());

        var result = await new GetProductBySlugQueryHandler(_repo.Object, _mapper.Object)
            .Handle(new GetProductBySlugQuery("bat"), CancellationToken.None);

        Assert.Equal("bat", result!.Slug);
    }

    [Fact]
    public async Task GetList_ForwardsFilters_AndBuildsPagedResponse()
    {
        var products = new List<Product> { NewProduct(), NewProduct(2) };
        _repo.Setup(r => r.SearchAsync("bat", 3, 4, 10m, 500m, 2, 5, "price_asc"))
            .ReturnsAsync(((IEnumerable<Product>)products, 12));
        _mapper.Setup(m => m.Map<List<ProductDto>>(It.IsAny<IEnumerable<Product>>()))
            .Returns(new List<ProductDto> { NewDto(), NewDto(2) });

        var query = new GetProductsListQuery
        {
            SearchTerm = "bat", CategoryId = 3, BrandId = 4, MinPrice = 10m, MaxPrice = 500m,
            PageNumber = 2, PageSize = 5, SortBy = "price_asc"
        };
        var result = await new GetProductsListQueryHandler(_repo.Object, _mapper.Object).Handle(query, CancellationToken.None);

        Assert.Equal(2, result.Items.Count);
        Assert.Equal(12, result.TotalCount);
        Assert.Equal(2, result.PageNumber);
        Assert.Equal(5, result.PageSize);
    }

    [Fact]
    public async Task GetList_NullSortBy_DefaultsToNewest()
    {
        _repo.Setup(r => r.SearchAsync(null, null, null, null, null, 1, 20, "newest"))
            .ReturnsAsync((Enumerable.Empty<Product>(), 0));
        _mapper.Setup(m => m.Map<List<ProductDto>>(It.IsAny<IEnumerable<Product>>())).Returns(new List<ProductDto>());

        await new GetProductsListQueryHandler(_repo.Object, _mapper.Object)
            .Handle(new GetProductsListQuery { SortBy = null }, CancellationToken.None);

        _repo.Verify(r => r.SearchAsync(null, null, null, null, null, 1, 20, "newest"), Times.Once);
    }

    [Fact]
    public async Task Create_SetsCreatedAt_PersistsAndReturnsDto()
    {
        var createDto = new CreateProductDto { Name = "Bat", Slug = "bat", Sku = "SKU-1" };
        var product = NewProduct(0);
        _mapper.Setup(m => m.Map<Product>(createDto)).Returns(product);
        _repo.Setup(r => r.AddAsync(product)).ReturnsAsync(1);
        _mapper.Setup(m => m.Map<ProductDto>(product)).Returns(NewDto());
        var before = DateTime.UtcNow;

        var result = await new CreateProductCommandHandler(_repo.Object, _mapper.Object)
            .Handle(new CreateProductCommand { Product = createDto }, CancellationToken.None);

        Assert.NotNull(result);
        Assert.True(product.CreatedAt >= before);
        _repo.Verify(r => r.AddAsync(product), Times.Once);
    }

    [Fact]
    public async Task Update_Existing_MapsOntoEntityAndSaves()
    {
        var product = NewProduct();
        var updateDto = new UpdateProductDto { Name = "New", Slug = "new", Sku = "SKU-2" };
        _repo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(product);
        _repo.Setup(r => r.UpdateAsync(product)).ReturnsAsync(true);
        _mapper.Setup(m => m.Map<ProductDto>(product)).Returns(NewDto());

        var result = await new UpdateProductCommandHandler(_repo.Object, _mapper.Object)
            .Handle(new UpdateProductCommand { Id = 1, Product = updateDto }, CancellationToken.None);

        Assert.NotNull(result);
        _mapper.Verify(m => m.Map(updateDto, product), Times.Once);
        _repo.Verify(r => r.UpdateAsync(product), Times.Once);
    }

    [Fact]
    public async Task Update_Missing_ThrowsKeyNotFound()
    {
        _repo.Setup(r => r.GetByIdAsync(It.IsAny<int>())).ReturnsAsync((Product?)null);

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            new UpdateProductCommandHandler(_repo.Object, _mapper.Object).Handle(
                new UpdateProductCommand { Id = 9, Product = new UpdateProductDto { Name = "a", Slug = "a", Sku = "a" } },
                CancellationToken.None));
        _repo.Verify(r => r.UpdateAsync(It.IsAny<Product>()), Times.Never);
    }

    [Fact]
    public async Task Delete_Existing_DeletesAndReturnsTrue()
    {
        _repo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(NewProduct());
        _repo.Setup(r => r.DeleteAsync(1)).ReturnsAsync(true);

        var result = await new DeleteProductCommandHandler(_repo.Object).Handle(new DeleteProductCommand(1), CancellationToken.None);

        Assert.True(result);
        _repo.Verify(r => r.DeleteAsync(1), Times.Once);
    }

    [Fact]
    public async Task Delete_Missing_ReturnsFalse_WithoutDeleting()
    {
        _repo.Setup(r => r.GetByIdAsync(It.IsAny<int>())).ReturnsAsync((Product?)null);

        var result = await new DeleteProductCommandHandler(_repo.Object).Handle(new DeleteProductCommand(9), CancellationToken.None);

        Assert.False(result);
        _repo.Verify(r => r.DeleteAsync(It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task AddImage_Existing_SetsProductId()
    {
        var image = new ProductImage { Url = "u" };
        _repo.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(NewProduct(3));
        _mapper.Setup(m => m.Map<ProductImage>(It.IsAny<CreateProductImageDto>())).Returns(image);
        _mapper.Setup(m => m.Map<ProductImageDto>(image)).Returns(new ProductImageDto { Url = "u" });

        var result = await new AddProductImageCommandHandler(_repo.Object, _mapper.Object)
            .Handle(new AddProductImageCommand { ProductId = 3, Image = new CreateProductImageDto { Url = "u" } }, CancellationToken.None);

        Assert.Equal(3, image.ProductId);
        Assert.Equal("u", result.Url);
    }

    [Fact]
    public async Task AddImage_MissingProduct_Throws()
    {
        _repo.Setup(r => r.GetByIdAsync(It.IsAny<int>())).ReturnsAsync((Product?)null);

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            new AddProductImageCommandHandler(_repo.Object, _mapper.Object).Handle(
                new AddProductImageCommand { ProductId = 3, Image = new CreateProductImageDto { Url = "u" } }, CancellationToken.None));
    }

    [Fact]
    public async Task AddVariant_Existing_SetsProductId()
    {
        var variant = new ProductVariant();
        _repo.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(NewProduct(3));
        _mapper.Setup(m => m.Map<ProductVariant>(It.IsAny<CreateProductVariantDto>())).Returns(variant);
        _mapper.Setup(m => m.Map<ProductVariantDto>(variant)).Returns(new ProductVariantDto { Size = "L" });

        var result = await new AddProductVariantCommandHandler(_repo.Object, _mapper.Object)
            .Handle(new AddProductVariantCommand { ProductId = 3, Variant = new CreateProductVariantDto { Size = "L" } }, CancellationToken.None);

        Assert.Equal(3, variant.ProductId);
        Assert.Equal("L", result.Size);
    }

    [Fact]
    public async Task AddVariant_MissingProduct_Throws()
    {
        _repo.Setup(r => r.GetByIdAsync(It.IsAny<int>())).ReturnsAsync((Product?)null);

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            new AddProductVariantCommandHandler(_repo.Object, _mapper.Object).Handle(
                new AddProductVariantCommand { ProductId = 3, Variant = new CreateProductVariantDto() }, CancellationToken.None));
    }
}
