namespace CricketBazar.Application.Queries.Categories;

using MediatR;
using AutoMapper;
using CricketBazar.Application.DTOs;
using CricketBazar.Domain.Entities;
using CricketBazar.Domain.Interfaces;

public class GetCategoryByIdQueryHandler : IRequestHandler<GetCategoryByIdQuery, CategoryDto?>
{
    private readonly ICategoryRepository _repository;
    private readonly IMapper _mapper;

    public GetCategoryByIdQueryHandler(ICategoryRepository repository, IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<CategoryDto?> Handle(GetCategoryByIdQuery request, CancellationToken cancellationToken)
    {
        var category = await _repository.GetByIdAsync(request.Id);
        return _mapper.Map<CategoryDto?>(category);
    }
}

public class GetCategoriesListQueryHandler : IRequestHandler<GetCategoriesListQuery, List<CategoryDto>>
{
    private readonly ICategoryRepository _repository;
    private readonly IMapper _mapper;

    public GetCategoriesListQueryHandler(ICategoryRepository repository, IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<List<CategoryDto>> Handle(GetCategoriesListQuery request, CancellationToken cancellationToken)
    {
        IEnumerable<Category> categories;
        
        if (request.OnlyActive == true)
            categories = await _repository.GetActiveCategoriesAsync();
        else
            categories = await _repository.GetAllAsync();

        return _mapper.Map<List<CategoryDto>>(categories);
    }
}

public class GetCategoryBySlugQueryHandler : IRequestHandler<GetCategoryBySlugQuery, CategoryDto?>
{
    private readonly ICategoryRepository _repository;
    private readonly IMapper _mapper;

    public GetCategoryBySlugQueryHandler(ICategoryRepository repository, IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<CategoryDto?> Handle(GetCategoryBySlugQuery request, CancellationToken cancellationToken)
    {
        var category = await _repository.GetBySlugAsync(request.Slug);
        return _mapper.Map<CategoryDto?>(category);
    }
}
