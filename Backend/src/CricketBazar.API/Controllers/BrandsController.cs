namespace CricketBazar.API.Controllers;

using MediatR;
using Microsoft.AspNetCore.Mvc;
using CricketBazar.Application.DTOs;
using CricketBazar.Domain.Interfaces;

[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public class BrandsController : ControllerBase
{
    private const int MaxLogoBytes = 2 * 1024 * 1024;
    private static readonly HashSet<string> AllowedLogoExtensions = new() { ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg" };

    private readonly IBrandRepository _repository;
    private readonly ILogger<BrandsController> _logger;
    private readonly IWebHostEnvironment _environment;

    public BrandsController(IBrandRepository repository, ILogger<BrandsController> logger, IWebHostEnvironment environment)
    {
        _repository = repository;
        _logger = logger;
        _environment = environment;
    }

    /// <summary>
    /// Get all brands
    /// </summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<List<BrandDto>>> GetAll([FromQuery] bool? onlyActive = true)
    {
        _logger.LogInformation("Getting brands - OnlyActive: {OnlyActive}", onlyActive);
        
        var brands = onlyActive == true 
            ? await _repository.GetActiveBrandsAsync()
            : await _repository.GetAllAsync();

        return Ok(brands.Select(b => new BrandDto
        {
            Id = b.Id,
            Name = b.Name,
            Slug = b.Slug,
            LogoUrl = b.LogoUrl,
            IsActive = b.IsActive
        }).ToList());
    }

    /// <summary>
    /// Search brands with pagination and sorting (sortBy: name, slug, id, isActive)
    /// </summary>
    [HttpGet("paged")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<PaginatedResponse<BrandDto>>> GetPaged(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] string? sortBy = "name",
        [FromQuery] string? sortDirection = "asc")
    {
        pageNumber = Math.Max(1, pageNumber);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var (items, totalCount) = await _repository.SearchAsync(
            searchTerm, isActive, sortBy,
            string.Equals(sortDirection, "desc", StringComparison.OrdinalIgnoreCase),
            pageNumber, pageSize);

        return Ok(new PaginatedResponse<BrandDto>
        {
            Items = items.Select(b => new BrandDto
            {
                Id = b.Id,
                Name = b.Name,
                Slug = b.Slug,
                LogoUrl = b.LogoUrl,
                IsActive = b.IsActive
            }).ToList(),
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        });
    }

    /// <summary>
    /// Upload a brand logo image; returns the relative URL to store in LogoUrl
    /// </summary>
    [HttpPost("logo")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MaxLogoBytes)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadLogo(IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "No file was uploaded." });
        if (file.Length > MaxLogoBytes)
            return BadRequest(new { message = "Logo must be 2 MB or smaller." });

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedLogoExtensions.Contains(extension))
            return BadRequest(new { message = "Logo must be a PNG, JPG, GIF, WEBP or SVG image." });

        var folder = Path.Combine(_environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot"), "uploads", "brands");
        Directory.CreateDirectory(folder);

        var fileName = $"{Guid.NewGuid():N}{extension}";
        await using (var stream = System.IO.File.Create(Path.Combine(folder, fileName)))
        {
            await file.CopyToAsync(stream);
        }

        return Ok(new { logoUrl = $"/uploads/brands/{fileName}" });
    }

    /// <summary>
    /// Get brand by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BrandDto>> GetById(int id)
    {
        _logger.LogInformation("Getting brand with ID: {BrandId}", id);
        
        var brand = await _repository.GetByIdAsync(id);
        
        if (brand == null)
            return NotFound(new { message = "Brand not found" });

        return Ok(new BrandDto
        {
            Id = brand.Id,
            Name = brand.Name,
            Slug = brand.Slug,
            LogoUrl = brand.LogoUrl,
            IsActive = brand.IsActive
        });
    }

    /// <summary>
    /// Get brand by slug
    /// </summary>
    [HttpGet("slug/{slug}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BrandDto>> GetBySlug(string slug)
    {
        _logger.LogInformation("Getting brand with slug: {Slug}", slug);
        
        var brand = await _repository.GetBySlugAsync(slug);
        
        if (brand == null)
            return NotFound(new { message = "Brand not found" });

        return Ok(new BrandDto
        {
            Id = brand.Id,
            Name = brand.Name,
            Slug = brand.Slug,
            LogoUrl = brand.LogoUrl,
            IsActive = brand.IsActive
        });
    }

    /// <summary>
    /// Create a new brand (Admin only)
    /// </summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<BrandDto>> Create([FromBody] CreateBrandDto createBrandDto)
    {
        _logger.LogInformation("Creating new brand: {BrandName}", createBrandDto.Name);
        
        // Validate slug is unique
        var existingBrand = await _repository.GetBySlugAsync(createBrandDto.Slug);
        if (existingBrand != null)
        {
            _logger.LogWarning("Brand creation failed: Slug '{Slug}' already exists", createBrandDto.Slug);
            return BadRequest(new
            {
                error = "Slug already exists",
                slug = createBrandDto.Slug,
                message = "A brand with this slug already exists. Please use a different slug."
            });
        }
        
        var brand = new Domain.Entities.Brand
        {
            Name = createBrandDto.Name,
            Slug = createBrandDto.Slug,
            LogoUrl = createBrandDto.LogoUrl,
            IsActive = true
        };

        try
        {
            brand.Id = await _repository.AddAsync(brand);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating brand: {BrandName}", createBrandDto.Name);
            return BadRequest(new
            {
                error = "Failed to create brand",
                message = "An error occurred while creating the brand. Please ensure all data is valid.",
                details = ex.Message
            });
        }

        return CreatedAtAction(nameof(GetById), new { id = brand.Id }, new BrandDto
        {
            Id = brand.Id,
            Name = brand.Name,
            Slug = brand.Slug,
            LogoUrl = brand.LogoUrl,
            IsActive = brand.IsActive
        });
    }

    /// <summary>
    /// Update an existing brand (Admin only)
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BrandDto>> Update(int id, [FromBody] UpdateBrandDto updateBrandDto)
    {
        _logger.LogInformation("Updating brand with ID: {BrandId}", id);
        
        var brand = await _repository.GetByIdAsync(id);
        
        if (brand == null)
            return NotFound(new { message = "Brand not found" });

        brand.Name = updateBrandDto.Name;
        brand.Slug = updateBrandDto.Slug;
        brand.LogoUrl = updateBrandDto.LogoUrl;
        brand.IsActive = updateBrandDto.IsActive;

        await _repository.UpdateAsync(brand);

        return Ok(new BrandDto
        {
            Id = brand.Id,
            Name = brand.Name,
            Slug = brand.Slug,
            LogoUrl = brand.LogoUrl,
            IsActive = brand.IsActive
        });
    }

    /// <summary>
    /// Delete a brand (Admin only)
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        _logger.LogInformation("Deleting brand with ID: {BrandId}", id);
        
        var brand = await _repository.GetByIdAsync(id);
        
        if (brand == null)
            return NotFound(new { message = "Brand not found" });

        await _repository.DeleteAsync(id);

        return NoContent();
    }
}
