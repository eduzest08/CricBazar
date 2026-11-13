using CricketBazar.Domain.Entities;
using CricketBazar.Domain.Interfaces;
using CricketBazar.Infrastructure.Data;
using Dapper;
using Microsoft.Data.SqlClient;

namespace CricketBazar.Infrastructure.Repositories;

public sealed class DapperCustomerAccountRepository : ICustomerAccountRepository
{
    private readonly ISqlConnectionFactory _connectionFactory;

    public DapperCustomerAccountRepository(ISqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<CustomerAccount?> GetByIdAsync(int customerAccountId, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT * FROM cust.CustomerAccount
            WHERE CustomerAccountId = @CustomerAccountId AND IsGuest = 0;
            """;

        await using var connection = _connectionFactory.GetConnection();
        return await connection.QuerySingleOrDefaultAsync<CustomerAccount>(
            new CommandDefinition(sql, new { CustomerAccountId = customerAccountId }, cancellationToken: cancellationToken));
    }

    public async Task<CustomerAccount?> GetRegisteredByEmailAsync(string email, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT TOP (1) * FROM cust.CustomerAccount
            WHERE IsGuest = 0 AND Email = @Email;
            """;

        await using var connection = _connectionFactory.GetConnection();
        return await connection.QuerySingleOrDefaultAsync<CustomerAccount>(
            new CommandDefinition(sql, new { Email = email }, cancellationToken: cancellationToken));
    }

    public async Task<CustomerAccount?> GetRegisteredByMobileAsync(
        string country, string mobileNumber, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT TOP (1) * FROM cust.CustomerAccount
            WHERE IsGuest = 0 AND Country = @Country AND MobileNumber = @MobileNumber;
            """;

        await using var connection = _connectionFactory.GetConnection();
        return await connection.QuerySingleOrDefaultAsync<CustomerAccount>(
            new CommandDefinition(sql, new { Country = country, MobileNumber = mobileNumber }, cancellationToken: cancellationToken));
    }

    public async Task<int?> AddRegisteredAsync(CustomerAccount account, CancellationToken cancellationToken)
    {
        const string sql = """
            INSERT INTO cust.CustomerAccount
                (IsGuest, Country, MobileNumber, Email, FirstName, LastName, PasswordHash, PasswordSalt, CreatedAt)
            VALUES
                (0, @Country, @MobileNumber, @Email, @FirstName, @LastName, @PasswordHash, @PasswordSalt, @CreatedAt);
            SELECT CAST(SCOPE_IDENTITY() AS int);
            """;

        await using var connection = _connectionFactory.GetConnection();
        try
        {
            return await connection.QuerySingleAsync<int>(
                new CommandDefinition(sql, account, cancellationToken: cancellationToken));
        }
        catch (SqlException exception) when (exception.Number is 2601 or 2627)
        {
            return null;
        }
    }

    public async Task RecordFailedLoginAsync(
        int customerAccountId, DateTime nowUtc, CancellationToken cancellationToken)
    {
        const string sql = """
            UPDATE cust.CustomerAccount
            SET FailedLoginCount = FailedLoginCount + 1,
                LockoutEndUtc = CASE
                    WHEN FailedLoginCount + 1 >= 5 THEN DATEADD(MINUTE, 15, @NowUtc)
                    ELSE LockoutEndUtc
                END,
                UpdatedAt = @NowUtc
            WHERE CustomerAccountId = @CustomerAccountId AND IsGuest = 0;
            """;

        await using var connection = _connectionFactory.GetConnection();
        await connection.ExecuteAsync(new CommandDefinition(
            sql, new { CustomerAccountId = customerAccountId, NowUtc = nowUtc }, cancellationToken: cancellationToken));
    }

    public async Task RecordSuccessfulLoginAsync(
        int customerAccountId, DateTime nowUtc, CancellationToken cancellationToken)
    {
        const string sql = """
            UPDATE cust.CustomerAccount
            SET FailedLoginCount = 0, LockoutEndUtc = NULL,
                LastLoginAt = @NowUtc, UpdatedAt = @NowUtc
            WHERE CustomerAccountId = @CustomerAccountId AND IsGuest = 0 AND IsActive = 1;
            """;

        await using var connection = _connectionFactory.GetConnection();
        await connection.ExecuteAsync(new CommandDefinition(
            sql, new { CustomerAccountId = customerAccountId, NowUtc = nowUtc }, cancellationToken: cancellationToken));
    }
}
