namespace CricketBazar.Domain.Entities;

public class Product
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string Slug { get; set; }
    public required string Sku { get; set; }
    public int CategoryId { get; set; }
    public int BrandId { get; set; }
    public decimal Mrp { get; set; }
    public decimal SalePrice { get; set; }
    public int DiscountPct { get; set; }
    public string? ShortDesc { get; set; }
    public string? Description { get; set; }
    public int Stock { get; set; }
    public decimal AvgRating { get; set; }
    public int ReviewCount { get; set; }
    public int SalesCount { get; set; }
    public int SortOrder { get; set; }
    public string? MetaTitle { get; set; }
    public string? MetaDesc { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public virtual Category? Category { get; set; }
    public virtual Brand? Brand { get; set; }
    public virtual ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
    public virtual ICollection<ProductAttribute> Attributes { get; set; } = new List<ProductAttribute>();
    public virtual ICollection<ProductVariant> Variants { get; set; } = new List<ProductVariant>();
    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();
}

public class Brand
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string Slug { get; set; }
    public string? LogoUrl { get; set; }
    public bool IsActive { get; set; }

    // Navigation properties
    public virtual ICollection<Product> Products { get; set; } = new List<Product>();
}

public class ProductImage
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public required string Url { get; set; }
    public int SortOrder { get; set; }

    // Navigation property
    public virtual Product? Product { get; set; }
}

public class ProductAttribute
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public required string Name { get; set; }
    public required string Value { get; set; }

    // Navigation property
    public virtual Product? Product { get; set; }
}

public class ProductVariant
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string? Size { get; set; }
    public string? Color { get; set; }
    public string? Hand { get; set; }
    public int Stock { get; set; }
    public decimal? PriceOverride { get; set; }

    // Navigation property
    public virtual Product? Product { get; set; }
}

public class Review
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public int UserId { get; set; }
    public byte Rating { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public virtual Product? Product { get; set; }
    public virtual User? User { get; set; }
}

public class User
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public string? Email { get; set; }
    public string? Mobile { get; set; }
    public string? PasswordHash { get; set; }
    public string Role { get; set; } = "Customer";
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public virtual ICollection<Address> Addresses { get; set; } = new List<Address>();
    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();
    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
}

public class Address
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public required string FullName { get; set; }
    public required string Mobile { get; set; }
    public required string Line1 { get; set; }
    public string? Line2 { get; set; }
    public required string City { get; set; }
    public required string State { get; set; }
    public required string Pincode { get; set; }
    public bool IsDefault { get; set; }

    // Navigation property
    public virtual User? User { get; set; }
}

public class Order
{
    public int Id { get; set; }
    public required string OrderNo { get; set; }
    public int UserId { get; set; }
    public string Status { get; set; } = "Pending";
    public decimal SubTotal { get; set; }
    public decimal ShippingFee { get; set; }
    public decimal Total { get; set; }
    public required string ShipFullName { get; set; }
    public required string ShipMobile { get; set; }
    public required string ShipAddress { get; set; }
    public required string ShipPincode { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public virtual User? User { get; set; }
    public virtual ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();
}

public class OrderItem
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public int ProductId { get; set; }
    public int? VariantId { get; set; }
    public required string ProductName { get; set; }
    public decimal UnitPrice { get; set; }
    public int Qty { get; set; }

    // Navigation properties
    public virtual Order? Order { get; set; }
    public virtual Product? Product { get; set; }
}

public class Payment
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public required string Gateway { get; set; }
    public string? GatewayOrderId { get; set; }
    public string? TxnId { get; set; }
    public decimal Amount { get; set; }
    public string Status { get; set; } = "Created";
    public DateTime CreatedAt { get; set; }

    // Navigation property
    public virtual Order? Order { get; set; }
}
