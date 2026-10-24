namespace CricketBazar.Infrastructure.Data;

using Microsoft.EntityFrameworkCore;
using CricketBazar.Domain.Entities;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Product> Products => Set<Product>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Brand> Brands => Set<Brand>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();
    public DbSet<ProductAttribute> ProductAttributes => Set<ProductAttribute>();
    public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Address> Addresses => Set<Address>();
    public DbSet<Cart> Carts => Set<Cart>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Wishlist> Wishlists => Set<Wishlist>();
    public DbSet<CustomBatRequest> CustomBatRequests => Set<CustomBatRequest>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Product entity configuration
        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(300);
            entity.Property(e => e.Slug).IsRequired().HasMaxLength(300);
            entity.Property(e => e.Sku).IsRequired().HasMaxLength(60);
            entity.Property(e => e.Mrp).HasPrecision(10, 2);
            entity.Property(e => e.SalePrice).HasPrecision(10, 2);
            entity.Property(e => e.AvgRating).HasPrecision(3, 2);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.HasIndex(e => e.Sku).IsUnique();
            entity.HasOne(e => e.Category)
                .WithMany(c => c.Products)
                .HasForeignKey(e => e.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Brand)
                .WithMany(b => b.Products)
                .HasForeignKey(e => e.BrandId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Category entity configuration
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(150);
            entity.Property(e => e.Slug).IsRequired().HasMaxLength(150);
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.HasOne(e => e.Parent)
                .WithMany(c => c.Children)
                .HasForeignKey(e => e.ParentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Brand entity configuration
        modelBuilder.Entity<Brand>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Slug).IsRequired().HasMaxLength(100);
            entity.HasIndex(e => e.Slug).IsUnique();
        });

        // ProductImage entity configuration
        modelBuilder.Entity<ProductImage>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Url).IsRequired().HasMaxLength(500);
            entity.HasOne(e => e.Product)
                .WithMany(p => p.Images)
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ProductAttribute entity configuration
        modelBuilder.Entity<ProductAttribute>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Value).IsRequired().HasMaxLength(300);
            entity.HasOne(e => e.Product)
                .WithMany(p => p.Attributes)
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ProductVariant entity configuration
        modelBuilder.Entity<ProductVariant>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Size).HasMaxLength(50);
            entity.Property(e => e.Color).HasMaxLength(50);
            entity.Property(e => e.Hand).HasMaxLength(20);
            entity.Property(e => e.PriceOverride).HasPrecision(10, 2);
            entity.HasOne(e => e.Product)
                .WithMany(p => p.Variants)
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Review entity configuration
        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Comment).HasMaxLength(2000);
            entity.Property(e => e.Rating).HasMaxLength(1);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            entity.HasOne(e => e.Product)
                .WithMany(p => p.Reviews)
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.User)
                .WithMany(u => u.Reviews)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // User entity configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(150);
            entity.Property(e => e.Email).HasMaxLength(256);
            entity.Property(e => e.Mobile).HasMaxLength(15);
            entity.Property(e => e.PasswordHash).HasMaxLength(200);
            entity.Property(e => e.Role).HasMaxLength(20);
            entity.Property(e => e.RefreshToken).HasMaxLength(200);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.Mobile).IsUnique();
        });

        // Address entity configuration
        modelBuilder.Entity<Address>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FullName).IsRequired().HasMaxLength(150);
            entity.Property(e => e.Mobile).IsRequired().HasMaxLength(15);
            entity.Property(e => e.Line1).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Line2).HasMaxLength(200);
            entity.Property(e => e.City).IsRequired().HasMaxLength(100);
            entity.Property(e => e.State).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Pincode).IsRequired().HasMaxLength(10);
            entity.HasOne(e => e.User)
                .WithMany(u => u.Addresses)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Cart entity configuration
        modelBuilder.Entity<Cart>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // CartItem entity configuration
        modelBuilder.Entity<CartItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Cart)
                .WithMany(c => c.Items)
                .HasForeignKey(e => e.CartId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Product)
                .WithMany()
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Variant)
                .WithMany()
                .HasForeignKey(e => e.VariantId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Order entity configuration
        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.OrderNo).IsRequired().HasMaxLength(30);
            entity.Property(e => e.Status).HasMaxLength(30);
            entity.Property(e => e.SubTotal).HasPrecision(10, 2);
            entity.Property(e => e.ShippingFee).HasPrecision(10, 2);
            entity.Property(e => e.Total).HasPrecision(10, 2);
            entity.Property(e => e.ShipFullName).IsRequired().HasMaxLength(150);
            entity.Property(e => e.ShipMobile).IsRequired().HasMaxLength(15);
            entity.Property(e => e.ShipAddress).IsRequired().HasMaxLength(600);
            entity.Property(e => e.ShipPincode).IsRequired().HasMaxLength(10);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            entity.HasIndex(e => e.OrderNo).IsUnique();
            entity.HasOne(e => e.User)
                .WithMany(u => u.Orders)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // OrderItem entity configuration
        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ProductName).IsRequired().HasMaxLength(300);
            entity.Property(e => e.UnitPrice).HasPrecision(10, 2);
            entity.HasOne(e => e.Order)
                .WithMany(o => o.Items)
                .HasForeignKey(e => e.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Product)
                .WithMany()
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Payment entity configuration
        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Gateway).IsRequired().HasMaxLength(30);
            entity.Property(e => e.GatewayOrderId).HasMaxLength(100);
            entity.Property(e => e.TxnId).HasMaxLength(100);
            entity.Property(e => e.Amount).HasPrecision(10, 2);
            entity.Property(e => e.Status).HasMaxLength(30);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            entity.HasOne(e => e.Order)
                .WithMany(o => o.Payments)
                .HasForeignKey(e => e.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Wishlist entity configuration
        modelBuilder.Entity<Wishlist>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.ProductId });
            entity.Property(e => e.AddedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Product)
                .WithMany()
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // CustomBatRequest entity configuration
        modelBuilder.Entity<CustomBatRequest>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(150);
            entity.Property(e => e.Mobile).IsRequired().HasMaxLength(15);
            entity.Property(e => e.Status).HasMaxLength(30);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
