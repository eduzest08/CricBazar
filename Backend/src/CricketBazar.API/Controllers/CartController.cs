namespace CricketBazar.API.Controllers;

using Microsoft.AspNetCore.Mvc;
using CricketBazar.Application.DTOs;
using CricketBazar.Domain.Entities;
using CricketBazar.Domain.Interfaces;

[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public class CartController : ControllerBase
{
    private readonly ICartRepository _cartRepository;
    private readonly IProductRepository _productRepository;
    private readonly IUserRepository _userRepository;
    private readonly ILogger<CartController> _logger;

    public CartController(
        ICartRepository cartRepository,
        IProductRepository productRepository,
        IUserRepository userRepository,
        ILogger<CartController> logger)
    {
        _cartRepository = cartRepository;
        _productRepository = productRepository;
        _userRepository = userRepository;
        _logger = logger;
    }

    /// <summary>
    /// Get user's cart
    /// </summary>
    [HttpGet("user/{userId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<CartDto>> GetUserCart(int userId)
    {
        _logger.LogInformation("Getting cart for user ID: {UserId}", userId);
        
        var cart = await _cartRepository.GetByUserIdAsync(userId);
        
        if (cart == null)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
                return NotFound(new { message = "User not found" });

            cart = new Cart { UserId = userId, UpdatedAt = DateTime.UtcNow };
            await _cartRepository.AddAsync(cart);
        }

        return Ok(MapCartToDto(cart));
    }

    /// <summary>
    /// Get guest cart
    /// </summary>
    [HttpGet("guest/{token}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<CartDto>> GetGuestCart(Guid token)
    {
        _logger.LogInformation("Getting guest cart with token: {Token}", token);
        
        var cart = await _cartRepository.GetByGuestTokenAsync(token);
        
        if (cart == null)
        {
            cart = new Cart { GuestToken = token, UpdatedAt = DateTime.UtcNow };
            await _cartRepository.AddAsync(cart);
        }

        return Ok(MapCartToDto(cart));
    }

    private CartDto MapCartToDto(Cart cart)
    {
        var cartDto = new CartDto
        {
            Id = cart.Id,
            UserId = cart.UserId,
            GuestToken = cart.GuestToken,
            UpdatedAt = cart.UpdatedAt,
            Items = new(),
            Total = 0
        };

        return cartDto;
    }
}
