# 🎯 Swagger UI - Interactive API Testing Guide

## What is Swagger UI?

Swagger UI is an **interactive web interface** that lets you:
- 📖 See all API endpoints with documentation
- 📝 View request/response formats
- 🧪 Test endpoints directly from the browser
- 📊 See real responses from your API
- 📋 View request parameters and body schemas

## Quick Start (3 Steps)

### Step 1️⃣: Start the API

Open a terminal and run:

```bash
cd /Users/shaktibratanaik/CricketBazar/Backend
dotnet run --project src/CricketBazar.API --urls http://localhost:5001
```

You should see:
```
[HH:MM:SS INF] Now listening on: http://localhost:5001
[HH:MM:SS INF] Application started. Press Ctrl+C to shut down.
```

✅ **Leave this running!**

### Step 2️⃣: Open Swagger UI in Browser

Click this link or type in your browser:

```
👉 http://localhost:5001/swagger
```

### Step 3️⃣: Start Testing!

You'll see a beautiful interface with all endpoints listed and organized by category.

---

## What You'll See in Swagger UI

### 📋 Endpoint Organization

Endpoints are grouped by category:

```
🏷️  CATEGORIES (6 endpoints)
🏪  BRANDS (6 endpoints)
🏏  PRODUCTS (8 endpoints) - with pagination & filtering
⭐  REVIEWS (4 endpoints)
🛒  CART (5 endpoints)
❤️   WISHLIST (4 endpoints)
📦  ORDERS (5 endpoints)
🏏  CUSTOM BAT REQUESTS (6 endpoints)
🏥  HEALTH (1 endpoint)
```

---

## How to Test an Endpoint - Example 1: GET Products

### View the Endpoint

1. Scroll to **PRODUCTS** section
2. Click on **GET /api/v1/products**
3. The endpoint details will expand showing:

```
GET /api/v1/products
List products (paginated with filters)

Parameters:
┌─────────────────────────────────┐
│ pageNumber (integer)            │
│   Page number                   │
│   Default: 1                    │
│                                 │
│ pageSize (integer)              │
│   Items per page                │
│   Default: 20                   │
│                                 │
│ categoryId (integer)            │
│   Filter by category ID         │
│                                 │
│ brandId (integer)               │
│   Filter by brand ID            │
│                                 │
│ minPrice (decimal)              │
│   Minimum price filter          │
│                                 │
│ maxPrice (decimal)              │
│   Maximum price filter          │
│                                 │
│ searchTerm (string)             │
│   Search products by name       │
│                                 │
│ sortBy (string)                 │
│   Sort order (newest,           │
│   price_asc, price_desc,        │
│   rating)                       │
└─────────────────────────────────┘

Response:
┌─────────────────────────────────┐
│ 200 - Success                   │
│ {                               │
│   "items": [...],               │
│   "totalCount": 0,              │
│   "pageNumber": 1,              │
│   "pageSize": 20                │
│ }                               │
│                                 │
│ 400 - Bad Request               │
│ 500 - Server Error              │
└─────────────────────────────────┘
```

### Test the Endpoint

1. Click the **"Try it out"** button
2. Fill in parameters (optional):
   - pageNumber: `1`
   - pageSize: `10`
   - Leave others blank
3. Click **"Execute"** button
4. See response:

```json
{
  "items": [],
  "totalCount": 0,
  "pageNumber": 1,
  "pageSize": 10
}
```

---

## How to Test an Endpoint - Example 2: POST Categories

### View the Endpoint

1. Scroll to **CATEGORIES** section
2. Click on **POST /api/v1/categories**
3. The endpoint details will expand showing:

```
POST /api/v1/categories
Create a new category

Request Body (JSON):
┌──────────────────────────────────┐
│ {                                │
│   "name": "string",              │
│   "slug": "string",              │
│   "sortOrder": 0                 │
│ }                                │
└──────────────────────────────────┘

Response:
┌──────────────────────────────────┐
│ 201 - Created                    │
│ {                                │
│   "id": 1,                       │
│   "name": "Category Name",       │
│   "slug": "category-name",       │
│   "sortOrder": 0,                │
│   "isActive": true               │
│ }                                │
│                                  │
│ 400 - Bad Request                │
│ 500 - Server Error               │
└──────────────────────────────────┘
```

### Test the Endpoint

1. Click the **"Try it out"** button
2. Edit the JSON request body:
   ```json
   {
     "name": "Cricket Bats",
     "slug": "cricket-bats",
     "sortOrder": 1
   }
   ```
3. Click **"Execute"** button
4. See the response:
   ```json
   {
     "id": 1,
     "name": "Cricket Bats",
     "slug": "cricket-bats",
     "sortOrder": 1,
     "isActive": true
   }
   ```

---

## Swagger UI Features Explained

### 🎨 Endpoint Color Coding

- 🟦 **Blue** = GET (Read data)
- 🟩 **Green** = POST (Create data)
- 🟨 **Yellow** = PUT (Update data)
- 🟥 **Red** = DELETE (Remove data)

### 📋 Request Body Schema

For POST/PUT endpoints, you'll see the exact JSON format required:

```json
{
  "fieldName": "type (string, integer, decimal, boolean, etc.)",
  "requiredField": "required",
  "optionalField": "optional"
}
```

### 📊 Response Schema

Shows what the API returns:

```json
{
  "successResponse": {
    "statusCode": 200,
    "data": "The actual data returned"
  },
  "errorResponse": {
    "statusCode": 400,
    "message": "Error message"
  }
}
```

### 📝 Parameter Types

- **integer** - Whole numbers (1, 2, 3)
- **decimal** - Numbers with decimals (99.99)
- **string** - Text ("hello", "bat")
- **boolean** - True/False
- **array** - List of items [1, 2, 3]

---

## Testing with Different Scenarios

### Scenario 1: Get Products by Category

1. Click GET /api/v1/products
2. Click "Try it out"
3. Fill in:
   - categoryId: `1`
   - pageSize: `5`
4. Click "Execute"
5. See products from category 1

### Scenario 2: Search Products

1. Click GET /api/v1/products
2. Click "Try it out"
3. Fill in:
   - searchTerm: `bat`
   - sortBy: `price_asc`
4. Click "Execute"
5. See products matching "bat", sorted by price ascending

### Scenario 3: Price Range Filter

1. Click GET /api/v1/products
2. Click "Try it out"
3. Fill in:
   - minPrice: `1000`
   - maxPrice: `5000`
   - pageSize: `10`
4. Click "Execute"
5. See products in price range ₹1000 - ₹5000

---

## Advanced Swagger UI Tips

### 📋 View Request as cURL

Each endpoint shows a "curl" option to copy the exact command:

```bash
curl -X GET "http://localhost:5001/api/v1/products?pageNumber=1&pageSize=10" \
  -H "accept: application/json"
```

### 🔄 Clear All Values

Click the "Clear" button to reset all parameters.

### 📊 Expand/Collapse Responses

- Click arrow (▶) to expand response schema
- Click arrow (▼) to collapse

### 💾 Copy Response

Click the copy button to copy entire response JSON to clipboard.

### 🔍 Filter Endpoints

Use the search box at top to filter endpoints:
- Type "product" to see only product endpoints
- Type "POST" to see only create endpoints

---

## Troubleshooting

### Issue: Swagger page is blank

**Solution:**
1. Make sure API is running (terminal shows "Now listening on")
2. Check the port is 5001: `http://localhost:5001/swagger`
3. Try refreshing the page (Cmd+R or Ctrl+R)

### Issue: "Try it out" button doesn't work

**Solution:**
1. Make sure API is still running in terminal
2. Check the port matches what's in the URL
3. Try a different endpoint to test

### Issue: Getting error responses

**Solution:**
1. Check if database is created (endpoints return empty because DB doesn't exist)
2. Verify JSON format is correct for POST/PUT requests
3. Check response body for error message details

### Issue: Port 5001 already in use

**Solution:**
Use a different port:
```bash
dotnet run --project src/CricketBazar.API --urls http://localhost:5002
# Then visit: http://localhost:5002/swagger
```

---

## Common API Response Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK - Request successful | GET products |
| 201 | Created - Resource created | POST category |
| 204 | No Content - Successful delete | DELETE category |
| 400 | Bad Request - Invalid data | Missing required field |
| 404 | Not Found - Resource doesn't exist | GET category/999 |
| 500 | Server Error - Internal error | Database connection failed |

---

## Next Steps

1. ✅ Start API on port 5001
2. ✅ Open Swagger UI
3. ✅ Click on different endpoints
4. ✅ Try out at least 5 endpoints
5. ✅ Understand request/response formats
6. 🔄 Create database and seed test data
7. 🧪 Test endpoints with real data

---

## Summary

Swagger UI gives you:
- 📖 Complete API documentation
- 🧪 Interactive testing environment
- 📋 Request/response schemas
- 🎨 Beautiful, organized interface
- ⚡ Instant feedback
- 📝 Copy-paste ready curl commands

**Everything you need to understand and test your API!**

---

**Status**: ✅ Ready to explore!  
**Last Updated**: October 24, 2026  
**Next Step**: Create SQL Server database and seed data
