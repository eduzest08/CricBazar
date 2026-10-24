# Cricket Bazar API Documentation

## Overview
Cricket Bazar is a comprehensive e-commerce API for cricket equipment built with .NET 10, Entity Framework Core, MediatR, and AutoMapper.

## API Base URL
- Development: `http://localhost:5000/api/v1`
- Production: `https://api.cricketbazar.com/api/v1`

## Authentication
Currently using X-User-Id header for user identification (to be replaced with JWT when authentication module is added).

## Endpoints

### Products
- **GET** `/products` - Get all products with pagination and filtering
  - Query Parameters: `pageNumber`, `pageSize`, `categoryId`, `brandId`, `minPrice`, `maxPrice`, `searchTerm`, `sortBy`
- **GET** `/products/{id}` - Get product by ID
- **GET** `/products/slug/{slug}` - Get product by slug
- **POST** `/products` - Create new product (Admin)
- **PUT** `/products/{id}` - Update product (Admin)
- **DELETE** `/products/{id}` - Delete product (Admin)
- **POST** `/products/{productId}/images` - Add image to product (Admin)
- **POST** `/products/{productId}/variants` - Add variant to product (Admin)

### Categories
- **GET** `/categories` - Get all categories with hierarchy
- **GET** `/categories/{id}` - Get category by ID
- **GET** `/categories/slug/{slug}` - Get category by slug
- **POST** `/categories` - Create new category (Admin)
- **PUT** `/categories/{id}` - Update category (Admin)
- **DELETE** `/categories/{id}` - Delete category (Admin)

### Brands
- **GET** `/brands` - Get all brands
- **GET** `/brands/{id}` - Get brand by ID
- **GET** `/brands/slug/{slug}` - Get brand by slug
- **POST** `/brands` - Create new brand (Admin)
- **PUT** `/brands/{id}` - Update brand (Admin)
- **DELETE** `/brands/{id}` - Delete brand (Admin)

### Reviews
- **GET** `/reviews/product/{productId}` - Get reviews for a product
- **GET** `/reviews/user/{userId}` - Get reviews by a user
- **POST** `/reviews` - Create a review (requires X-User-Id header)
- **DELETE** `/reviews/{id}` - Delete a review (own reviews only)

### Wishlist
- **GET** `/wishlist/user/{userId}` - Get user's wishlist
- **GET** `/wishlist/user/{userId}/product/{productId}` - Check if product in wishlist
- **POST** `/wishlist/user/{userId}/product/{productId}` - Add to wishlist
- **DELETE** `/wishlist/user/{userId}/product/{productId}` - Remove from wishlist

### Cart
- **GET** `/cart/user/{userId}` - Get user's cart
- **GET** `/cart/guest/{token}` - Get guest cart
- **POST** `/cart/user/{userId}/items` - Add item to cart
- **PUT** `/cart/items/{itemId}` - Update cart item quantity
- **DELETE** `/cart/items/{itemId}` - Remove item from cart
- **DELETE** `/cart/user/{userId}` - Clear entire cart

### Orders
- **GET** `/orders/user/{userId}` - Get user's orders
- **GET** `/orders/{id}` - Get order by ID
- **GET** `/orders/number/{orderNo}` - Get order by order number
- **POST** `/orders/user/{userId}` - Create new order from cart
- **PUT** `/orders/{id}/status` - Update order status (Admin)
- **POST** `/orders/{id}/cancel` - Cancel order

### Custom Bat Requests
- **GET** `/custombat requests/user/{userId}` - Get user's requests
- **GET** `/custombat requests/{id}` - Get request by ID
- **POST** `/custombat requests` - Create new request
- **PUT** `/custombat requests/{id}/status` - Update request status (Admin)
- **DELETE** `/custombat requests/{id}` - Delete request
- **GET** `/custombat requests/admin/pending` - Get all pending requests (Admin)

## Request/Response Examples

### Get Products List
```
GET /api/v1/products?pageNumber=1&pageSize=20&categoryId=1&sortBy=newest
```

### Create Product
```
POST /api/v1/products
Content-Type: application/json

{
  "name": "Professional Cricket Bat",
  "slug": "professional-cricket-bat",
  "sku": "BAT-001",
  "categoryId": 1,
  "brandId": 1,
  "mrp": 5000.00,
  "salePrice": 4500.00,
  "shortDesc": "High quality cricket bat",
  "description": "Professional grade cricket bat made from English willow",
  "stock": 50,
  "metaTitle": "Buy Professional Cricket Bat",
  "metaDesc": "High quality cricket bat at best price",
  "isActive": true
}
```

### Add to Cart
```
POST /api/v1/cart/user/1/items
Content-Type: application/json

{
  "productId": 1,
  "variantId": null,
  "qty": 1
}
```

### Create Order
```
POST /api/v1/orders/user/1
Content-Type: application/json

{
  "shipFullName": "John Doe",
  "shipMobile": "9876543210",
  "shipAddress": "123 Cricket Lane, Sports City",
  "shipPincode": "560001",
  "shippingFee": 100.00
}
```

### Create Review
```
POST /api/v1/reviews
Content-Type: application/json
X-User-Id: 1

{
  "productId": 1,
  "rating": 5,
  "comment": "Excellent product! Highly recommended."
}
```

## Error Responses

### 404 Not Found
```json
{
  "message": "Product not found"
}
```

### 400 Bad Request
```json
{
  "message": "Quantity must be greater than 0"
}
```

### 403 Forbidden
```json
{
  "message": "Cannot cancel order belonging to another user"
}
```

## Sorting Options
- `newest` - Sort by creation date (default)
- `price-asc` - Sort by price ascending
- `price-desc` - Sort by price descending
- `rating` - Sort by average rating
- `bestselling` - Sort by sales count

## Response Pagination
Responses include pagination with:
- `pageNumber` - Current page
- `pageSize` - Items per page
- `totalCount` - Total items available

## Rate Limiting
(To be implemented) - 1000 requests per hour per IP

## CORS
Enabled for:
- `http://localhost:4200` (Angular dev)
- `http://localhost:3000` (React dev)

## Health Check
- **GET** `/health` - API health status
- **GET** `/api/version` - API version information

## Database
- SQL Server 2019+
- Connection string: Configured in `appsettings.json`

## Development Notes
- All admin endpoints require admin role verification (to be implemented)
- User authentication via JWT tokens (to be implemented)
- Pagination defaults: pageNumber=1, pageSize=20
- All timestamps are in UTC
