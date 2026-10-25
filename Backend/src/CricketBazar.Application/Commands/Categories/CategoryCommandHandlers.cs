namespace CricketBazar.Application.Commands.Categories;

using MediatR;
using AutoMapper;
using CricketBazar.Application.DTOs;
using CricketBazar.Domain.Entities;
using CricketBazar.Domain.Interfaces;

public class CreateCategoryCommandHandler : IRequestHandler<CreateCategoryCommand, CategoryDto>
{
    private readonly ICategoryRepository _repository;
    private readonly IMapper _mapper;

    public CreateCategoryCommandHandler(ICategoryRepository repository, IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<CategoryDto> Handle(CreateCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = _mapper.Map<Category>(request.Category);
        category.IsActive = true;

        if (await _repository.GetBySlugAsync(category.Slug) != null)
            throw new InvalidOperationException($"Category with slug '{category.Slug}' already exists");

        category.Id = await _repository.AddAsync(category);

        return _mapper.Map<CategoryDto>(category);
    }
}

public class UpdateCategoryCommandHandler : IRequestHandler<UpdateCategoryCommand, CategoryDto>
{
    private readonly ICategoryRepository _repository;
    private readonly IMapper _mapper;

    public UpdateCategoryCommandHandler(ICategoryRepository repository, IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<CategoryDto> Handle(UpdateCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = await _repository.GetByIdAsync(request.Id);
        if (category == null)
            throw new KeyNotFoundException($"Category with ID {request.Id} not found");

        _mapper.Map(request.Category, category);

        var existing = await _repository.GetBySlugAsync(category.Slug);
        if (existing != null && existing.Id != category.Id)
            throw new InvalidOperationException($"Category with slug '{category.Slug}' already exists");

        await _repository.UpdateAsync(category);

        return _mapper.Map<CategoryDto>(category);
    }
}

public class DeleteCategoryCommandHandler : IRequestHandler<DeleteCategoryCommand, bool>
{
    private readonly ICategoryRepository _repository;

    public DeleteCategoryCommandHandler(ICategoryRepository repository)
    {
        _repository = repository;
    }

    public async Task<bool> Handle(DeleteCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = await _repository.GetByIdAsync(request.Id);
        if (category == null)
            return false;

        await _repository.DeleteAsync(request.Id);
        return true;
    }
}
