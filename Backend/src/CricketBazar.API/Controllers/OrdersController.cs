namespace CricketBazar.API.Controllers;

using Microsoft.AspNetCore.Mvc;
using CricketBazar.Application.DTOs;
using CricketBazar.Domain.Entities;
using CricketBazar.Domain.Interfaces;

[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public class OrdersController : ControllerBase
{
    private readonly IOrderRepository _orderRepository;
    private readonly IUserRepository _userRepository;
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(
        IOrderRepository orderRepository,
        IUserRepository userRepository,
        ILogger<OrdersController> logger)
    {
        _orderRepository = orderRepository;
        _userRepository = userRepository;
        _logger = logger;
    }

    /// <summary>
    /// Get orders for a user
    /// </summary>
    [HttpGet("user/{userId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<OrderDto>>> GetUserOrders(int userId)
    {
        _logger.LogInformation("Getting orders for user ID: {UserId}", userId);
        
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
            return NotFound(new { message = "User not found" });

        var orders = await _orderRepository.GetByUserIdAsync(userId);
        
        return Ok(orders.Select(o => MapOrderToDto(o)).ToList());
    }

    /// <summary>
    /// Get order by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OrderDto>> GetOrderById(int id)
    {
        _logger.LogInformation("Getting order with ID: {OrderId}", id);
        
        var order = await _orderRepository.GetByIdAsync(id);
        
        if (order == null)
            return NotFound(new { message = "Order not found" });

        return Ok(MapOrderToDto(order));
    }

    /// <summary>
    /// Get order by order number
    /// </summary>
    [HttpGet("number/{orderNo}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OrderDto>> GetOrderByNumber(string orderNo)
    {
        _logger.LogInformation("Getting order with number: {OrderNo}", orderNo);
        
        var order = await _orderRepository.GetByOrderNumberAsync(orderNo);
        
        if (order == null)
            return NotFound(new { message = "Order not found" });

        return Ok(MapOrderToDto(order));
    }

    /// <summary>
    /// Update order status (Admin only)
    /// </summary>
    [HttpPut("{id}/status")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OrderDto>> UpdateOrderStatus(int id, [FromBody] UpdateOrderStatusDto updateDto)
    {
        _logger.LogInformation("Updating order status for ID: {OrderId} to {Status}", id, updateDto.Status);
        
        var order = await _orderRepository.GetByIdAsync(id);
        if (order == null)
            return NotFound(new { message = "Order not found" });

        var validStatuses = new[] { "Pending", "Processing", "Shipped", "Delivered", "Cancelled" };
        if (!validStatuses.Contains(updateDto.Status))
            return BadRequest(new { message = "Invalid status" });

        order.Status = updateDto.Status;
        await _orderRepository.UpdateAsync(order);

        return Ok(MapOrderToDto(order));
    }

    /// <summary>
    /// Cancel an order
    /// </summary>
    [HttpPost("{id}/cancel")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OrderDto>> CancelOrder(int id, int userId)
    {
        _logger.LogInformation("Cancelling order ID: {OrderId} for user ID: {UserId}", id, userId);
        
        var order = await _orderRepository.GetByIdAsync(id);
        if (order == null)
            return NotFound(new { message = "Order not found" });

        if (order.UserId != userId)
            return BadRequest(new { message = "Cannot cancel order belonging to another user" });

        if (order.Status != "Pending")
            return BadRequest(new { message = "Can only cancel pending orders" });

        order.Status = "Cancelled";
        await _orderRepository.UpdateAsync(order);

        return Ok(MapOrderToDto(order));
    }

    private OrderDto MapOrderToDto(Order order)
    {
        return new OrderDto
        {
            Id = order.Id,
            OrderNo = order.OrderNo,
            UserId = order.UserId,
            Status = order.Status,
            SubTotal = order.SubTotal,
            ShippingFee = order.ShippingFee,
            Total = order.Total,
            ShipFullName = order.ShipFullName,
            ShipMobile = order.ShipMobile,
            ShipAddress = order.ShipAddress,
            ShipPincode = order.ShipPincode,
            CreatedAt = order.CreatedAt,
            Items = order.Items.Select(oi => new OrderItemDto
            {
                Id = oi.Id,
                ProductId = oi.ProductId,
                VariantId = oi.VariantId,
                ProductName = oi.ProductName,
                UnitPrice = oi.UnitPrice,
                Qty = oi.Qty,
                SubTotal = oi.UnitPrice * oi.Qty
            }).ToList()
        };
    }
}

public class UpdateOrderStatusDto
{
    public required string Status { get; set; }
}
