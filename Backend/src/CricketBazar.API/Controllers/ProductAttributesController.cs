namespace CricketBazar.API.Controllers;

using Microsoft.AspNetCore.Mvc;
using CricketBazar.Application.DTOs;
using CricketBazar.Domain.Entities;
using CricketBazar.Domain.Interfaces;

[ApiController]
[Route("api/v1/product-attributes")]
[Produces("application/json")]
public class ProductAttributesController : ControllerBase
{
    private const int MaxNameLength = 100;
    private const int MaxValueLength = 300;

    private readonly IProductAttributeRepository _repository;
    private readonly IProductRepository _productRepository;
    private readonly ILogger<ProductAttributesController> _logger;

    public ProductAttributesController(
        IProductAttributeRepository repository,
        IProductRepository productRepository,
        ILogger<ProductAttributesController> logger)
    {
        _repository = repository;
        _productRepository = productRepository;
        _logger = logger;
    }

    /// <summary>
    /// Search product attributes with pagination and sorting (sortBy: name, value, product, id)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<PaginatedResponse<ProductAttributeListItemDto>>> GetPaged(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] int? productId = null,
        [FromQuery] string? sortBy = "name",
        [FromQuery] string? sortDirection = "asc")
    {
        pageNumber = Math.Max(1, pageNumber);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var (items, totalCount) = await _repository.SearchAsync(
            searchTerm, productId, sortBy,
            string.Equals(sortDirection, "desc", StringComparison.OrdinalIgnoreCase),
            pageNumber, pageSize);

        return Ok(new PaginatedResponse<ProductAttributeListItemDto>
        {
            Items = items.Select(ToDto).ToList(),
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        });
    }

    /// <summary>
    /// Get product attribute by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductAttributeListItemDto>> GetById(int id)
    {
        var item = await _repository.GetListItemByIdAsync(id);
        if (item == null)
            return NotFound(new { message = "Product attribute not found" });

        return Ok(ToDto(item));
    }

    /// <summary>
    /// Create a product attribute
    /// </summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ProductAttributeListItemDto>> Create([FromBody] SaveProductAttributeDto dto)
    {
        var error = await ValidateAsync(dto, null);
        if (error != null)
            return BadRequest(new { message = error });

        _logger.LogInformation("Creating product attribute {Name} for product {ProductId}", dto.Name, dto.ProductId);

        var id = await _repository.AddAsync(new ProductAttribute
        {
            ProductId = dto.ProductId,
            Name = dto.Name.Trim(),
            Value = dto.Value.Trim()
        });

        var created = await _repository.GetListItemByIdAsync(id);
        return CreatedAtAction(nameof(GetById), new { id }, ToDto(created!));
    }

    /// <summary>
    /// Update a product attribute
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductAttributeListItemDto>> Update(int id, [FromBody] SaveProductAttributeDto dto)
    {
        var attribute = await _repository.GetByIdAsync(id);
        if (attribute == null)
            return NotFound(new { message = "Product attribute not found" });

        var error = await ValidateAsync(dto, id);
        if (error != null)
            return BadRequest(new { message = error });

        attribute.ProductId = dto.ProductId;
        attribute.Name = dto.Name.Trim();
        attribute.Value = dto.Value.Trim();
        await _repository.UpdateAsync(attribute);

        var updated = await _repository.GetListItemByIdAsync(id);
        return Ok(ToDto(updated!));
    }

    /// <summary>
    /// Delete a product attribute
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        if (!await _repository.DeleteAsync(id))
            return NotFound(new { message = "Product attribute not found" });

        return NoContent();
    }

    private async Task<string?> ValidateAsync(SaveProductAttributeDto dto, int? existingId)
    {
        var name = dto.Name?.Trim() ?? string.Empty;
        var value = dto.Value?.Trim() ?? string.Empty;

        if (name.Length == 0)
            return "Attribute name is required.";
        if (name.Length > MaxNameLength)
            return $"Attribute name must be {MaxNameLength} characters or fewer.";
        if (value.Length == 0)
            return "Attribute value is required.";
        if (value.Length > MaxValueLength)
            return $"Attribute value must be {MaxValueLength} characters or fewer.";
        if (await _productRepository.GetByIdAsync(dto.ProductId) == null)
            return "Selected product does not exist.";

        var duplicate = await _repository.GetByProductAndNameAsync(dto.ProductId, name);
        if (duplicate != null && duplicate.Id != existingId)
            return "This product already has an attribute with that name.";

        return null;
    }

    private static ProductAttributeListItemDto ToDto(ProductAttributeListItem item) => new()
    {
        Id = item.Id,
        ProductId = item.ProductId,
        ProductName = item.ProductName,
        Name = item.Name,
        Value = item.Value
    };
}
