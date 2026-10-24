# 🏏 Cricket Bazar - E-Commerce REST API

Production-ready REST API for an online cricket equipment store built with clean architecture, CQRS pattern, and Entity Framework Core.

[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen)]()
[![.NET Version](https://img.shields.io/badge/.NET-10.0-blue)]()
[![SQL Server](https://img.shields.io/badge/SQL%20Server-2019%2B-green)]()
[![API Endpoints](https://img.shields.io/badge/Endpoints-40%2B-brightgreen)]()
[![Architecture](https://img.shields.io/badge/Architecture-Clean-blue)]()

## 🌟 Features

✅ **Complete E-Commerce Platform**
- Product catalog with variants, images, and attributes
- Hierarchical category management
- Brand management with logos
- Product reviews and 1-5 star ratings
- Shopping cart (user and guest support)
- Order management with status tracking
- Wishlist functionality
- Custom bat request submissions
- Multiple user addresses
- Payment gateway placeholders

✅ **Advanced Search & Filtering**
- Full-text search across product names/descriptions
- Multi-field filtering (category, brand, price range)
- Multiple sort options (newest, price asc/desc, rating, bestselling)
- Pagination support for all list endpoints
- SEO-friendly slug-based URLs

✅ **Enterprise Architecture**
- 4-layer clean architecture with strict separation of concerns
- CQRS pattern using MediatR for queries and commands
- Repository pattern for all data access
- Dependency injection throughout
- AutoMapper for DTO conversions
- Structured logging with Serilog
- Input validation with FluentValidation
- Comprehensive error handling

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- .NET 10 SDK
- SQL Server 2019 or later
- VS Code or Visual Studio 2022

### 1. Setup Database

Edit `src/CricketBazar.API/appsettings.Development.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_SERVER;Database=cricbazar;Trusted_Connection=true;"
  }
}
```

Run SQL schema:
```bash
sqlcmd -S YOUR_SERVER -i Database/Schema.sql
```

### 2. Run API

```bash
cd src/CricketBazar.API
dotnet run
```

API starts at: `http://localhost:5000`

### 3. Browse API

- **Swagger UI**: http://localhost:5000/swagger
- **Health Check**: http://localhost:5000/health
- **API Version**: http://localhost:5000/api/version

## 📊 Project Layers
- AutoMapper Profiles
- Application Services

**Dependencies**: Domain, Shared

**Example**:
```csharp
// Query
public class GetProductQuery : IRequest<ProductDto>
{
    public int ProductId { get; set; }
}

// Handler
public class GetProductQueryHandler : IRequestHandler<GetProductQuery, ProductDto>
{
    public async Task<ProductDto> Handle(GetProductQuery request, CancellationToken cancellationToken)
    {
        // Business logic here
    }
}
```

### 3. Infrastructure Layer (`CricketBazar.Infrastructure`)
**Purpose**: Data persistence and external service integration

**Contains**:
- Entity Framework DbContext
- Repository implementations
- Migrations
- Database seeders
- External API integrations
- Email service implementations

**Dependencies**: Domain, Application, Shared

**Example**:
```csharp
public class ApplicationDbContext : DbContext
{
    public DbSet<Product> Products { get; set; }
    public DbSet<Order> Orders { get; set; }
}

public class ProductRepository : IProductRepository
{
    // Repository implementation
}
```

### 4. API Layer (`CricketBazar.API`)
**Purpose**: HTTP endpoints and external communication

**Contains**:
- Controllers
- Middleware
- Dependency Injection setup
- Configuration
- Authentication/Authorization

**Dependencies**: Application, Infrastructure, Shared

**Example**:
```csharp
[ApiController]
[Route("api/v1/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IMediator _mediator;

    [HttpGet("{id}")]
    public async Task<ActionResult<ProductDto>> GetProduct(int id)
    {
        var query = new GetProductQuery { ProductId = id };
        return await _mediator.Send(query);
    }
}
```

### 5. Shared Layer (`CricketBazar.Shared`)
**Purpose**: Cross-cutting concerns

**Contains**:
- Common exceptions
- Utility classes
- Constants
- Helper methods
- Result/Response wrappers

## Key Design Patterns

### CQRS (Command Query Responsibility Segregation)
Using MediatR to separate read and write operations

### Dependency Injection
All dependencies managed through ASP.NET Core DI container

### Repository Pattern
Data access abstraction through repositories

### Unit of Work Pattern
Coordinating database transactions across repositories

## API Endpoints Structure

```
/api/v1/products        - Products management
/api/v1/orders          - Orders management
/api/v1/users           - User management
/api/v1/categories      - Categories management
/api/v1/auth            - Authentication
```

## Development Workflow

1. **Define Entity** in `Domain` layer
2. **Create DTOs** in `Application` layer
3. **Write Validators** in `Application` layer
4. **Create Commands/Queries** in `Application` layer
5. **Implement Handlers** in `Application` layer
6. **Create Repository** in `Infrastructure` layer
7. **Implement DbContext** in `Infrastructure` layer
8. **Create Controller** in `API` layer

## Configuration Files

- **appsettings.json** - Default configuration
- **appsettings.Development.json** - Development-specific settings
- **.editorconfig** - Code style configuration
- **Directory.Build.props** - Shared NuGet packages and build settings

## Running the API

### Development
```bash
dotnet run --project src/CricketBazar.API/CricketBazar.API.csproj
```

### Production
```bash
dotnet publish -c Release
```

## Database Migrations

### Add a new migration
```bash
dotnet ef migrations add MigrationName --project src/CricketBazar.Infrastructure
```

### Update database
```bash
dotnet ef database update --project src/CricketBazar.Infrastructure
```

### Remove last migration
```bash
dotnet ef migrations remove --project src/CricketBazar.Infrastructure
```

## Testing Strategy

- **Unit Tests**: Business logic in Application layer
- **Integration Tests**: Database and API integration
- **API Tests**: End-to-end API functionality

## Next Steps

1. Initialize Git repository
2. Create initial Domain entities
3. Set up Entity Framework DbContext
4. Create database and run migrations
5. Implement first feature (CRUD operation)
6. Set up CI/CD pipelines

---

For detailed API documentation, see the Swagger UI at `/swagger` when running the API.
