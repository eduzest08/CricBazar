# Cricket Bazar API - Quick Start Guide

## 🚀 Getting Started

This is a complete e-commerce API for cricket equipment built with .NET 10, following clean architecture principles.

## ✅ What Has Been Implemented

### ✨ Complete Feature Set
- ✅ **Products** - Full CRUD with search, filtering, variants, and images
- ✅ **Categories** - Hierarchical structure with parent-child relationships  
- ✅ **Brands** - Brand management with logo support
- ✅ **Reviews & Ratings** - 1-5 star reviews with comments
- ✅ **Shopping Cart** - User and guest carts with variant support
- ✅ **Orders** - Order management with status tracking
- ✅ **Wishlist** - User wishlists with add/remove
- ✅ **Custom Bat Requests** - Custom product specification submissions
- ✅ **User Management** - User profiles and multiple addresses

### 🏗️ Architecture
- ✅ Clean Architecture (4-layer separation)
- ✅ MediatR for CQRS pattern
- ✅ AutoMapper for DTO conversions
- ✅ Entity Framework Core with advanced configurations
- ✅ Comprehensive repository pattern
- ✅ Dependency Injection setup
- ✅ Swagger/OpenAPI documentation

### 🔧 Technical Stack
- .NET 10 SDK
- Entity Framework Core 9.0
- SQL Server 2019+
- MediatR 12.2.0
- AutoMapper 13.0.1
- FluentValidation 11.9.0
- Serilog for logging

## 📋 Prerequisites

1. **Install .NET 10 SDK**
   ```bash
   dotnet --version
   ```

2. **SQL Server 2019 or later**
   - Local installation or Azure SQL Database
   - SQL Server Management Studio (optional but recommended)

3. **Visual Studio Code or Visual Studio 2022**

## 🔌 Connection String Setup

Update the `appsettings.Development.json` in the CricketBazar.API project:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_SERVER;Database=cricbazar;Trusted_Connection=true;TrustServerCertificate=true;Encrypt=false;"
  }
}
```

### Examples:
- **Local SQL Server:**
  ```
  Server=(localdb)\\mssqllocaldb;Database=cricbazar;Trusted_Connection=true;
  ```
- **SQL Server Express:**
  ```
  Server=.\\SQLEXPRESS;Database=cricbazar;Trusted_Connection=true;
  ```
- **Docker SQL Server:**
  ```
  Server=127.0.0.1,1433;Database=cricbazar;User Id=sa;Password=YourPassword123!;
  ```

## 🗄️ Database Setup

### 1. Create Database Using SQL Script

Run the SQL schema provided in `/Backend/Database/` folder to create tables with proper indices and constraints.

### 2. Using Entity Framework Migrations (Future)

```bash
cd Backend/src/CricketBazar.Infrastructure
dotnet ef database update -s ../CricketBazar.API
```

## ▶️ Running the Application

### Option 1: Using dotnet CLI

```bash
cd Backend/src/CricketBazar.API
dotnet run
```

The API will start on: `https://localhost:5001` or `http://localhost:5000`

### Option 2: Using Visual Studio

1. Open `CricketBazar.sln` in Visual Studio 2022
2. Set `CricketBazar.API` as startup project
3. Press `F5` or click Run

### Option 3: Using VS Code

```bash
cd Backend
code .
# Install C# extension if prompted
# F5 to debug
```

## 📚 API Documentation

### Swagger UI
Once running, visit: `http://localhost:5000/swagger`

### Manual Testing
Use the provided `API_TESTING.http` file:
- Open in VS Code with REST Client extension
- Or import into Postman

## 📋 API Endpoints Summary

### Products (8 endpoints)
```
GET    /api/v1/products                    - List all with filters
GET    /api/v1/products/{id}              - Get by ID
GET    /api/v1/products/slug/{slug}       - Get by slug
POST   /api/v1/products                   - Create (Admin)
PUT    /api/v1/products/{id}              - Update (Admin)
DELETE /api/v1/products/{id}              - Delete (Admin)
POST   /api/v1/products/{id}/images       - Add image
POST   /api/v1/products/{id}/variants     - Add variant
```

### Categories (5 endpoints)
```
GET    /api/v1/categories                 - List with hierarchy
GET    /api/v1/categories/{id}           - Get by ID
GET    /api/v1/categories/slug/{slug}    - Get by slug
POST   /api/v1/categories                 - Create
PUT    /api/v1/categories/{id}           - Update
DELETE /api/v1/categories/{id}           - Delete
```

### Brands (5 endpoints)
```
GET    /api/v1/brands                    - List all
GET    /api/v1/brands/{id}              - Get by ID
GET    /api/v1/brands/slug/{slug}       - Get by slug
POST   /api/v1/brands                   - Create
PUT    /api/v1/brands/{id}              - Update
DELETE /api/v1/brands/{id}              - Delete
```

### Reviews (4 endpoints)
```
GET    /api/v1/reviews/product/{id}     - Product reviews
GET    /api/v1/reviews/user/{id}        - User reviews
POST   /api/v1/reviews                  - Create review
DELETE /api/v1/reviews/{id}             - Delete review
```

### Wishlist (4 endpoints)
```
GET    /api/v1/wishlist/user/{id}                    - Get wishlist
GET    /api/v1/wishlist/user/{id}/product/{pid}     - Check product
POST   /api/v1/wishlist/user/{id}/product/{pid}     - Add to wishlist
DELETE /api/v1/wishlist/user/{id}/product/{pid}     - Remove from wishlist
```

### Cart (6 endpoints)
```
GET    /api/v1/cart/user/{id}                      - Get user cart
GET    /api/v1/cart/guest/{token}                  - Get guest cart
POST   /api/v1/cart/user/{id}/items               - Add to cart
PUT    /api/v1/cart/items/{id}                     - Update quantity
DELETE /api/v1/cart/items/{id}                     - Remove from cart
DELETE /api/v1/cart/user/{id}                      - Clear cart
```

### Orders (6 endpoints)
```
GET    /api/v1/orders/user/{id}         - User's orders
GET    /api/v1/orders/{id}             - Get order
GET    /api/v1/orders/number/{no}      - Get by order number
POST   /api/v1/orders/user/{id}        - Create order
PUT    /api/v1/orders/{id}/status      - Update status (Admin)
POST   /api/v1/orders/{id}/cancel      - Cancel order
```

### Custom Bat Requests (6 endpoints)
```
GET    /api/v1/custombatrequests/user/{id}          - User requests
GET    /api/v1/custombatrequests/{id}              - Get request
POST   /api/v1/custombatrequests                   - Create request
PUT    /api/v1/custombatrequests/{id}/status      - Update status (Admin)
DELETE /api/v1/custombatrequests/{id}             - Delete request
GET    /api/v1/custombatrequests/admin/pending    - Pending requests (Admin)
```

## 🧪 Testing

### Using REST Client Extension (VS Code)
1. Install "REST Client" extension
2. Open `API_TESTING.http`
3. Click "Send Request" on each endpoint
4. Review responses

### Using Postman
1. Import the collection from `API_TESTING.http`
2. Update variables (userId, productId, etc.)
3. Test each endpoint

### Using curl
```bash
# Get products
curl http://localhost:5000/api/v1/products

# Get health status
curl http://localhost:5000/health

# Get API version
curl http://localhost:5000/api/version
```

## 📊 Database Schema

Key tables (14 total):
- Categories (hierarchical)
- Brands
- Products (with computed discount)
- ProductImages
- ProductAttributes
- ProductVariants (size, color, hand, price override)
- Reviews (ratings)
- Users
- Addresses (multiple per user)
- Carts & CartItems
- Orders & OrderItems
- Payments
- Wishlists
- CustomBatRequests

All properly indexed for performance and referential integrity enforced.

## 🔐 Security Considerations

### Current
- Input validation on all endpoints
- Proper error handling
- CORS configured for frontend

### To Implement
- JWT authentication
- Role-based authorization (Admin, Customer)
- Password hashing
- Rate limiting
- API key validation
- HTTPS enforcement in production

## 🚀 Deployment

### Docker
```bash
cd Backend
docker-compose up
```

### Azure
1. Create Azure SQL Database
2. Update connection string
3. Deploy App Service
4. Configure environment variables

### On-Premises
1. Install .NET 10 Runtime
2. Update connection string for production SQL Server
3. Configure IIS with Application Pool
4. Enable HTTPS with SSL certificate

## 📝 Logging

Logs are configured with Serilog:
- Console output (development)
- File output: `logs/app-{date}.txt`
- Structured logging with correlation IDs
- Configurable log levels

## 📖 Documentation Files

- `API_DOCUMENTATION.md` - Complete API reference
- `API_TESTING.http` - REST client test file
- `IMPLEMENTATION_SUMMARY.md` - Architecture and implementation details

## ❓ Troubleshooting

### Connection String Issues
```
Error: "Login failed for user"
→ Check SQL Server credentials and database name
```

### Package Resolution Errors
```
dotnet restore
```

### Build Errors
```
dotnet clean
dotnet build
```

### Port Already in Use
```
The default port is 5000/5001. 
Change in launchSettings.json if needed.
```

## 🎯 Next Steps

1. ✅ Review `API_DOCUMENTATION.md` for full endpoint reference
2. ✅ Test endpoints using `API_TESTING.http`
3. ✅ Review database schema in `ApplicationDbContext.cs`
4. ✅ Implement authentication system
5. ✅ Add admin panel
6. ✅ Integrate payment gateway
7. ✅ Deploy to production

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review API_DOCUMENTATION.md
3. Check Swagger UI at `/swagger`
4. Review source code comments and documentation

## 📄 License

Cricket Bazar API - All rights reserved

---

**Happy Coding! 🏏🚀**
