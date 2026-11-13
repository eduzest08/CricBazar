using System.Net;
using System.Net.Http.Json;
using CricketBazar.Application.Services;
using CricketBazar.Domain.Entities;
using CricketBazar.Domain.Interfaces;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Xunit;

namespace CricketBazar.Tests.API;

public class CustomerDeliveryAccountTests
{
    [Fact]
    public async Task AddressesArePrivateToTheSignedInAccountAndGuestsAreNotLinked()
    {
        await using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Testing");
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<ICustomerAccountService>();
                services.RemoveAll<ICustomerDeliveryDetailsRepository>();
                services.AddSingleton<ICustomerAccountService, FakeAccounts>();
                services.AddSingleton<ICustomerDeliveryDetailsRepository, FakeDeliveries>();
            });
        });
        using var first = CreateClient(factory);
        using var second = CreateClient(factory);
        using var guest = CreateClient(factory);
        var address = new
        {
            customerCountry = "India", mobileNumber = "1234567890", firstName = "Fan",
            addressLine1 = "First address", receiverPhone = "1234567890",
            pincode = "560001", state = "Karnataka", city = "Bengaluru", deliveryCountry = "India"
        };
        var accountAddress = new
        {
            customerCountry = "India", mobileNumber = "1234567890", firstName = "Fan",
            addressLine1 = "First address", receiverPhone = "1234567890", saveToAccount = true,
            pincode = "560001", state = "Karnataka", city = "Bengaluru", deliveryCountry = "India"
        };
        const string endpoint = "/api/v1/customer-delivery-details";

        Assert.Equal(HttpStatusCode.Unauthorized, (await guest.GetAsync($"{endpoint}/latest")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await guest.GetAsync(endpoint)).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await guest.PostAsJsonAsync(endpoint, address)).StatusCode);
        await AddToken(guest);
        Assert.Equal(HttpStatusCode.Unauthorized, (await guest.PostAsJsonAsync(endpoint, accountAddress)).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await guest.PostAsJsonAsync(endpoint, address)).StatusCode);

        await Register(first, "1234567890");
        await AddToken(first);
        Assert.Equal(HttpStatusCode.NoContent, (await first.GetAsync($"{endpoint}/latest")).StatusCode);
        Assert.Empty((await first.GetFromJsonAsync<AddressResponse[]>(endpoint))!);
        Assert.Equal(HttpStatusCode.Created, (await first.PostAsJsonAsync(endpoint, accountAddress)).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await first.PostAsJsonAsync(endpoint, new
        {
            customerCountry = "India", mobileNumber = "1234567890", firstName = "Fan",
            addressLine1 = "Another address", receiverPhone = "1234567890", saveToAccount = true,
            pincode = "560001", state = "Karnataka", city = "Bengaluru", deliveryCountry = "India"
        })).StatusCode);
        var latest = await first.GetFromJsonAsync<AddressResponse>($"{endpoint}/latest");
        Assert.Equal("Another address", latest?.AddressLine1);
        var firstAddresses = await first.GetFromJsonAsync<AddressResponse[]>(endpoint);
        Assert.Equal(new[] { "Another address", "First address" }, firstAddresses!.Select(a => a.AddressLine1));
        Assert.All(firstAddresses, a => Assert.True(a.CustomerDeliveryId > 0));

        await Register(second, "1234567891");
        Assert.Equal(HttpStatusCode.NoContent, (await second.GetAsync($"{endpoint}/latest")).StatusCode);
        Assert.Empty((await second.GetFromJsonAsync<AddressResponse[]>(endpoint))!);
        await AddToken(second);
        Assert.Equal(HttpStatusCode.Created, (await second.PostAsJsonAsync(endpoint, new
        {
            customerCountry = "India", mobileNumber = "1234567891", firstName = "Other",
            addressLine1 = "Second address", receiverPhone = "1234567891", saveToAccount = true,
            pincode = "560001", state = "Karnataka", city = "Bengaluru", deliveryCountry = "India"
        })).StatusCode);
        Assert.Equal("Another address", (await first.GetFromJsonAsync<AddressResponse>($"{endpoint}/latest"))?.AddressLine1);
        Assert.Equal("Second address", (await second.GetFromJsonAsync<AddressResponse>($"{endpoint}/latest"))?.AddressLine1);
        Assert.Equal(new[] { "Another address", "First address" },
            (await first.GetFromJsonAsync<AddressResponse[]>(endpoint))!.Select(a => a.AddressLine1));
        Assert.Equal(new[] { "Second address" },
            (await second.GetFromJsonAsync<AddressResponse[]>(endpoint))!.Select(a => a.AddressLine1));

        var target = firstAddresses[1].CustomerDeliveryId;
        var updated = new
        {
            customerCountry = "India", mobileNumber = "1234567890", firstName = "Fan",
            addressLine1 = "Updated address", receiverPhone = "1234567890",
            pincode = "560001", state = "Karnataka", city = "Bengaluru", deliveryCountry = "India"
        };
        Assert.Equal(HttpStatusCode.Unauthorized, (await guest.PutAsJsonAsync($"{endpoint}/{target}", updated)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await guest.DeleteAsync($"{endpoint}/{target}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await second.PutAsJsonAsync($"{endpoint}/{target}", updated)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await second.DeleteAsync($"{endpoint}/{target}")).StatusCode);
        first.DefaultRequestHeaders.Remove("X-CSRF-TOKEN");
        Assert.Equal(HttpStatusCode.BadRequest, (await first.PutAsJsonAsync($"{endpoint}/{target}", updated)).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await first.DeleteAsync($"{endpoint}/{target}")).StatusCode);
        await AddToken(first);
        Assert.Equal(HttpStatusCode.BadRequest, (await first.PutAsJsonAsync($"{endpoint}/{target}", new { firstName = "" })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await first.PutAsJsonAsync($"{endpoint}/{target}", updated)).StatusCode);
        var afterUpdate = (await first.GetFromJsonAsync<AddressResponse[]>(endpoint))!;
        Assert.Equal(2, afterUpdate.Length);
        Assert.Contains(afterUpdate, a => a.CustomerDeliveryId == target && a.AddressLine1 == "Updated address");
        Assert.Equal(HttpStatusCode.NoContent, (await first.DeleteAsync($"{endpoint}/{target}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await first.DeleteAsync($"{endpoint}/{target}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await first.PutAsJsonAsync($"{endpoint}/{target}", updated)).StatusCode);
        Assert.Single((await first.GetFromJsonAsync<AddressResponse[]>(endpoint))!);
        Assert.Single((await second.GetFromJsonAsync<AddressResponse[]>(endpoint))!);
    }

    private static HttpClient CreateClient(WebApplicationFactory<Program> factory) =>
        factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false, HandleCookies = true, BaseAddress = new Uri("https://localhost")
        });

    private static async Task AddToken(HttpClient client)
    {
        client.DefaultRequestHeaders.Remove("X-CSRF-TOKEN");
        var token = await client.GetFromJsonAsync<TokenResponse>("/api/v1/customer-accounts/antiforgery");
        client.DefaultRequestHeaders.Add("X-CSRF-TOKEN", token!.RequestToken);
    }

    private static async Task Register(HttpClient client, string mobile)
    {
        await AddToken(client);
        using var response = await client.PostAsJsonAsync("/api/v1/customer-accounts/register", new
        {
            country = "India", mobileNumber = mobile, password = "ExamplePassword123"
        });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    private sealed record TokenResponse(string RequestToken);
    private sealed record AddressResponse(string AddressLine1, int CustomerDeliveryId);

    private sealed class FakeAccounts : ICustomerAccountService
    {
        public Task<CustomerAccountProfile?> RegisterAsync(RegisterCustomerAccountInput input, CancellationToken cancellationToken) =>
            GetByIdAsync(input.MobileNumber.EndsWith('0') ? 1 : 2, cancellationToken);

        public Task<CustomerAccountProfile?> LoginAsync(CustomerAccountCredentials credentials, CancellationToken cancellationToken) =>
            Task.FromResult<CustomerAccountProfile?>(null);

        public Task<CustomerAccountProfile?> GetByIdAsync(int customerAccountId, CancellationToken cancellationToken) =>
            Task.FromResult<CustomerAccountProfile?>(new CustomerAccountProfile(
                customerAccountId, Guid.NewGuid(), "India", "1234567890", null, "Fan", null, DateTimeOffset.UtcNow));
    }

    private sealed class FakeDeliveries : ICustomerDeliveryDetailsRepository
    {
        private readonly List<CustomerDeliveryDetails> _items = [];

        public Task<int> AddAsync(CustomerDeliveryDetails details, CancellationToken cancellationToken)
        {
            details.CustomerDeliveryId = _items.Count + 1;
            _items.Add(details);
            return Task.FromResult(details.CustomerDeliveryId);
        }

        public Task<CustomerDeliveryDetails?> GetLatestForAccountAsync(int customerAccountId, CancellationToken cancellationToken) =>
            Task.FromResult(_items.LastOrDefault(item => item.CustomerAccountId == customerAccountId));

        public Task<IReadOnlyList<CustomerDeliveryDetails>> GetAllForAccountAsync(int customerAccountId, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<CustomerDeliveryDetails>>(_items
                .Where(item => item.CustomerAccountId == customerAccountId).Reverse().ToArray());

        public Task<bool> UpdateForAccountAsync(CustomerDeliveryDetails details, CancellationToken cancellationToken)
        {
            var index = _items.FindIndex(item => item.CustomerAccountId == details.CustomerAccountId &&
                item.CustomerDeliveryId == details.CustomerDeliveryId);
            if (index < 0) return Task.FromResult(false);
            _items[index] = details;
            return Task.FromResult(true);
        }

        public Task<bool> DeleteForAccountAsync(int customerAccountId, int customerDeliveryId, CancellationToken cancellationToken) =>
            Task.FromResult(_items.RemoveAll(item => item.CustomerAccountId == customerAccountId &&
                item.CustomerDeliveryId == customerDeliveryId) > 0);
    }
}
