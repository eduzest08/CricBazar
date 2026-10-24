namespace CricketBazar.Domain.Entities;

public class Cart
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public Guid? GuestToken { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public virtual User? User { get; set; }
    public virtual ICollection<CartItem> Items { get; set; } = new List<CartItem>();
}

public class CartItem
{
    public int Id { get; set; }
    public int CartId { get; set; }
    public int ProductId { get; set; }
    public int? VariantId { get; set; }
    public int Qty { get; set; }

    // Navigation properties
    public virtual Cart? Cart { get; set; }
    public virtual Product? Product { get; set; }
    public virtual ProductVariant? Variant { get; set; }
}
