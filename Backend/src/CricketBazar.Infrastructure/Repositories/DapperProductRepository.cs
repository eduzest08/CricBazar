using Dapper;
using System.Data;
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

    public async Task<ActivateProductResult> ActivateAsync(int id, CancellationToken cancellationToken)
    {
        await using var connection = _connectionFactory.GetConnection();
        await connection.OpenAsync(cancellationToken);
        using var transaction = connection.BeginTransaction(IsolationLevel.Serializable);
        var active = await connection.QuerySingleOrDefaultAsync<bool?>(new CommandDefinition(
            "SELECT IsActive FROM dbo.Products WITH (UPDLOCK, HOLDLOCK) WHERE Id = @Id",
            new { Id = id }, transaction, cancellationToken: cancellationToken));
        if (active is null) return ActivateProductResult.NotFound;
        var hasImage = await connection.ExecuteScalarAsync<bool>(new CommandDefinition(
            "SELECT CAST(CASE WHEN EXISTS (SELECT 1 FROM dbo.ProductImages WHERE ProductId = @Id) THEN 1 ELSE 0 END AS bit)",
            new { Id = id }, transaction, cancellationToken: cancellationToken));
        if (!hasImage) return ActivateProductResult.MissingImage;
        await connection.ExecuteAsync(new CommandDefinition(
            "UPDATE dbo.Products SET IsActive = 1, IsPublished = 1, UpdatedAt = SYSUTCDATETIME() WHERE Id = @Id",
            new { Id = id }, transaction, cancellationToken: cancellationToken));
        transaction.Commit();
        return ActivateProductResult.Activated;
    }

    public async Task<PermanentProductDeleteResult> DeleteInactiveAsync(int id, CancellationToken cancellationToken)
    {
        using var connection = _connectionFactory.GetConnection();
        await connection.OpenAsync(cancellationToken);
        using var transaction = connection.BeginTransaction(IsolationLevel.Serializable);
        var product = await connection.QuerySingleOrDefaultAsync<bool?>(
            new CommandDefinition("SELECT IsActive FROM dbo.Products WITH (UPDLOCK, HOLDLOCK) WHERE Id = @Id",
                new { Id = id }, transaction, cancellationToken: cancellationToken));

        if (product is null) return PermanentProductDeleteResult.NotFound;
        if (product.Value) return PermanentProductDeleteResult.Active;

        const string orderSql = @"
            SELECT CASE WHEN EXISTS (
                SELECT 1 FROM dbo.OrderItems
                WHERE ProductId = @Id OR VariantId IN (SELECT Id FROM dbo.ProductVariants WHERE ProductId = @Id)
            ) THEN 1 ELSE 0 END";
        var hasOrders = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(orderSql, new { Id = id }, transaction, cancellationToken: cancellationToken));
        if (hasOrders != 0) return PermanentProductDeleteResult.HasOrderHistory;

        const string deleteRelatedSql = @"
            DELETE FROM dbo.CartItems
            WHERE ProductId = @Id OR VariantId IN (SELECT Id FROM dbo.ProductVariants WHERE ProductId = @Id);
            DELETE FROM dbo.Wishlist WHERE ProductId = @Id;
            DELETE FROM dbo.Reviews WHERE ProductId = @Id;
            DELETE FROM dbo.ProductImages WHERE ProductId = @Id;
            DELETE FROM dbo.ProductAttributes WHERE ProductId = @Id;
            DELETE FROM dbo.ProductVariants WHERE ProductId = @Id;";
        await connection.ExecuteAsync(new CommandDefinition(
            deleteRelatedSql, new { Id = id }, transaction, cancellationToken: cancellationToken));

        await connection.ExecuteAsync(new CommandDefinition(
            "DELETE FROM dbo.Products WHERE Id = @Id AND IsActive = 0",
            new { Id = id }, transaction, cancellationToken: cancellationToken));
        transaction.Commit();
        return PermanentProductDeleteResult.Deleted;
    }

    /// <summary>
    /// Gets a product by its ID with all related data.
    /// </summary>
    public async Task<Product?> GetByIdAsync(int id)
    {
        const string sql = @"
            SELECT p.*,
                   CAST(CASE WHEN EXISTS (SELECT 1 FROM dbo.ProductImages pi WHERE pi.ProductId = p.Id) THEN 1 ELSE 0 END AS bit) AS HasImage,
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
            SELECT p.*, CAST(CASE WHEN EXISTS (SELECT 1 FROM dbo.ProductImages pi WHERE pi.ProductId = p.Id) THEN 1 ELSE 0 END AS bit) AS HasImage
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
        string sortBy = "newest",
        bool isActive = true,
        bool? hasImage = null,
        bool publishedOnly = false)
    {
        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var offset = (pageNumber - 1) * pageSize;

        var whereConditions = new List<string> { "IsActive = @IsActive" };
        var parameters = new DynamicParameters();
        parameters.Add("@IsActive", isActive);
        if (publishedOnly) whereConditions.Add("IsPublished = 1");
        if (hasImage.HasValue)
        {
            whereConditions.Add(hasImage.Value
                ? "EXISTS (SELECT 1 FROM dbo.ProductImages pi WHERE pi.ProductId = dbo.Products.Id)"
                : "NOT EXISTS (SELECT 1 FROM dbo.ProductImages pi WHERE pi.ProductId = dbo.Products.Id)");
        }

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
            "name_asc" => "ORDER BY Name ASC, Id ASC",
            "name_desc" => "ORDER BY Name DESC, Id ASC",
            "sku_asc" => "ORDER BY SKU ASC, Id ASC",
            "sku_desc" => "ORDER BY SKU DESC, Id ASC",
            "stock_asc" => "ORDER BY Stock ASC, Id ASC",
            "stock_desc" => "ORDER BY Stock DESC, Id ASC",
            "id_asc" => "ORDER BY Id ASC",
            "id_desc" => "ORDER BY Id DESC",
            _ => "ORDER BY CreatedAt DESC"
        };

        var countSql = $"SELECT COUNT(*) FROM {TableName} WHERE {whereClause}";
        var dataSql = $@"
            SELECT *, CAST(CASE WHEN EXISTS (SELECT 1 FROM dbo.ProductImages pi WHERE pi.ProductId = dbo.Products.Id) THEN 1 ELSE 0 END AS bit) AS HasImage FROM {TableName}
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
            (Name, Slug, Sku, CategoryId, BrandId, Mrp, SalePrice, CostPrice, ShortDesc, Description, Stock, AvgRating, ReviewCount, SalesCount, SortOrder, MetaTitle, MetaDesc, IsActive, CreatedAt, UpdatedAt, CreatedBy, CreatedByUserId)
            VALUES 
            (@Name, @Slug, @Sku, @CategoryId, @BrandId, @Mrp, @SalePrice, @CostPrice, @ShortDesc, @Description, @Stock, @AvgRating, @ReviewCount, @SalesCount, @SortOrder, @MetaTitle, @MetaDesc, @IsActive, @CreatedAt, @UpdatedAt, @CreatedBy, @CreatedByUserId);
            
            SELECT CAST(SCOPE_IDENTITY() as int)";

        using (var connection = _connectionFactory.GetConnection())
        {
            var parameters = new DynamicParameters(product);
            parameters.Add("@CreatedAt", product.CreatedAt, DbType.DateTime2);
            parameters.Add("@UpdatedAt", product.UpdatedAt, DbType.DateTime2);
            return await connection.QueryFirstAsync<int>(sql, parameters);
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
                Mrp = @Mrp, SalePrice = @SalePrice, CostPrice = @CostPrice, ShortDesc = @ShortDesc, Description = @Description, 
                Stock = @Stock, AvgRating = @AvgRating, ReviewCount = @ReviewCount, SalesCount = @SalesCount, 
                SortOrder = @SortOrder, MetaTitle = @MetaTitle, MetaDesc = @MetaDesc,
                IsPublished = CASE WHEN @IsActive = 0 OR IsActive = 0 THEN 0 ELSE IsPublished END,
                IsActive = @IsActive,
                UpdatedAt = @UpdatedAt
            WHERE Id = @Id";

        using (var connection = _connectionFactory.GetConnection())
        {
            product.UpdatedAt = DateTime.UtcNow;
            var parameters = new DynamicParameters(product);
            parameters.Add("@UpdatedAt", product.UpdatedAt, DbType.DateTime2);
            var rowsAffected = await connection.ExecuteAsync(sql, parameters);
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
