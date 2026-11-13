using System.Net;
using System.Net.Http.Json;
using CricketBazar.Application.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Xunit;

namespace CricketBazar.Tests.API;

public class CustomerAccountAntiforgeryTests
{
    [Fact]
    public async Task AccountRequestsValidateAntiforgeryAndAllowAuthenticatedLogout()
    {
        await using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Testing");
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<ICustomerAccountService>();
                services.AddSingleton<ICustomerAccountService, FakeCustomerAccountService>();
            });
        });
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
            HandleCookies = true,
            BaseAddress = new Uri("https://localhost")
        });
        const string endpoint = "/api/v1/customer-accounts";
        var registration = new
        {
            country = "India",
            mobileNumber = "9876543210",
            password = "ExamplePassword123"
        };

        using var noToken = await client.PostAsJsonAsync($"{endpoint}/register", registration);
        Assert.Equal(HttpStatusCode.BadRequest, noToken.StatusCode);

        var token = await client.GetFromJsonAsync<TokenResponse>($"{endpoint}/antiforgery");
        Assert.NotNull(token);
        client.DefaultRequestHeaders.Add("X-CSRF-TOKEN", token.RequestToken);

        using var register = await client.PostAsJsonAsync($"{endpoint}/register", registration);
        Assert.Equal(HttpStatusCode.Created, register.StatusCode);
        using var current = await client.GetAsync($"{endpoint}/me");
        Assert.Equal(HttpStatusCode.OK, current.StatusCode);

        client.DefaultRequestHeaders.Remove("X-CSRF-TOKEN");
        token = await client.GetFromJsonAsync<TokenResponse>($"{endpoint}/antiforgery");
        Assert.NotNull(token);
        client.DefaultRequestHeaders.Add("X-CSRF-TOKEN", token.RequestToken);
        using var logout = await client.PostAsync($"{endpoint}/logout", null);
        Assert.Equal(HttpStatusCode.NoContent, logout.StatusCode);
        using var afterLogout = await client.GetAsync($"{endpoint}/me");
        Assert.Equal(HttpStatusCode.Unauthorized, afterLogout.StatusCode);
    }

    private sealed record TokenResponse(string RequestToken);

    private sealed class FakeCustomerAccountService : ICustomerAccountService
    {
        private static readonly CustomerAccountProfile Account = new(
            1, Guid.Parse("1508bec1-033f-4f91-b142-28f84c8e0b48"),
            "India", "9876543210", null, null, null, DateTimeOffset.UtcNow);

        public Task<CustomerAccountProfile?> RegisterAsync(
            RegisterCustomerAccountInput input, CancellationToken cancellationToken) =>
            Task.FromResult<CustomerAccountProfile?>(Account);

        public Task<CustomerAccountProfile?> LoginAsync(
            CustomerAccountCredentials credentials, CancellationToken cancellationToken) =>
            Task.FromResult<CustomerAccountProfile?>(null);

        public Task<CustomerAccountProfile?> GetByIdAsync(
            int customerAccountId, CancellationToken cancellationToken) =>
            Task.FromResult<CustomerAccountProfile?>(customerAccountId == Account.CustomerAccountId ? Account : null);
    }
}
