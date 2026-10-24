# Cricket Bazar API - Project Structure

## Directory Layout

```
CricketBazar/Backend/
├── src/
│   ├── CricketBazar.API/                          (REST API Layer)
│   │   ├── Controllers/
│   │   │   ├── ProductsController.cs              (8 endpoints)
│   │   │   ├── CategoriesController.cs            (5 endpoints)
│   │   │   ├── BrandsController.cs                (5 endpoints)
│   │   │   ├── ReviewsController.cs               (4 endpoints)
│   │   │   ├── WishlistController.cs              (4 endpoints)
│   │   │   ├── CartController.cs                  (6 endpoints)
│   │   │   ├── OrdersController.cs                (6 endpoints)
│   │   │   └── CustomBatRequestsController.cs     (6 endpoints)
│   │   ├── Program.cs                             (Configuration & DI setup)
│   │   ├── appsettings.json                       (Default settings)
│   │   ├── appsettings.Development.json           (Dev settings)
│   │   ├── CricketBazar.API.csproj
│   │   └── launchSettings.json
│   │
│   ├── CricketBazar.Application/                  (Business Logic Layer)
│   │   ├── Commands/
│   │   │   ├── Products/
│   │   │   │   ├── ProductCommands.cs
│   │   │   │   └── ProductCommandHandlers.cs
│   │   │   └── Categories/
│   │   │       ├── CategoryCommands.cs
│   │   │       └── CategoryCommandHandlers.cs
│   │   ├── Queries/
│   │   │   ├── Products/
│   │   │   │   ├── ProductQueries.cs
│   │   │   │   └── ProductQueryHandlers.cs
│   │   │   └── Categories/
│   │   │       ├── CategoryQueries.cs
│   │   │       └── CategoryQueryHandlers.cs
│   │   ├── DTOs/
│   │   │   ├── ProductDto.cs                      (30+ DTOs for all entities)
│   │   │   ├── CategoryDto.cs
│   │   │   ├── BrandDto.cs
│   │   │   ├── ReviewDto.cs
│   │   │   ├── UserDto.cs
│   │   │   ├── CartDto.cs
│   │   │   ├── OrderDto.cs
│   │   │   ├── WishlistDto.cs
│   │   │   ├── AddressDto.cs
│   │   │   ├── PaymentDto.cs
│   │   │   ├── CustomBatRequestDto.cs
│   │   │   └── PaginationDto.cs
│   │   ├── Mappings/
│   │   │   └── MappingProfile.cs                  (AutoMapper configuration)
│   │   ├── ApplicationServiceExtensions.cs        (DI Registration)
│   │   └── CricketBazar.Application.csproj
│   │
│   ├── CricketBazar.Infrastructure/               (Data Access Layer)
│   │   ├── Data/
│   │   │   └── ApplicationDbContext.cs            (EF Core DbContext with all configs)
│   │   ├── Repositories/
│   │   │   ├── BaseRepository.cs                  (Generic repository base)
│   │   │   ├── ProductRepository.cs               (Advanced product queries)
│   │   │   ├── CategoryRepository.cs
│   │   │   ├── BrandRepository.cs
│   │   │   ├── ReviewRepository.cs
│   │   │   ├── UserRepository.cs
│   │   │   ├── CartRepository.cs
│   │   │   ├── OrderRepository.cs
│   │   │   ├── WishlistRepository.cs
│   │   │   ├── CustomBatRequestRepository.cs
│   │   │   └── RepositoryImplementations.cs       (Repository aggregates)
│   │   ├── InfrastructureServiceExtensions.cs     (DI Registration)
│   │   └── CricketBazar.Infrastructure.csproj
│   │
│   ├── CricketBazar.Domain/                       (Core Business Logic)
│   │   ├── Entities/
│   │   │   ├── Product.cs
│   │   │   ├── Category.cs
│   │   │   ├── Brand.cs
│   │   │   ├── ProductImage.cs
│   │   │   ├── ProductAttribute.cs
│   │   │   ├── ProductVariant.cs
│   │   │   ├── Review.cs
│   │   │   ├── User.cs
│   │   │   ├── Address.cs
│   │   │   ├── Cart.cs
│   │   │   ├── CartItem.cs
│   │   │   ├── Order.cs
│   │   │   ├── OrderItem.cs
│   │   │   ├── Payment.cs
│   │   │   ├── Wishlist.cs
│   │   │   └── CustomBatRequest.cs
│   │   ├── Interfaces/
│   │   │   ├── IProductRepository.cs
│   │   │   ├── ICategoryRepository.cs
│   │   │   ├── IBrandRepository.cs
│   │   │   ├── IReviewRepository.cs
│   │   │   ├── IUserRepository.cs
│   │   │   ├── ICartRepository.cs
│   │   │   ├── IOrderRepository.cs
│   │   │   ├── IWishlistRepository.cs
│   │   │   ├── ICustomBatRequestRepository.cs
│   │   │   └── IRepository.cs                     (Generic interface)
│   │   └── CricketBazar.Domain.csproj
│   │
│   └── CricketBazar.Shared/                       (Shared Utilities)
│       ├── Constants/
│       │   ├── ApiConstants.cs
│       │   └── ValidationConstants.cs
│       ├── Exceptions/
│       │   ├── NotFoundException.cs
│       │   ├── ValidationException.cs
│       │   └── BusinessException.cs
│       ├── Responses/
│       │   ├── ApiResponse.cs
│       │   └── ApiResponseT.cs
│       └── CricketBazar.Shared.csproj
│
├── tests/                                         (Test Projects)
│   ├── CricketBazar.Tests.Unit/
│   │   ├── Repositories/
│   │   ├── Services/
│   │   └── CricketBazar.Tests.Unit.csproj
│   ├── CricketBazar.Tests.Integration/
│   │   ├── Controllers/
│   │   └── CricketBazar.Tests.Integration.csproj
│   └── CricketBazar.Tests.API/
│       ├── Endpoints/
│       └── CricketBazar.Tests.API.csproj
│
├── Database/
│   ├── Schema.sql                                 (Complete SQL schema with 14 tables)
│   └── SeedData.sql                               (Optional: Sample data)
│
├── Documentation/
│   ├── QUICK_START.md                             (Setup & running guide)
│   ├── API_DOCUMENTATION.md                       (Complete API reference)
│   ├── IMPLEMENTATION_SUMMARY.md                  (Architecture details)
│   ├── PROJECT_CHECKLIST.md                       (Implementation status)
│   └── PROJECT_STRUCTURE.md                       (This file)
│
├── API_TESTING.http                               (REST Client test file)
├── DELIVERY_SUMMARY.md                            (Project completion summary)
├── CricketBazar.sln                               (Solution file)
└── .gitignore                                     (Git ignore rules)
```

## Layer Descriptions

### 🎯 API Layer (CricketBazar.API)
**Purpose**: HTTP request handling and REST endpoints
- **Controllers**: Handle HTTP requests/responses
- **Program.cs**: Application startup and configuration
- **appsettings.json**: Configuration (DB connection, logging)
- **Responsibilities**:
  - Receive HTTP requests
  - Call MediatR handlers
  - Return HTTP responses with proper status codes
  - Handle CORS and middleware

### 📊 Application Layer (CricketBazar.Application)
**Purpose**: Business logic and data transformation
- **Commands**: Write operations (Create, Update, Delete)
- **Queries**: Read operations
- **DTOs**: Data transfer objects for API contracts
- **Mappings**: AutoMapper configuration (Entity ↔ DTO)
- **Responsibilities**:
  - Validate business rules
  - Transform entities to/from DTOs
  - Orchestrate business operations
  - No database access (via repositories)

### 🔧 Infrastructure Layer (CricketBazar.Infrastructure)
**Purpose**: Data access and external systems
- **DbContext**: Entity Framework Core configuration
- **Repositories**: Database operations
- **Responsibilities**:
  - Execute database queries
  - Handle EF Core configuration
  - Manage database connections
  - Only accessed via interfaces

### 📚 Domain Layer (CricketBazar.Domain)
**Purpose**: Core business models and contracts
- **Entities**: Database models matching schema
- **Interfaces**: Repository contracts
- **Responsibilities**:
  - Define entity models
  - Define repository interfaces
  - No external dependencies
  - Pure business logic

### 🛠️ Shared Layer (CricketBazar.Shared)
**Purpose**: Common utilities and exceptions
- **Constants**: API and validation constants
- **Exceptions**: Custom exception types
- **Responses**: Standard API response wrappers
- **Responsibilities**:
  - Provide common utilities
  - Define exception types
  - Standard response formats

## Dependency Flow

```
HTTP Request
    ↓
API Layer (Controllers)
    ↓
Application Layer (MediatR Queries/Commands)
    ↓
Infrastructure Layer (Repositories)
    ↓
Domain Layer (Entities)
    ↓
Database (SQL Server)
```

## Data Flow Example: Get Product

1. **Request**: `GET /api/v1/products/123`
2. **ProductsController**: Receives request → Creates `GetProductByIdQuery(123)` → Sends to MediatR
3. **ProductQueryHandler**: Handles query → Calls `productRepository.GetByIdAsync(123)`
4. **ProductRepository**: Executes `context.Products.Include(...).FirstOrDefaultAsync()`
5. **EF Core**: Translates to SQL → Executes on SQL Server
6. **Database**: Returns Product entity
7. **ProductRepository**: Returns to handler
8. **ProductQueryHandler**: Maps Product → ProductDto using AutoMapper
9. **Controller**: Returns `Ok(productDto)` → HTTP 200 with JSON

## Important Files

### Configuration
- **Program.cs**: DI, middleware, services registration
- **appsettings.Development.json**: Local configuration
- **launchSettings.json**: Debug/run profiles

### Database
- **ApplicationDbContext.cs**: EF Core configuration (relationships, indices, constraints)
- **Schema.sql**: SQL creation script for manual setup

### Entity Models
- **Product.cs**: Central entity with all fields and relationships
- **Category.cs**: Hierarchical categories
- **Order.cs**: Order management
- **User.cs**: User profiles

### Key Repositories
- **ProductRepository.cs**: Advanced search, filtering, sorting
- **BaseRepository.cs**: Generic CRUD operations

### API Contracts
- **ProductDto.cs**: 30+ DTOs for all operations
- **MappingProfile.cs**: AutoMapper configuration

## Testing Structure

```
Tests/
├── Unit Tests
│   └── Test individual services/repositories in isolation
├── Integration Tests
│   └── Test multiple layers together with test database
└── API Tests
    └── Test actual HTTP endpoints
```

## Code Organization Principles

### Namespaces
- Follow folder structure: `CricketBazar.Domain.Entities`, `CricketBazar.Application.DTOs`
- Group by feature: `ProductCommands`, `ProductQueries`, `ProductRepository`

### Naming Conventions
- **Classes**: PascalCase (`ProductRepository`)
- **Methods**: PascalCase (`GetByIdAsync`)
- **Properties**: PascalCase (`ProductId`)
- **Private fields**: camelCase with underscore (`_logger`)
- **Constants**: UPPER_CASE or PascalCase (`ApiConstants.ApiVersion`)
- **DTOs**: Suffixed with Dto (`ProductDto`)
- **Queries**: Suffixed with Query (`GetProductByIdQuery`)
- **Commands**: Suffixed with Command (`CreateProductCommand`)
- **Handlers**: Suffixed with Handler (`GetProductByIdQueryHandler`)

### File Organization
- One class per file (with rare exceptions for small related classes)
- File name matches class name
- Logical grouping in folders by feature/type

## Entity Relationships

```
Category (1) ←→ (Many) Product
Brand (1) ←→ (Many) Product
Product (1) ←→ (Many) ProductImage
Product (1) ←→ (Many) ProductAttribute
Product (1) ←→ (Many) ProductVariant
Product (1) ←→ (Many) Review
Product (1) ←→ (Many) Wishlist
User (1) ←→ (Many) Review
User (1) ←→ (Many) Address
User (1) ←→ (Many) Cart
Cart (1) ←→ (Many) CartItem
CartItem (Many) ←→ (1) Product
CartItem (Many) ←→ (1) ProductVariant
User (1) ←→ (Many) Order
Order (1) ←→ (Many) OrderItem
OrderItem (Many) ←→ (1) Product
Order (1) ←→ (1) Payment
OrderItem (Many) ←→ (1) ProductVariant
User (1) ←→ (Many) CustomBatRequest
```

## Build & Run

### Prerequisites
```bash
dotnet --version                    # Should show .NET 10.x
```

### Build
```bash
cd Backend
dotnet build                        # Build all projects
```

### Run API
```bash
cd Backend/src/CricketBazar.API
dotnet run                          # Starts on https://localhost:5001
```

### Browse
- API: http://localhost:5000
- Swagger: http://localhost:5000/swagger
- Health: http://localhost:5000/health

## Next Enhancements

1. **Authentication**: Implement JWT with identity
2. **Authorization**: Role-based access control
3. **Validation**: Add FluentValidation validators
4. **Testing**: Implement unit and integration tests
5. **Logging**: Centralize Serilog configuration
6. **Caching**: Add Redis cache layer
7. **Payment**: Integrate payment gateway
8. **Email**: Add email notification service
9. **Search**: Implement Elasticsearch
10. **Admin**: Create admin portal

---

**Total Lines of Code**: 5,000+
**Total Endpoints**: 40+
**Clean Architecture**: Fully implemented ✅

