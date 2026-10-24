namespace CricketBazar.Application.Commands.Categories;

using MediatR;
using CricketBazar.Application.DTOs;

public class CreateCategoryCommand : IRequest<CategoryDto>
{
    public required CreateCategoryDto Category { get; set; }
}

public class UpdateCategoryCommand : IRequest<CategoryDto>
{
    public int Id { get; set; }
    public required UpdateCategoryDto Category { get; set; }
}

public class DeleteCategoryCommand : IRequest<bool>
{
    public int Id { get; set; }

    public DeleteCategoryCommand(int id)
    {
        Id = id;
    }
}
