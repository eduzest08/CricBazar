using Dapper;
using CricketBazar.Infrastructure.Data;
using CricketBazar.Domain.Entities;
using CricketBazar.Domain.Interfaces;

namespace CricketBazar.Infrastructure.Repositories;

/// <summary>
/// Dapper-based repository for ProductAttribute entity.
/// </summary>
public class DapperProductAttributeRepository : DapperRepository<ProductAttribute>, IProductAttributeRepository
{
    private const string ListSelect = @"
        SELECT pa.Id, pa.ProductId, p.Name AS ProductName, pa.Name, pa.Value
        FROM dbo.ProductAttributes pa
        INNER JOIN dbo.Products p ON p.Id = pa.ProductId";

    public DapperProductAttributeRepository(ISqlConnectionFactory connectionFactory)
        : base(connectionFactory)
    {
    }

    public async Task<ProductAttribute?> GetByIdAsync(int id)
    {
        const string sql = "SELECT * FROM dbo.ProductAttributes WHERE Id = @Id";
        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryFirstOrDefaultAsync<ProductAttribute>(sql, new { Id = id });
        }
    }

    public async Task<ProductAttribute?> GetByProductAndNameAsync(int productId, string name)
    {
        const string sql = "SELECT * FROM dbo.ProductAttributes WHERE ProductId = @ProductId AND Name = @Name";
        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryFirstOrDefaultAsync<ProductAttribute>(sql, new { ProductId = productId, Name = name });
        }
    }

    public async Task<ProductAttributeListItem?> GetListItemByIdAsync(int id)
    {
        var sql = $"{ListSelect} WHERE pa.Id = @Id";
        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryFirstOrDefaultAsync<ProductAttributeListItem>(sql, new { Id = id });
        }
    }

    public async Task<int> AddAsync(ProductAttribute attribute)
    {
        const string sql = @"
            INSERT INTO dbo.ProductAttributes (ProductId, Name, Value)
            VALUES (@ProductId, @Name, @Value);
            SELECT CAST(SCOPE_IDENTITY() as int)";

        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryFirstAsync<int>(sql, attribute);
        }
    }

    public async Task<bool> UpdateAsync(ProductAttribute attribute)
    {
        const string sql = @"
            UPDATE dbo.ProductAttributes
            SET ProductId = @ProductId, Name = @Name, Value = @Value
            WHERE Id = @Id";

        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.ExecuteAsync(sql, attribute) > 0;
        }
    }

    public async Task<bool> DeleteAsync(int id)
    {
        const string sql = "DELETE FROM dbo.ProductAttributes WHERE Id = @Id";
        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.ExecuteAsync(sql, new { Id = id }) > 0;
        }
    }

    public async Task<(IEnumerable<ProductAttributeListItem> items, int totalCount)> SearchAsync(
        string? searchTerm, int? productId, string? sortBy, bool descending, int pageNumber, int pageSize)
    {
        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        // Column names come from a whitelist, never from user input directly
        var sortColumn = (sortBy ?? "name").ToLowerInvariant() switch
        {
            "id" => "pa.Id",
            "value" => "pa.Value",
            "product" => "p.Name",
            _ => "pa.Name"
        };
        var direction = descending ? "DESC" : "ASC";
        var tieBreak = sortColumn == "pa.Id" ? "" : ", pa.Id ASC";

        const string where = @"
            WHERE (@SearchTerm IS NULL OR pa.Name LIKE '%' + @SearchTerm + '%'
                   OR pa.Value LIKE '%' + @SearchTerm + '%' OR p.Name LIKE '%' + @SearchTerm + '%')
              AND (@ProductId IS NULL OR pa.ProductId = @ProductId)";

        var countSql = $@"
            SELECT COUNT(*) FROM dbo.ProductAttributes pa
            INNER JOIN dbo.Products p ON p.Id = pa.ProductId {where}";
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
            var items = await connection.QueryAsync<ProductAttributeListItem>(sql, parameters);
            return (items, totalCount);
        }
    }
}
