using Dapper;
using CricketBazar.Infrastructure.Data;
using CricketBazar.Domain.Entities;
using CricketBazar.Domain.Interfaces;

namespace CricketBazar.Infrastructure.Repositories;

/// <summary>
/// Dapper-based repository for Product entity.
/// Provides data access operations for products using raw SQL queries.
/// </summary>
public class DapperProductRepository : DapperRepository<Product>, IProductRepository
{
    private const string TableName = "dbo.Products";

    public DapperProductRepository(ISqlConnectionFactory connectionFactory) 
        : base(connectionFactory)
    {
    }

    /// <summary>
    /// Gets a product by its ID with all related data.
    /// </summary>
    public async Task<Product?> GetByIdAsync(int id)
    {
        const string sql = @"
            SELECT p.*, 
                   c.Id as CategoryId, c.Name as CategoryName, c.Slug as CategorySlug,
                   b.Id as BrandId, b.Name as BrandName
            FROM dbo.Products p
            LEFT JOIN dbo.Categories c ON p.CategoryId = c.Id
            LEFT JOIN dbo.Brands b ON p.BrandId = b.Id
            WHERE p.Id = @Id";

        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryFirstOrDefaultAsync<Product>(sql, new { Id = id });
        }
    }

    /// <summary>
    /// Gets a product by its SKU (Stock Keeping Unit).
    /// </summary>
    public async Task<Product?> GetBySkuAsync(string sku)
    {
        const string sql = @"
            SELECT p.* 
            FROM dbo.Products p
            WHERE p.Sku = @Sku AND p.IsActive = 1";

        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryFirstOrDefaultAsync<Product>(sql, new { Sku = sku });
        }
    }

    /// <summary>
    /// Gets a product by its slug (SEO-friendly URL).
    /// </summary>
    public async Task<Product?> GetBySlugAsync(string slug)
    {
        const string sql = @"
            SELECT p.* 
            FROM dbo.Products p
            WHERE p.Slug = @Slug AND p.IsActive = 1";

        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryFirstOrDefaultAsync<Product>(sql, new { Slug = slug });
        }
    }

    /// <summary>
    /// Gets all active products.
    /// </summary>
    public async Task<IEnumerable<Product>> GetAllAsync()
    {
        const string sql = @"
            SELECT * FROM dbo.Products 
            WHERE IsActive = 1
            ORDER BY CreatedAt DESC";

        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryAsync<Product>(sql);
        }
    }

    /// <summary>
    /// Gets all active products with pagination.
    /// </summary>
    public async Task<(IEnumerable<Product> items, int totalCount)> GetPagedAsync(int pageNumber = 1, int pageSize = 20)
    {
        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;

        var offset = (pageNumber - 1) * pageSize;

        const string countSql = "SELECT COUNT(*) FROM dbo.Products WHERE IsActive = 1";
        const string sql = @"
            SELECT * FROM dbo.Products 
            WHERE IsActive = 1
            ORDER BY CreatedAt DESC
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY";

        using (var connection = _connectionFactory.GetConnection())
        {
            var totalCount = await connection.ExecuteScalarAsync<int>(countSql);
            var items = await connection.QueryAsync<Product>(sql, new { Offset = offset, PageSize = pageSize });
            
            return (items, totalCount);
        }
    }

    /// <summary>
    /// Searches products by name and description with filters.
    /// </summary>
    public async Task<(IEnumerable<Product> items, int totalCount)> SearchAsync(
        string? search = null,
        int? categoryId = null,
        int? brandId = null,
        decimal? minPrice = null,
        decimal? maxPrice = null,
        int pageNumber = 1,
        int pageSize = 10,
        string sortBy = "newest")
    {
        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var offset = (pageNumber - 1) * pageSize;

        var whereConditions = new List<string> { "IsActive = 1" };
        var parameters = new DynamicParameters();

        if (!string.IsNullOrWhiteSpace(search))
        {
            whereConditions.Add("(Name LIKE @Search OR Description LIKE @Search OR ShortDesc LIKE @Search)");
            parameters.Add("@Search", $"%{search}%");
        }

        if (categoryId.HasValue)
        {
            whereConditions.Add("CategoryId = @CategoryId");
            parameters.Add("@CategoryId", categoryId);
        }

        if (brandId.HasValue)
        {
            whereConditions.Add("BrandId = @BrandId");
            parameters.Add("@BrandId", brandId);
        }

        if (minPrice.HasValue)
        {
            whereConditions.Add("SalePrice >= @MinPrice");
            parameters.Add("@MinPrice", minPrice);
        }

        if (maxPrice.HasValue)
        {
            whereConditions.Add("SalePrice <= @MaxPrice");
            parameters.Add("@MaxPrice", maxPrice);
        }

        var whereClause = string.Join(" AND ", whereConditions);

        var orderByClause = sortBy switch
        {
            "price_asc" => "ORDER BY SalePrice ASC",
            "price_desc" => "ORDER BY SalePrice DESC",
            "rating" => "ORDER BY AvgRating DESC",
            "bestselling" => "ORDER BY SalesCount DESC",
            _ => "ORDER BY CreatedAt DESC"
        };

        var countSql = $"SELECT COUNT(*) FROM {TableName} WHERE {whereClause}";
        var dataSql = $@"
            SELECT * FROM {TableName} 
            WHERE {whereClause}
            {orderByClause}
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY";

        parameters.Add("@Offset", offset);
        parameters.Add("@PageSize", pageSize);

        using (var connection = _connectionFactory.GetConnection())
        {
            var totalCount = await connection.ExecuteScalarAsync<int>(countSql, parameters);
            var items = await connection.QueryAsync<Product>(dataSql, parameters);
            
            return (items, totalCount);
        }
    }

    /// <summary>
    /// Gets products by category ID.
    /// </summary>
    public async Task<IEnumerable<Product>> GetByCategoryAsync(int categoryId)
    {
        const string sql = @"
            SELECT * FROM dbo.Products 
            WHERE CategoryId = @CategoryId AND IsActive = 1
            ORDER BY SortOrder, Name";

        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryAsync<Product>(sql, new { CategoryId = categoryId });
        }
    }

    /// <summary>
    /// Gets products by brand ID.
    /// </summary>
    public async Task<IEnumerable<Product>> GetByBrandAsync(int brandId)
    {
        const string sql = @"
            SELECT * FROM dbo.Products 
            WHERE BrandId = @BrandId AND IsActive = 1
            ORDER BY SortOrder, Name";

        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryAsync<Product>(sql, new { BrandId = brandId });
        }
    }

    /// <summary>
    /// Adds a new product.
    /// </summary>
    public async Task<int> AddAsync(Product product)
    {
        const string sql = @"
            INSERT INTO dbo.Products 
            (Name, Slug, Sku, CategoryId, BrandId, Mrp, SalePrice, ShortDesc, Description, Stock, AvgRating, ReviewCount, SalesCount, SortOrder, MetaTitle, MetaDesc, IsActive, CreatedAt)
            VALUES 
            (@Name, @Slug, @Sku, @CategoryId, @BrandId, @Mrp, @SalePrice, @ShortDesc, @Description, @Stock, @AvgRating, @ReviewCount, @SalesCount, @SortOrder, @MetaTitle, @MetaDesc, @IsActive, @CreatedAt);
            
            SELECT CAST(SCOPE_IDENTITY() as int)";

        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryFirstAsync<int>(sql, product);
        }
    }

    /// <summary>
    /// Updates an existing product.
    /// </summary>
    public async Task<bool> UpdateAsync(Product product)
    {
        const string sql = @"
            UPDATE dbo.Products 
            SET Name = @Name, Slug = @Slug, Sku = @Sku, CategoryId = @CategoryId, BrandId = @BrandId, 
                Mrp = @Mrp, SalePrice = @SalePrice, ShortDesc = @ShortDesc, Description = @Description, 
                Stock = @Stock, AvgRating = @AvgRating, ReviewCount = @ReviewCount, SalesCount = @SalesCount, 
                SortOrder = @SortOrder, MetaTitle = @MetaTitle, MetaDesc = @MetaDesc, IsActive = @IsActive
            WHERE Id = @Id";

        using (var connection = _connectionFactory.GetConnection())
        {
            var rowsAffected = await connection.ExecuteAsync(sql, product);
            return rowsAffected > 0;
        }
    }

    /// <summary>
    /// Deletes a product by ID.
    /// </summary>
    public async Task<bool> DeleteAsync(int id)
    {
        const string sql = "DELETE FROM dbo.Products WHERE Id = @Id";

        using (var connection = _connectionFactory.GetConnection())
        {
            var rowsAffected = await connection.ExecuteAsync(sql, new { Id = id });
            return rowsAffected > 0;
        }
    }
}
