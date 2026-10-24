namespace CricketBazar.Application.Commands.Products;

using MediatR;
using CricketBazar.Application.DTOs;

public class CreateProductCommand : IRequest<ProductDto>
{
    public required CreateProductDto Product { get; set; }
}

public class UpdateProductCommand : IRequest<ProductDto>
{
    public int Id { get; set; }
    public required UpdateProductDto Product { get; set; }
}

public class DeleteProductCommand : IRequest<bool>
{
    public int Id { get; set; }

    public DeleteProductCommand(int id)
    {
        Id = id;
    }
}

public class AddProductImageCommand : IRequest<ProductImageDto>
{
    public int ProductId { get; set; }
    public required CreateProductImageDto Image { get; set; }
}

public class AddProductVariantCommand : IRequest<ProductVariantDto>
{
    public int ProductId { get; set; }
    public required CreateProductVariantDto Variant { get; set; }
}
