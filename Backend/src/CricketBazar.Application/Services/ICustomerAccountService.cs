namespace CricketBazar.Application.Services;

public sealed record RegisterCustomerAccountInput(
    string Country,
    string MobileNumber,
    string? Email,
    string? FirstName,
    string? LastName,
    string Password);

public sealed record CustomerAccountCredentials(string Identifier, string Country, string Password);

public sealed record CustomerAccountProfile(
    int CustomerAccountId,
    Guid AccountGuid,
    string Country,
    string MobileNumber,
    string? Email,
    string? FirstName,
    string? LastName,
    DateTimeOffset CreatedAt);

public interface ICustomerAccountService
{
    Task<CustomerAccountProfile?> RegisterAsync(
        RegisterCustomerAccountInput input, CancellationToken cancellationToken);

    Task<CustomerAccountProfile?> LoginAsync(
        CustomerAccountCredentials credentials, CancellationToken cancellationToken);

    Task<CustomerAccountProfile?> GetByIdAsync(int customerAccountId, CancellationToken cancellationToken);
}
