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

    private const string ListSelect = @"
        SELECT r.Id, r.ProductId, p.Name AS ProductName, r.UserId, u.Name AS UserName,
               r.Rating, r.Comment, r.CreatedAt
        FROM dbo.Reviews r
        INNER JOIN dbo.Products p ON p.Id = r.ProductId
        INNER JOIN dbo.Users u ON u.Id = r.UserId";

    public async Task<bool> UpdateAsync(Review review)
    {
        const string sql = "UPDATE dbo.Reviews SET ProductId = @ProductId, Rating = @Rating, Comment = @Comment WHERE Id = @Id";
        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.ExecuteAsync(sql, review) > 0;
        }
    }

    public async Task<ReviewListItem?> GetListItemByIdAsync(int id)
    {
        var sql = $"{ListSelect} WHERE r.Id = @Id";
        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryFirstOrDefaultAsync<ReviewListItem>(sql, new { Id = id });
        }
    }

    public async Task<(IEnumerable<ReviewListItem> items, int totalCount)> SearchAsync(
        string? searchTerm, int? productId, int? rating, string? sortBy, bool descending, int pageNumber, int pageSize)
    {
        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        // Column names come from a whitelist, never from user input directly
        var sortColumn = (sortBy ?? "date").ToLowerInvariant() switch
        {
            "id" => "r.Id",
            "product" => "p.Name",
            "user" => "u.Name",
            "rating" => "r.Rating",
            _ => "r.CreatedAt"
        };
        var direction = descending ? "DESC" : "ASC";
        var tieBreak = sortColumn == "r.Id" ? "" : ", r.Id ASC";

        const string from = @"
            FROM dbo.Reviews r
            INNER JOIN dbo.Products p ON p.Id = r.ProductId
            INNER JOIN dbo.Users u ON u.Id = r.UserId";
        const string where = @"
            WHERE (@SearchTerm IS NULL OR r.Comment LIKE '%' + @SearchTerm + '%'
                   OR p.Name LIKE '%' + @SearchTerm + '%' OR u.Name LIKE '%' + @SearchTerm + '%')
              AND (@ProductId IS NULL OR r.ProductId = @ProductId)
              AND (@Rating IS NULL OR r.Rating = @Rating)";

        var countSql = $"SELECT COUNT(*) {from} {where}";
        var sql = $@"
            {ListSelect} {where}
            ORDER BY {sortColumn} {direction}{tieBreak}
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY";

        var parameters = new
        {
            SearchTerm = string.IsNullOrWhiteSpace(searchTerm) ? null : searchTerm.Trim(),
            ProductId = productId,
            Rating = rating,
            Offset = (pageNumber - 1) * pageSize,
            PageSize = pageSize
        };

        using (var connection = _connectionFactory.GetConnection())
        {
            var totalCount = await connection.ExecuteScalarAsync<int>(countSql, parameters);
            var items = await connection.QueryAsync<ReviewListItem>(sql, parameters);
            return (items, totalCount);
        }
    }
}
