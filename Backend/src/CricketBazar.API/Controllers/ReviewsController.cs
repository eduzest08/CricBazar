namespace CricketBazar.API.Controllers;

using Microsoft.AspNetCore.Mvc;
using CricketBazar.Application.DTOs;
using CricketBazar.Domain.Entities;
using CricketBazar.Domain.Interfaces;

[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public class ReviewsController : ControllerBase
{
    private readonly IReviewRepository _reviewRepository;
    private readonly IProductRepository _productRepository;
    private readonly IUserRepository _userRepository;
    private readonly ILogger<ReviewsController> _logger;

    public ReviewsController(
        IReviewRepository reviewRepository,
        IProductRepository productRepository,
        IUserRepository userRepository,
        ILogger<ReviewsController> logger)
    {
        _reviewRepository = reviewRepository;
        _productRepository = productRepository;
        _userRepository = userRepository;
        _logger = logger;
    }

    /// <summary>
    /// Get reviews for a product
    /// </summary>
    [HttpGet("product/{productId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<ReviewDto>>> GetProductReviews(int productId)
    {
        _logger.LogInformation("Getting reviews for product ID: {ProductId}", productId);
        
        var product = await _productRepository.GetByIdAsync(productId);
        if (product == null)
            return NotFound(new { message = "Product not found" });

        var reviews = await _reviewRepository.GetByProductIdAsync(productId);
        
        return Ok(reviews.Select(r => new ReviewDto
        {
            Id = r.Id,
            ProductId = r.ProductId,
            UserId = r.UserId,
            Rating = r.Rating,
            Comment = r.Comment,
            CreatedAt = r.CreatedAt
        }).ToList());
    }

    /// <summary>
    /// Get user's reviews
    /// </summary>
    [HttpGet("user/{userId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<ReviewDto>>> GetUserReviews(int userId)
    {
        _logger.LogInformation("Getting reviews for user ID: {UserId}", userId);
        
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
            return NotFound(new { message = "User not found" });

        var reviews = await _reviewRepository.GetByUserIdAsync(userId);
        
        return Ok(reviews.Select(r => new ReviewDto
        {
            Id = r.Id,
            ProductId = r.ProductId,
            UserId = r.UserId,
            Rating = r.Rating,
            Comment = r.Comment,
            CreatedAt = r.CreatedAt
        }).ToList());
    }

    /// <summary>
    /// Create a review for a product
    /// </summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ReviewDto>> Create([FromBody] CreateReviewDto createReviewDto, [FromHeader(Name = "X-User-Id")] int? userId)
    {
        if (!userId.HasValue)
            return BadRequest(new { message = "User ID is required" });

        _logger.LogInformation("Creating review for product ID: {ProductId} by user ID: {UserId}", createReviewDto.ProductId, userId);
        
        var product = await _productRepository.GetByIdAsync(createReviewDto.ProductId);
        if (product == null)
            return NotFound(new { message = "Product not found" });

        var user = await _userRepository.GetByIdAsync(userId.Value);
        if (user == null)
            return NotFound(new { message = "User not found" });

        if (createReviewDto.Rating < 1 || createReviewDto.Rating > 5)
            return BadRequest(new { message = "Rating must be between 1 and 5" });

        var review = new Review
        {
            ProductId = createReviewDto.ProductId,
            UserId = userId.Value,
            Rating = createReviewDto.Rating,
            Comment = createReviewDto.Comment,
            CreatedAt = DateTime.UtcNow
        };

        await _reviewRepository.AddAsync(review);

        return CreatedAtAction(nameof(GetProductReviews), new { productId = review.ProductId }, new ReviewDto
        {
            Id = review.Id,
            ProductId = review.ProductId,
            UserId = review.UserId,
            Rating = review.Rating,
            Comment = review.Comment,
            CreatedAt = review.CreatedAt
        });
    }

    /// <summary>
    /// Delete a review
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Delete(int id, [FromHeader(Name = "X-User-Id")] int? userId)
    {
        if (!userId.HasValue)
            return BadRequest(new { message = "User ID is required" });

        _logger.LogInformation("Deleting review with ID: {ReviewId} by user ID: {UserId}", id, userId);
        
        var review = await _reviewRepository.GetByIdAsync(id);
        if (review == null)
            return NotFound(new { message = "Review not found" });

        if (review.UserId != userId.Value)
            return Forbid();

        await _reviewRepository.DeleteAsync(id);

        return NoContent();
    }
}
