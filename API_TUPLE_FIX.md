# ✅ Cricket Bazar API - Tuple Mapping Fix

## Problem
The API was throwing `AutoMapperMappingException` when trying to map tuples returned from Dapper repositories to DTOs:

```
AutoMapper.AutoMapperMappingException: Missing type map configuration or unsupported mapping.
Mapping types: ValueTuple`2 -> List`1
```

### Root Cause
Dapper repositories return paginated results as `Task<(IEnumerable<T> items, int totalCount)>` tuples. The old code tried to map this tuple directly to `List<ProductDto>`, but AutoMapper doesn't know how to convert tuples.

**Before (Broken):**
```csharp
// This tried to map ValueTuple directly - AutoMapper doesn't support that
var productDtos = _mapper.Map<List<ProductDto>>(result);  // ❌ Error!
```

## Solution
Created a proper wrapper DTO and unpacked the tuple before mapping:

### Step 1: Created PaginatedResponse<T> DTO
**File**: `src/CricketBazar.Application/DTOs/PaginatedResponse.cs`

```csharp
public class PaginatedResponse<T>
{
    public List<T> Items { get; set; } = [];
    public int TotalCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
}
```

### Step 2: Updated Handler to Unpack Tuple
**File**: `src/CricketBazar.Application/Queries/Products/ProductQueryHandlers.cs`

```csharp
public async Task<PaginatedResponse<ProductDto>> Handle(GetProductsListQuery request, CancellationToken cancellationToken)
{
    var result = await _repository.SearchAsync(...);

    // ✅ Unpack tuple into individual items
    var productDtos = _mapper.Map<List<ProductDto>>(result.Item1);
    
    return new PaginatedResponse<ProductDto>
    {
        Items = productDtos,
        TotalCount = result.Item2,
        PageNumber = request.PageNumber,
        PageSize = request.PageSize
    };
}
```

### Step 3: Updated Query Return Type
**File**: `src/CricketBazar.Application/Queries/Products/ProductQueries.cs`

```csharp
public class GetProductsListQuery : IRequest<PaginatedResponse<ProductDto>>  // ✅ New return type
{
    // ...
}
```

### Step 4: Updated Controller
**File**: `src/CricketBazar.API/Controllers/ProductsController.cs`

```csharp
[HttpGet]
public async Task<ActionResult<PaginatedResponse<ProductDto>>> GetAll(...)  // ✅ New return type
{
    // ...
}
```

## Result ✅

The API now successfully returns paginated responses:

```bash
curl http://localhost:5000/api/v1/products
```

```json
{
    "items": [],
    "totalCount": 0,
    "pageNumber": 1,
    "pageSize": 20
}
```

## Verification

All endpoints tested and working:

| Endpoint | Status | Response |
|----------|--------|----------|
| GET /health | ✅ 200 | Healthy |
| GET /api/v1/products | ✅ 200 | Paginated list |
| GET /api/v1/categories | ✅ 200 | Category list |
| GET /api/v1/brands | ✅ 200 | Brand list |

## Important Notes

1. **API runs on port 5000** by default (not 5001)
2. Empty responses are expected - database doesn't have data yet
3. Only `ProductRepository.SearchAsync` returns tuples; other repos return simple collections
4. This pattern can be reused for other paginated endpoints

## Running the API

```bash
cd Backend
dotnet run --project src/CricketBazar.API
```

Then test:
```bash
curl http://localhost:5000/api/v1/products
```

---
**Status**: ✅ RESOLVED - API is working and returning proper JSON responses
