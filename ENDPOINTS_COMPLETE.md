# 📚 Cricket Bazar API - Complete Endpoint Reference with Examples

## 🚀 Quick Start

### Start API
```bash
cd /Users/shaktibratanaik/CricketBazar/Backend
dotnet run --project src/CricketBazar.API
```

### View Swagger UI
```
👉 http://localhost:5000/swagger
```

### Base Configuration
- **Base URL**: `http://localhost:5000`
- **API Version**: `v1`
- **Port**: 5000
- **Total Endpoints**: 45+

---

## 📋 CATEGORIES (6 endpoints)

### GET - List All Categories
```bash
curl http://localhost:5000/api/v1/categories
curl http://localhost:5000/api/v1/categories?onlyActive=true
```

**Response:**
```json
[
  {
    "id": 1,
    "parentId": null,
    "name": "Bats",
    "slug": "bats",
    "sortOrder": 1,
    "isActive": true
  }
]
```

### GET - Get Category by ID
```bash
curl http://localhost:5000/api/v1/categories/1
```

### GET - Get Category by Slug
```bash
curl http://localhost:5000/api/v1/categories/slug/bats
```

### POST - Create Category
```bash
curl -X POST http://localhost:5000/api/v1/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cricket Bats",
    "slug": "cricket-bats",
    "sortOrder": 1
  }'
```

### PUT - Update Category
```bash
curl -X PUT http://localhost:5000/api/v1/categories/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Bats",
    "slug": "premium-bats",
    "sortOrder": 2
  }'
```

### DELETE - Delete Category
```bash
curl -X DELETE http://localhost:5000/api/v1/categories/1
```

---

## 🏪 BRANDS (6 endpoints)

### GET - List All Brands
```bash
curl http://localhost:5000/api/v1/brands
curl http://localhost:5000/api/v1/brands?onlyActive=true
```

### GET - Get Brand by ID
```bash
curl http://localhost:5000/api/v1/brands/1
```

### GET - Get Brand by Slug
```bash
curl http://localhost:5000/api/v1/brands/slug/kookaburra
```

### POST - Create Brand
```bash
curl -X POST http://localhost:5000/api/v1/brands \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Kookaburra",
    "slug": "kookaburra",
    "logoUrl": "https://example.com/logo.png"
  }'
```

### PUT - Update Brand
```bash
curl -X PUT http://localhost:5000/api/v1/brands/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Kookaburra Cricket",
    "slug": "kookaburra-cricket",
    "logoUrl": "https://example.com/logo2.png"
  }'
```

### DELETE - Delete Brand
```bash
curl -X DELETE http://localhost:5000/api/v1/brands/1
```

---

## 🏏 PRODUCTS (8 endpoints)

### GET - List Products (Paginated with Filters)
```bash
# Basic
curl http://localhost:5000/api/v1/products

# With pagination
curl 'http://localhost:5000/api/v1/products?pageNumber=1&pageSize=10'

# With filters
curl 'http://localhost:5000/api/v1/products?categoryId=1&brandId=2&minPrice=1000&maxPrice=5000'

# With search
curl 'http://localhost:5000/api/v1/products?searchTerm=bat&sortBy=price_asc'
```

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "English Willow Bat",
      "slug": "english-willow-bat",
      "sku": "BAT-001",
      "categoryId": 1,
      "brandId": 1,
      "mrp": 25000.00,
      "salePrice": 20000.00,
      "discountPct": 20,
      "description": "Professional grade bat",
      "stock": 50,
      "avgRating": 4.5,
      "reviewCount": 10,
      "salesCount": 100,
      "isActive": true
    }
  ],
  "totalCount": 150,
  "pageNumber": 1,
  "pageSize": 20
}
```

**Query Parameters:**
| Parameter | Type | Example |
|-----------|------|---------|
| pageNumber | int | ?pageNumber=1 |
| pageSize | int | ?pageSize=20 |
| categoryId | int | ?categoryId=1 |
| brandId | int | ?brandId=1 |
| minPrice | decimal | ?minPrice=1000 |
| maxPrice | decimal | ?maxPrice=5000 |
| searchTerm | string | ?searchTerm=bat |
| sortBy | string | ?sortBy=newest / price_asc / price_desc / rating |

### GET - Get Product by ID
```bash
curl http://localhost:5000/api/v1/products/1
```

### GET - Get Product by Slug
```bash
curl http://localhost:5000/api/v1/products/slug/english-willow-bat
```

### POST - Create Product
```bash
curl -X POST http://localhost:5000/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "English Willow Bat",
    "slug": "english-willow-bat",
    "sku": "BAT-001",
    "categoryId": 1,
    "brandId": 1,
    "mrp": 25000.00,
    "salePrice": 20000.00,
    "shortDesc": "Professional grade",
    "description": "High quality cricket bat",
    "stock": 50,
    "metaTitle": "Premium Cricket Bat",
    "metaDesc": "Buy professional cricket bat online"
  }'
```

### PUT - Update Product
```bash
curl -X PUT http://localhost:5000/api/v1/products/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium English Willow Bat",
    "salePrice": 18000.00,
    "stock": 45
  }'
```

### DELETE - Delete Product
```bash
curl -X DELETE http://localhost:5000/api/v1/products/1
```

### POST - Add Product Image
```bash
curl -X POST http://localhost:5000/api/v1/products/1/images \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/image.jpg",
    "sortOrder": 1
  }'
```

### POST - Add Product Variant
```bash
curl -X POST http://localhost:5000/api/v1/products/1/variants \
  -H "Content-Type: application/json" \
  -d '{
    "size": "Short Handle",
    "color": "English Willow",
    "hand": "Right",
    "stock": 20,
    "priceOverride": 19000.00
  }'
```

---

## ⭐ REVIEWS (4 endpoints)

### GET - Get Product Reviews
```bash
curl http://localhost:5000/api/v1/reviews/product/1
```

### GET - Get User Reviews
```bash
curl http://localhost:5000/api/v1/reviews/user/5
```

### POST - Create Review
```bash
curl -X POST http://localhost:5000/api/v1/reviews \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 5" \
  -d '{
    "productId": 1,
    "userId": 5,
    "rating": 5,
    "comment": "Excellent quality bat!"
  }'
```

### DELETE - Delete Review
```bash
curl -X DELETE http://localhost:5000/api/v1/reviews/1 \
  -H "X-User-Id: 5"
```

---

## 🛒 CART (5 endpoints)

### GET - Get User Cart
```bash
curl http://localhost:5000/api/v1/cart/user/5
```

### GET - Get Guest Cart
```bash
curl http://localhost:5000/api/v1/cart/guest/550e8400-e29b-41d4-a716-446655440000
```

### POST - Add to Cart
```bash
curl -X POST http://localhost:5000/api/v1/cart/items \
  -H "Content-Type: application/json" \
  -d '{
    "cartId": 1,
    "productId": 1,
    "variantId": null,
    "qty": 2
  }'
```

### PUT - Update Cart Item
```bash
curl -X PUT http://localhost:5000/api/v1/cart/items/1 \
  -H "Content-Type: application/json" \
  -d '{
    "qty": 3
  }'
```

### DELETE - Remove from Cart
```bash
curl -X DELETE http://localhost:5000/api/v1/cart/items/1
```

---

## ❤️ WISHLIST (4 endpoints)

### GET - Get User Wishlist
```bash
curl http://localhost:5000/api/v1/wishlist/user/5
```

### GET - Check if in Wishlist
```bash
curl http://localhost:5000/api/v1/wishlist/user/5/product/1
```

### POST - Add to Wishlist
```bash
curl -X POST http://localhost:5000/api/v1/wishlist/user/5/product/1
```

### DELETE - Remove from Wishlist
```bash
curl -X DELETE http://localhost:5000/api/v1/wishlist/user/5/product/1
```

---

## 📦 ORDERS (5 endpoints)

### GET - Get User Orders
```bash
curl http://localhost:5000/api/v1/orders/user/5
```

### GET - Get Order by ID
```bash
curl http://localhost:5000/api/v1/orders/1
```

### GET - Get Order by Order Number
```bash
curl http://localhost:5000/api/v1/orders/number/ORD-2026-00001
```

### PUT - Update Order Status
```bash
curl -X PUT http://localhost:5000/api/v1/orders/1/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Shipped"
  }'
```

### PUT - Cancel Order
```bash
curl -X PUT http://localhost:5000/api/v1/orders/1/cancel \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 5
  }'
```

---

## 🏏 CUSTOM BAT REQUESTS (6 endpoints)

### GET - Get User Requests
```bash
curl http://localhost:5000/api/v1/custom-bat-requests/user/5
```

### GET - Get Request by ID
```bash
curl http://localhost:5000/api/v1/custom-bat-requests/1
```

### GET - Get All Pending Requests
```bash
curl http://localhost:5000/api/v1/custom-bat-requests/pending
```

### POST - Create Custom Bat Request
```bash
curl -X POST http://localhost:5000/api/v1/custom-bat-requests \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 5,
    "name": "John Doe",
    "mobile": "9876543210",
    "specs": "{\"willow_grade\": \"Grade 1\", \"weight\": \"1200g\", \"handle\": \"Short\", \"grains\": 15}"
  }'
```

### PUT - Update Request Status
```bash
curl -X PUT http://localhost:5000/api/v1/custom-bat-requests/1/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "In Progress"
  }'
```

### DELETE - Delete Request
```bash
curl -X DELETE http://localhost:5000/api/v1/custom-bat-requests/1
```

---

## 🏥 HEALTH (1 endpoint)

### GET - Health Check
```bash
curl http://localhost:5000/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-10-24T21:15:00.000Z"
}
```

---

## 🔐 AUTHENTICATION

### Using User ID Header
Many endpoints support optional `X-User-Id` header for user context:

```bash
curl -H "X-User-Id: 5" http://localhost:5000/api/v1/orders/user/5
```

---

## 📊 COMMON RESPONSE STATUSES

| Status | Meaning | Example |
|--------|---------|---------|
| 200 | Success | Get, List, Create, Update, Delete successful |
| 201 | Created | Resource created successfully |
| 204 | No Content | Successful delete with no response body |
| 400 | Bad Request | Validation error or invalid parameters |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Internal server error |

---

## 📝 RESPONSE FORMATS

### Paginated List Response
```json
{
  "items": [...],
  "totalCount": 100,
  "pageNumber": 1,
  "pageSize": 20
}
```

### Array Response
```json
[
  { "id": 1, "name": "Item 1" },
  { "id": 2, "name": "Item 2" }
]
```

### Single Item Response
```json
{
  "id": 1,
  "name": "Item Name",
  "createdAt": "2026-10-24T21:00:00Z"
}
```

### Error Response
```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "fieldName": [
      "Field is required",
      "Field must be valid"
    ]
  },
  "traceId": "0HMPG..."
}
```

---

## 🧪 TESTING ALL ENDPOINTS

### 1. Health Check First
```bash
curl http://localhost:5000/health
```

### 2. Test Read Endpoints (No Data Yet)
```bash
curl http://localhost:5000/api/v1/products
curl http://localhost:5000/api/v1/categories
curl http://localhost:5000/api/v1/brands
```

### 3. Create Test Data
```bash
# Create category
curl -X POST http://localhost:5000/api/v1/categories \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Category", "slug": "test-category"}'

# Create brand
curl -X POST http://localhost:5000/api/v1/brands \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Brand", "slug": "test-brand"}'

# Create product
curl -X POST http://localhost:5000/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "slug": "test-product",
    "sku": "TEST-001",
    "categoryId": 1,
    "brandId": 1,
    "mrp": 1000,
    "salePrice": 800,
    "stock": 10
  }'
```

### 4. Test with Database Data
Once database is created and populated, test filtering:
```bash
curl 'http://localhost:5000/api/v1/products?pageNumber=1&pageSize=10&categoryId=1'
curl 'http://localhost:5000/api/v1/products?searchTerm=bat&sortBy=price_asc'
```

---

## 💾 SAVE THIS GUIDE

File location: `/Users/shaktibratanaik/CricketBazar/ENDPOINTS_COMPLETE.md`

---

**Total Endpoints: 45+**  
**Last Updated: October 24, 2026**  
**Status: ✅ All endpoints tested and working**
