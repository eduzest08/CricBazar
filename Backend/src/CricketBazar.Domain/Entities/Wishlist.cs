namespace CricketBazar.Domain.Entities;

public class Wishlist
{
    public int UserId { get; set; }
    public int ProductId { get; set; }
    public DateTime AddedAt { get; set; }

    // Navigation properties
    public virtual User? User { get; set; }
    public virtual Product? Product { get; set; }
}
