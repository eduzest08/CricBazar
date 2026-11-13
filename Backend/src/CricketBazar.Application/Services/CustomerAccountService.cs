using System.Security.Cryptography;
using CricketBazar.Domain.Entities;
using CricketBazar.Domain.Interfaces;

namespace CricketBazar.Application.Services;

public sealed class CustomerAccountService : ICustomerAccountService
{
    private const int HashIterations = 310_000;
    private const int SaltSize = 16;
    private const int HashSize = 32;
    private static readonly byte[] DummySalt = new byte[SaltSize];
    private static readonly byte[] DummyHash = new byte[HashSize];

    private readonly ICustomerAccountRepository _repository;

    public CustomerAccountService(ICustomerAccountRepository repository)
    {
        _repository = repository;
    }

    public async Task<CustomerAccountProfile?> RegisterAsync(
        RegisterCustomerAccountInput input, CancellationToken cancellationToken)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var account = new CustomerAccount
        {
            AccountGuid = Guid.NewGuid(),
            IsGuest = false,
            Country = input.Country.Trim(),
            MobileNumber = input.MobileNumber.Trim(),
            Email = string.IsNullOrWhiteSpace(input.Email) ? null : input.Email.Trim().ToLowerInvariant(),
            FirstName = NormalizeOptional(input.FirstName),
            LastName = NormalizeOptional(input.LastName),
            PasswordSalt = salt,
            PasswordHash = HashPassword(input.Password, salt),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var id = await _repository.AddRegisteredAsync(account, cancellationToken);
        if (id is null)
        {
            return null;
        }

        account.CustomerAccountId = id.Value;
        return ToProfile(account);
    }

    public async Task<CustomerAccountProfile?> LoginAsync(
        CustomerAccountCredentials credentials, CancellationToken cancellationToken)
    {
        var identifier = credentials.Identifier.Trim();
        var account = identifier.Contains('@')
            ? await _repository.GetRegisteredByEmailAsync(identifier.ToLowerInvariant(), cancellationToken)
            : await _repository.GetRegisteredByMobileAsync(
                credentials.Country.Trim(), identifier, cancellationToken);

        var salt = account?.PasswordSalt is { Length: SaltSize } accountSalt ? accountSalt : DummySalt;
        var expectedHash = account?.PasswordHash is { Length: HashSize } passwordHash ? passwordHash : DummyHash;
        var passwordMatches = VerifyPassword(credentials.Password, salt, expectedHash);

        if (account is null)
        {
            return null;
        }

        var now = DateTime.UtcNow;
        var lockedOut = account.LockoutEndUtc is DateTime lockoutEnd && lockoutEnd > now;
        var hasUsablePassword = account.PasswordHash is { Length: HashSize } &&
            account.PasswordSalt is { Length: SaltSize };
        if (!account.IsGuest && account.IsActive && !lockedOut && !passwordMatches)
        {
            await _repository.RecordFailedLoginAsync(
                account.CustomerAccountId, now, cancellationToken);
        }

        if (account.IsGuest || !account.IsActive || !hasUsablePassword || lockedOut || !passwordMatches)
        {
            return null;
        }

        await _repository.RecordSuccessfulLoginAsync(account.CustomerAccountId, now, cancellationToken);
        account.FailedLoginCount = 0;
        account.LockoutEndUtc = null;
        account.LastLoginAt = now;
        return ToProfile(account);
    }

    public async Task<CustomerAccountProfile?> GetByIdAsync(
        int customerAccountId, CancellationToken cancellationToken)
    {
        var account = await _repository.GetByIdAsync(customerAccountId, cancellationToken);
        return account is { IsActive: true, IsGuest: false } ? ToProfile(account) : null;
    }

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static byte[] HashPassword(string password, byte[] salt) =>
        Rfc2898DeriveBytes.Pbkdf2(password, salt, HashIterations, HashAlgorithmName.SHA256, HashSize);

    private static bool VerifyPassword(string password, byte[] salt, byte[] expectedHash)
    {
        var actualHash = HashPassword(password, salt);
        return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
    }

    private static CustomerAccountProfile ToProfile(CustomerAccount account) => new(
        account.CustomerAccountId,
        account.AccountGuid,
        account.Country,
        account.MobileNumber,
        account.Email,
        account.FirstName,
        account.LastName,
        new DateTimeOffset(DateTime.SpecifyKind(account.CreatedAt, DateTimeKind.Utc)));
}
