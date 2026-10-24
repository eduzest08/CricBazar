# Integration Tests Quick Start 🧪

## 📊 What You Need to Know

**Integration Tests:** Test full application stack with real database
- 14 tests for Brand API
- Requires SQL Server connection
- Tests actual database operations
- Execution time: ~660ms

---

## 🚀 Quick Commands

### Run All Integration Tests
```bash
cd Backend
dotnet test tests/CricketBazar.Tests.Integration
```

### Run Specific Test
```bash
dotnet test tests/CricketBazar.Tests.Integration --filter "GetAll_ReturnsActiveBrands"
```

### Run with Verbose Output
```bash
dotnet test tests/CricketBazar.Tests.Integration -v d
```

### Watch Mode (Auto-rerun)
```bash
dotnet watch test tests/CricketBazar.Tests.Integration
```

---

## 📋 Test Coverage

### 14 Integration Tests for Brand API

| Test | Validates |
|------|-----------|
| GetAll_ReturnsActiveBrands | GET all brands, active filter |
| GetById_WithValidId_ReturnsBrand | GET by ID, 200 response |
| GetById_WithInvalidId_Returns404 | GET invalid ID, 404 error |
| GetBySlug_WithValidSlug_ReturnsBrand | GET by slug, lookup |
| GetBySlug_WithInvalidSlug_Returns404 | GET invalid slug, 404 |
| Create_WithUniqueSlug_ReturnsCreated | POST new brand, 201 response |
| Create_WithDuplicateSlug_ReturnsBadRequest | **POST duplicate slug, 400 (BUG FIX)** |
| Update_WithValidBrand_ReturnsUpdated | PUT brand update, 200 response |
| Update_WithInvalidId_Returns404 | PUT invalid ID, 404 error |
| Delete_WithValidId_Returns204 | DELETE brand, 204 NoContent |
| Delete_WithInvalidId_Returns404 | DELETE invalid ID, 404 error |
| GetAll_WithPagination_ReturnsPaged | GET with pagination parameters |
| Create_WithoutLogo_CreatesSuccessfully | POST without LogoUrl field |
| GetBySlug_IsCaseInsensitive | Slug comparison handling |

---

## ✅ Key Test: Slug Uniqueness (Bug Fix)

### Test: `Create_WithDuplicateSlug_ReturnsBadRequest`

**What it does:**
1. Creates a brand with slug "nike"
2. Attempts to create another brand with slug "nike"
3. Expects 400 Bad Request response

**Before Fix:** 500 Internal Server Error (SQL constraint violation)
**After Fix:** 400 Bad Request with helpful message ✅

```
POST /api/v1/brands
{
  "name": "Nike",
  "slug": "nike"
}

Response: 400 Bad Request
{
  "error": "Slug already exists",
  "slug": "nike",
  "message": "A brand with this slug already exists..."
}
```

---

## 🔧 Prerequisites

### Database Connection Required
Integration tests need SQL Server:

```
Server: localhost or your SQL Server
Database: cricbazar
User ID: Sa
Password: @Bbsr123#
```

**Note:** Connection string from `appsettings.json`

### Connection String Format
```
Server=localhost;Database=cricbazar;User Id=Sa;Password=@Bbsr123#;TrustServerCertificate=True;
```

---

## 📊 Test Execution Flow

```
1. WebApplicationFactory creates test server
2. Database initialized with test data
3. HTTP requests sent to endpoints
4. Real database operations executed
5. Responses validated
6. Database cleaned up (if configured)
```

---

## 🎯 Common Test Scenarios

### ✅ Happy Path (Success Cases)
```csharp
// Creates brand successfully
var response = await client.PostAsJsonAsync("/api/v1/brands", new {
    name = "Adidas",
    slug = "adidas",
    logoUrl = "https://adidas.png"
});
Assert.Equal(HttpStatusCode.Created, response.StatusCode);
```

### ❌ Error Cases
```csharp
// Duplicate slug returns 400
var response = await client.PostAsJsonAsync("/api/v1/brands", new {
    name = "Nike",
    slug = "nike"  // Already exists
});
Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
```

### 🔍 Validation Cases
```csharp
// Missing resource returns 404
var response = await client.GetAsync("/api/v1/brands/999");
Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
```

---

## 📁 Files

### Integration Test Code
- `tests/CricketBazar.Tests.Integration/BrandIntegrationTests.cs` (14 tests)
- `tests/CricketBazar.Tests.Integration/BrandIntegrationTestFixture.cs` (WebApplicationFactory)

### Documentation
- `INTEGRATION_TESTS_SUMMARY.md` - Full guide
- `INTEGRATION_TESTS_CHECKPOINT.md` - Project history

---

## 🐛 Troubleshooting

### Issue: "Connection string not found"
**Solution:** Ensure `appsettings.json` has DefaultConnection configured

### Issue: "Database 'cricbazar' does not exist"
**Solution:** Run SQL script to create database and tables

### Issue: "Test fails with timeout"
**Solution:** Increase test timeout or check database performance

### Issue: "Port already in use"
**Solution:** Tests use dynamic ports, usually not an issue

---

## 📈 Performance

| Metric | Value |
|--------|-------|
| Total Tests | 14 |
| Duration | ~660ms |
| Per Test | ~47ms |
| Pass Rate | 100% |

---

## 🔗 Related Files

- **Controllers:** `src/CricketBazar.API/Controllers/BrandsController.cs`
- **Repository:** `src/CricketBazar.Infrastructure/Repositories/DapperBrandRepository.cs`
- **DTOs:** `src/CricketBazar.Application/DTOs/BrandDtos.cs`
- **Unit Tests:** `tests/CricketBazar.Tests.Unit/`

---

## 📚 Full Documentation

For detailed integration test information:
→ See `INTEGRATION_TESTS_SUMMARY.md`

For unit tests:
→ See `UNIT_TESTS_README.md`

---

## ✨ What's Tested

✅ HTTP status codes (200, 201, 204, 400, 404)
✅ Request/response serialization
✅ Database persistence
✅ Business logic validation
✅ Slug uniqueness constraint
✅ Pagination and filtering
✅ Data integrity

---

## 🎓 Best Practices

1. **Isolate Test Data** - Each test uses unique data
2. **Clean State** - Database reset between tests
3. **Real Operations** - Actual HTTP requests to real server
4. **Full Stack** - Tests entire pipeline
5. **Performance** - Keep tests fast (~47ms each)

---

**Status:** ✅ All 14 integration tests passing
**Last Updated:** 2025
**Success Rate:** 100%
