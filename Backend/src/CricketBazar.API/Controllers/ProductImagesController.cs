namespace CricketBazar.API.Controllers;

using Microsoft.AspNetCore.Mvc;
using CricketBazar.Application.DTOs;
using CricketBazar.Domain.Entities;
using CricketBazar.Domain.Interfaces;

[ApiController]
[Route("api/v1/product-images")]
[Produces("application/json")]
public class ProductImagesController : ControllerBase
{
    private const int MaxImageBytes = 5 * 1024 * 1024;
    private const int MaxUrlLength = 500;
    private const string UploadUrlPrefix = "/uploads/products/";
    private static readonly HashSet<string> AllowedExtensions = new() { ".png", ".jpg", ".jpeg", ".gif", ".webp" };

    private readonly IProductImageRepository _repository;
    private readonly IProductRepository _productRepository;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<ProductImagesController> _logger;

    public ProductImagesController(
        IProductImageRepository repository,
        IProductRepository productRepository,
        IWebHostEnvironment environment,
        ILogger<ProductImagesController> logger)
    {
        _repository = repository;
        _productRepository = productRepository;
        _environment = environment;
        _logger = logger;
    }

    /// <summary>
    /// Search product images with pagination and sorting (sortBy: product, sortOrder, id)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<PaginatedResponse<ProductImageListItemDto>>> GetPaged(
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

        return Ok(new PaginatedResponse<ProductImageListItemDto>
        {
            Items = items.Select(ToDto).ToList(),
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        });
    }

    /// <summary>
    /// Get product image by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductImageListItemDto>> GetById(int id)
    {
        var item = await _repository.GetListItemByIdAsync(id);
        if (item == null)
            return NotFound(new { message = "Product image not found" });

        return Ok(ToDto(item));
    }

    /// <summary>
    /// Upload an image file; returns the relative URL to store in Url
    /// </summary>
    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MaxImageBytes)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "No file was uploaded." });
        if (file.Length > MaxImageBytes)
            return BadRequest(new { message = "Image must be 5 MB or smaller." });

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
            return BadRequest(new { message = "Image must be a PNG, JPG, GIF or WEBP file." });

        var folder = UploadFolder();
        Directory.CreateDirectory(folder);

        var fileName = $"{Guid.NewGuid():N}{extension}";
        await using (var stream = System.IO.File.Create(Path.Combine(folder, fileName)))
        {
            await file.CopyToAsync(stream);
        }

        return Ok(new { url = $"{UploadUrlPrefix}{fileName}" });
    }

    /// <summary>
    /// Create a product image
    /// </summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ProductImageListItemDto>> Create([FromBody] SaveProductImageDto dto)
    {
        var error = await ValidateAsync(dto);
        if (error != null)
            return BadRequest(new { message = error });

        _logger.LogInformation("Creating product image for product {ProductId}", dto.ProductId);

        var id = await _repository.AddAsync(new ProductImage
        {
            ProductId = dto.ProductId,
            Url = dto.Url.Trim(),
            SortOrder = dto.SortOrder
        });

        var created = await _repository.GetListItemByIdAsync(id);
        return CreatedAtAction(nameof(GetById), new { id }, ToDto(created!));
    }

    /// <summary>
    /// Update a product image
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductImageListItemDto>> Update(int id, [FromBody] SaveProductImageDto dto)
    {
        var image = await _repository.GetByIdAsync(id);
        if (image == null)
            return NotFound(new { message = "Product image not found" });

        var error = await ValidateAsync(dto);
        if (error != null)
            return BadRequest(new { message = error });

        var previousUrl = image.Url;
        image.ProductId = dto.ProductId;
        image.Url = dto.Url.Trim();
        image.SortOrder = dto.SortOrder;
        await _repository.UpdateAsync(image);

        if (!string.Equals(previousUrl, image.Url, StringComparison.Ordinal))
            DeleteUploadedFile(previousUrl);

        var updated = await _repository.GetListItemByIdAsync(id);
        return Ok(ToDto(updated!));
    }

    /// <summary>
    /// Delete a product image (also removes the uploaded file)
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var image = await _repository.GetByIdAsync(id);
        if (image == null)
            return NotFound(new { message = "Product image not found" });

        await _repository.DeleteAsync(id);
        DeleteUploadedFile(image.Url);

        return NoContent();
    }

    private async Task<string?> ValidateAsync(SaveProductImageDto dto)
    {
        var url = dto.Url?.Trim() ?? string.Empty;

        if (url.Length == 0)
            return "Image is required.";
        if (url.Length > MaxUrlLength)
            return $"Image URL must be {MaxUrlLength} characters or fewer.";
        var isUpload = url.StartsWith(UploadUrlPrefix, StringComparison.Ordinal);
        var isHttpUrl = Uri.TryCreate(url, UriKind.Absolute, out var uri)
            && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
        if (!isUpload && !isHttpUrl)
            return "Image must be an uploaded file or an http(s) URL.";
        if (url.Contains("..", StringComparison.Ordinal))
            return "Image URL is not valid.";
        if (dto.SortOrder < 0)
            return "Sort order cannot be negative.";
        if (await _productRepository.GetByIdAsync(dto.ProductId) == null)
            return "Selected product does not exist.";

        return null;
    }

    private string UploadFolder() =>
        Path.Combine(_environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot"), "uploads", "products");

    // Only files this controller uploaded are removed; external URLs are left alone
    private void DeleteUploadedFile(string url)
    {
        if (!url.StartsWith(UploadUrlPrefix, StringComparison.Ordinal))
            return;

        var fileName = Path.GetFileName(url);
        if (string.IsNullOrEmpty(fileName))
            return;

        try
        {
            var path = Path.Combine(UploadFolder(), fileName);
            if (System.IO.File.Exists(path))
                System.IO.File.Delete(path);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not delete uploaded product image {Url}", url);
        }
    }

    private static ProductImageListItemDto ToDto(ProductImageListItem item) => new()
    {
        Id = item.Id,
        ProductId = item.ProductId,
        ProductName = item.ProductName,
        Url = item.Url,
        SortOrder = item.SortOrder
    };
}
