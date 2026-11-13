using CricketBazar.Domain.Entities;

namespace CricketBazar.Domain.Interfaces;

public interface ICustomerDeliveryDetailsRepository
{
    Task<int> AddAsync(CustomerDeliveryDetails deliveryDetails, CancellationToken cancellationToken);
    Task<CustomerDeliveryDetails?> GetLatestForAccountAsync(int customerAccountId, CancellationToken cancellationToken);
    Task<IReadOnlyList<CustomerDeliveryDetails>> GetAllForAccountAsync(int customerAccountId, CancellationToken cancellationToken);
    Task<bool> UpdateForAccountAsync(CustomerDeliveryDetails deliveryDetails, CancellationToken cancellationToken);
    Task<bool> DeleteForAccountAsync(int customerAccountId, int customerDeliveryId, CancellationToken cancellationToken);
}
