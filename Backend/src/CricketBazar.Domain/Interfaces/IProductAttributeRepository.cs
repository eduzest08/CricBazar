namespace CricketBazar.Domain.Interfaces;

using Entities;

public class ProductAttributeListItem
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}

public interface IProductAttributeRepository
{
    Task<ProductAttribute?> GetByIdAsync(int id);
    Task<ProductAttribute?> GetByProductAndNameAsync(int productId, string name);
    Task<ProductAttributeListItem?> GetListItemByIdAsync(int id);
    Task<int> AddAsync(ProductAttribute entity);
    Task<bool> UpdateAsync(ProductAttribute entity);
    Task<bool> DeleteAsync(int id);
    Task<(IEnumerable<ProductAttributeListItem> items, int totalCount)> SearchAsync(
        string? searchTerm, int? productId, string? sortBy, bool descending, int pageNumber, int pageSize);
}
