namespace CricketBazar.API.Controllers;

using Microsoft.AspNetCore.Mvc;
using CricketBazar.Application.DTOs;
using CricketBazar.Domain.Entities;
using CricketBazar.Domain.Interfaces;

[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public class WishlistController : ControllerBase
{
    private readonly IWishlistRepository _wishlistRepository;
    private readonly IProductRepository _productRepository;
    private readonly IUserRepository _userRepository;
    private readonly ILogger<WishlistController> _logger;

    public WishlistController(
        IWishlistRepository wishlistRepository,
        IProductRepository productRepository,
        IUserRepository userRepository,
        ILogger<WishlistController> logger)
    {
        _wishlistRepository = wishlistRepository;
        _productRepository = productRepository;
        _userRepository = userRepository;
        _logger = logger;
    }

    /// <summary>
    /// Get user's wishlist
    /// </summary>
    [HttpGet("user/{userId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<WishlistItemDto>>> GetUserWishlist(int userId)
    {
        _logger.LogInformation("Getting wishlist for user ID: {UserId}", userId);
        
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
            return NotFound(new { message = "User not found" });

        var wishlistItems = await _wishlistRepository.GetByUserIdAsync(userId);
        
        var result = wishlistItems.Select(w => new WishlistItemDto
        {
            ProductId = w.ProductId,
            ProductName = w.Product!.Name,
            SalePrice = w.Product.SalePrice,
            Image = w.Product.Images.FirstOrDefault()?.Url,
            AddedAt = w.AddedAt
        }).ToList();

        return Ok(result);
    }

    /// <summary>
    /// Check if product is in user's wishlist
    /// </summary>
    [HttpGet("user/{userId}/product/{productId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<bool>> IsInWishlist(int userId, int productId)
    {
        _logger.LogInformation("Checking if product {ProductId} is in wishlist for user {UserId}", productId, userId);
        
        var wishlistItem = await _wishlistRepository.GetByIdAsync(userId, productId);
        return Ok(wishlistItem != null);
    }

    /// <summary>
    /// Add product to wishlist
    /// </summary>
    [HttpPost("user/{userId}/product/{productId}")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WishlistItemDto>> AddToWishlist(int userId, int productId)
    {
        _logger.LogInformation("Adding product {ProductId} to wishlist for user {UserId}", productId, userId);
        
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
            return NotFound(new { message = "User not found" });

        var product = await _productRepository.GetByIdAsync(productId);
        if (product == null)
            return NotFound(new { message = "Product not found" });

        var existingWishlistItem = await _wishlistRepository.GetByIdAsync(userId, productId);
        if (existingWishlistItem != null)
            return BadRequest(new { message = "Product is already in wishlist" });

        var wishlistItem = new Wishlist
        {
            UserId = userId,
            ProductId = productId,
            AddedAt = DateTime.UtcNow
        };

        await _wishlistRepository.AddAsync(wishlistItem);

        return CreatedAtAction(nameof(GetUserWishlist), new { userId }, new WishlistItemDto
        {
            ProductId = product.Id,
            ProductName = product.Name,
            SalePrice = product.SalePrice,
            Image = product.Images.FirstOrDefault()?.Url,
            AddedAt = wishlistItem.AddedAt
        });
    }

    /// <summary>
    /// Remove product from wishlist
    /// </summary>
    [HttpDelete("user/{userId}/product/{productId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveFromWishlist(int userId, int productId)
    {
        _logger.LogInformation("Removing product {ProductId} from wishlist for user {UserId}", productId, userId);
        
        var wishlistItem = await _wishlistRepository.GetByIdAsync(userId, productId);
        if (wishlistItem == null)
            return NotFound(new { message = "Wishlist item not found" });

        await _wishlistRepository.RemoveAsync(userId, productId);

        return NoContent();
    }
}
