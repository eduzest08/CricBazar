namespace CricketBazar.Application.Queries.Products;

using MediatR;
using AutoMapper;
using CricketBazar.Application.DTOs;
using CricketBazar.Domain.Interfaces;

public class GetProductByIdQueryHandler : IRequestHandler<GetProductByIdQuery, ProductDto?>
{
    private readonly IProductRepository _repository;
    private readonly IMapper _mapper;

    public GetProductByIdQueryHandler(IProductRepository repository, IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<ProductDto?> Handle(GetProductByIdQuery request, CancellationToken cancellationToken)
    {
        var product = await _repository.GetByIdAsync(request.Id);
        return _mapper.Map<ProductDto?>(product);
    }
}

public class GetProductsListQueryHandler : IRequestHandler<GetProductsListQuery, PaginatedResponse<ProductDto>>
{
    private readonly IProductRepository _repository;
    private readonly IMapper _mapper;

    public GetProductsListQueryHandler(IProductRepository repository, IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<PaginatedResponse<ProductDto>> Handle(GetProductsListQuery request, CancellationToken cancellationToken)
    {
        var result = await _repository.SearchAsync(
            request.SearchTerm,
            request.CategoryId,
            request.BrandId,
            request.MinPrice,
            request.MaxPrice,
            request.PageNumber,
            request.PageSize,
            request.SortBy ?? "newest"
        );

        var productDtos = _mapper.Map<List<ProductDto>>(result.Item1);
        
        return new PaginatedResponse<ProductDto>
        {
            Items = productDtos,
            TotalCount = result.Item2,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }
}

public class GetProductBySlugQueryHandler : IRequestHandler<GetProductBySlugQuery, ProductDto?>
{
    private readonly IProductRepository _repository;
    private readonly IMapper _mapper;

    public GetProductBySlugQueryHandler(IProductRepository repository, IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<ProductDto?> Handle(GetProductBySlugQuery request, CancellationToken cancellationToken)
    {
        var product = await _repository.GetBySlugAsync(request.Slug);
        return _mapper.Map<ProductDto?>(product);
    }
}
