using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using CricketBazar.API.Controllers;
using CricketBazar.Application.Commands.Products;
using CricketBazar.Application.DTOs;
using CricketBazar.Application.Queries.Products;

namespace CricketBazar.Tests.Unit;

public class ProductsControllerTests
{
    private readonly Mock<IMediator> _mediator = new();
    private readonly ProductsController _controller;

    public ProductsControllerTests()
    {
        _controller = new ProductsController(_mediator.Object, Mock.Of<ILogger<ProductsController>>());
    }

    private static ProductDto NewProductDto(int id = 1) => new()
    {
        Id = id, Name = "Bat", Slug = "bat", Sku = "SKU-1", Mrp = 100, SalePrice = 80, IsActive = true
    };

    [Fact]
    public async Task GetAll_PassesFiltersToQuery_AndReturnsOk()
    {
        var page = new PaginatedResponse<ProductDto>
        {
            Items = new List<ProductDto> { NewProductDto() }, TotalCount = 1, PageNumber = 2, PageSize = 5
        };
        _mediator.Setup(m => m.Send(It.IsAny<GetProductsListQuery>(), It.IsAny<CancellationToken>())).ReturnsAsync(page);

        var result = await _controller.GetAll(2, 5, 3, 4, 10m, 500m, "bat", "price_asc");

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(page, ok.Value);
        _mediator.Verify(m => m.Send(It.Is<GetProductsListQuery>(q =>
            q.PageNumber == 2 && q.PageSize == 5 && q.CategoryId == 3 && q.BrandId == 4 &&
            q.MinPrice == 10m && q.MaxPrice == 500m && q.SearchTerm == "bat" && q.SortBy == "price_asc"),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetAll_Defaults_UsePage1Size20Newest()
    {
        _mediator.Setup(m => m.Send(It.IsAny<GetProductsListQuery>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PaginatedResponse<ProductDto>());

        await _controller.GetAll();

        _mediator.Verify(m => m.Send(It.Is<GetProductsListQuery>(q =>
            q.PageNumber == 1 && q.PageSize == 20 && q.SortBy == "newest"), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetById_Existing_ReturnsOk()
    {
        _mediator.Setup(m => m.Send(It.IsAny<GetProductByIdQuery>(), It.IsAny<CancellationToken>())).ReturnsAsync(NewProductDto(7));

        var result = await _controller.GetById(7);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(7, Assert.IsType<ProductDto>(ok.Value).Id);
        _mediator.Verify(m => m.Send(It.Is<GetProductByIdQuery>(q => q.Id == 7), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetById_Missing_ReturnsNotFound()
    {
        _mediator.Setup(m => m.Send(It.IsAny<GetProductByIdQuery>(), It.IsAny<CancellationToken>())).ReturnsAsync((ProductDto?)null);

        var result = await _controller.GetById(99);

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetBySlug_Existing_ReturnsOk()
    {
        _mediator.Setup(m => m.Send(It.IsAny<GetProductBySlugQuery>(), It.IsAny<CancellationToken>())).ReturnsAsync(NewProductDto());

        var result = await _controller.GetBySlug("bat");

        Assert.IsType<OkObjectResult>(result.Result);
        _mediator.Verify(m => m.Send(It.Is<GetProductBySlugQuery>(q => q.Slug == "bat"), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetBySlug_Missing_ReturnsNotFound()
    {
        _mediator.Setup(m => m.Send(It.IsAny<GetProductBySlugQuery>(), It.IsAny<CancellationToken>())).ReturnsAsync((ProductDto?)null);

        var result = await _controller.GetBySlug("nope");

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task Create_ReturnsCreatedAtGetById()
    {
        _mediator.Setup(m => m.Send(It.IsAny<CreateProductCommand>(), It.IsAny<CancellationToken>())).ReturnsAsync(NewProductDto(5));
        var dto = new CreateProductDto { Name = "Bat", Slug = "bat", Sku = "SKU-1" };

        var result = await _controller.Create(dto);

        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        Assert.Equal(nameof(ProductsController.GetById), created.ActionName);
        Assert.Equal(5, created.RouteValues!["id"]);
        Assert.Equal(5, Assert.IsType<ProductDto>(created.Value).Id);
    }

    [Fact]
    public async Task Update_Existing_ReturnsOk()
    {
        _mediator.Setup(m => m.Send(It.IsAny<UpdateProductCommand>(), It.IsAny<CancellationToken>())).ReturnsAsync(NewProductDto(2));
        var dto = new UpdateProductDto { Name = "Bat", Slug = "bat", Sku = "SKU-1" };

        var result = await _controller.Update(2, dto);

        Assert.IsType<OkObjectResult>(result.Result);
        _mediator.Verify(m => m.Send(It.Is<UpdateProductCommand>(c => c.Id == 2 && c.Product == dto), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Update_Missing_ReturnsNotFound()
    {
        _mediator.Setup(m => m.Send(It.IsAny<UpdateProductCommand>(), It.IsAny<CancellationToken>())).ThrowsAsync(new KeyNotFoundException());

        var result = await _controller.Update(2, new UpdateProductDto { Name = "a", Slug = "a", Sku = "a" });

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task Delete_Existing_ReturnsNoContent()
    {
        _mediator.Setup(m => m.Send(It.IsAny<DeleteProductCommand>(), It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var result = await _controller.Delete(1);

        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task Delete_Missing_ReturnsNotFound()
    {
        _mediator.Setup(m => m.Send(It.IsAny<DeleteProductCommand>(), It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var result = await _controller.Delete(1);

        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task AddImage_Existing_ReturnsCreated()
    {
        _mediator.Setup(m => m.Send(It.IsAny<AddProductImageCommand>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ProductImageDto { Id = 1, Url = "http://x/y.png" });

        var result = await _controller.AddImage(3, new CreateProductImageDto { Url = "http://x/y.png" });

        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        Assert.Equal(3, created.RouteValues!["id"]);
    }

    [Fact]
    public async Task AddImage_MissingProduct_ReturnsNotFound()
    {
        _mediator.Setup(m => m.Send(It.IsAny<AddProductImageCommand>(), It.IsAny<CancellationToken>())).ThrowsAsync(new KeyNotFoundException());

        var result = await _controller.AddImage(3, new CreateProductImageDto { Url = "u" });

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task AddVariant_Existing_ReturnsCreated()
    {
        _mediator.Setup(m => m.Send(It.IsAny<AddProductVariantCommand>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ProductVariantDto { Id = 1, Size = "L" });

        var result = await _controller.AddVariant(3, new CreateProductVariantDto { Size = "L" });

        Assert.IsType<CreatedAtActionResult>(result.Result);
    }

    [Fact]
    public async Task AddVariant_MissingProduct_ReturnsNotFound()
    {
        _mediator.Setup(m => m.Send(It.IsAny<AddProductVariantCommand>(), It.IsAny<CancellationToken>())).ThrowsAsync(new KeyNotFoundException());

        var result = await _controller.AddVariant(3, new CreateProductVariantDto());

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }
}
