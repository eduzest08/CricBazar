namespace CricketBazar.API.Controllers;

using MediatR;
using Microsoft.AspNetCore.Mvc;
using CricketBazar.Application.DTOs;
using CricketBazar.Application.Commands.Products;
using CricketBazar.Application.Queries.Products;
using CricketBazar.Domain.Interfaces;

[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public class ProductsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<ProductsController> _logger;

    public ProductsController(IMediator mediator, ILogger<ProductsController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Get all products with optional filtering and pagination
    /// </summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<PaginatedResponse<ProductDto>>> GetAll(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] int? categoryId = null,
        [FromQuery] int? brandId = null,
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] string? searchTerm = null,
        [FromQuery] string? sortBy = "newest",
        [FromQuery] bool isActive = true)
    {
        _logger.LogInformation("Getting products - Page: {PageNumber}, Size: {PageSize}, Category: {CategoryId}", pageNumber, pageSize, categoryId);
        
        var query = new GetProductsListQuery
        {
            PageNumber = pageNumber,
            PageSize = pageSize,
            CategoryId = categoryId,
            BrandId = brandId,
            MinPrice = minPrice,
            MaxPrice = maxPrice,
            SearchTerm = searchTerm,
            SortBy = sortBy,
            IsActive = isActive
        };

        var products = await _mediator.Send(query);
        return Ok(products);
    }

    /// <summary>
    /// Get product by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductDto>> GetById(int id)
    {
        _logger.LogInformation("Getting product with ID: {ProductId}", id);
        
        var product = await _mediator.Send(new GetProductByIdQuery(id));
        
        if (product == null)
            return NotFound(new { message = "Product not found" });

        return Ok(product);
    }

    /// <summary>
    /// Get product by slug (for detail page)
    /// </summary>
    [HttpGet("slug/{slug}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductDto>> GetBySlug(string slug)
    {
        _logger.LogInformation("Getting product with slug: {Slug}", slug);
        
        var product = await _mediator.Send(new GetProductBySlugQuery(slug));
        
        if (product == null)
            return NotFound(new { message = "Product not found" });

        return Ok(product);
    }

    /// <summary>
    /// Create a new product (Admin only)
    /// </summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ProductDto>> Create([FromBody] CreateProductDto createProductDto)
    {
        _logger.LogInformation("Creating new product: {ProductName}", createProductDto.Name);
        
        var command = new CreateProductCommand { Product = createProductDto };
        var result = await _mediator.Send(command);
        
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    /// <summary>
    /// Update an existing product (Admin only)
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductDto>> Update(int id, [FromBody] UpdateProductDto updateProductDto)
    {
        _logger.LogInformation("Updating product with ID: {ProductId}", id);
        
        var command = new UpdateProductCommand { Id = id, Product = updateProductDto };
        
        try
        {
            var result = await _mediator.Send(command);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "Product not found" });
        }
    }

    /// <summary>
    /// Soft-delete a product: marks it inactive so it can be restored later (Admin only)
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        _logger.LogInformation("Deleting product with ID: {ProductId}", id);
        
        var command = new DeleteProductCommand(id);
        var result = await _mediator.Send(command);
        
        if (!result)
            return NotFound(new { message = "Product not found" });

        return NoContent();
    }

    /// <summary>
    /// Permanently delete an inactive product and its catalog, cart and wishlist records, unless it has order history.
    /// </summary>
    [HttpDelete("{id}/permanent")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DeletePermanent(int id, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Permanently deleting inactive product with ID: {ProductId}", id);
        var result = await _mediator.Send(new DeleteInactiveProductCommand(id), cancellationToken);
        return result switch
        {
            PermanentProductDeleteResult.Deleted => NoContent(),
            PermanentProductDeleteResult.NotFound => NotFound(new { message = "Product not found." }),
            PermanentProductDeleteResult.Active => Conflict(new { message = "Only inactive products can be permanently deleted." }),
            PermanentProductDeleteResult.HasOrderHistory => Conflict(new { message = "This product is linked to order history and cannot be permanently deleted." }),
            _ => throw new InvalidOperationException("Unexpected permanent product deletion result.")
        };
    }

    /// <summary>
    /// Add image to product (Admin only)
    /// </summary>
    [HttpPost("{productId}/images")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductImageDto>> AddImage(int productId, [FromBody] CreateProductImageDto imageDto)
    {
        _logger.LogInformation("Adding image to product ID: {ProductId}", productId);
        
        var command = new AddProductImageCommand { ProductId = productId, Image = imageDto };
        
        try
        {
            var result = await _mediator.Send(command);
            return CreatedAtAction(nameof(GetById), new { id = productId }, result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "Product not found" });
        }
    }

    /// <summary>
    /// Add variant to product (Admin only)
    /// </summary>
    [HttpPost("{productId}/variants")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductVariantDto>> AddVariant(int productId, [FromBody] CreateProductVariantDto variantDto)
    {
        _logger.LogInformation("Adding variant to product ID: {ProductId}", productId);
        
        var command = new AddProductVariantCommand { ProductId = productId, Variant = variantDto };
        
        try
        {
            var result = await _mediator.Send(command);
            return CreatedAtAction(nameof(GetById), new { id = productId }, result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "Product not found" });
        }
    }
}
