namespace CricketBazar.Application.DTOs;

public class ProductVariantListItemDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? Size { get; set; }
    public string? Color { get; set; }
    public string? Hand { get; set; }
    public int Stock { get; set; }
    public decimal? PriceOverride { get; set; }
}

public class SaveProductVariantDto
{
    public int ProductId { get; set; }
    public string? Size { get; set; }
    public string? Color { get; set; }
    public string? Hand { get; set; }
    public int Stock { get; set; }
    public decimal? PriceOverride { get; set; }
}
