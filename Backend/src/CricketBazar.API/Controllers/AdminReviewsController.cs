namespace CricketBazar.API.Controllers;

using Microsoft.AspNetCore.Mvc;
using CricketBazar.Application.DTOs;
using CricketBazar.Domain.Entities;
using CricketBazar.Domain.Interfaces;

[ApiController]
[Route("api/v1/admin/reviews")]
[Produces("application/json")]
public class AdminReviewsController : ControllerBase
{
    private const int MaxCommentLength = 2000;
    private const string AdminEmail = "admin@cricbazar.local";

    private readonly IReviewRepository _repository;
    private readonly IProductRepository _productRepository;
    private readonly IUserRepository _userRepository;
    private readonly ILogger<AdminReviewsController> _logger;

    public AdminReviewsController(
        IReviewRepository repository,
        IProductRepository productRepository,
        IUserRepository userRepository,
        ILogger<AdminReviewsController> logger)
    {
        _repository = repository;
        _productRepository = productRepository;
        _userRepository = userRepository;
        _logger = logger;
    }

    /// <summary>
    /// Get a review by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ReviewListItemDto>> GetById(int id)
    {
        var item = await _repository.GetListItemByIdAsync(id);
        if (item == null)
            return NotFound(new { message = "Review not found" });
        return Ok(ToDto(item));
    }

    /// <summary>
    /// Create a review written by the admin
    /// </summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ReviewListItemDto>> Create([FromBody] SaveReviewDto dto)
    {
        var error = await ValidateAsync(dto);
        if (error != null)
            return BadRequest(new { message = error });

        var admin = await _userRepository.GetByEmailAsync(AdminEmail);
        var adminId = admin?.Id ?? await _userRepository.AddAsync(new User
        {
            Name = "Admin",
            Email = AdminEmail,
            Role = "Admin",
            CreatedAt = DateTime.UtcNow
        });

        var id = await _repository.AddAsync(new Review
        {
            ProductId = dto.ProductId,
            UserId = adminId,
            Rating = (byte)dto.Rating,
            Comment = NormalizeComment(dto.Comment),
            CreatedAt = DateTime.UtcNow
        });

        var created = await _repository.GetListItemByIdAsync(id);
        return CreatedAtAction(nameof(GetById), new { id }, ToDto(created!));
    }

    /// <summary>
    /// Update a review's product, rating and comment
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ReviewListItemDto>> Update(int id, [FromBody] SaveReviewDto dto)
    {
        var existing = await _repository.GetByIdAsync(id);
        if (existing == null)
            return NotFound(new { message = "Review not found" });

        var error = await ValidateAsync(dto);
        if (error != null)
            return BadRequest(new { message = error });

        existing.ProductId = dto.ProductId;
        existing.Rating = (byte)dto.Rating;
        existing.Comment = NormalizeComment(dto.Comment);
        await _repository.UpdateAsync(existing);

        var updated = await _repository.GetListItemByIdAsync(id);
        return Ok(ToDto(updated!));
    }

    private async Task<string?> ValidateAsync(SaveReviewDto dto)
    {
        if (dto.Rating < 1 || dto.Rating > 5)
            return "Rating must be between 1 and 5.";
        if (dto.Comment != null && dto.Comment.Trim().Length > MaxCommentLength)
            return $"Comment must be {MaxCommentLength} characters or fewer.";
        if (await _productRepository.GetByIdAsync(dto.ProductId) == null)
            return "Selected product does not exist.";
        return null;
    }

    private static string? NormalizeComment(string? comment) =>
        string.IsNullOrWhiteSpace(comment) ? null : comment.Trim();

    private static ReviewListItemDto ToDto(ReviewListItem r) => new()
    {
        Id = r.Id,
        ProductId = r.ProductId,
        ProductName = r.ProductName,
        UserId = r.UserId,
        UserName = r.UserName,
        Rating = r.Rating,
        Comment = r.Comment,
        CreatedAt = r.CreatedAt
    };

    /// <summary>
    /// Search reviews with pagination and sorting (sortBy: date, product, user, rating, id)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<PaginatedResponse<ReviewListItemDto>>> GetPaged(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] int? productId = null,
        [FromQuery] int? rating = null,
        [FromQuery] string? sortBy = "date",
        [FromQuery] string? sortDirection = "desc")
    {
        pageNumber = Math.Max(1, pageNumber);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var (items, totalCount) = await _repository.SearchAsync(
            searchTerm, productId, rating, sortBy,
            !string.Equals(sortDirection, "asc", StringComparison.OrdinalIgnoreCase),
            pageNumber, pageSize);

        return Ok(new PaginatedResponse<ReviewListItemDto>
        {
            Items = items.Select(ToDto).ToList(),
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        });
    }

    /// <summary>
    /// Delete a review (moderation)
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        if (!await _repository.DeleteAsync(id))
            return NotFound(new { message = "Review not found" });

        _logger.LogInformation("Admin deleted review {ReviewId}", id);
        return NoContent();
    }
}
