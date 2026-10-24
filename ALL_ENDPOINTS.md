# 🎯 Cricket Bazar API - All Endpoints

## Quick Links
- **Base URL**: `http://localhost:5000`
- **API Version**: `v1`
- **Swagger UI**: `http://localhost:5000/swagger` (if enabled)

---

## 📋 Endpoints by Category

### 🏥 Health & Status
```
GET  /health
```

### 🏷️ Categories
```
GET    /api/v1/categories              - List all categories
GET    /api/v1/categories/{id}         - Get category by ID
GET    /api/v1/categories/slug/{slug}  - Get category by slug
POST   /api/v1/categories              - Create category
PUT    /api/v1/categories/{id}         - Update category
DELETE /api/v1/categories/{id}         - Delete category
```

### 🏪 Brands
```
GET    /api/v1/brands                  - List all brands
GET    /api/v1/brands/{id}             - Get brand by ID
GET    /api/v1/brands/slug/{slug}      - Get brand by slug
POST   /api/v1/brands                  - Create brand
PUT    /api/v1/brands/{id}             - Update brand
DELETE /api/v1/brands/{id}             - Delete brand
```

### 🏏 Products
```
GET    /api/v1/products                - List products (paginated with filters)
GET    /api/v1/products/{id}           - Get product by ID
GET    /api/v1/products/slug/{slug}    - Get product by slug
POST   /api/v1/products                - Create product
PUT    /api/v1/products/{id}           - Update product
DELETE /api/v1/products/{id}           - Delete product
POST   /api/v1/products/{productId}/images  - Add product image
POST   /api/v1/products/{productId}/variants - Add product variant
```

### 📸 Product Images
```
POST   /api/v1/products/{productId}/images
```

### 🎨 Product Variants
```
POST   /api/v1/products/{productId}/variants
```

### ⭐ Reviews
```
GET    /api/v1/reviews/product/{productId}  - Get reviews for product
GET    /api/v1/reviews/user/{userId}       - Get user's reviews
POST   /api/v1/reviews                     - Create review
DELETE /api/v1/reviews/{id}                - Delete review
```

### 🛒 Shopping Cart
```
GET    /api/v1/cart/user/{userId}     - Get user's cart
GET    /api/v1/cart/guest/{token}     - Get guest cart
POST   /api/v1/cart/items             - Add to cart
PUT    /api/v1/cart/items/{itemId}    - Update cart item
DELETE /api/v1/cart/items/{itemId}    - Remove from cart
```

### ❤️ Wishlist
```
GET    /api/v1/wishlist/user/{userId}              - Get user's wishlist
GET    /api/v1/wishlist/user/{userId}/product/{productId} - Check if in wishlist
POST   /api/v1/wishlist/user/{userId}/product/{productId} - Add to wishlist
DELETE /api/v1/wishlist/user/{userId}/product/{productId} - Remove from wishlist
```

### 📦 Orders
```
GET    /api/v1/orders/user/{userId}     - Get user's orders
GET    /api/v1/orders/{id}              - Get order by ID
GET    /api/v1/orders/number/{orderNo}  - Get order by order number
PUT    /api/v1/orders/{id}/status       - Update order status
PUT    /api/v1/orders/{id}/cancel       - Cancel order
```

### 🏏 Custom Bat Requests
```
GET    /api/v1/custom-bat-requests/user/{userId}    - Get user's bat requests
GET    /api/v1/custom-bat-requests/{id}             - Get request by ID
GET    /api/v1/custom-bat-requests/pending          - Get all pending requests
POST   /api/v1/custom-bat-requests                  - Create custom bat request
PUT    /api/v1/custom-bat-requests/{id}/status      - Update request status
DELETE /api/v1/custom-bat-requests/{id}             - Delete request
```

---

## 🔍 Example Requests

### Products with Pagination
```bash
curl 'http://localhost:5000/api/v1/products?pageNumber=1&pageSize=20'
```

### Products with Filters
```bash
curl 'http://localhost:5000/api/v1/products?categoryId=1&minPrice=500&maxPrice=10000&sortBy=newest'
```

### Categories (Only Active)
```bash
curl 'http://localhost:5000/api/v1/categories?onlyActive=true'
```

### User's Orders
```bash
curl 'http://localhost:5000/api/v1/orders/user/1'
```

### Product Reviews
```bash
curl 'http://localhost:5000/api/v1/reviews/product/5'
```

---

## 📊 Query Parameters (Products)

| Parameter | Type | Description |
|-----------|------|-------------|
| `pageNumber` | int | Page number (default: 1) |
| `pageSize` | int | Items per page (default: 20) |
| `categoryId` | int? | Filter by category |
| `brandId` | int? | Filter by brand |
| `minPrice` | decimal? | Minimum price filter |
| `maxPrice` | decimal? | Maximum price filter |
| `searchTerm` | string | Search in name/description |
| `sortBy` | string | Sort order (newest, price_asc, price_desc, rating) |

---

## 🔐 Authentication

Current endpoints support optional `X-User-Id` header for user context:

```bash
curl -H "X-User-Id: 123" http://localhost:5000/api/v1/orders/user/123
```

---

## 📝 Response Format

### Paginated Response
```json
{
  "items": [...],
  "totalCount": 100,
  "pageNumber": 1,
  "pageSize": 20
}
```

### Single Item Response
```json
{
  "id": 1,
  "name": "Example",
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
    "fieldName": ["error message"]
  }
}
```

---

## 🚀 Total Endpoints: 50+

