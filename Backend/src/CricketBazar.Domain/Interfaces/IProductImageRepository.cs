namespace CricketBazar.Domain.Interfaces;

using Entities;

public class ProductImageListItem
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}

public interface IProductImageRepository
{
    Task<ProductImage?> GetByIdAsync(int id);
    Task<ProductImageListItem?> GetListItemByIdAsync(int id);
    Task<int> AddAsync(ProductImage entity);
    Task<bool> UpdateAsync(ProductImage entity);
    Task<bool> DeleteAsync(int id);
    Task<(IEnumerable<ProductImageListItem> items, int totalCount)> SearchAsync(
        string? searchTerm, int? productId, string? sortBy, bool descending, int pageNumber, int pageSize);
}
