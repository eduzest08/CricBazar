# Cricket Bazar - Quick Reference Card

## 📍 Project Location
```bash
~/CricketBazar/
```

## 🚀 Quick Start Commands

### Initialize & Build
```bash
cd ~/CricketBazar/Backend
dotnet restore
dotnet build
```

### Run API
```bash
dotnet run --project src/CricketBazar.API/CricketBazar.API.csproj
```
🌐 API: http://localhost:5000 (or https://localhost:7000)
📖 Swagger: http://localhost:5000/swagger

### Database
```bash
# Start SQL Server
docker-compose up -d

# Apply migrations
dotnet ef database update

# Add new migration
dotnet ef migrations add MigrationName --project src/CricketBazar.Infrastructure
```

### Testing
```bash
# Run all tests
dotnet test

# Run specific test project
dotnet test tests/CricketBazar.Tests.Unit/
```

## 📁 Key Directories

| Path | Purpose |
|------|---------|
| `Backend/src/CricketBazar.Domain/` | Business entities & interfaces |
| `Backend/src/CricketBazar.Application/` | Use cases, DTOs, validators |
| `Backend/src/CricketBazar.Infrastructure/` | Database, repositories |
| `Backend/src/CricketBazar.API/` | REST API, controllers |
| `Backend/tests/` | Unit, integration, API tests |

## 🔧 Solution Structure

```
CricketBazar.sln
├── src
│   ├── CricketBazar.Domain
│   ├── CricketBazar.Application
│   ├── CricketBazar.Infrastructure
│   ├── CricketBazar.Shared
│   └── CricketBazar.API
└── tests
    ├── CricketBazar.Tests.Unit
    ├── CricketBazar.Tests.Integration
    └── CricketBazar.Tests.API
```

## 📦 Project Dependencies Flow

```
CricketBazar.API
  ├── depends on → CricketBazar.Application
  │                   ├── depends on → CricketBazar.Domain
  │                   └── depends on → CricketBazar.Shared
  ├── depends on → CricketBazar.Infrastructure
  │                   ├── depends on → CricketBazar.Domain
  │                   ├── depends on → CricketBazar.Application
  │                   └── depends on → CricketBazar.Shared
  └── depends on → CricketBazar.Shared

✓ Domain layer has NO external dependencies
✓ Application depends only on Domain & Shared
✓ Infrastructure depends on Domain & Application
✓ API depends on all layers
```

## 🛠️ Common Development Tasks

### Add New Entity
1. Create class in `Domain/Entities/`
2. Add `DbSet<Entity>` to `ApplicationDbContext`
3. Create migration: `dotnet ef migrations add AddEntity --project src/CricketBazar.Infrastructure`
4. Update database: `dotnet ef database update`

### Add New API Endpoint
1. Create Command/Query in `Application/Commands/` or `Queries/`
2. Create Handler in same folder
3. Create DTO in `Application/DTOs/`
4. Create Controller in `API/Controllers/`
5. Register in MediatR (already done in `ApplicationServiceExtensions`)

### Add Validation
1. Create Validator in `Application/Validators/`
2. Implement `AbstractValidator<T>` from FluentValidation
3. Validator auto-discovered by `FluentValidation.DependencyInjectionExtensions`

## 🗄️ Connection Strings

**Development (SQLite)**
```
Server=(localdb)\mssqllocaldb;Database=CricketBazar;Trusted_Connection=true;
```

**Development (Docker SQL Server)**
```
Server=localhost,1433;Database=CricketBazar_Dev;User Id=sa;Password=YourPassword123!;
```

**Production**
```
Server=your-server;Database=CricketBazar_Prod;User Id=sa;Password=<secure-password>;
```

## 🔍 Architecture Principles

| Principle | Implementation |
|-----------|-----------------|
| **Single Responsibility** | Each layer has one job |
| **Dependency Inversion** | Depend on abstractions, not implementations |
| **Don't Repeat Yourself** | BaseRepository, Shared utilities |
| **Explicit Dependencies** | Constructor injection, no magic |
| **Separation of Concerns** | Each layer isolated |

## 📊 Current Features

✅ Clean Architecture setup
✅ CQRS pattern ready (MediatR)
✅ Entity Framework Core configured
✅ SQL Server support
✅ Logging setup (Serilog)
✅ Authentication structure
✅ Validation framework
✅ Object mapping (AutoMapper)
✅ Test projects ready
✅ API documentation (Swagger)

## 🔐 Security Checklist

- [ ] Update JWT secret key in `appsettings.json`
- [ ] Configure CORS properly for your domain
- [ ] Enable HTTPS in production
- [ ] Use environment variables for sensitive data
- [ ] Implement authentication middleware
- [ ] Add authorization policies
- [ ] SQL Server firewall rules
- [ ] Regular security updates

## 📝 Important Files

- **Program.cs** - API startup & configuration
- **ApplicationDbContext.cs** - Database models & relationships
- **appsettings.json** - Configuration
- **CricketBazar.sln** - Solution file (open in Visual Studio)
- **Directory.Build.props** - Shared build settings

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Run `dotnet clean` then `dotnet restore` |
| DB migration error | Delete Migrations folder & recreate |
| Port already in use | Change port in `launchSettings.json` |
| Package not found | Update NuGet: `dotnet nuget locals all --clear` |
| EF Core error | Ensure migrations are up to date |

## 📞 Useful Resources

- [Clean Architecture Guide](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [CQRS Pattern](https://martinfowler.com/bliki/CQRS.html)
- [Entity Framework Core Docs](https://docs.microsoft.com/en-us/ef/core/)
- [MediatR Documentation](https://github.com/jbogard/MediatR)
- [ASP.NET Core Documentation](https://docs.microsoft.com/en-us/aspnet/core/)

## 🎯 Next Development Goals

1. Implement Product CRUD operations
2. Add authentication & authorization
3. Create order management system
4. Implement payment processing
5. Build Angular frontend
6. Set up CI/CD pipelines
7. Deploy to cloud (Azure/AWS)

---

**Quick Help**: Open `SETUP_GUIDE.md` for detailed instructions
**Architecture Guide**: See `Backend/README.md`
**Project Structure**: Check `STRUCTURE.txt`

**Created**: 2026-10-24 | **Version**: 1.0.0
