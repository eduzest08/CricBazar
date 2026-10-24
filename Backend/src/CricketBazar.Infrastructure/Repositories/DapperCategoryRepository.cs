using Dapper;
using CricketBazar.Infrastructure.Data;
using CricketBazar.Domain.Entities;
using CricketBazar.Domain.Interfaces;

namespace CricketBazar.Infrastructure.Repositories;

/// <summary>
/// Dapper-based repository for Category entity.
/// Provides data access operations for categories using raw SQL queries.
/// </summary>
public class DapperCategoryRepository : DapperRepository<Category>, ICategoryRepository
{
    private const string TableName = "dbo.Categories";

    public DapperCategoryRepository(ISqlConnectionFactory connectionFactory) 
        : base(connectionFactory)
    {
    }

    /// <summary>
    /// Gets a category by ID with parent information.
    /// </summary>
    public async Task<Category?> GetByIdAsync(int id)
    {
        const string sql = @"
            SELECT c.* 
            FROM dbo.Categories c
            WHERE c.Id = @Id AND c.IsActive = 1";

        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryFirstOrDefaultAsync<Category>(sql, new { Id = id });
        }
    }

    /// <summary>
    /// Gets a category by slug.
    /// </summary>
    public async Task<Category?> GetBySlugAsync(string slug)
    {
        const string sql = @"
            SELECT c.* 
            FROM dbo.Categories c
            WHERE c.Slug = @Slug AND c.IsActive = 1";

        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryFirstOrDefaultAsync<Category>(sql, new { Slug = slug });
        }
    }

    /// <summary>
    /// Gets all categories with hierarchical structure (parent-child).
    /// </summary>
    public async Task<IEnumerable<Category>> GetAllAsync()
    {
        const string sql = @"
            SELECT c.* 
            FROM dbo.Categories c
            WHERE c.IsActive = 1
            ORDER BY c.ParentId, c.SortOrder, c.Name";

        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryAsync<Category>(sql);
        }
    }

    /// <summary>
    /// Gets categories with pagination.
    /// </summary>
    public async Task<(IEnumerable<Category> items, int totalCount)> GetPagedAsync(int pageNumber = 1, int pageSize = 10)
    {
        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var offset = (pageNumber - 1) * pageSize;

        const string countSql = "SELECT COUNT(*) FROM dbo.Categories WHERE IsActive = 1";
        const string sql = @"
            SELECT c.* 
            FROM dbo.Categories c
            WHERE c.IsActive = 1
            ORDER BY c.ParentId, c.SortOrder, c.Name
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY";

        using (var connection = _connectionFactory.GetConnection())
        {
            var totalCount = await connection.ExecuteScalarAsync<int>(countSql);
            var items = await connection.QueryAsync<Category>(sql, new { Offset = offset, PageSize = pageSize });
            
            return (items, totalCount);
        }
    }

    /// <summary>
    /// Gets top-level categories (where ParentId is NULL).
    /// </summary>
    public async Task<IEnumerable<Category>> GetRootCategoriesAsync()
    {
        const string sql = @"
            SELECT c.* 
            FROM dbo.Categories c
            WHERE c.ParentId IS NULL AND c.IsActive = 1
            ORDER BY c.SortOrder, c.Name";

        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryAsync<Category>(sql);
        }
    }

    /// <summary>
    /// Gets subcategories of a parent category.
    /// </summary>
    public async Task<IEnumerable<Category>> GetChildCategoriesAsync(int parentId)
    {
        const string sql = @"
            SELECT c.* 
            FROM dbo.Categories c
            WHERE c.ParentId = @ParentId AND c.IsActive = 1
            ORDER BY c.SortOrder, c.Name";

        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryAsync<Category>(sql, new { ParentId = parentId });
        }
    }

    /// <summary>
    /// Adds a new category.
    /// </summary>
    public async Task<int> AddAsync(Category category)
    {
        const string sql = @"
            INSERT INTO dbo.Categories 
            (ParentId, Name, Slug, SortOrder, IsActive)
            VALUES 
            (@ParentId, @Name, @Slug, @SortOrder, @IsActive);
            
            SELECT CAST(SCOPE_IDENTITY() as int)";

        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryFirstAsync<int>(sql, category);
        }
    }

    /// <summary>
    /// Updates an existing category.
    /// </summary>
    public async Task<bool> UpdateAsync(Category category)
    {
        const string sql = @"
            UPDATE dbo.Categories 
            SET ParentId = @ParentId, Name = @Name, Slug = @Slug, SortOrder = @SortOrder, IsActive = @IsActive
            WHERE Id = @Id";

        using (var connection = _connectionFactory.GetConnection())
        {
            var rowsAffected = await connection.ExecuteAsync(sql, category);
            return rowsAffected > 0;
        }
    }

    /// <summary>
    /// Deletes a category by ID.
    /// </summary>
    public async Task<bool> DeleteAsync(int id)
    {
        const string sql = "DELETE FROM dbo.Categories WHERE Id = @Id";

        using (var connection = _connectionFactory.GetConnection())
        {
            var rowsAffected = await connection.ExecuteAsync(sql, new { Id = id });
            return rowsAffected > 0;
        }
    }

    /// <summary>
    /// Gets all active categories.
    /// </summary>
    public async Task<IEnumerable<Category>> GetActiveCategoriesAsync()
    {
        const string sql = @"
            SELECT c.* 
            FROM dbo.Categories c
            WHERE c.IsActive = 1
            ORDER BY c.ParentId, c.SortOrder, c.Name";

        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryAsync<Category>(sql);
        }
    }

    /// <summary>
    /// Gets the complete hierarchical structure of categories.
    /// </summary>
    public async Task<IEnumerable<Category>> GetCategoriesHierarchyAsync()
    {
        const string sql = @"
            WITH CategoryHierarchy AS (
                SELECT c.*, 0 as HierarchyLevel
                FROM dbo.Categories c
                WHERE c.ParentId IS NULL AND c.IsActive = 1
                
                UNION ALL
                
                SELECT c.*, ch.HierarchyLevel + 1
                FROM dbo.Categories c
                INNER JOIN CategoryHierarchy ch ON c.ParentId = ch.Id
                WHERE c.IsActive = 1
            )
            SELECT * FROM CategoryHierarchy
            ORDER BY HierarchyLevel, ParentId, SortOrder, Name";

        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryAsync<Category>(sql);
        }
    }
}
