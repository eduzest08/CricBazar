using System.Security.Claims;
using CricketBazar.Application.Services;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace CricketBazar.API.Controllers;

[ApiController]
[Route("api/v1/customer-accounts")]
[Produces("application/json")]
public sealed class CustomerAccountsController : ControllerBase
{
    private readonly ICustomerAccountService _accountService;
    private readonly IAntiforgery _antiforgery;

    public CustomerAccountsController(
        ICustomerAccountService accountService,
        IAntiforgery antiforgery)
    {
        _accountService = accountService;
        _antiforgery = antiforgery;
    }

    /// <summary>Returns a request token required for customer account state-changing requests.</summary>
    [AllowAnonymous]
    [HttpGet("antiforgery")]
    [ProducesResponseType(typeof(AntiforgeryTokenResponse), StatusCodes.Status200OK)]
    public IActionResult GetAntiforgeryToken()
    {
        var tokens = _antiforgery.GetAndStoreTokens(HttpContext);
        return Ok(new AntiforgeryTokenResponse(tokens.RequestToken!));
    }

    /// <summary>Registers a customer account and starts an authenticated session.</summary>
    [AllowAnonymous]
    [ValidateAntiForgeryToken]
    [EnableRateLimiting("CustomerAccountAuth")]
    [HttpPost("register")]
    [ProducesResponseType(typeof(CustomerAccountResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Register(
        [FromBody] RegisterCustomerAccountRequest request,
        CancellationToken cancellationToken)
    {
        var account = await _accountService.RegisterAsync(
            new RegisterCustomerAccountInput(
                request.Country,
                request.MobileNumber,
                request.Email,
                request.FirstName,
                request.LastName,
                request.Password),
            cancellationToken);

        if (account is null)
        {
            return Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Account already exists",
                Detail = "An account with the provided country/mobile number or email already exists."
            });
        }

        await SignInAsync(account);
        var response = ToResponse(account);
        return CreatedAtAction(nameof(GetCurrent), new { }, response);
    }

    /// <summary>Authenticates a registered customer using their email or country/mobile number.</summary>
    [AllowAnonymous]
    [ValidateAntiForgeryToken]
    [EnableRateLimiting("CustomerAccountAuth")]
    [HttpPost("login")]
    [ProducesResponseType(typeof(CustomerAccountResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Login(
        [FromBody] CustomerAccountLoginRequest request,
        CancellationToken cancellationToken)
    {
        var account = await _accountService.LoginAsync(
            new CustomerAccountCredentials(request.Identifier, request.Country, request.Password),
            cancellationToken);

        if (account is null)
        {
            return Unauthorized(new ProblemDetails
            {
                Status = StatusCodes.Status401Unauthorized,
                Title = "Sign-in failed",
                Detail = "The account details are invalid or the account is temporarily unavailable."
            });
        }

        await SignInAsync(account);
        return Ok(ToResponse(account));
    }

    /// <summary>Returns the authenticated customer's account details.</summary>
    [Authorize]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [HttpGet("me", Name = nameof(GetCurrent))]
    [ProducesResponseType(typeof(CustomerAccountResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCurrent(CancellationToken cancellationToken)
    {
        var idValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(idValue, out var customerAccountId))
        {
            return Unauthorized();
        }

        var account = await _accountService.GetByIdAsync(customerAccountId, cancellationToken);
        return account is null ? Unauthorized() : Ok(ToResponse(account));
    }

    /// <summary>Ends the authenticated customer's session.</summary>
    [Authorize]
    [ValidateAntiForgeryToken]
    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return NoContent();
    }

    private async Task SignInAsync(CustomerAccountProfile account)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, account.CustomerAccountId.ToString()),
            new Claim(ClaimTypes.Name, account.FirstName ?? account.MobileNumber),
            new Claim("customerAccountGuid", account.AccountGuid.ToString())
        };
        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            new ClaimsPrincipal(identity),
            new AuthenticationProperties { IsPersistent = false });
    }

    private static CustomerAccountResponse ToResponse(CustomerAccountProfile account) => new(
        account.CustomerAccountId,
        account.AccountGuid,
        account.Country,
        account.MobileNumber,
        account.Email,
        account.FirstName,
        account.LastName,
        account.CreatedAt);
}

/// <summary>Anti-forgery request token required for account state-changing requests.</summary>
public sealed record AntiforgeryTokenResponse(string RequestToken);

/// <summary>Customer account details returned after registration or sign-in.</summary>
public sealed record CustomerAccountResponse(
    int CustomerAccountId,
    Guid AccountGuid,
    string Country,
    string MobileNumber,
    string? Email,
    string? FirstName,
    string? LastName,
    DateTimeOffset CreatedAt);

/// <summary>Customer details and password used to register a new account.</summary>
public sealed record RegisterCustomerAccountRequest
{
    [System.ComponentModel.DataAnnotations.Required]
    [System.ComponentModel.DataAnnotations.StringLength(100)]
    public required string Country { get; init; }

    [System.ComponentModel.DataAnnotations.Required]
    [System.ComponentModel.DataAnnotations.RegularExpression(@"^(?=.*[0-9])\+?[0-9()\-\s]{7,15}$")]
    public required string MobileNumber { get; init; }

    [System.ComponentModel.DataAnnotations.EmailAddress]
    [System.ComponentModel.DataAnnotations.StringLength(254)]
    public string? Email { get; init; }

    [System.ComponentModel.DataAnnotations.StringLength(100)]
    public string? FirstName { get; init; }

    [System.ComponentModel.DataAnnotations.StringLength(100)]
    public string? LastName { get; init; }

    [System.ComponentModel.DataAnnotations.Required]
    [System.ComponentModel.DataAnnotations.StringLength(128, MinimumLength = 12)]
    [System.ComponentModel.DataAnnotations.RegularExpression(@"^(?=.*[A-Za-z])(?=.*\d).{12,128}$")]
    public required string Password { get; init; }
}

/// <summary>Customer identifier, country, and password used to sign in.</summary>
public sealed record CustomerAccountLoginRequest
{
    [System.ComponentModel.DataAnnotations.Required]
    [System.ComponentModel.DataAnnotations.StringLength(254)]
    public required string Identifier { get; init; }

    [System.ComponentModel.DataAnnotations.Required]
    [System.ComponentModel.DataAnnotations.StringLength(100)]
    public required string Country { get; init; }

    [System.ComponentModel.DataAnnotations.Required]
    [System.ComponentModel.DataAnnotations.StringLength(128, MinimumLength = 12)]
    public required string Password { get; init; }
}
