namespace CricketBazar.Domain.Entities;

public sealed class CustomerAccount
{
    public int CustomerAccountId { get; set; }
    public Guid AccountGuid { get; set; }
    public bool IsGuest { get; set; }
    public string Country { get; set; } = "India";
    public string MobileNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public byte[]? PasswordHash { get; set; }
    public byte[]? PasswordSalt { get; set; }
    public bool IsMobileVerified { get; set; }
    public bool IsEmailVerified { get; set; }
    public bool IsActive { get; set; }
    public int FailedLoginCount { get; set; }
    public DateTime? LockoutEndUtc { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public bool ConvertedFromGuest { get; set; }
    public DateTime CreatedAt { get; set; }
}
