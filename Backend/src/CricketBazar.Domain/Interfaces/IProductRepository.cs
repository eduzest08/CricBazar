namespace CricketBazar.Domain.Interfaces;

using Entities;

public interface IProductRepository
{
    Task<Product?> GetByIdAsync(int id);
    Task<IEnumerable<Product>> GetAllAsync();
    Task<(IEnumerable<Product> items, int totalCount)> GetPagedAsync(int pageNumber = 1, int pageSize = 20);
    Task<int> AddAsync(Product entity);
    Task<bool> UpdateAsync(Product entity);
    Task<bool> DeleteAsync(int id);
    Task<Product?> GetBySkuAsync(string sku);
    Task<Product?> GetBySlugAsync(string slug);
    Task<IEnumerable<Product>> GetByCategoryAsync(int categoryId);
    Task<IEnumerable<Product>> GetByBrandAsync(int brandId);
    Task<(IEnumerable<Product> items, int totalCount)> SearchAsync(string? search = null, int? categoryId = null, int? brandId = null, decimal? minPrice = null, decimal? maxPrice = null, int pageNumber = 1, int pageSize = 20, string sortBy = "newest");
}

public interface ICategoryRepository
{
    Task<Category?> GetByIdAsync(int id);
    Task<IEnumerable<Category>> GetAllAsync();
    Task<(IEnumerable<Category> items, int totalCount)> GetPagedAsync(int pageNumber = 1, int pageSize = 10);
    Task<int> AddAsync(Category entity);
    Task<bool> UpdateAsync(Category entity);
    Task<bool> DeleteAsync(int id);
    Task<Category?> GetBySlugAsync(string slug);
    Task<IEnumerable<Category>> GetRootCategoriesAsync();
    Task<IEnumerable<Category>> GetChildCategoriesAsync(int parentId);
    Task<IEnumerable<Category>> GetActiveCategoriesAsync();
    Task<IEnumerable<Category>> GetCategoriesHierarchyAsync();
}

public interface IBrandRepository
{
    Task<Brand?> GetByIdAsync(int id);
    Task<IEnumerable<Brand>> GetAllAsync();
    Task<(IEnumerable<Brand> items, int totalCount)> GetPagedAsync(int pageNumber = 1, int pageSize = 10);
    Task<int> AddAsync(Brand entity);
    Task<bool> UpdateAsync(Brand entity);
    Task<bool> DeleteAsync(int id);
    Task<Brand?> GetBySlugAsync(string slug);
    Task<IEnumerable<Brand>> GetActiveBrandsAsync();
}

public interface IReviewRepository
{
    Task<Review?> GetByIdAsync(int id);
    Task<int> AddAsync(Review entity);
    Task<bool> DeleteAsync(int id);
    Task<IEnumerable<Review>> GetByProductIdAsync(int productId);
    Task<IEnumerable<Review>> GetByUserIdAsync(int userId);
}

public interface IUserRepository
{
    Task<User?> GetByIdAsync(int id);
    Task<int> AddAsync(User entity);
    Task<bool> UpdateAsync(User entity);
    Task<bool> DeleteAsync(int id);
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByMobileAsync(string mobile);
}

public interface ICartRepository
{
    Task<Cart?> GetByIdAsync(int id);
    Task<int> AddAsync(Cart entity);
    Task<bool> UpdateAsync(Cart entity);
    Task<bool> DeleteAsync(int id);
    Task<Cart?> GetByUserIdAsync(int userId);
    Task<Cart?> GetByGuestTokenAsync(Guid guestToken);
}

public interface IOrderRepository
{
    Task<Order?> GetByIdAsync(int id);
    Task<int> AddAsync(Order entity);
    Task<bool> UpdateAsync(Order entity);
    Task<bool> DeleteAsync(int id);
    Task<Order?> GetByOrderNumberAsync(string orderNumber);
    Task<IEnumerable<Order>> GetByUserIdAsync(int userId);
}

public interface IWishlistRepository
{
    Task<IEnumerable<Wishlist>> GetByUserIdAsync(int userId);
    Task<bool> AddAsync(Wishlist wishlist);
    Task<bool> RemoveAsync(int userId, int productId);
    Task<Wishlist?> GetByIdAsync(int userId, int productId);
}

public interface ICustomBatRequestRepository
{
    Task<CustomBatRequest?> GetByIdAsync(int id);
    Task<IEnumerable<CustomBatRequest>> GetAllAsync();
    Task<int> AddAsync(CustomBatRequest entity);
    Task<bool> UpdateAsync(CustomBatRequest entity);
    Task<bool> DeleteAsync(int id);
    Task<IEnumerable<CustomBatRequest>> GetByUserIdAsync(int userId);
    Task<IEnumerable<CustomBatRequest>> GetPendingAsync();
    Task<IEnumerable<CustomBatRequest>> GetByStatusAsync(string status);
}

