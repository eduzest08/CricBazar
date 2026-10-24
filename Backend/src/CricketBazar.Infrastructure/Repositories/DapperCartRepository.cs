using Dapper;
using CricketBazar.Infrastructure.Data;
using CricketBazar.Domain.Entities;
using CricketBazar.Domain.Interfaces;

namespace CricketBazar.Infrastructure.Repositories;

/// <summary>
/// Dapper-based repository for Cart entity.
/// </summary>
public class DapperCartRepository : DapperRepository<Cart>, ICartRepository
{
    public DapperCartRepository(ISqlConnectionFactory connectionFactory) 
        : base(connectionFactory)
    {
    }

    public async Task<Cart?> GetByIdAsync(int id)
    {
        const string sql = "SELECT * FROM dbo.Carts WHERE Id = @Id";
        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryFirstOrDefaultAsync<Cart>(sql, new { Id = id });
        }
    }

    public async Task<Cart?> GetByUserIdAsync(int userId)
    {
        const string sql = "SELECT * FROM dbo.Carts WHERE UserId = @UserId";
        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryFirstOrDefaultAsync<Cart>(sql, new { UserId = userId });
        }
    }

    public async Task<Cart?> GetByGuestTokenAsync(Guid guestToken)
    {
        const string sql = "SELECT * FROM dbo.Carts WHERE GuestToken = @GuestToken";
        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryFirstOrDefaultAsync<Cart>(sql, new { GuestToken = guestToken });
        }
    }

    public async Task<int> AddAsync(Cart cart)
    {
        const string sql = @"
            INSERT INTO dbo.Carts (UserId, GuestToken, UpdatedAt)
            VALUES (@UserId, @GuestToken, @UpdatedAt);
            SELECT CAST(SCOPE_IDENTITY() as int)";

        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryFirstAsync<int>(sql, cart);
        }
    }

    public async Task<bool> UpdateAsync(Cart cart)
    {
        const string sql = @"
            UPDATE dbo.Carts 
            SET UserId = @UserId, GuestToken = @GuestToken, UpdatedAt = @UpdatedAt
            WHERE Id = @Id";

        using (var connection = _connectionFactory.GetConnection())
        {
            var rowsAffected = await connection.ExecuteAsync(sql, cart);
            return rowsAffected > 0;
        }
    }

    public async Task<bool> DeleteAsync(int id)
    {
        const string sql = "DELETE FROM dbo.Carts WHERE Id = @Id";
        using (var connection = _connectionFactory.GetConnection())
        {
            var rowsAffected = await connection.ExecuteAsync(sql, new { Id = id });
            return rowsAffected > 0;
        }
    }
}
