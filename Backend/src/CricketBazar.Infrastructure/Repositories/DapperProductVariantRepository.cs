using Dapper;
using CricketBazar.Infrastructure.Data;
using CricketBazar.Domain.Entities;
using CricketBazar.Domain.Interfaces;

namespace CricketBazar.Infrastructure.Repositories;

/// <summary>
/// Dapper-based repository for ProductVariant entity.
/// </summary>
public class DapperProductVariantRepository : DapperRepository<ProductVariant>, IProductVariantRepository
{
    private const string ListSelect = @"
        SELECT pv.Id, pv.ProductId, p.Name AS ProductName, pv.Size, pv.Color, pv.Hand, pv.Stock, pv.PriceOverride
        FROM dbo.ProductVariants pv
        INNER JOIN dbo.Products p ON p.Id = pv.ProductId";

    public DapperProductVariantRepository(ISqlConnectionFactory connectionFactory)
        : base(connectionFactory)
    {
    }

    public async Task<ProductVariant?> GetByIdAsync(int id)
    {
        const string sql = "SELECT * FROM dbo.ProductVariants WHERE Id = @Id";
        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryFirstOrDefaultAsync<ProductVariant>(sql, new { Id = id });
        }
    }

    public async Task<ProductVariant?> GetByCombinationAsync(int productId, string? size, string? color, string? hand)
    {
        const string sql = @"
            SELECT * FROM dbo.ProductVariants
            WHERE ProductId = @ProductId
              AND ISNULL(Size, '') = ISNULL(@Size, '')
              AND ISNULL(Color, '') = ISNULL(@Color, '')
              AND ISNULL(Hand, '') = ISNULL(@Hand, '')";
        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryFirstOrDefaultAsync<ProductVariant>(
                sql, new { ProductId = productId, Size = size, Color = color, Hand = hand });
        }
    }

    public async Task<ProductVariantListItem?> GetListItemByIdAsync(int id)
    {
        var sql = $"{ListSelect} WHERE pv.Id = @Id";
        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryFirstOrDefaultAsync<ProductVariantListItem>(sql, new { Id = id });
        }
    }

    public async Task<int> AddAsync(ProductVariant variant)
    {
        const string sql = @"
            INSERT INTO dbo.ProductVariants (ProductId, Size, Color, Hand, Stock, PriceOverride)
            VALUES (@ProductId, @Size, @Color, @Hand, @Stock, @PriceOverride);
            SELECT CAST(SCOPE_IDENTITY() as int)";

        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryFirstAsync<int>(sql, variant);
        }
    }

    public async Task<bool> UpdateAsync(ProductVariant variant)
    {
        const string sql = @"
            UPDATE dbo.ProductVariants
            SET ProductId = @ProductId, Size = @Size, Color = @Color, Hand = @Hand,
                Stock = @Stock, PriceOverride = @PriceOverride
            WHERE Id = @Id";

        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.ExecuteAsync(sql, variant) > 0;
        }
    }

    public async Task<bool> DeleteAsync(int id)
    {
        const string sql = "DELETE FROM dbo.ProductVariants WHERE Id = @Id";
        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.ExecuteAsync(sql, new { Id = id }) > 0;
        }
    }

    public async Task<(IEnumerable<ProductVariantListItem> items, int totalCount)> SearchAsync(
        string? searchTerm, int? productId, string? sortBy, bool descending, int pageNumber, int pageSize)
    {
        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        // Column names come from a whitelist, never from user input directly
        var sortColumn = (sortBy ?? "product").ToLowerInvariant() switch
        {
            "id" => "pv.Id",
            "size" => "pv.Size",
            "color" => "pv.Color",
            "hand" => "pv.Hand",
            "stock" => "pv.Stock",
            "priceoverride" => "pv.PriceOverride",
            _ => "p.Name"
        };
        var direction = descending ? "DESC" : "ASC";
        var tieBreak = sortColumn == "pv.Id" ? "" : ", pv.Id ASC";

        const string where = @"
            WHERE (@SearchTerm IS NULL OR p.Name LIKE '%' + @SearchTerm + '%'
                   OR pv.Size LIKE '%' + @SearchTerm + '%' OR pv.Color LIKE '%' + @SearchTerm + '%'
                   OR pv.Hand LIKE '%' + @SearchTerm + '%')
              AND (@ProductId IS NULL OR pv.ProductId = @ProductId)";

        var countSql = $@"
            SELECT COUNT(*) FROM dbo.ProductVariants pv
            INNER JOIN dbo.Products p ON p.Id = pv.ProductId {where}";
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
            var items = await connection.QueryAsync<ProductVariantListItem>(sql, parameters);
            return (items, totalCount);
        }
    }
}
