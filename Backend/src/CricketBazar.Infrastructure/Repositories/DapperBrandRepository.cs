using Dapper;
using CricketBazar.Infrastructure.Data;
using CricketBazar.Domain.Entities;
using CricketBazar.Domain.Interfaces;

namespace CricketBazar.Infrastructure.Repositories;

/// <summary>
/// Dapper-based repository for Brand entity.
/// </summary>
public class DapperBrandRepository : DapperRepository<Brand>, IBrandRepository
{
    private const string TableName = "dbo.Brands";

    public DapperBrandRepository(ISqlConnectionFactory connectionFactory) 
        : base(connectionFactory)
    {
    }

    public async Task<Brand?> GetByIdAsync(int id)
    {
        const string sql = "SELECT * FROM dbo.Brands WHERE Id = @Id";
        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryFirstOrDefaultAsync<Brand>(sql, new { Id = id });
        }
    }

    public async Task<Brand?> GetBySlugAsync(string slug)
    {
        const string sql = "SELECT * FROM dbo.Brands WHERE Slug = @Slug AND IsActive = 1";
        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryFirstOrDefaultAsync<Brand>(sql, new { Slug = slug });
        }
    }

    public async Task<IEnumerable<Brand>> GetAllAsync()
    {
        const string sql = "SELECT * FROM dbo.Brands WHERE IsActive = 1 ORDER BY Name";
        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryAsync<Brand>(sql);
        }
    }

    public async Task<(IEnumerable<Brand> items, int totalCount)> GetPagedAsync(int pageNumber = 1, int pageSize = 10)
    {
        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var offset = (pageNumber - 1) * pageSize;

        const string countSql = "SELECT COUNT(*) FROM dbo.Brands WHERE IsActive = 1";
        const string sql = @"
            SELECT * FROM dbo.Brands 
            WHERE IsActive = 1
            ORDER BY Name
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY";

        using (var connection = _connectionFactory.GetConnection())
        {
            var totalCount = await connection.ExecuteScalarAsync<int>(countSql);
            var items = await connection.QueryAsync<Brand>(sql, new { Offset = offset, PageSize = pageSize });
            return (items, totalCount);
        }
    }

    public async Task<int> AddAsync(Brand brand)
    {
        const string sql = @"
            INSERT INTO dbo.Brands (Name, Slug, LogoUrl, IsActive)
            VALUES (@Name, @Slug, @LogoUrl, @IsActive);
            SELECT CAST(SCOPE_IDENTITY() as int)";

        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryFirstAsync<int>(sql, brand);
        }
    }

    public async Task<bool> UpdateAsync(Brand brand)
    {
        const string sql = @"
            UPDATE dbo.Brands 
            SET Name = @Name, Slug = @Slug, LogoUrl = @LogoUrl, IsActive = @IsActive
            WHERE Id = @Id";

        using (var connection = _connectionFactory.GetConnection())
        {
            var rowsAffected = await connection.ExecuteAsync(sql, brand);
            return rowsAffected > 0;
        }
    }

    public async Task<bool> DeleteAsync(int id)
    {
        const string sql = "DELETE FROM dbo.Brands WHERE Id = @Id";
        using (var connection = _connectionFactory.GetConnection())
        {
            var rowsAffected = await connection.ExecuteAsync(sql, new { Id = id });
            return rowsAffected > 0;
        }
    }

    public async Task<(IEnumerable<Brand> items, int totalCount)> SearchAsync(
        string? searchTerm, bool? isActive, string? sortBy, bool descending, int pageNumber, int pageSize)
    {
        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        // Column names come from a whitelist, never from user input directly
        var sortColumn = (sortBy ?? "name").ToLowerInvariant() switch
        {
            "id" => "Id",
            "slug" => "Slug",
            "isactive" => "IsActive",
            _ => "Name"
        };
        var direction = descending ? "DESC" : "ASC";

        const string where = @"
            WHERE (@SearchTerm IS NULL OR Name LIKE '%' + @SearchTerm + '%' OR Slug LIKE '%' + @SearchTerm + '%')
              AND (@IsActive IS NULL OR IsActive = @IsActive)";

        var countSql = $"SELECT COUNT(*) FROM dbo.Brands {where}";
        var sql = $@"
            SELECT * FROM dbo.Brands {where}
            ORDER BY {sortColumn} {direction}, Id ASC
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY";

        var parameters = new
        {
            SearchTerm = string.IsNullOrWhiteSpace(searchTerm) ? null : searchTerm.Trim(),
            IsActive = isActive,
            Offset = (pageNumber - 1) * pageSize,
            PageSize = pageSize
        };

        using (var connection = _connectionFactory.GetConnection())
        {
            var totalCount = await connection.ExecuteScalarAsync<int>(countSql, parameters);
            var items = await connection.QueryAsync<Brand>(sql, parameters);
            return (items, totalCount);
        }
    }

    public async Task<IEnumerable<Brand>> GetActiveBrandsAsync()
    {
        const string sql = "SELECT * FROM dbo.Brands WHERE IsActive = 1 ORDER BY Name";
        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryAsync<Brand>(sql);
        }
    }
}
