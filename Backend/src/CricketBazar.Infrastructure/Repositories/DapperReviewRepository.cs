using Dapper;
using CricketBazar.Infrastructure.Data;
using CricketBazar.Domain.Entities;
using CricketBazar.Domain.Interfaces;

namespace CricketBazar.Infrastructure.Repositories;

/// <summary>
/// Dapper-based repository for Review entity.
/// </summary>
public class DapperReviewRepository : DapperRepository<Review>, IReviewRepository
{
    public DapperReviewRepository(ISqlConnectionFactory connectionFactory) 
        : base(connectionFactory)
    {
    }

    public async Task<Review?> GetByIdAsync(int id)
    {
        const string sql = "SELECT * FROM dbo.Reviews WHERE Id = @Id";
        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryFirstOrDefaultAsync<Review>(sql, new { Id = id });
        }
    }

    public async Task<IEnumerable<Review>> GetByProductIdAsync(int productId)
    {
        const string sql = "SELECT * FROM dbo.Reviews WHERE ProductId = @ProductId ORDER BY CreatedAt DESC";
        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryAsync<Review>(sql, new { ProductId = productId });
        }
    }

    public async Task<IEnumerable<Review>> GetByUserIdAsync(int userId)
    {
        const string sql = "SELECT * FROM dbo.Reviews WHERE UserId = @UserId ORDER BY CreatedAt DESC";
        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryAsync<Review>(sql, new { UserId = userId });
        }
    }

    public async Task<int> AddAsync(Review review)
    {
        const string sql = @"
            INSERT INTO dbo.Reviews (ProductId, UserId, Rating, Comment, CreatedAt)
            VALUES (@ProductId, @UserId, @Rating, @Comment, @CreatedAt);
            SELECT CAST(SCOPE_IDENTITY() as int)";

        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryFirstAsync<int>(sql, review);
        }
    }

    public async Task<bool> DeleteAsync(int id)
    {
        const string sql = "DELETE FROM dbo.Reviews WHERE Id = @Id";
        using (var connection = _connectionFactory.GetConnection())
        {
            var rowsAffected = await connection.ExecuteAsync(sql, new { Id = id });
            return rowsAffected > 0;
        }
    }
}
