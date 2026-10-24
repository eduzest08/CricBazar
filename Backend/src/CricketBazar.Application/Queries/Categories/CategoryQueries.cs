namespace CricketBazar.Application.Queries.Categories;

using MediatR;
using CricketBazar.Application.DTOs;

public class GetCategoryByIdQuery : IRequest<CategoryDto?>
{
    public int Id { get; set; }

    public GetCategoryByIdQuery(int id)
    {
        Id = id;
    }
}

public class GetCategoriesListQuery : IRequest<List<CategoryDto>>
{
    public bool? OnlyActive { get; set; } = true;
}

public class GetCategoryBySlugQuery : IRequest<CategoryDto?>
{
    public string Slug { get; set; }

    public GetCategoryBySlugQuery(string slug)
    {
        Slug = slug;
    }
}
