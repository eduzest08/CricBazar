using Dapper;
using CricketBazar.Infrastructure.Data;
using CricketBazar.Domain.Entities;
using CricketBazar.Domain.Interfaces;

namespace CricketBazar.Infrastructure.Repositories;

/// <summary>
/// Dapper-based repository for Wishlist entity.
/// </summary>
public class DapperWishlistRepository : DapperRepository<Wishlist>, IWishlistRepository
{
    public DapperWishlistRepository(ISqlConnectionFactory connectionFactory) 
        : base(connectionFactory)
    {
    }

    public async Task<Wishlist?> GetByIdAsync(int userId, int productId)
    {
        const string sql = "SELECT * FROM dbo.Wishlist WHERE UserId = @UserId AND ProductId = @ProductId";
        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryFirstOrDefaultAsync<Wishlist>(sql, new { UserId = userId, ProductId = productId });
        }
    }

    public async Task<IEnumerable<Wishlist>> GetByUserIdAsync(int userId)
    {
        const string sql = "SELECT * FROM dbo.Wishlist WHERE UserId = @UserId ORDER BY AddedAt DESC";
        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryAsync<Wishlist>(sql, new { UserId = userId });
        }
    }

    public async Task<bool> AddAsync(Wishlist wishlist)
    {
        const string sql = @"
            INSERT INTO dbo.Wishlist (UserId, ProductId, AddedAt)
            VALUES (@UserId, @ProductId, @AddedAt)";

        using (var connection = _connectionFactory.GetConnection())
        {
            var rowsAffected = await connection.ExecuteAsync(sql, wishlist);
            return rowsAffected > 0;
        }
    }

    public async Task<bool> RemoveAsync(int userId, int productId)
    {
        const string sql = "DELETE FROM dbo.Wishlist WHERE UserId = @UserId AND ProductId = @ProductId";
        using (var connection = _connectionFactory.GetConnection())
        {
            var rowsAffected = await connection.ExecuteAsync(sql, new { UserId = userId, ProductId = productId });
            return rowsAffected > 0;
        }
    }
}
