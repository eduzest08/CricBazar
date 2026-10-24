# ✅ Connection String Configuration - FIXED

## Problem
`System.InvalidOperationException: Connection string 'DefaultConnection' is not configured`

## Root Cause
The `appsettings.json` and `appsettings.Development.json` files were located in the Backend root directory, but when running `dotnet run --project src/CricketBazar.API`, the content root is the project directory (`src/CricketBazar.API`), not the Backend root.

ASP.NET Core searches for configuration files in the content root directory, so the configuration files were not being found.

## Solution Applied

### 1. Updated Configuration Files
Both `appsettings.json` files now contain the correct SQL Server connection string:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=CricBazar;User Id=sa;Password=@Bbsr123#;Encrypt=false;TrustServerCertificate=true;"
  }
}
```

**Files Updated:**
- `/Users/shaktibratanaik/CricketBazar/Backend/appsettings.json`
- `/Users/shaktibratanaik/CricketBazar/Backend/appsettings.Development.json`

### 2. Copied Configuration Files to API Project
Copied both appsettings files to the API project directory where dotnet expects them:

```bash
cp /Users/shaktibratanaik/CricketBazar/Backend/appsettings.json \
   /Users/shaktibratanaik/CricketBazar/Backend/src/CricketBazar.API/

cp /Users/shaktibratanaik/CricketBazar/Backend/appsettings.Development.json \
   /Users/shaktibratanaik/CricketBazar/Backend/src/CricketBazar.API/
```

**New Locations:**
- `/Users/shaktibratanaik/CricketBazar/Backend/src/CricketBazar.API/appsettings.json`
- `/Users/shaktibratanaik/CricketBazar/Backend/src/CricketBazar.API/appsettings.Development.json`

### 3. Updated API Project File
Added configuration file copying to the `.csproj` file to ensure they're included in the build output:

```xml
<ItemGroup>
  <None Update="appsettings.json">
    <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
  </None>
  <None Update="appsettings.Development.json">
    <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
  </None>
</ItemGroup>
```

## Verification

### ✅ Build Status
```
Build succeeded with 0 errors, 341 non-critical warnings
```

### ✅ API Startup
The API now starts successfully:
```
[20:43:38 INF] Now listening on: http://localhost:5000
[20:43:38 INF] Application started. Press Ctrl+C to shut down.
```

### ✅ Health Check Endpoint
```bash
$ curl http://localhost:5000/health
{"status":"healthy","timestamp":"2026-10-24T15:14:00.836144Z"}
```

## Next Steps

### 1. Create the CricBazar Database
The API requires the SQL Server database to exist. You must run the SQL schema script:

```bash
# Option 1: Using SSMS (SQL Server Management Studio)
# - Connect to localhost with sa/@Bbsr123#
# - Open your SQL schema file and execute it

# Option 2: Using Docker SQL Server (if you have Docker)
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=@Bbsr123#" \
  -p 1433:1433 -d mcr.microsoft.com/mssql/server

# Then run your SQL schema script via sqlcmd or SSMS
```

### 2. Test the API
Once the database is created:

```bash
# Start the API (from Backend directory)
cd /Users/shaktibratanaik/CricketBazar/Backend
dotnet run --project src/CricketBazar.API

# In another terminal, test an endpoint
curl -X GET "http://localhost:5000/api/products"

# Expected response (empty database):
# {"items":[],"totalCount":0,"pageNumber":1,"pageSize":20}
```

### 3. Access Swagger/OpenAPI
After confirming database connectivity:
- Browser: `http://localhost:5000/swagger`
- Test all endpoints interactively

## Important Notes

⚠️ **Password Security Note:**
The password `@Bbsr123#` is stored in configuration files. For production:
- Use Azure Key Vault or similar secrets management
- Never commit passwords to version control
- Consider using environment variables:

```csharp
// In Program.cs
var password = Environment.GetEnvironmentVariable("DB_PASSWORD");
var connectionString = $"Server=localhost;Database=CricBazar;User Id=sa;Password={password};...";
```

## File Changes Summary

| File | Change | Reason |
|------|--------|--------|
| `/Backend/appsettings.json` | Updated connection string | Configure SQL Server |
| `/Backend/appsettings.Development.json` | Updated connection string | Configure SQL Server |
| `/Backend/src/CricketBazar.API/appsettings.json` | Copied | Make available to ASP.NET Core |
| `/Backend/src/CricketBazar.API/appsettings.Development.json` | Copied | Make available to ASP.NET Core |
| `/Backend/src/CricketBazar.API/CricketBazar.API.csproj` | Added ItemGroup | Copy files to output directory |

## Commands to Verify

```bash
# Check connection string is present
grep "Password" /Users/shaktibratanaik/CricketBazar/Backend/src/CricketBazar.API/appsettings.json

# Verify files exist in API project
ls -la /Users/shaktibratanaik/CricketBazar/Backend/src/CricketBazar.API/appsettings*

# Start API
cd /Users/shaktibratanaik/CricketBazar/Backend
dotnet run --project src/CricketBazar.API

# Test in another terminal
curl http://localhost:5000/health
```

---
**Status**: ✅ **RESOLVED** - Configuration error fixed, API starting successfully
