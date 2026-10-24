# 🚀 Starting the Cricket Bazar API

## Quick Start (3 Steps)

### Step 1: Navigate to Backend Directory
```bash
cd /Users/shaktibratanaik/CricketBazar/Backend
```

### Step 2: Make Sure Port 5000 is Free
```bash
# If you have a previous API running, kill it
lsof -ti:5000 | xargs kill -9 2>/dev/null || true

# Or find all dotnet processes
ps aux | grep dotnet
```

### Step 3: Start the API
```bash
dotnet run --project src/CricketBazar.API
```

You should see:
```
[HH:MM:SS INF] Now listening on: http://localhost:5000
[HH:MM:SS INF] Application started. Press Ctrl+C to shut down.
```

## Testing the API

### In Another Terminal:

```bash
# Test health endpoint
curl http://localhost:5000/health

# Expected: {"status":"healthy","timestamp":"2026-10-24T..."}

# Try to get products (will be empty until database is created)
curl -X GET "http://localhost:5000/api/products"

# Expected: {"items":[],"totalCount":0,"pageNumber":1,"pageSize":20}
```

## Port Already in Use?

If you get: `Failed to bind to address http://127.0.0.1:5000: address already in use`

**On macOS/Linux:**
```bash
# Find what's using port 5000
lsof -i :5000

# Kill the process (replace PID with the actual process ID)
kill -9 <PID>

# Or use this one-liner
ps aux | grep dotnet | grep CricketBazar | awk '{print $2}' | xargs kill -9
```

**On Windows (PowerShell):**
```powershell
# Find what's using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID)
taskkill /PID <PID> /F
```

## What's Next?

1. ✅ API is running and healthy
2. ⏳ **Next**: Create the CricBazar database from your SQL schema
3. 🔄 Test API endpoints once database is ready

### Create the Database

You need SQL Server running with the CricBazar database. Options:

**Option 1: Docker (Recommended)**
```bash
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=@Bbsr123#" \
  -p 1433:1433 -d mcr.microsoft.com/mssql/server

# Wait 30 seconds for SQL Server to start, then run your schema script
```

**Option 2: Local SQL Server**
- Use SQL Server Management Studio (SSMS)
- Connect to: `localhost` with credentials `sa` / `@Bbsr123#`
- Execute your SQL schema script

**Option 3: Command Line (if sqlcmd is available)**
```bash
sqlcmd -S localhost -U sa -P "@Bbsr123#" -i schema.sql
```

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| Port 5000 already in use | Kill previous dotnet process |
| Connection string not configured | Check appsettings.json exists in project |
| Cannot connect to database | Create CricBazar database (see "Create the Database" above) |
| API starts but endpoints return empty | Database doesn't exist or is empty (expected) |

## Files Overview

| File | Purpose |
|------|---------|
| `/Backend/appsettings.json` | Configuration (connection string, JWT, etc.) |
| `/Backend/src/CricketBazar.API/Program.cs` | API startup configuration |
| `/Backend/src/CricketBazar.API/logs/app-*.txt` | API logs |

---
**Status**: ✅ Ready to run - just execute Step 3 above!
