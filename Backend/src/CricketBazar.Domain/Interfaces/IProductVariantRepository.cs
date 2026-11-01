namespace CricketBazar.Domain.Interfaces;

using Entities;

public class ProductVariantListItem
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? Size { get; set; }
    public string? Color { get; set; }
    public string? Hand { get; set; }
    public int Stock { get; set; }
    public decimal? PriceOverride { get; set; }
}

public interface IProductVariantRepository
{
    Task<ProductVariant?> GetByIdAsync(int id);
    Task<ProductVariant?> GetByCombinationAsync(int productId, string? size, string? color, string? hand);
    Task<ProductVariantListItem?> GetListItemByIdAsync(int id);
    Task<int> AddAsync(ProductVariant entity);
    Task<bool> UpdateAsync(ProductVariant entity);
    Task<bool> DeleteAsync(int id);
    Task<(IEnumerable<ProductVariantListItem> items, int totalCount)> SearchAsync(
        string? searchTerm, int? productId, string? sortBy, bool descending, int pageNumber, int pageSize);
}
