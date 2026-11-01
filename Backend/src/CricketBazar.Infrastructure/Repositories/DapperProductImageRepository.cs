using Dapper;
using CricketBazar.Infrastructure.Data;
using CricketBazar.Domain.Entities;
using CricketBazar.Domain.Interfaces;

namespace CricketBazar.Infrastructure.Repositories;

/// <summary>
/// Dapper-based repository for ProductImage entity.
/// </summary>
public class DapperProductImageRepository : DapperRepository<ProductImage>, IProductImageRepository
{
    private const string ListSelect = @"
        SELECT pi.Id, pi.ProductId, p.Name AS ProductName, pi.Url, pi.SortOrder
        FROM dbo.ProductImages pi
        INNER JOIN dbo.Products p ON p.Id = pi.ProductId";

    public DapperProductImageRepository(ISqlConnectionFactory connectionFactory)
        : base(connectionFactory)
    {
    }

    public async Task<ProductImage?> GetByIdAsync(int id)
    {
        const string sql = "SELECT * FROM dbo.ProductImages WHERE Id = @Id";
        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryFirstOrDefaultAsync<ProductImage>(sql, new { Id = id });
        }
    }

    public async Task<ProductImageListItem?> GetListItemByIdAsync(int id)
    {
        var sql = $"{ListSelect} WHERE pi.Id = @Id";
        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryFirstOrDefaultAsync<ProductImageListItem>(sql, new { Id = id });
        }
    }

    public async Task<int> AddAsync(ProductImage image)
    {
        const string sql = @"
            INSERT INTO dbo.ProductImages (ProductId, Url, SortOrder)
            VALUES (@ProductId, @Url, @SortOrder);
            SELECT CAST(SCOPE_IDENTITY() as int)";

        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryFirstAsync<int>(sql, image);
        }
    }

    public async Task<bool> UpdateAsync(ProductImage image)
    {
        const string sql = @"
            UPDATE dbo.ProductImages
            SET ProductId = @ProductId, Url = @Url, SortOrder = @SortOrder
            WHERE Id = @Id";

        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.ExecuteAsync(sql, image) > 0;
        }
    }

    public async Task<bool> DeleteAsync(int id)
    {
        const string sql = "DELETE FROM dbo.ProductImages WHERE Id = @Id";
        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.ExecuteAsync(sql, new { Id = id }) > 0;
        }
    }

    public async Task<(IEnumerable<ProductImageListItem> items, int totalCount)> SearchAsync(
        string? searchTerm, int? productId, string? sortBy, bool descending, int pageNumber, int pageSize)
    {
        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        // Column names come from a whitelist, never from user input directly
        var sortColumn = (sortBy ?? "product").ToLowerInvariant() switch
        {
            "id" => "pi.Id",
            "sortorder" => "pi.SortOrder",
            _ => "p.Name"
        };
        var direction = descending ? "DESC" : "ASC";
        // Tie-breakers must not repeat the primary sort column
        var tieBreak = sortColumn switch
        {
            "pi.Id" => "",
            "pi.SortOrder" => ", pi.Id ASC",
            _ => ", pi.SortOrder ASC, pi.Id ASC"
        };

        const string where = @"
            WHERE (@SearchTerm IS NULL OR p.Name LIKE '%' + @SearchTerm + '%' OR pi.Url LIKE '%' + @SearchTerm + '%')
              AND (@ProductId IS NULL OR pi.ProductId = @ProductId)";

        var countSql = $@"
            SELECT COUNT(*) FROM dbo.ProductImages pi
            INNER JOIN dbo.Products p ON p.Id = pi.ProductId {where}";
        var sql = $@"
            {ListSelect} {where}
            ORDER BY {sortColumn} {direction}{tieBreak}
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY";

        var parameters = new
        {
            SearchTerm = string.IsNullOrWhiteSpace(searchTerm) ? null : searchTerm.Trim(),
            ProductId = productId,
            Offset = (pageNumber - 1) * pageSize,
            PageSize = pageSize
        };

        using (var connection = _connectionFactory.GetConnection())
        {
            var totalCount = await connection.ExecuteScalarAsync<int>(countSql, parameters);
            var items = await connection.QueryAsync<ProductImageListItem>(sql, parameters);
            return (items, totalCount);
        }
    }
}
