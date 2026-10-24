namespace CricketBazar.Domain.Entities;

public class Category
{
    public int Id { get; set; }
    public int? ParentId { get; set; }
    public required string Name { get; set; }
    public required string Slug { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }

    // Navigation properties
    public virtual Category? Parent { get; set; }
    public virtual ICollection<Category> Children { get; set; } = new List<Category>();
    public virtual ICollection<Product> Products { get; set; } = new List<Product>();
}
