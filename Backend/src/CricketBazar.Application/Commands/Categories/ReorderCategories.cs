namespace CricketBazar.Application.Commands.Categories;

using System.ComponentModel.DataAnnotations;
using CricketBazar.Domain.Interfaces;
using MediatR;

/// <summary>One category and its current sort order, used to detect concurrent changes.</summary>
public sealed record CategoryOrderItem(int Id, int SortOrder);

/// <summary>Categories in the requested sibling order with their previously observed sort orders.</summary>
public sealed record ReorderCategoriesRequest
{
    public int? ParentId { get; init; }
    [Required, MinLength(2)]
    public required List<CategoryOrderItem> Categories { get; init; }
}

public sealed record ReorderCategoriesCommand(ReorderCategoriesRequest Request) : IRequest<bool>;

public sealed class ReorderCategoriesCommandHandler(ICategoryRepository repository)
    : IRequestHandler<ReorderCategoriesCommand, bool>
{
    public Task<bool> Handle(ReorderCategoriesCommand command, CancellationToken cancellationToken) =>
        repository.ReorderAsync(command.Request.ParentId,
            command.Request.Categories.Select(item => (item.Id, item.SortOrder)).ToArray(), cancellationToken);
}
