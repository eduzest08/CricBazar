using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using CricketBazar.Application.Services;
using CricketBazar.Domain.Entities;
using CricketBazar.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CricketBazar.API.Controllers;

[ApiController]
[Route("api/v1/customer-delivery-details")]
[Produces("application/json")]
public class CustomerDeliveryDetailsController : ControllerBase
{
    private readonly ICustomerDeliveryDetailsRepository _repository;
    private readonly ICustomerAccountService _accountService;

    public CustomerDeliveryDetailsController(ICustomerDeliveryDetailsRepository repository, ICustomerAccountService accountService)
    {
        _repository = repository;
        _accountService = accountService;
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateCustomerDeliveryDetailsRequest request, CancellationToken cancellationToken)
    {
        int? accountId = null;
        if (request.SaveToAccount)
        {
            if (User.Identity?.IsAuthenticated != true ||
                !int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ||
                await _accountService.GetByIdAsync(id, cancellationToken) is null)
                return Unauthorized();
            accountId = id;
        }

        var details = ToDetails(request, accountId);

        var deliveryId = await _repository.AddAsync(details, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, new
        {
            customerDeliveryId = deliveryId,
            message = "Delivery details saved. An order and payment have not been created."
        });
    }

    /// <summary>Updates an address belonging to the authenticated customer.</summary>
    [Authorize]
    [ValidateAntiForgeryToken]
    [HttpPut("{deliveryId:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int deliveryId, [FromBody] CreateCustomerDeliveryDetailsRequest request, CancellationToken cancellationToken)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ||
            await _accountService.GetByIdAsync(id, cancellationToken) is null)
            return Unauthorized();

        var details = ToDetails(request, id);
        details.CustomerDeliveryId = deliveryId;
        if (!await _repository.UpdateForAccountAsync(details, cancellationToken))
            return NotFound();

        return Ok(new { customerDeliveryId = deliveryId, message = "Delivery details updated. An order and payment have not been created." });
    }

    /// <summary>Removes an address belonging to the authenticated customer.</summary>
    [Authorize]
    [ValidateAntiForgeryToken]
    [HttpDelete("{deliveryId:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int deliveryId, CancellationToken cancellationToken)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ||
            await _accountService.GetByIdAsync(id, cancellationToken) is null)
            return Unauthorized();

        return await _repository.DeleteForAccountAsync(id, deliveryId, cancellationToken) ? NoContent() : NotFound();
    }

    private static CustomerDeliveryDetails ToDetails(CreateCustomerDeliveryDetailsRequest request, int? accountId) => new()
    {
        CustomerAccountId = accountId,
        CustomerCountry = request.CustomerCountry,
        MobileNumber = request.MobileNumber,
        OrderEmail = request.OrderEmail,
        FirstName = request.FirstName,
        LastName = request.LastName,
        AddressLine1 = request.AddressLine1,
        AddressLine2 = request.AddressLine2,
        ReceiverPhone = request.ReceiverPhone,
        Pincode = request.Pincode,
        State = request.State,
        City = request.City,
        DeliveryCountry = request.DeliveryCountry,
        CreatedAt = DateTime.UtcNow
    };

    /// <summary>Returns the latest address saved by the authenticated customer.</summary>
    [Authorize]
    [HttpGet("latest")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [ProducesResponseType(typeof(CustomerDeliveryAddressResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetLatest(CancellationToken cancellationToken)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ||
            await _accountService.GetByIdAsync(id, cancellationToken) is null)
            return Unauthorized();

        var details = await _repository.GetLatestForAccountAsync(id, cancellationToken);
        return details is null ? NoContent() : Ok(new CustomerDeliveryAddressResponse(
            details.CustomerCountry, details.MobileNumber, details.OrderEmail, details.FirstName,
            details.LastName, details.AddressLine1, details.AddressLine2, details.ReceiverPhone,
            details.Pincode, details.State, details.City, details.DeliveryCountry));
    }

    /// <summary>Returns the authenticated customer's saved delivery addresses, newest first.</summary>
    [Authorize]
    [HttpGet]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [ProducesResponseType(typeof(IReadOnlyList<SavedCustomerDeliveryAddressResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetSavedAddresses(CancellationToken cancellationToken)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ||
            await _accountService.GetByIdAsync(id, cancellationToken) is null)
            return Unauthorized();

        var addresses = await _repository.GetAllForAccountAsync(id, cancellationToken);
        return Ok(addresses.Select(details => new SavedCustomerDeliveryAddressResponse(
            details.CustomerDeliveryId, details.CustomerCountry, details.MobileNumber, details.OrderEmail,
            details.FirstName, details.LastName, details.AddressLine1, details.AddressLine2,
            details.ReceiverPhone, details.Pincode, details.State, details.City, details.DeliveryCountry)));
    }
}

/// <summary>Delivery address saved for the current customer.</summary>
public sealed record CustomerDeliveryAddressResponse(
    string CustomerCountry, string MobileNumber, string? OrderEmail, string FirstName,
    string? LastName, string AddressLine1, string? AddressLine2, string ReceiverPhone,
    string Pincode, string State, string City, string DeliveryCountry);

/// <summary>Delivery address and reference saved for the current customer.</summary>
public sealed record SavedCustomerDeliveryAddressResponse(
    int CustomerDeliveryId, string CustomerCountry, string MobileNumber, string? OrderEmail,
    string FirstName, string? LastName, string AddressLine1, string? AddressLine2,
    string ReceiverPhone, string Pincode, string State, string City, string DeliveryCountry);

public class CreateCustomerDeliveryDetailsRequest
{
    public bool SaveToAccount { get; set; }

    [Required, StringLength(100)]
    public string CustomerCountry { get; set; } = "India";

    [Required, RegularExpression(@"^[0-9+()\-\s]{7,15}$")]
    public string MobileNumber { get; set; } = string.Empty;

    [EmailAddress, StringLength(254)]
    public string? OrderEmail { get; set; }

    [Required, StringLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [StringLength(100)]
    public string? LastName { get; set; }

    [Required, StringLength(255)]
    public string AddressLine1 { get; set; } = string.Empty;

    [StringLength(255)]
    public string? AddressLine2 { get; set; }

    [Required, RegularExpression(@"^[0-9+()\-\s]{7,15}$")]
    public string ReceiverPhone { get; set; } = string.Empty;

    [Required, RegularExpression(@"^[a-zA-Z0-9 -]{1,10}$")]
    public string Pincode { get; set; } = string.Empty;

    [Required, StringLength(100)]
    public string State { get; set; } = string.Empty;

    [Required, StringLength(100)]
    public string City { get; set; } = string.Empty;

    [Required, StringLength(100)]
    public string DeliveryCountry { get; set; } = "India";
}
