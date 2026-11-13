namespace CricketBazar.Domain.Entities;

public class CustomerDeliveryDetails
{
    public int CustomerDeliveryId { get; set; }
    public int? CustomerAccountId { get; set; }
    public string CustomerCountry { get; set; } = "India";
    public string MobileNumber { get; set; } = string.Empty;
    public string? OrderEmail { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string? LastName { get; set; }
    public string AddressLine1 { get; set; } = string.Empty;
    public string? AddressLine2 { get; set; }
    public string ReceiverPhone { get; set; } = string.Empty;
    public string Pincode { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string DeliveryCountry { get; set; } = "India";
    public DateTime CreatedAt { get; set; }
}
