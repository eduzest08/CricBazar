namespace CricketBazar.API.Controllers;

using MediatR;
using Microsoft.AspNetCore.Mvc;
using CricketBazar.Application.DTOs;
using CricketBazar.Application.Commands.Categories;
using CricketBazar.Application.Queries.Categories;

[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public class CategoriesController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<CategoriesController> _logger;

    public CategoriesController(IMediator mediator, ILogger<CategoriesController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Get all categories with hierarchy
    /// </summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<List<CategoryDto>>> GetAll([FromQuery] bool? onlyActive = true)
    {
        _logger.LogInformation("Getting categories - OnlyActive: {OnlyActive}", onlyActive);
        
        var query = new GetCategoriesListQuery { OnlyActive = onlyActive };
        var categories = await _mediator.Send(query);
        
        return Ok(categories);
    }

    /// <summary>
    /// Get category by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CategoryDto>> GetById(int id)
    {
        _logger.LogInformation("Getting category with ID: {CategoryId}", id);
        
        var category = await _mediator.Send(new GetCategoryByIdQuery(id));
        
        if (category == null)
            return NotFound(new { message = "Category not found" });

        return Ok(category);
    }

    /// <summary>
    /// Get category by slug
    /// </summary>
    [HttpGet("slug/{slug}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CategoryDto>> GetBySlug(string slug)
    {
        _logger.LogInformation("Getting category with slug: {Slug}", slug);
        
        var category = await _mediator.Send(new GetCategoryBySlugQuery(slug));
        
        if (category == null)
            return NotFound(new { message = "Category not found" });

        return Ok(category);
    }

    /// <summary>
    /// Create a new category (Admin only)
    /// </summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CategoryDto>> Create([FromBody] CreateCategoryDto createCategoryDto)
    {
        _logger.LogInformation("Creating new category: {CategoryName}", createCategoryDto.Name);
        
        var command = new CreateCategoryCommand { Category = createCategoryDto };
        var result = await _mediator.Send(command);
        
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    /// <summary>
    /// Update an existing category (Admin only)
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CategoryDto>> Update(int id, [FromBody] UpdateCategoryDto updateCategoryDto)
    {
        _logger.LogInformation("Updating category with ID: {CategoryId}", id);
        
        var command = new UpdateCategoryCommand { Id = id, Category = updateCategoryDto };
        
        try
        {
            var result = await _mediator.Send(command);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "Category not found" });
        }
    }

    /// <summary>
    /// Delete a category (Admin only)
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        _logger.LogInformation("Deleting category with ID: {CategoryId}", id);
        
        var command = new DeleteCategoryCommand(id);
        var result = await _mediator.Send(command);
        
        if (!result)
            return NotFound(new { message = "Category not found" });

        return NoContent();
    }
}
