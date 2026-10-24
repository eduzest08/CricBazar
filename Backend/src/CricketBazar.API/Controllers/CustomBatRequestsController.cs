namespace CricketBazar.API.Controllers;

using Microsoft.AspNetCore.Mvc;
using CricketBazar.Application.DTOs;
using CricketBazar.Domain.Entities;
using CricketBazar.Domain.Interfaces;

[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public class CustomBatRequestsController : ControllerBase
{
    private readonly ICustomBatRequestRepository _repository;
    private readonly IUserRepository _userRepository;
    private readonly ILogger<CustomBatRequestsController> _logger;

    public CustomBatRequestsController(
        ICustomBatRequestRepository repository,
        IUserRepository userRepository,
        ILogger<CustomBatRequestsController> logger)
    {
        _repository = repository;
        _userRepository = userRepository;
        _logger = logger;
    }

    /// <summary>
    /// Get custom bat requests for a user
    /// </summary>
    [HttpGet("user/{userId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<CustomBatRequestDto>>> GetUserRequests(int userId)
    {
        _logger.LogInformation("Getting custom bat requests for user ID: {UserId}", userId);
        
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
            return NotFound(new { message = "User not found" });

        var requests = await _repository.GetByUserIdAsync(userId);
        
        return Ok(requests.Select(r => MapToDto(r)).ToList());
    }

    /// <summary>
    /// Get custom bat request by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CustomBatRequestDto>> GetById(int id)
    {
        _logger.LogInformation("Getting custom bat request with ID: {RequestId}", id);
        
        var request = await _repository.GetByIdAsync(id);
        
        if (request == null)
            return NotFound(new { message = "Request not found" });

        return Ok(MapToDto(request));
    }

    /// <summary>
    /// Create a new custom bat request
    /// </summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CustomBatRequestDto>> Create([FromBody] CreateCustomBatRequestDto createDto, [FromQuery] int? userId = null)
    {
        _logger.LogInformation("Creating custom bat request - User ID: {UserId}", userId);
        
        if (string.IsNullOrWhiteSpace(createDto.Name))
            return BadRequest(new { message = "Name is required" });

        if (string.IsNullOrWhiteSpace(createDto.Mobile))
            return BadRequest(new { message = "Mobile is required" });

        if (string.IsNullOrWhiteSpace(createDto.Specs))
            return BadRequest(new { message = "Specifications are required" });

        var request = new CustomBatRequest
        {
            UserId = userId,
            Name = createDto.Name,
            Mobile = createDto.Mobile,
            Specs = createDto.Specs,
            Status = "New",
            CreatedAt = DateTime.UtcNow
        };

        await _repository.AddAsync(request);

        return CreatedAtAction(nameof(GetById), new { id = request.Id }, MapToDto(request));
    }

    /// <summary>
    /// Update custom bat request status (Admin only)
    /// </summary>
    [HttpPut("{id}/status")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CustomBatRequestDto>> UpdateStatus(int id, [FromBody] UpdateCustomBatStatusDto updateDto)
    {
        _logger.LogInformation("Updating custom bat request status for ID: {RequestId} to {Status}", id, updateDto.Status);
        
        var request = await _repository.GetByIdAsync(id);
        if (request == null)
            return NotFound(new { message = "Request not found" });

        var validStatuses = new[] { "New", "In Progress", "Completed", "Rejected", "Cancelled" };
        if (!validStatuses.Contains(updateDto.Status))
            return BadRequest(new { message = "Invalid status" });

        request.Status = updateDto.Status;
        await _repository.UpdateAsync(request);

        return Ok(MapToDto(request));
    }

    /// <summary>
    /// Delete a custom bat request
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        _logger.LogInformation("Deleting custom bat request with ID: {RequestId}", id);
        
        var request = await _repository.GetByIdAsync(id);
        if (request == null)
            return NotFound(new { message = "Request not found" });

        await _repository.DeleteAsync(id);

        return NoContent();
    }

    /// <summary>
    /// Get all pending requests (Admin only)
    /// </summary>
    [HttpGet("admin/pending")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<List<CustomBatRequestDto>>> GetPendingRequests()
    {
        _logger.LogInformation("Getting all pending custom bat requests");
        
        var allRequests = await _repository.GetAllAsync();
        var pendingRequests = allRequests
            .Where(r => r.Status == "New" || r.Status == "In Progress")
            .OrderByDescending(r => r.CreatedAt)
            .ToList();

        return Ok(pendingRequests.Select(r => MapToDto(r)).ToList());
    }

    private CustomBatRequestDto MapToDto(CustomBatRequest request)
    {
        return new CustomBatRequestDto
        {
            Id = request.Id,
            UserId = request.UserId,
            Name = request.Name,
            Mobile = request.Mobile,
            Specs = request.Specs,
            Status = request.Status,
            CreatedAt = request.CreatedAt
        };
    }
}

public class UpdateCustomBatStatusDto
{
    public required string Status { get; set; }
}
