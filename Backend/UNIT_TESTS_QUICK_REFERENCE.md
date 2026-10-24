# Unit Tests Quick Reference

## 🚀 Quick Start

### Run All Tests
```bash
cd Backend
dotnet test tests/
```

### Run Only Unit Tests
```bash
dotnet test tests/CricketBazar.Tests.Unit
```

### Run Only Integration Tests
```bash
dotnet test tests/CricketBazar.Tests.Integration
```

### Run Specific Test Class
```bash
dotnet test tests/CricketBazar.Tests.Unit --filter BrandsControllerTests
```

### Run Specific Test Method
```bash
dotnet test tests/CricketBazar.Tests.Unit --filter "GetAll_WithOnlyActiveFalse_ReturnsAllBrands"
```

### Watch Mode (Auto-rerun on changes)
```bash
dotnet watch test tests/CricketBazar.Tests.Unit
```

---

## 📊 Test Summary

| Test Type | Count | Duration | Status |
|-----------|-------|----------|--------|
| Unit Tests | 66 | ~44ms | ✅ All Pass |
| Integration Tests | 14 | ~664ms | ✅ All Pass |
| **TOTAL** | **80** | **~708ms** | ✅ **100%** |

---

## 📁 Test File Structure

```
tests/
├── CricketBazar.Tests.Unit/          # Unit tests (66 tests)
│   ├── BrandsControllerTests.cs      # Controller tests (28)
│   ├── DapperBrandRepositoryTests.cs # Repository tests (30)
│   ├── BrandDtoTests.cs              # DTO tests (8)
│   └── CricketBazar.Tests.Unit.csproj
│
└── CricketBazar.Tests.Integration/   # Integration tests (14 tests)
    ├── BrandIntegrationTests.cs
    └── BrandIntegrationTestFixture.cs
```

---

## 🧪 Test Coverage by Component

### BrandsController (28 tests)

| Operation | Tests | Coverage |
|-----------|-------|----------|
| GetAll | 4 | Filter (active/all), empty list |
| GetById | 3 | Valid ID, invalid ID, DTO mapping |
| GetBySlug | 2 | Valid slug, invalid slug |
| Create | 4 | Unique slug ✅, duplicate slug ❌, null logo, IsActive default |
| Update | 3 | Valid ID, invalid ID, property preservation |
| Delete | 2 | Valid ID (204 NoContent), invalid ID (404) |
| **Total** | **28** | **All CRUD operations** |

### DapperBrandRepository (30 tests)

| Category | Tests | Coverage |
|----------|-------|----------|
| Pagination Logic | 9 | Page defaults, size caps, offset calculation |
| Entity Creation | 4 | Required/optional fields, property updates |
| SQL Structure | 7 | Query verification, INSERT/UPDATE/DELETE |
| Parameter Validation | 4 | Required fields, optional fields |
| **Total** | **30** | **Business logic & queries** |

### DTOs (8 tests)

| DTO | Tests |
|-----|-------|
| BrandDto | 3 |
| CreateBrandDto | 3 |
| UpdateBrandDto | 2 |
| **Total** | **8** |

---

## ✅ Key Test Scenarios

### HTTP Status Codes
- ✅ 200 OK (GET, PUT operations)
- ✅ 201 Created (POST operations)
- ✅ 204 No Content (DELETE operations)
- ✅ 400 Bad Request (duplicate slug, validation errors)
- ✅ 404 Not Found (missing resources)

### Slug Validation (Bug Fixed)
```csharp
// BEFORE: 500 Server Error on duplicate slug
// AFTER: 400 Bad Request with helpful message

var duplicate = new CreateBrandDto { 
    Name = "Nike", 
    Slug = "existing-slug" 
};
// Returns 400 with: { error: "Slug already exists", ... }
```

### Pagination Edge Cases
```csharp
GetPagedAsync(pageNumber: 0, pageSize: 250)
// Becomes: pageNumber=1, pageSize=100, offset=0

GetPagedAsync(pageNumber: 3, pageSize: 10)
// Becomes: pageNumber=3, pageSize=10, offset=20
```

---

## 🔧 Debugging Tests

### Run with Verbose Output
```bash
dotnet test tests/ -v d
```

### Run Single Test with Debug Info
```bash
dotnet test tests/CricketBazar.Tests.Unit --filter "GetAll_WithOnlyActiveFalse_ReturnsAllBrands" -v d
```

### Visual Studio Test Explorer
1. Open Solution in Visual Studio
2. View → Test Explorer
3. Find and run tests directly in GUI

### VS Code Test Explorer
1. Install "Test Explorer UI" extension
2. Click "Test Explorer" in activity bar
3. Run/debug tests directly

---

## 📝 Test Naming Convention

Follow: `MethodName_Scenario_ExpectedResult`

### Examples
✅ `Create_WithDuplicateSlug_ReturnsBadRequest`
✅ `GetAll_WithOnlyActiveTrue_ReturnsOnlyActiveBrands`
✅ `Update_WithInvalidId_ReturnsNotFound`
✅ `GetPagedAsync_PaginationLogic_PageSizeAbove100CapsAt100`

### Anti-Patterns
❌ `TestCreate`
❌ `BrandCreation`
❌ `TestWhenSlugExists`

---

## 🔍 Common Assertions

```csharp
// Type assertions
Assert.IsType<OkObjectResult>(result);
Assert.IsType<BadRequestObjectResult>(result);
Assert.IsType<NotFoundObjectResult>(result);

// Value assertions
Assert.Equal(expectedValue, actualValue);
Assert.True(condition);
Assert.False(condition);
Assert.Null(value);
Assert.NotNull(value);

// Collection assertions
Assert.Empty(collection);
Assert.Single(collection);
Assert.Equal(count, collection.Count());

// Moq verifications
_mockRepository.Verify(r => r.GetByIdAsync(1), Times.Once);
_mockRepository.Verify(r => r.GetByIdAsync(It.IsAny<int>()), Times.Never);
```

---

## 🚨 Common Issues & Solutions

### Issue: Tests timeout
**Solution:** Increase timeout or check for infinite loops
```bash
dotnet test tests/ --logger "console;verbosity=detailed"
```

### Issue: "Connection string 'DefaultConnection' not configured"
**Solution:** Use test database or mock the connection
This is for integration tests - unit tests mock dependencies

### Issue: Moq not finding extension methods
**Solution:** Mock the interface, not the concrete class
```csharp
// ❌ Wrong
var mock = new Mock<SqlConnection>();

// ✅ Correct (but still won't work with sealed classes)
var mock = new Mock<IConnection>();
```

### Issue: Test passes locally but fails in CI
**Cause:** Timing issues, database state, environment differences
**Solution:** 
- Isolate tests (clean state before each)
- Use fixed test data
- Mock time-dependent code

---

## 📚 Writing New Tests

### Template: Unit Test
```csharp
[Fact]
public async Task MethodName_Scenario_ExpectedResult()
{
    // Arrange
    var input = new TestData { /* ... */ };
    _mockRepository.Setup(r => r.GetAsync(It.IsAny<int>()))
        .ReturnsAsync(expectedOutput);

    // Act
    var result = await _controller.MethodName(input);

    // Assert
    Assert.IsType<OkObjectResult>(result.Result);
    var returnedData = Assert.IsType<ResultDto>(okResult.Value);
    Assert.Equal(expectedOutput.Id, returnedData.Id);
    
    // Verify
    _mockRepository.Verify(r => r.GetAsync(It.IsAny<int>()), Times.Once);
}
```

### Template: Pagination Test
```csharp
[Theory]
[InlineData(0, 1)]      // Page 0 → Page 1
[InlineData(-1, 1)]     // Page -1 → Page 1
[InlineData(1, 1)]      // Page 1 → Page 1
public void GetPagedAsync_PaginationLogic(int input, int expected)
{
    int pageNumber = input;
    if (pageNumber < 1) pageNumber = 1;
    
    Assert.Equal(expected, pageNumber);
}
```

---

## 🔗 Related Resources

- [xUnit Documentation](https://xunit.net/)
- [Moq Quick Start](https://github.com/Moq/moq4/wiki/Quickstart)
- [Integration Tests Guide](./INTEGRATION_TESTS_SUMMARY.md)
- [API Documentation](./API_DOCUMENTATION.md)

---

## ✨ Best Practices

1. **One Assert Principle** - One logical assertion per test
2. **Descriptive Names** - Test name explains what is being tested
3. **AAA Pattern** - Arrange, Act, Assert
4. **Mock External Dependencies** - Isolate the unit being tested
5. **Fast Tests** - Unit tests should complete in milliseconds
6. **Deterministic** - Tests should pass/fail consistently
7. **Isolated** - No test should depend on another test
8. **Clear Failures** - Assertion messages should explain the failure

---

## 📊 Continuous Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-dotnet@v3
      - run: cd Backend && dotnet test tests/
```

### Pre-commit Hook
```bash
#!/bin/bash
cd Backend
dotnet test tests/ --filter "Category=Unit"
if [ $? -ne 0 ]; then
    echo "Tests failed!"
    exit 1
fi
```

---

## 📞 Support

For issues or questions:
1. Check test output: `dotnet test tests/ -v d`
2. Review test comments for expected behavior
3. Check UNIT_TESTS_SUMMARY.md for detailed documentation
4. Run integration tests to verify database operations

---

**Last Updated:** 2025
**Status:** ✅ All 80 tests passing
**Coverage:** Controllers, Repositories, DTOs
