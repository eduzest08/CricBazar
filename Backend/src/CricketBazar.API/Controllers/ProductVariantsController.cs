namespace CricketBazar.API.Controllers;

using Microsoft.AspNetCore.Mvc;
using CricketBazar.Application.DTOs;
using CricketBazar.Domain.Entities;
using CricketBazar.Domain.Interfaces;

[ApiController]
[Route("api/v1/product-variants")]
[Produces("application/json")]
public class ProductVariantsController : ControllerBase
{
    private readonly IProductVariantRepository _repository;
    private readonly IProductRepository _productRepository;
    private readonly ILogger<ProductVariantsController> _logger;

    public ProductVariantsController(
        IProductVariantRepository repository,
        IProductRepository productRepository,
        ILogger<ProductVariantsController> logger)
    {
        _repository = repository;
        _productRepository = productRepository;
        _logger = logger;
    }

    /// <summary>
    /// Search product variants with pagination and sorting (sortBy: product, size, color, hand, stock, priceOverride, id)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<PaginatedResponse<ProductVariantListItemDto>>> GetPaged(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] int? productId = null,
        [FromQuery] string? sortBy = "product",
        [FromQuery] string? sortDirection = "asc")
    {
        pageNumber = Math.Max(1, pageNumber);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var (items, totalCount) = await _repository.SearchAsync(
            searchTerm, productId, sortBy,
            string.Equals(sortDirection, "desc", StringComparison.OrdinalIgnoreCase),
            pageNumber, pageSize);

        return Ok(new PaginatedResponse<ProductVariantListItemDto>
        {
            Items = items.Select(ToDto).ToList(),
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        });
    }

    /// <summary>
    /// Get product variant by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductVariantListItemDto>> GetById(int id)
    {
        var item = await _repository.GetListItemByIdAsync(id);
        if (item == null)
            return NotFound(new { message = "Product variant not found" });

        return Ok(ToDto(item));
    }

    /// <summary>
    /// Create a product variant
    /// </summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ProductVariantListItemDto>> Create([FromBody] SaveProductVariantDto dto)
    {
        var (variant, error) = await BuildAsync(dto, null);
        if (error != null)
            return BadRequest(new { message = error });

        _logger.LogInformation("Creating product variant for product {ProductId}", dto.ProductId);

        var id = await _repository.AddAsync(variant!);
        var created = await _repository.GetListItemByIdAsync(id);
        return CreatedAtAction(nameof(GetById), new { id }, ToDto(created!));
    }

    /// <summary>
    /// Update a product variant
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductVariantListItemDto>> Update(int id, [FromBody] SaveProductVariantDto dto)
    {
        if (await _repository.GetByIdAsync(id) == null)
            return NotFound(new { message = "Product variant not found" });

        var (variant, error) = await BuildAsync(dto, id);
        if (error != null)
            return BadRequest(new { message = error });

        variant!.Id = id;
        await _repository.UpdateAsync(variant);

        var updated = await _repository.GetListItemByIdAsync(id);
        return Ok(ToDto(updated!));
    }

    /// <summary>
    /// Delete a product variant
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        if (!await _repository.DeleteAsync(id))
            return NotFound(new { message = "Product variant not found" });

        return NoContent();
    }

    private async Task<(ProductVariant? variant, string? error)> BuildAsync(SaveProductVariantDto dto, int? existingId)
    {
        var size = Clean(dto.Size);
        var color = Clean(dto.Color);
        var hand = Clean(dto.Hand);

        if (size == null && color == null && hand == null)
            return (null, "Enter at least one of size, color or hand.");
        if (size?.Length > 50)
            return (null, "Size must be 50 characters or fewer.");
        if (color?.Length > 50)
            return (null, "Color must be 50 characters or fewer.");
        if (hand?.Length > 20)
            return (null, "Hand must be 20 characters or fewer.");
        if (dto.Stock < 0)
            return (null, "Stock cannot be negative.");
        if (dto.PriceOverride is < 0 or > 99999999.99m)
            return (null, "Price override must be between 0 and 99,999,999.99.");
        if (await _productRepository.GetByIdAsync(dto.ProductId) == null)
            return (null, "Selected product does not exist.");

        var duplicate = await _repository.GetByCombinationAsync(dto.ProductId, size, color, hand);
        if (duplicate != null && duplicate.Id != existingId)
            return (null, "This product already has a variant with the same size, color and hand.");

        return (new ProductVariant
        {
            ProductId = dto.ProductId,
            Size = size,
            Color = color,
            Hand = hand,
            Stock = dto.Stock,
            PriceOverride = dto.PriceOverride.HasValue ? Math.Round(dto.PriceOverride.Value, 2) : null
        }, null);
    }

    private static string? Clean(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static ProductVariantListItemDto ToDto(ProductVariantListItem item) => new()
    {
        Id = item.Id,
        ProductId = item.ProductId,
        ProductName = item.ProductName,
        Size = item.Size,
        Color = item.Color,
        Hand = item.Hand,
        Stock = item.Stock,
        PriceOverride = item.PriceOverride
    };
}
