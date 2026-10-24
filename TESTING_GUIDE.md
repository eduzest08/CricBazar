# Cricket Bazar API - Testing Guide

## Prerequisites

### 1. SQL Server Setup
```bash
# Check if SQL Server is running (on Windows)
sqlcmd -S localhost -U sa -P "@Bbsr123#" -Q "SELECT @@VERSION"

# Expected output: SQL Server version information
```

### 2. Database Creation
Run the SQL schema script to create the database and tables:

```sql
-- Execute this from SSMS or sqlcmd
-- File: schema.sql or from the user's initial SQL schema message
-- This creates database 'CricBazar' and all required tables
```

### 3. .NET 10 SDK
```bash
dotnet --version
# Should return: 10.0.113 or higher
```

---

## Build & Run

### Clean Build
```bash
cd /Users/shaktibratanaik/CricketBazar/Backend
dotnet clean
dotnet build
```

### Run the API
```bash
dotnet run --project src/CricketBazar.API
# API starts on: https://localhost:5001 or http://localhost:5000
```

### View Swagger Documentation
```
Navigate to: http://localhost:5000/swagger/ui
```

---

## Test Scenarios

### 1. Test Database Connectivity

**Endpoint**: GET /health (if implemented) or any GET endpoint

```powershell
# PowerShell
$response = Invoke-WebRequest -Uri "http://localhost:5000/api/products" `
    -Method Get -SkipCertificateCheck

Write-Host "Status: $($response.StatusCode)"
Write-Host "Response: $($response.Content | ConvertFrom-Json | ConvertTo-Json)"
```

```bash
# Bash
curl -X GET "http://localhost:5000/api/products" \
  -H "Content-Type: application/json"
```

**Expected Response**:
```json
{
  "items": [],
  "totalCount": 0,
  "pageNumber": 1,
  "pageSize": 20
}
```

---

### 2. Product Tests

#### 2.1 Create a Product
```bash
curl -X POST "http://localhost:5000/api/products" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "English Willow Cricket Bat",
    "slug": "english-willow-bat",
    "sku": "BAT-EW-001",
    "categoryId": 1,
    "brandId": 1,
    "mrp": 15000.00,
    "salePrice": 12000.00,
    "stock": 50,
    "shortDesc": "Premium English willow bat"
  }'
```

**Expected Response** (201 Created):
```json
{
  "id": 1,
  "name": "English Willow Cricket Bat",
  "sku": "BAT-EW-001",
  "mrp": 15000.00,
  "salePrice": 12000.00,
  "discountPct": 20
}
```

#### 2.2 Get All Products (Paginated)
```bash
curl -X GET "http://localhost:5000/api/products?pageNumber=1&pageSize=10"
```

#### 2.3 Get Product by ID
```bash
curl -X GET "http://localhost:5000/api/products/1"
```

#### 2.4 Search Products
```bash
curl -X GET "http://localhost:5000/api/products/search?search=willow&categoryId=1&minPrice=5000&maxPrice=20000"
```

#### 2.5 Update Product
```bash
curl -X PUT "http://localhost:5000/api/products/1" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium English Willow Cricket Bat",
    "salePrice": 11000.00
  }'
```

#### 2.6 Delete Product
```bash
curl -X DELETE "http://localhost:5000/api/products/1"
```

---

### 3. Category Tests

#### 3.1 Create Category
```bash
curl -X POST "http://localhost:5000/api/categories" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bats",
    "slug": "bats",
    "parentId": null,
    "sortOrder": 1
  }'
```

#### 3.2 Get Category Hierarchy
```bash
curl -X GET "http://localhost:5000/api/categories/hierarchy"
```

**Expected Response**:
```json
{
  "items": [
    {
      "id": 1,
      "name": "Bats",
      "slug": "bats",
      "parentId": null,
      "sortOrder": 1
    },
    {
      "id": 2,
      "name": "English Willow Bats",
      "slug": "english-willow-bats",
      "parentId": 1,
      "sortOrder": 1
    }
  ]
}
```

#### 3.3 Get Active Categories
```bash
curl -X GET "http://localhost:5000/api/categories/active"
```

---

### 4. Brand Tests

#### 4.1 Create Brand
```bash
curl -X POST "http://localhost:5000/api/brands" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "SG",
    "slug": "sg",
    "logoUrl": "https://example.com/sg-logo.jpg"
  }'
```

#### 4.2 Get Active Brands
```bash
curl -X GET "http://localhost:5000/api/brands"
```

---

### 5. Wishlist Tests

#### 5.1 Add to Wishlist
```bash
curl -X POST "http://localhost:5000/api/wishlist" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "productId": 1
  }'
```

#### 5.2 Get User Wishlist
```bash
curl -X GET "http://localhost:5000/api/wishlist/1"
```

#### 5.3 Remove from Wishlist
```bash
curl -X DELETE "http://localhost:5000/api/wishlist/1/1"
```

---

### 6. Custom Bat Request Tests

#### 6.1 Create Custom Bat Request
```bash
curl -X POST "http://localhost:5000/api/custombat-requests" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "mobile": "9876543210",
    "specs": "{\"willow\": \"grade1\", \"weight\": \"1200g\", \"handle\": \"cane\"}"
  }'
```

#### 6.2 Get All Custom Bat Requests
```bash
curl -X GET "http://localhost:5000/api/custombat-requests"
```

#### 6.3 Update Status (Admin)
```bash
curl -X PUT "http://localhost:5000/api/custombat-requests/1/status" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "In Progress"
  }'
```

---

## Test with Postman

### Import Collection
1. Open Postman
2. Click "Import"
3. Select "Link" tab
4. Paste: `http://localhost:5000/swagger/v1/swagger.json`
5. Click "Import"

### Execute Tests
1. Set `{{baseUrl}}` = `http://localhost:5000`
2. Run requests in order (Products → Categories → Brands → etc.)
3. Verify status codes and response structures

---

## Debugging

### Enable Detailed Logging
Add to `appsettings.Development.json`:
```json
"Logging": {
  "LogLevel": {
    "Default": "Debug",
    "CricketBazar.Infrastructure": "Debug",
    "Microsoft.Data.SqlClient": "Debug"
  }
}
```

### Check Database Queries
```bash
# Connect to SQL Server
sqlcmd -S localhost -U sa -P "@Bbsr123#"

# Check if tables exist
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo';

# Count records
SELECT COUNT(*) FROM dbo.Products;

# View recent inserts
SELECT TOP 10 * FROM dbo.Products ORDER BY CreatedAt DESC;
```

### API Debug Output
```bash
# Run with verbose output
dotnet run --project src/CricketBazar.API --verbosity=diagnostic
```

---

## Common Issues & Solutions

### ❌ Issue: "Cannot open database 'CricBazar'"
**Solution**: Create database from SQL schema script

### ❌ Issue: "Login failed for user 'sa'"
**Solution**: 
- Verify password: `@Bbsr123#`
- Check SQL Server uses Mixed Authentication
- Run: `sqlcmd -S localhost -U sa -P "@Bbsr123#"`

### ❌ Issue: "Connection timeout"
**Solution**:
- Ensure SQL Server is running
- Check firewall allows 1433
- Verify connection string in `appsettings.Development.json`

### ❌ Issue: "404 Not Found on API endpoints"
**Solution**:
- API starts on `http://localhost:5000` (HTTP) or `https://localhost:5001` (HTTPS)
- Check Swagger UI: `http://localhost:5000/swagger/ui`
- Verify controller routes use `/api/` prefix

### ❌ Issue: "500 Internal Server Error"
**Solution**:
- Check API logs for detailed error
- Verify database connection string
- Ensure all required tables exist in database
- Check for null reference exceptions in entity mappings

---

## Performance Testing

### Load Test Setup
```bash
# Using Apache Bench
ab -n 1000 -c 10 http://localhost:5000/api/products

# Using wrk (if installed)
wrk -t4 -c100 -d30s http://localhost:5000/api/products
```

### Expected Performance (Local)
- Avg response time: < 100ms
- P99 response time: < 500ms
- Throughput: > 100 req/sec

---

## Automated Testing

### Run Unit Tests
```bash
cd /Users/shaktibratanaik/CricketBazar/Backend
dotnet test
```

### Run Integration Tests (with DB)
```bash
dotnet test --filter "IntegrationTests"
```

### Generate Coverage Report
```bash
dotnet test /p:CollectCoverage=true /p:CoverageFormat=opencover
```

---

## Test Data Seeding

### Insert Sample Data
```sql
-- Insert Category
INSERT INTO dbo.Categories (Name, Slug, SortOrder, IsActive) 
VALUES ('Bats', 'bats', 1, 1);

-- Insert Brand
INSERT INTO dbo.Brands (Name, Slug, IsActive) 
VALUES ('SG', 'sg', 1);

-- Insert Product
INSERT INTO dbo.Products (Name, Slug, Sku, CategoryId, BrandId, Mrp, SalePrice, Stock, IsActive)
VALUES ('English Willow Bat', 'english-willow-bat', 'BAT-001', 1, 1, 15000, 12000, 50, 1);
```

---

## Validation Tests

### Field Validation
- Product Name: Required, max 300 chars
- SKU: Required, unique, max 60 chars
- Slug: Required, unique, URL-safe
- Price: Must be > 0, decimal(10,2)
- Stock: Must be >= 0

### Business Logic Validation
- Sale Price cannot exceed MRP
- Discount % calculated automatically
- Category parent must exist
- Active status required for queries

---

## Success Criteria

✅ **All the following should pass**:
1. [ ] Database connection successful
2. [ ] Product CRUD operations work
3. [ ] Search/filter returns correct results
4. [ ] Pagination returns exact page size
5. [ ] Category hierarchy displays correctly
6. [ ] Wishlist composite key operations work
7. [ ] Custom bat requests stored/retrieved
8. [ ] All 40+ endpoints return HTTP 200/201/204
9. [ ] No unhandled exceptions in logs
10. [ ] Response times < 100ms for simple queries

---

## Next Steps After Testing

1. ✅ Run complete API test suite
2. ✅ Verify database persistence across restarts
3. ✅ Test with actual SQL Server instance
4. ✅ Configure Azure Key Vault for production
5. ✅ Set up CI/CD pipeline
6. ✅ Deploy to staging environment
7. ✅ Performance testing at scale
8. ✅ Security audit and penetration testing
9. ✅ Production deployment

---

**Happy Testing! 🎉**
