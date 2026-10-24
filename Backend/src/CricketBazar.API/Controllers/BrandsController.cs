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
    private readonly IBrandRepository _repository;
    private readonly ILogger<BrandsController> _logger;

    public BrandsController(IBrandRepository repository, ILogger<BrandsController> logger)
    {
        _repository = repository;
        _logger = logger;
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
            await _repository.AddAsync(brand);
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
