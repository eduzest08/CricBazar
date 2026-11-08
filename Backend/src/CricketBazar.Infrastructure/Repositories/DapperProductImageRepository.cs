using Dapper;
using System.Data;
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
        SELECT pi.Id, pi.ProductId, p.Name AS ProductName, p.IsPublished AS ProductIsPublished, pi.Url, pi.SortOrder
        FROM dbo.ProductImages pi
        INNER JOIN dbo.Products p ON p.Id = pi.ProductId";

    public DapperProductImageRepository(ISqlConnectionFactory connectionFactory)
        : base(connectionFactory)
    {
    }

    public async Task<bool> ReorderAsync(int productId, IReadOnlyList<(int Id, int SortOrder)> images, CancellationToken cancellationToken)
    {
        await using var connection = _connectionFactory.GetConnection();
        await connection.OpenAsync(cancellationToken);
        using var transaction = connection.BeginTransaction(IsolationLevel.Serializable);
        var current = (await connection.QueryAsync<(int Id, int SortOrder)>(new CommandDefinition(
            "SELECT Id, SortOrder FROM dbo.ProductImages WITH (UPDLOCK, HOLDLOCK) WHERE ProductId = @ProductId",
            new { ProductId = productId }, transaction, cancellationToken: cancellationToken))).ToArray();
        var expected = images.ToDictionary(image => image.Id, image => image.SortOrder);
        if (current.Length != expected.Count || current.Any(image => !expected.TryGetValue(image.Id, out var order) || order != image.SortOrder))
            return false;
        for (var index = 0; index < images.Count; index++)
        {
            await connection.ExecuteAsync(new CommandDefinition(
                "UPDATE dbo.ProductImages SET SortOrder = @SortOrder WHERE Id = @Id AND ProductId = @ProductId",
                new { images[index].Id, ProductId = productId, SortOrder = index }, transaction, cancellationToken: cancellationToken));
        }
        transaction.Commit();
        return true;
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
        await using var connection = _connectionFactory.GetConnection();
        await connection.OpenAsync();
        using var transaction = connection.BeginTransaction(IsolationLevel.Serializable);
        var oldProductId = await connection.QuerySingleOrDefaultAsync<int?>(
            "SELECT ProductId FROM dbo.ProductImages WITH (UPDLOCK, HOLDLOCK) WHERE Id = @Id",
            new { image.Id }, transaction);
        if (oldProductId is null) return false;
        await connection.ExecuteAsync(
            "UPDATE dbo.ProductImages SET ProductId = @ProductId, Url = @Url, SortOrder = @SortOrder WHERE Id = @Id",
            image, transaction);
        if (oldProductId != image.ProductId)
            await UnpublishWithoutImages(connection, transaction, oldProductId.Value);
        transaction.Commit();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        await using var connection = _connectionFactory.GetConnection();
        await connection.OpenAsync();
        using var transaction = connection.BeginTransaction(IsolationLevel.Serializable);
        var productId = await connection.QuerySingleOrDefaultAsync<int?>(
            "SELECT ProductId FROM dbo.ProductImages WITH (UPDLOCK, HOLDLOCK) WHERE Id = @Id",
            new { Id = id }, transaction);
        if (productId is null) return false;
        await connection.ExecuteAsync("DELETE FROM dbo.ProductImages WHERE Id = @Id", new { Id = id }, transaction);
        await UnpublishWithoutImages(connection, transaction, productId.Value);
        transaction.Commit();
        return true;
    }

    private static Task<int> UnpublishWithoutImages(IDbConnection connection, IDbTransaction transaction, int productId)
        => connection.ExecuteAsync(@"UPDATE dbo.Products SET IsPublished = 0
            WHERE Id = @ProductId AND NOT EXISTS
            (SELECT 1 FROM dbo.ProductImages WHERE ProductId = @ProductId)",
            new { ProductId = productId }, transaction);

    public async Task<(IEnumerable<ProductImageListItem> items, int totalCount)> SearchAsync(
        string? searchTerm, int? productId, string? sortBy, bool descending, int pageNumber, int pageSize, bool isActive = true)
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
              AND (@ProductId IS NULL OR pi.ProductId = @ProductId)
              AND p.IsActive = @IsActive";

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
            IsActive = isActive,
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
