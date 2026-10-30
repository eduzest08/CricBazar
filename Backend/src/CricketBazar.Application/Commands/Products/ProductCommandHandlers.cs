namespace CricketBazar.Application.Commands.Products;

using MediatR;
using AutoMapper;
using CricketBazar.Application.DTOs;
using CricketBazar.Domain.Entities;
using CricketBazar.Domain.Interfaces;

public class CreateProductCommandHandler : IRequestHandler<CreateProductCommand, ProductDto>
{
    private readonly IProductRepository _repository;
    private readonly IMapper _mapper;

    public CreateProductCommandHandler(IProductRepository repository, IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<ProductDto> Handle(CreateProductCommand request, CancellationToken cancellationToken)
    {
        var product = _mapper.Map<Product>(request.Product);
        product.CreatedAt = DateTime.UtcNow;
        product.Sku = await GenerateUniqueSkuAsync();

        product.Id = await _repository.AddAsync(product);

        return _mapper.Map<ProductDto>(product);
    }

    private async Task<string> GenerateUniqueSkuAsync()
    {
        for (var attempt = 0; attempt < 10; attempt++)
        {
            var sku = $"CB-{DateTime.UtcNow:yyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";
            if (await _repository.GetBySkuAsync(sku) == null)
                return sku;
        }

        throw new InvalidOperationException("Unable to generate a unique SKU.");
    }
}

public class UpdateProductCommandHandler : IRequestHandler<UpdateProductCommand, ProductDto>
{
    private readonly IProductRepository _repository;
    private readonly IMapper _mapper;

    public UpdateProductCommandHandler(IProductRepository repository, IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<ProductDto> Handle(UpdateProductCommand request, CancellationToken cancellationToken)
    {
        var product = await _repository.GetByIdAsync(request.Id);
        if (product == null)
            throw new KeyNotFoundException($"Product with ID {request.Id} not found");

        _mapper.Map(request.Product, product);
        await _repository.UpdateAsync(product);

        return _mapper.Map<ProductDto>(product);
    }
}

public class DeleteProductCommandHandler : IRequestHandler<DeleteProductCommand, bool>
{
    private readonly IProductRepository _repository;

    public DeleteProductCommandHandler(IProductRepository repository)
    {
        _repository = repository;
    }

    public async Task<bool> Handle(DeleteProductCommand request, CancellationToken cancellationToken)
    {
        var product = await _repository.GetByIdAsync(request.Id);
        if (product == null)
            return false;

        await _repository.DeleteAsync(request.Id);
        return true;
    }
}

public class AddProductImageCommandHandler : IRequestHandler<AddProductImageCommand, ProductImageDto>
{
    private readonly IProductRepository _repository;
    private readonly IMapper _mapper;

    public AddProductImageCommandHandler(IProductRepository repository, IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<ProductImageDto> Handle(AddProductImageCommand request, CancellationToken cancellationToken)
    {
        var product = await _repository.GetByIdAsync(request.ProductId);
        if (product == null)
            throw new KeyNotFoundException($"Product with ID {request.ProductId} not found");

        var image = _mapper.Map<ProductImage>(request.Image);
        image.ProductId = request.ProductId;


        return _mapper.Map<ProductImageDto>(image);
    }
}

public class AddProductVariantCommandHandler : IRequestHandler<AddProductVariantCommand, ProductVariantDto>
{
    private readonly IProductRepository _repository;
    private readonly IMapper _mapper;

    public AddProductVariantCommandHandler(IProductRepository repository, IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<ProductVariantDto> Handle(AddProductVariantCommand request, CancellationToken cancellationToken)
    {
        var product = await _repository.GetByIdAsync(request.ProductId);
        if (product == null)
            throw new KeyNotFoundException($"Product with ID {request.ProductId} not found");

        var variant = _mapper.Map<ProductVariant>(request.Variant);
        variant.ProductId = request.ProductId;


        return _mapper.Map<ProductVariantDto>(variant);
    }
}
