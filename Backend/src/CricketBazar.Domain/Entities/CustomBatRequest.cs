namespace CricketBazar.Domain.Entities;

public class CustomBatRequest
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public required string Name { get; set; }
    public required string Mobile { get; set; }
    public required string Specs { get; set; }
    public string Status { get; set; } = "New";
    public DateTime CreatedAt { get; set; }

    // Navigation property
    public virtual User? User { get; set; }
}
