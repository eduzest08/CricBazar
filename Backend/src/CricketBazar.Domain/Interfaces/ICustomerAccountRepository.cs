using CricketBazar.Domain.Entities;

namespace CricketBazar.Domain.Interfaces;

public interface ICustomerAccountRepository
{
    Task<CustomerAccount?> GetByIdAsync(int customerAccountId, CancellationToken cancellationToken);
    Task<CustomerAccount?> GetRegisteredByEmailAsync(string email, CancellationToken cancellationToken);
    Task<CustomerAccount?> GetRegisteredByMobileAsync(string country, string mobileNumber, CancellationToken cancellationToken);
    Task<int?> AddRegisteredAsync(CustomerAccount account, CancellationToken cancellationToken);
    Task RecordFailedLoginAsync(int customerAccountId, DateTime nowUtc, CancellationToken cancellationToken);
    Task RecordSuccessfulLoginAsync(int customerAccountId, DateTime nowUtc, CancellationToken cancellationToken);
}
