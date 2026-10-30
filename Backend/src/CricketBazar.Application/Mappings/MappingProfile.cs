namespace CricketBazar.Application.Mappings;

using AutoMapper;
using CricketBazar.Application.DTOs;
using CricketBazar.Domain.Entities;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // Product mappings
        CreateMap<Product, ProductDto>()
            .ForMember(dest => dest.Images, opt => opt.MapFrom(src => src.Images))
            .ForMember(dest => dest.Variants, opt => opt.MapFrom(src => src.Variants))
            .ForMember(dest => dest.Category, opt => opt.MapFrom(src => src.Category))
            .ForMember(dest => dest.Brand, opt => opt.MapFrom(src => src.Brand));

        CreateMap<CreateProductDto, Product>()
            .ForMember(dest => dest.Sku, opt => opt.Ignore());
        CreateMap<UpdateProductDto, Product>()
            .ForMember(dest => dest.Sku, opt => opt.Ignore());

        // Category mappings
        CreateMap<Category, CategoryDto>()
            .ForMember(dest => dest.Children, opt => opt.MapFrom(src => src.Children));
        CreateMap<CreateCategoryDto, Category>();
        CreateMap<UpdateCategoryDto, Category>();

        // Brand mappings
        CreateMap<Brand, BrandDto>();
        CreateMap<CreateBrandDto, Brand>();
        CreateMap<UpdateBrandDto, Brand>();

        // ProductImage mappings
        CreateMap<ProductImage, ProductImageDto>();
        CreateMap<CreateProductImageDto, ProductImage>();

        // ProductVariant mappings
        CreateMap<ProductVariant, ProductVariantDto>();
        CreateMap<CreateProductVariantDto, ProductVariant>();

        // ProductAttribute mappings
        CreateMap<ProductAttribute, ProductAttributeDto>();

        // Review mappings
        CreateMap<Review, ReviewDto>();
        CreateMap<CreateReviewDto, Review>();

        // User mappings
        CreateMap<User, UserDto>();
        CreateMap<Address, AddressDto>();

        // Cart mappings
        CreateMap<Cart, CartDto>();
        CreateMap<CartItem, CartItemDto>()
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product!.Name))
            .ForMember(dest => dest.Price, opt => opt.MapFrom(src => src.Product!.SalePrice));

        CreateMap<AddToCartDto, CartItem>();

        // Order mappings
        CreateMap<Order, OrderDto>();
        CreateMap<OrderItem, OrderItemDto>()
            .ForMember(dest => dest.SubTotal, opt => opt.MapFrom(src => src.UnitPrice * src.Qty));
        CreateMap<CreateOrderDto, Order>();

        // Wishlist mappings
        CreateMap<Wishlist, WishlistItemDto>()
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product!.Name))
            .ForMember(dest => dest.SalePrice, opt => opt.MapFrom(src => src.Product!.SalePrice))
            .ForMember(dest => dest.Image, opt => opt.MapFrom(src => src.Product!.Images.FirstOrDefault()!.Url));

        // CustomBatRequest mappings
        CreateMap<CustomBatRequest, CustomBatRequestDto>();
        CreateMap<CreateCustomBatRequestDto, CustomBatRequest>();
    }
}

public class ProductAttributeDto
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string Value { get; set; }
}

public class UserDto
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public string? Email { get; set; }
    public string? Mobile { get; set; }
    public string Role { get; set; } = "Customer";
    public DateTime CreatedAt { get; set; }
}

public class AddressDto
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
}
