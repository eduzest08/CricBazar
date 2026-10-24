# Cricket Bazar - Setup & Development Guide

## 📋 Project Overview

**Cricket Bazar** is a clean architecture-based e-commerce platform for cricket equipment.

- **Backend**: .NET 10 REST API
- **Frontend**: Angular
- **Database**: SQL Server 2022
- **Architecture**: Clean Architecture with CQRS pattern

## 🏗️ Architecture Layers

```
┌─────────────────────────────────────────────────────┐
│  CricketBazar.API (Controllers, Routes, Config)     │
├─────────────────────────────────────────────────────┤
│  CricketBazar.Application (Use Cases, DTOs)         │
├─────────────────────────────────────────────────────┤
│  CricketBazar.Infrastructure (DbContext, Repos)     │
├─────────────────────────────────────────────────────┤
│  CricketBazar.Domain & CricketBazar.Shared          │
│  (Entities, Interfaces, Constants, Utilities)       │
└─────────────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer | Purpose | Contains |
|-------|---------|----------|
| **Domain** | Core business logic | Entities, Interfaces |
| **Application** | Use cases & orchestration | Commands, Queries, Handlers, DTOs, Validators |
| **Infrastructure** | Data persistence | DbContext, Repositories, Migrations |
| **API** | HTTP communication | Controllers, Middleware, Configuration |
| **Shared** | Cross-cutting concerns | Constants, Exceptions, Utilities |

## 📁 Directory Structure

```
CricketBazar/
├── Backend/                                 # .NET 10 API
│   ├── src/
│   │   ├── CricketBazar.Domain/            # Business entities & interfaces
│   │   │   ├── Entities/                   # Product.cs, Category.cs
│   │   │   └── Interfaces/                 # IProductRepository.cs
│   │   ├── CricketBazar.Application/       # Business logic & use cases
│   │   │   ├── DTOs/                       # ProductDto.cs
│   │   │   ├── Commands/                   # Create/Update commands
│   │   │   ├── Queries/                    # Read queries
│   │   │   ├── Validators/                 # FluentValidation rules
│   │   │   └── Mappings/                   # AutoMapper profiles
│   │   ├── CricketBazar.Infrastructure/    # Data access layer
│   │   │   ├── Data/                       # ApplicationDbContext.cs
│   │   │   └── Repositories/               # ProductRepository.cs
│   │   ├── CricketBazar.Shared/            # Shared utilities
│   │   │   ├── Constants/                  # ApiConstants.cs
│   │   │   └── Exceptions/                 # BusinessException.cs
│   │   └── CricketBazar.API/               # REST API layer
│   │       ├── Controllers/                # ProductsController.cs
│   │       ├── Middleware/                 # Custom middleware
│   │       └── Program.cs                  # Startup configuration
│   ├── tests/
│   │   ├── CricketBazar.Tests.Unit/        # Unit tests
│   │   ├── CricketBazar.Tests.Integration/ # Integration tests
│   │   └── CricketBazar.Tests.API/         # API endpoint tests
│   ├── .github/
│   │   ├── workflows/                      # CI/CD pipelines
│   │   ├── agents/                         # Custom Copilot agents
│   │   └── skills/                         # Reusable Copilot skills
│   ├── .editorconfig                       # Code style rules
│   ├── Directory.Build.props                # Shared NuGet packages
│   ├── CricketBazar.sln                    # Solution file
│   ├── appsettings.json                    # Default config
│   ├── appsettings.Development.json        # Dev config
│   └── README.md                           # Backend documentation
│
├── Frontend/                                # Angular application
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/                       # Core services & guards
│   │   │   ├── shared/                     # Shared components
│   │   │   └── modules/                    # Feature modules
│   │   ├── assets/                         # Static files
│   │   └── environments/                   # Environment configs
│   ├── angular.json                        # Angular CLI config
│   └── package.json                        # Dependencies
│
├── Database/                               # SQL Server scripts
│   ├── migrations/                         # EF Core migrations
│   ├── seeds/                              # Initial data
│   └── stored-procedures/                  # SP & views
│
├── docker-compose.yml                      # Local SQL Server
├── .gitignore                              # Git ignore rules
└── README.md                               # Main documentation
```

## 🚀 Quick Start

### 1. Prerequisites

```bash
# Check .NET version
dotnet --version  # Should be 10.0 or higher

# Check Node.js version
node --version    # Should be 18 or higher
```

### 2. Backend Setup

```bash
cd Backend

# Restore NuGet packages
dotnet restore

# Build the solution
dotnet build

# Update appsettings.Development.json with your SQL Server connection
# Then create the database
dotnet ef database update

# Run the API
dotnet run --project src/CricketBazar.API/CricketBazar.API.csproj
```

**API will run at**: `https://localhost:7000` (or `http://localhost:5000`)

**Swagger UI**: `https://localhost:7000/swagger`

### 3. Frontend Setup

```bash
cd Frontend

# Install dependencies
npm install

# Start development server
ng serve
```

**Frontend will run at**: `http://localhost:4200`

### 4. Database Setup (Docker)

```bash
# Start SQL Server using Docker
docker-compose up -d

# Connection string:
# Server=localhost,1433;Database=CricketBazar_Dev;User Id=sa;Password=YourPassword123!
```

## 📦 Key Dependencies

### Backend
- **MediatR** - CQRS pattern
- **Entity Framework Core** - ORM
- **AutoMapper** - Object mapping
- **FluentValidation** - Input validation
- **Serilog** - Structured logging

### Frontend
- **Angular 18+** - UI framework
- **RxJS** - Reactive programming
- **Angular Material** - UI components

## 🔍 Project Files Reference

### Solution File
- **CricketBazar.sln** - Contains all project references

### Project Files (.csproj)
- **CricketBazar.Domain.csproj** - No external dependencies
- **CricketBazar.Application.csproj** - Depends on Domain
- **CricketBazar.Infrastructure.csproj** - Depends on Domain & Application
- **CricketBazar.API.csproj** - Depends on all layers

### Startup Configuration
- **Program.cs** - API startup, DI container setup
- **ApplicationServiceExtensions.cs** - Application layer DI
- **InfrastructureServiceExtensions.cs** - Infrastructure layer DI

### Database
- **ApplicationDbContext.cs** - Entity Framework configuration
- **BaseRepository.cs** - Generic CRUD operations
- **ProductRepository.cs** - Product-specific data access

## 💻 Development Workflow

### Adding a New Feature

1. **Create Entity** (Domain)
   ```csharp
   public class Product { ... }
   ```

2. **Create DTOs** (Application)
   ```csharp
   public class ProductDto { ... }
   ```

3. **Create Repository Interface** (Domain)
   ```csharp
   public interface IProductRepository { ... }
   ```

4. **Implement Repository** (Infrastructure)
   ```csharp
   public class ProductRepository : IProductRepository { ... }
   ```

5. **Create MediatR Query/Command** (Application)
   ```csharp
   public class GetProductQuery : IRequest<ProductDto> { ... }
   ```

6. **Implement Handler** (Application)
   ```csharp
   public class GetProductQueryHandler : IRequestHandler<GetProductQuery, ProductDto> { ... }
   ```

7. **Create Controller** (API)
   ```csharp
   [ApiController]
   public class ProductsController : ControllerBase { ... }
   ```

8. **Add Tests** (Tests)
   - Unit tests for business logic
   - Integration tests for database
   - API tests for endpoints

## 🧪 Running Tests

```bash
cd Backend

# Run all tests
dotnet test

# Run specific test project
dotnet test tests/CricketBazar.Tests.Unit/

# Run with coverage
dotnet test /p:CollectCoverage=true
```

## 📝 Database Migrations

```bash
cd Backend

# Add a new migration
dotnet ef migrations add AddProductTable --project src/CricketBazar.Infrastructure

# Update database
dotnet ef database update

# Revert last migration
dotnet ef migrations remove
```

## 🔒 Security

- JWT authentication (configured in appsettings)
- Input validation with FluentValidation
- CORS configured for Angular frontend
- SQL injection prevention through EF Core
- HTTPS enforcement in production

## 📚 Useful Commands

```bash
# Build
dotnet build

# Run
dotnet run --project src/CricketBazar.API/CricketBazar.API.csproj

# Test
dotnet test

# Publish
dotnet publish -c Release -o ./publish

# Clean
dotnet clean
```

## 🐛 Troubleshooting

### Issue: SQL Server connection fails
- Check connection string in appsettings.Development.json
- Verify SQL Server is running (or use docker-compose)
- Ensure database exists or run migrations

### Issue: NuGet package restore fails
- Clear NuGet cache: `dotnet nuget locals all --clear`
- Try again: `dotnet restore`

### Issue: Angular build fails
- Clear node_modules: `rm -rf node_modules`
- Reinstall: `npm install`
- Clear cache: `npm cache clean --force`

## 📖 Next Steps

1. ✅ Review the folder structure
2. ✅ Set up the database
3. ✅ Run the backend API
4. ✅ Run the frontend
5. 📝 Start implementing features
6. 🧪 Add tests
7. 🔄 Set up CI/CD pipelines

## 📞 Support

For questions about:
- Clean Architecture: See `Backend/README.md`
- API Endpoints: Visit Swagger UI at `/swagger`
- Database Schema: Check `Database/` directory
- Angular Setup: See `Frontend/README.md`

---

**Last Updated**: 2026-10-24
**Project**: Cricket Bazar
**Version**: 1.0.0
