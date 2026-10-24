# Swagger UI Quick Start Guide

## ⚡ Quick Start (2 Steps)

### 1️⃣ Start the API
```bash
cd /Users/shaktibratanaik/CricketBazar/Backend
dotnet run --project src/CricketBazar.API --urls http://localhost:5001
```

### 2️⃣ Open Swagger in Browser
```
http://localhost:5001/swagger
```

**That's it!** 🎉 You now have full API documentation with interactive testing.

---

## 📋 What You See in Swagger UI

### Endpoint List
- All 31+ endpoints organized by category
- Each endpoint shows HTTP method (GET, POST, PUT, DELETE, etc.)
- Color-coded by operation type (GET=blue, POST=green, etc.)

### Endpoint Details (Click to Expand)
1. **Description** - What the endpoint does
2. **Parameters** - Query params, path params, headers
3. **Request Body** - JSON schema for POST/PUT requests
4. **Responses** - Response codes (200, 404, 500, etc.) with examples

### Testing with "Try it out"
1. Click the **"Try it out"** button
2. Fill in any required parameters
3. Edit the JSON request body if needed
4. Click **"Execute"** button
5. See the real response from your API
6. Copy the curl command if needed

---

## 📚 Endpoint Categories

### Categories
- `GET /api/v1/Categories` - List all categories
- `POST /api/v1/Categories` - Create new category
- `GET /api/v1/Categories/{id}` - Get specific category
- `PUT /api/v1/Categories/{id}` - Update category
- `DELETE /api/v1/Categories/{id}` - Delete category
- `GET /api/v1/Categories/slug/{slug}` - Get by slug

### Brands
- `GET /api/v1/Brands` - List all brands
- `POST /api/v1/Brands` - Create new brand
- `GET /api/v1/Brands/{id}` - Get specific brand
- `PUT /api/v1/Brands/{id}` - Update brand
- `DELETE /api/v1/Brands/{id}` - Delete brand
- `GET /api/v1/Brands/slug/{slug}` - Get by slug

### Products
- `GET /api/v1/Products` - List products (with pagination)
- `POST /api/v1/Products` - Create new product
- `GET /api/v1/Products/{id}` - Get specific product
- `PUT /api/v1/Products/{id}` - Update product
- `DELETE /api/v1/Products/{id}` - Delete product

### Cart
- `GET /api/v1/Cart/user/{userId}` - Get user's cart
- `GET /api/v1/Cart/guest/{token}` - Get guest cart
- `POST /api/v1/Cart/{id}/items` - Add item to cart
- `PUT /api/v1/Cart/items/{itemId}` - Update cart item
- `DELETE /api/v1/Cart/items/{itemId}` - Remove from cart

### Wishlist
- `GET /api/v1/Wishlist/{userId}` - Get user's wishlist
- `POST /api/v1/Wishlist` - Add to wishlist
- `DELETE /api/v1/Wishlist/{userId}/{productId}` - Remove from wishlist
- `GET /api/v1/Wishlist/check/{userId}/{productId}` - Check if in wishlist

### Orders
- `GET /api/v1/Orders` - List orders
- `POST /api/v1/Orders` - Create new order
- `GET /api/v1/Orders/{id}` - Get specific order
- `PUT /api/v1/Orders/{id}/status` - Update order status
- `DELETE /api/v1/Orders/{id}` - Cancel order

### Reviews
- `GET /api/v1/Reviews/product/{productId}` - Get product reviews
- `GET /api/v1/Reviews/user/{userId}` - Get user's reviews
- `POST /api/v1/Reviews` - Create review
- `DELETE /api/v1/Reviews/{id}` - Delete review

### Custom Bat Requests
- `GET /api/v1/CustomBats` - List all requests
- `POST /api/v1/CustomBats` - Create new request
- `GET /api/v1/CustomBats/{id}` - Get specific request
- `PUT /api/v1/CustomBats/{id}` - Update request
- `DELETE /api/v1/CustomBats/{id}` - Delete request
- `PUT /api/v1/CustomBats/{id}/status` - Update status

### Health
- `GET /health` - API health check

---

## 💡 Testing Examples

### Example 1: Test Health Endpoint
1. Find the **"GET /health"** endpoint
2. Click "Try it out"
3. Click "Execute"
4. See response: `{"status":"healthy","timestamp":"2026-10-24T..."}`

### Example 2: List Products
1. Find **"GET /api/v1/Products"**
2. Click "Try it out"
3. Optional: Set `pageNumber=1`, `pageSize=10`
4. Click "Execute"
5. See response with products, total count, and pagination info

### Example 3: Create a Category
1. Find **"POST /api/v1/Categories"**
2. Click "Try it out"
3. Edit the JSON body:
   ```json
   {
     "name": "Cricket Bats",
     "slug": "cricket-bats",
     "sortOrder": 1
   }
   ```
4. Click "Execute"
5. See created category with ID assigned

---

## 🔧 Common Issues

### Q: I get 404 when opening `/swagger`
**A:** Make sure you're on the correct port (5001) and the API is running. The URL should be: `http://localhost:5001/swagger`

### Q: Endpoints return empty arrays
**A:** That's normal! The database is empty. You need to create the SQL Server database and seed test data first.

### Q: "Try it out" button doesn't work
**A:** Make sure the API is still running. Check the terminal where you ran `dotnet run`.

### Q: I want to test on different port
**A:** Change the `--urls` parameter:
```bash
dotnet run --project src/CricketBazar.API --urls http://localhost:8080
```
Then open: `http://localhost:8080/swagger`

---

## 📖 API Response Format

### Paginated Response (Products, Orders, etc.)
```json
{
  "items": [
    {
      "id": 1,
      "name": "Product Name",
      ...
    }
  ],
  "totalCount": 100,
  "pageNumber": 1,
  "pageSize": 20
}
```

### Single Item Response
```json
{
  "id": 1,
  "name": "Cricket Bat",
  "slug": "cricket-bat",
  ...
}
```

### Error Response
```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "traceId": "...",
  "errors": {
    "Name": ["Name is required"]
  }
}
```

---

## 🚀 You're All Set!

Your API is fully documented and ready to test. Just:
1. Run the startup command
2. Open Swagger UI
3. Click "Try it out" on any endpoint
4. Test your API!

**Happy coding!** 🎯
