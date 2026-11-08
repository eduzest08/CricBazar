using System.Net;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace CricketBazar.Tests.Integration;

public class ProductImageCacheTests
{
    [Fact]
    public async Task ProductImagesAreCacheableButOtherResponsesAreNotChanged()
    {
        var root = Path.Combine(Path.GetTempPath(), $"cricbazar-cache-{Guid.NewGuid():N}");
        var productDirectory = Path.Combine(root, "uploads", "products");
        var brandDirectory = Path.Combine(root, "uploads", "brands");
        Directory.CreateDirectory(productDirectory);
        Directory.CreateDirectory(brandDirectory);
        var productFile = Path.Combine(productDirectory, "image.png");
        var otherFile = Path.Combine(productDirectory, "notes.txt");
        var brandFile = Path.Combine(brandDirectory, "logo.png");
        await File.WriteAllBytesAsync(productFile, [1, 2, 3]);
        await File.WriteAllTextAsync(otherFile, "test");
        await File.WriteAllBytesAsync(brandFile, [1, 2, 3]);
        try
        {
            using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
            {
                builder.UseEnvironment("Testing");
                builder.UseWebRoot(root);
                builder.UseSetting("ConnectionStrings:DefaultConnection", "Server=unused;Database=unused;");
            });
            using var client = factory.CreateClient();
            using var image = await client.GetAsync("/uploads/products/image.png");
            Assert.Equal(HttpStatusCode.OK, image.StatusCode);
            Assert.True(image.Headers.CacheControl?.Public);
            Assert.Equal(TimeSpan.FromDays(1), image.Headers.CacheControl?.MaxAge);
            Assert.NotNull(image.Headers.ETag);

            using var conditional = new HttpRequestMessage(HttpMethod.Get, "/uploads/products/image.png");
            conditional.Headers.IfNoneMatch.Add(image.Headers.ETag!);
            using var notModified = await client.SendAsync(conditional);
            Assert.Equal(HttpStatusCode.NotModified, notModified.StatusCode);
            Assert.Equal(TimeSpan.FromDays(1), notModified.Headers.CacheControl?.MaxAge);

            using var brand = await client.GetAsync("/uploads/brands/logo.png");
            Assert.Equal(HttpStatusCode.OK, brand.StatusCode);
            Assert.Null(brand.Headers.CacheControl);
            using var other = await client.GetAsync("/uploads/products/notes.txt");
            Assert.Equal(HttpStatusCode.OK, other.StatusCode);
            Assert.Null(other.Headers.CacheControl);
            using var missing = await client.GetAsync("/uploads/products/missing.png");
            Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);
            Assert.Null(missing.Headers.CacheControl);
        }
        finally
        {
            File.Delete(productFile);
            File.Delete(otherFile);
            File.Delete(brandFile);
            Directory.Delete(productDirectory);
            Directory.Delete(brandDirectory);
            Directory.Delete(Path.Combine(root, "uploads"));
            Directory.Delete(root);
        }
    }
}
