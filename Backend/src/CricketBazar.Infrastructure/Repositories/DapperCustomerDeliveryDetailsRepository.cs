using CricketBazar.Domain.Entities;
using CricketBazar.Domain.Interfaces;
using CricketBazar.Infrastructure.Data;
using Dapper;

namespace CricketBazar.Infrastructure.Repositories;

public class DapperCustomerDeliveryDetailsRepository : ICustomerDeliveryDetailsRepository
{
    private readonly ISqlConnectionFactory _connectionFactory;

    public DapperCustomerDeliveryDetailsRepository(ISqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<int> AddAsync(CustomerDeliveryDetails deliveryDetails, CancellationToken cancellationToken)
    {
        const string sql = """
            INSERT INTO cust.CustomerDeliveryDetails
                (CustomerAccountId, CustomerCountry, MobileNumber, OrderEmail, FirstName, LastName, AddressLine1,
                 AddressLine2, ReceiverPhone, Pincode, State, City, DeliveryCountry, CreatedAt)
            VALUES
                (@CustomerAccountId, @CustomerCountry, @MobileNumber, @OrderEmail, @FirstName, @LastName, @AddressLine1,
                 @AddressLine2, @ReceiverPhone, @Pincode, @State, @City, @DeliveryCountry, @CreatedAt);
            SELECT CAST(SCOPE_IDENTITY() AS int);
            """;

        await using var connection = _connectionFactory.GetConnection();
        return await connection.QuerySingleAsync<int>(new CommandDefinition(sql, deliveryDetails, cancellationToken: cancellationToken));
    }

    public async Task<CustomerDeliveryDetails?> GetLatestForAccountAsync(int customerAccountId, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT TOP (1) CustomerDeliveryId, CustomerAccountId, CustomerCountry, MobileNumber,
                OrderEmail, FirstName, LastName, AddressLine1, AddressLine2, ReceiverPhone,
                Pincode, State, City, DeliveryCountry, CreatedAt
            FROM cust.CustomerDeliveryDetails
            WHERE CustomerAccountId = @CustomerAccountId
            ORDER BY CustomerDeliveryId DESC;
            """;

        await using var connection = _connectionFactory.GetConnection();
        return await connection.QuerySingleOrDefaultAsync<CustomerDeliveryDetails>(
            new CommandDefinition(sql, new { CustomerAccountId = customerAccountId }, cancellationToken: cancellationToken));
    }

    public async Task<IReadOnlyList<CustomerDeliveryDetails>> GetAllForAccountAsync(int customerAccountId, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT CustomerDeliveryId, CustomerAccountId, CustomerCountry, MobileNumber,
                OrderEmail, FirstName, LastName, AddressLine1, AddressLine2, ReceiverPhone,
                Pincode, State, City, DeliveryCountry, CreatedAt
            FROM cust.CustomerDeliveryDetails
            WHERE CustomerAccountId = @CustomerAccountId
            ORDER BY CustomerDeliveryId DESC;
            """;

        await using var connection = _connectionFactory.GetConnection();
        var addresses = await connection.QueryAsync<CustomerDeliveryDetails>(
            new CommandDefinition(sql, new { CustomerAccountId = customerAccountId }, cancellationToken: cancellationToken));
        return addresses.AsList();
    }

    public async Task<bool> UpdateForAccountAsync(CustomerDeliveryDetails deliveryDetails, CancellationToken cancellationToken)
    {
        const string sql = """
            UPDATE cust.CustomerDeliveryDetails
            SET CustomerCountry = @CustomerCountry, MobileNumber = @MobileNumber, OrderEmail = @OrderEmail,
                FirstName = @FirstName, LastName = @LastName, AddressLine1 = @AddressLine1,
                AddressLine2 = @AddressLine2, ReceiverPhone = @ReceiverPhone, Pincode = @Pincode,
                State = @State, City = @City, DeliveryCountry = @DeliveryCountry, UpdatedAt = SYSUTCDATETIME()
            WHERE CustomerAccountId = @CustomerAccountId AND CustomerDeliveryId = @CustomerDeliveryId;
            """;

        await using var connection = _connectionFactory.GetConnection();
        return await connection.ExecuteAsync(new CommandDefinition(sql, deliveryDetails, cancellationToken: cancellationToken)) > 0;
    }

    public async Task<bool> DeleteForAccountAsync(int customerAccountId, int customerDeliveryId, CancellationToken cancellationToken)
    {
        const string sql = """
            DELETE FROM cust.CustomerDeliveryDetails
            WHERE CustomerAccountId = @CustomerAccountId AND CustomerDeliveryId = @CustomerDeliveryId;
            """;

        await using var connection = _connectionFactory.GetConnection();
        return await connection.ExecuteAsync(new CommandDefinition(
            sql, new { CustomerAccountId = customerAccountId, CustomerDeliveryId = customerDeliveryId },
            cancellationToken: cancellationToken)) > 0;
    }
}
