# 🌐 Cricket Bazar API - Swagger/OpenAPI Documentation

## Live Swagger UI
🎯 **Open in Browser**: [http://localhost:5001/swagger](http://localhost:5001/swagger)

## API Base URL
```
http://localhost:5001/api
```

## Authentication
Most endpoints require authentication via JWT Bearer token or OAuth2.

---

## 📦 Products API

### Get All Products (Paginated)
```
GET /api/products
```
**Query Parameters:**
- `pageNumber` (int, default: 1) - Page number
- `pageSize` (int, default: 20, max: 100) - Items per page
- `search` (string, optional) - Search term
- `categoryId` (int, optional) - Filter by category
- `brandId` (int, optional) - Filter by brand
- `minPrice` (decimal, optional) - Minimum price
- `maxPrice` (decimal, optional) - Maximum price
- `sortBy` (string, optional) - Sort field

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "Cricket Bat",
      "slug": "cricket-bat",
      "sku": "BAT001",
      "mrp": 5000,
      "salePrice": 4500,
      "discountPct": 10,
      "categoryId": 1,
      "brandId": 1,
      "stock": 50,
      "avgRating": 4.5,
      "reviewCount": 12,
      "isActive": true
    }
  ],
  "totalCount": 1,
  "pageNumber": 1,
  "pageSize": 20
}
```

### Get Product by ID
```
GET /api/products/{id}
```

### Create Product
```
POST /api/products
Content-Type: application/json

{
  "name": "Cricket Bat",
  "slug": "cricket-bat",
  "sku": "BAT001",
  "categoryId": 1,
  "brandId": 1,
  "mrp": 5000,
  "salePrice": 4500,
  "shortDesc": "Premium cricket bat",
  "description": "High-quality willow cricket bat",
  "stock": 50,
  "isActive": true
}
```

### Update Product
```
PUT /api/products/{id}
Content-Type: application/json
```

### Delete Product
```
DELETE /api/products/{id}
```

---

## 🏷️ Categories API

### Get All Categories
```
GET /api/categories
```

### Get Category by ID
```
GET /api/categories/{id}
```

### Get Category Hierarchy
```
GET /api/categories/hierarchy
```

### Create Category
```
POST /api/categories
Content-Type: application/json

{
  "name": "Bats",
  "slug": "bats",
  "parentId": null,
  "sortOrder": 1,
  "isActive": true
}
```

### Update Category
```
PUT /api/categories/{id}
```

### Delete Category
```
DELETE /api/categories/{id}
```

---

## 🏢 Brands API

### Get All Brands
```
GET /api/brands
```

### Get Brand by ID
```
GET /api/brands/{id}
```

### Create Brand
```
POST /api/brands
Content-Type: application/json

{
  "name": "SG Cricket",
  "slug": "sg-cricket",
  "logoUrl": "https://example.com/logo.png",
  "isActive": true
}
```

### Update Brand
```
PUT /api/brands/{id}
```

### Delete Brand
```
DELETE /api/brands/{id}
```

---

## ⭐ Reviews API

### Get All Reviews
```
GET /api/reviews?pageNumber=1&pageSize=20
```

### Get Product Reviews
```
GET /api/products/{productId}/reviews
```

### Create Review
```
POST /api/reviews
Content-Type: application/json

{
  "productId": 1,
  "userId": 1,
  "rating": 5,
  "comment": "Great product!"
}
```

---

## 🛒 Cart API

### Get Cart
```
GET /api/cart
```

### Add to Cart
```
POST /api/cart/items
Content-Type: application/json

{
  "productId": 1,
  "variantId": null,
  "qty": 2
}
```

### Remove from Cart
```
DELETE /api/cart/items/{itemId}
```

### Clear Cart
```
DELETE /api/cart
```

---

## 📋 Orders API

### Get User Orders
```
GET /api/orders?pageNumber=1&pageSize=20
```

### Get Order by ID
```
GET /api/orders/{id}
```

### Create Order
```
POST /api/orders
Content-Type: application/json

{
  "cartId": 1,
  "shipAddressId": 1,
  "shipMobile": "9876543210"
}
```

### Update Order Status
```
PUT /api/orders/{id}/status
Content-Type: application/json

{
  "status": "Confirmed"
}
```

---

## ❤️ Wishlist API

### Get Wishlist
```
GET /api/wishlist
```

### Add to Wishlist
```
POST /api/wishlist/{productId}
```

### Remove from Wishlist
```
DELETE /api/wishlist/{productId}
```

---

## 👤 Authentication API

### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "mobile": "9876543210",
  "password": "SecurePass123!"
}
```

### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "...",
  "expiresIn": 3600
}
```

### Request OTP
```
POST /api/auth/otp
Content-Type: application/json

{
  "mobile": "9876543210"
}
```

### Verify OTP
```
POST /api/auth/verify-otp
Content-Type: application/json

{
  "mobile": "9876543210",
  "otp": "123456"
}
```

---

## 🎯 Custom Bat Requests API

### Get All Requests
```
GET /api/custom-bat-requests?pageNumber=1&pageSize=20
```

### Get Request by ID
```
GET /api/custom-bat-requests/{id}
```

### Create Custom Request
```
POST /api/custom-bat-requests
Content-Type: application/json

{
  "name": "John Doe",
  "mobile": "9876543210",
  "specs": {
    "willowGrade": "Premium",
    "weight": "1200g",
    "handle": "Cane",
    "grains": 10
  }
}
```

---

## 📊 Health & Info Endpoints

### Health Check
```
GET /health
```
**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-10-24T15:23:20.178381Z"
}
```

### API Version
```
GET /api/version
```
**Response:**
```json
{
  "version": "v1"
}
```

---

## 🔐 Authorization Header Format

For authenticated endpoints, include the JWT token:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📝 Common Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Server Error |

---

## 🧪 Testing with curl

```bash
# Health check
curl http://localhost:5001/health

# Get products
curl http://localhost:5001/api/products

# Get specific product
curl http://localhost:5001/api/products/1

# Create product (requires authentication)
curl -X POST http://localhost:5001/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Bat",
    "slug": "test-bat",
    "sku": "BAT999",
    "categoryId": 1,
    "brandId": 1,
    "mrp": 1000,
    "salePrice": 900,
    "stock": 10
  }'
```

---

## 📚 Additional Resources

- **OpenAPI Spec**: http://localhost:5001/swagger/v1/swagger.json
- **Swagger UI**: http://localhost:5001/swagger
- **API Base**: http://localhost:5001/api

---

**API Status**: ✅ Running  
**Last Updated**: 2026-10-24
