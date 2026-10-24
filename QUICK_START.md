# 🚀 Quick Start Guide - Cricket Bazar API

## Step 1: Navigate to Backend Directory
```bash
cd /Users/shaktibratanaik/CricketBazar/Backend
```

## Step 2: Build the Solution
```bash
dotnet build
```
Expected: Build succeeded, 0 Error(s)

## Step 3: Create the Database

**IMPORTANT**: You must create the CricBazar database BEFORE running the API.

### Option A: Using SQL Server Management Studio (Windows/macOS)
1. Open SQL Server Management Studio
2. Connect to your local SQL Server instance
3. Execute the SQL schema script provided earlier (the one with all the CREATE TABLE statements)
4. Database should be created as "CricBazar"

### Option B: Using sqlcmd (Command Line)
```bash
# First, verify SQL Server is running and accessible
sqlcmd -S localhost -U sa -P "@Bbsr123#" -Q "SELECT @@VERSION"

# Then create the database by running the schema script
sqlcmd -S localhost -U sa -P "@Bbsr123#" -i schema.sql
```

### Option C: Direct SQL Commands
```bash
sqlcmd -S localhost -U sa -P "@Bbsr123#" << 'SQL'
IF DB_ID('cricbazar') IS NULL CREATE DATABASE cricbazar;
GO
USE cricbazar;
GO
-- Then paste all the CREATE TABLE statements here
SQL
```

## Step 4: Verify Database Connection

```bash
# Test SQL Server connection
sqlcmd -S localhost -U sa -P "@Bbsr123#" -Q "SELECT DB_NAME();"

# Should show: cricbazar (or similar)
```

## Step 5: Run the API

```bash
# From /Users/shaktibratanaik/CricketBazar/Backend
dotnet run --project src/CricketBazar.API
```

Expected output:
```
Hosting environment: Development
Content root path: ...
Now listening on: https://localhost:5001
Now listening on: http://localhost:5000
Application started. Press Ctrl+C to exit.
```

## Step 6: Test the API

### Option A: Using Swagger (Browser)
```
Navigate to: http://localhost:5000/swagger/ui
```

### Option B: Using curl
```bash
# Get all products (should return empty array initially)
curl -X GET "http://localhost:5000/api/products" \
  -H "Content-Type: application/json"

# Create a test product
curl -X POST "http://localhost:5000/api/products" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Bat",
    "slug": "test-bat",
    "sku": "BAT-TEST-001",
    "categoryId": 1,
    "brandId": 1,
    "mrp": 5000.00,
    "salePrice": 4000.00,
    "stock": 10,
    "shortDesc": "A test product"
  }'
```

---

## ⚠️ If API Won't Start

### Error: "Cannot connect to database"
**Solution**: The CricBazar database doesn't exist yet
1. Create the database using the SQL schema script
2. Verify connection: `sqlcmd -S localhost -U sa -P "@Bbsr123#" -Q "USE cricbazar; SELECT COUNT(*) FROM dbo.Products;"`

### Error: "Login failed for user 'sa'"
**Solution**: SQL Server credentials are wrong
1. Verify SA password: `@Bbsr123#` (with # at the end)
2. Check SQL Server is using Mixed Authentication mode
3. Test manually: `sqlcmd -S localhost -U sa -P "@Bbsr123#"`

### Error: "Connection timeout"
**Solution**: SQL Server is not running or not accessible
1. Check if SQL Server is running: `ps aux | grep sqlserver` (Linux/macOS)
2. Check firewall isn't blocking port 1433
3. Verify connection string in `appsettings.Development.json`

### API Starts But Returns Errors
**Solution**: Check the logs
```bash
# Run with more verbose output
dotnet run --project src/CricketBazar.API --verbosity diagnostic
```

---

## 🧪 Testing the API

### Create a Category First
```bash
curl -X POST "http://localhost:5000/api/categories" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bats",
    "slug": "bats",
    "sortOrder": 1,
    "isActive": true
  }'
```
Note the returned ID (should be 1)

### Create a Brand
```bash
curl -X POST "http://localhost:5000/api/brands" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "SG",
    "slug": "sg",
    "isActive": true
  }'
```
Note the returned ID (should be 1)

### Create a Product
```bash
curl -X POST "http://localhost:5000/api/products" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "English Willow Bat",
    "slug": "english-willow-bat",
    "sku": "BAT-EW-001",
    "categoryId": 1,
    "brandId": 1,
    "mrp": 15000.00,
    "salePrice": 12000.00,
    "stock": 50,
    "shortDesc": "Premium cricket bat"
  }'
```

### Get All Products
```bash
curl -X GET "http://localhost:5000/api/products"
```

---

## 📊 Checking Database Directly

```bash
# Connect to database
sqlcmd -S localhost -U sa -P "@Bbsr123#" -d cricbazar

# Check tables exist
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo';

# Count products
SELECT COUNT(*) FROM dbo.Products;

# View recent products
SELECT TOP 5 Id, Name, Sku, CreatedAt FROM dbo.Products ORDER BY CreatedAt DESC;

# Exit
GO
```

---

## 🛑 Stop the API

Press `Ctrl+C` in the terminal where the API is running.

---

## ✅ Success Indicators

You'll know everything is working when:
- ✅ API starts without errors
- ✅ Swagger UI loads at `http://localhost:5000/swagger/ui`
- ✅ GET /api/products returns `{"items":[],"totalCount":0,...}` or products if you added any
- ✅ You can create/read/update/delete through Swagger or curl
- ✅ Database shows data when you query it directly

---

## 📚 For More Details

- See: `/Users/shaktibratanaik/CricketBazar/INDEX.md` - Full documentation index
- See: `/Users/shaktibratanaik/CricketBazar/TESTING_GUIDE.md` - Detailed testing guide
- See: `/Users/shaktibratanaik/CricketBazar/FINAL_SUMMARY.md` - Complete summary

---

**Ready? Start with Step 1! 🚀**
