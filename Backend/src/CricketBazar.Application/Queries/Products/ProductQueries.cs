namespace CricketBazar.Application.Queries.Products;

using MediatR;
using CricketBazar.Application.DTOs;

public class GetProductByIdQuery : IRequest<ProductDto?>
{
    public int Id { get; set; }

    public GetProductByIdQuery(int id)
    {
        Id = id;
    }
}

public class GetProductsListQuery : IRequest<PaginatedResponse<ProductDto>>
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public int? CategoryId { get; set; }
    public int? BrandId { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public string? SearchTerm { get; set; }
    public string? SortBy { get; set; } = "newest";
}

public class GetProductBySlugQuery : IRequest<ProductDto?>
{
    public string Slug { get; set; }

    public GetProductBySlugQuery(string slug)
    {
        Slug = slug;
    }
}
