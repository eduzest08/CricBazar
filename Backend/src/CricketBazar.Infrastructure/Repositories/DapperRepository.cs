using Dapper;
using CricketBazar.Infrastructure.Data;
using Microsoft.Data.SqlClient;

namespace CricketBazar.Infrastructure.Repositories;

/// <summary>
/// Base repository for Dapper operations.
/// Provides common CRUD operations using Dapper ORM.
/// </summary>
public abstract class DapperRepository<T> where T : class
{
    protected readonly ISqlConnectionFactory _connectionFactory;
    
    protected DapperRepository(ISqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));
    }

    /// <summary>
    /// Gets a single entity by ID.
    /// </summary>
    public virtual async Task<T?> GetByIdAsync(int id, string tableName, string idColumnName = "Id")
    {
        const string sql = "SELECT * FROM {0} WHERE {1} = @Id";
        
        using (var connection = _connectionFactory.GetConnection())
        {
            var result = await connection.QueryFirstOrDefaultAsync<T>(
                string.Format(sql, tableName, idColumnName),
                new { Id = id }
            );
            return result;
        }
    }

    /// <summary>
    /// Gets all entities from a table.
    /// </summary>
    public virtual async Task<IEnumerable<T>> GetAllAsync(string tableName)
    {
        const string sql = "SELECT * FROM {0}";
        
        using (var connection = _connectionFactory.GetConnection())
        {
            var results = await connection.QueryAsync<T>(
                string.Format(sql, tableName)
            );
            return results;
        }
    }

    /// <summary>
    /// Gets paginated results from a table.
    /// </summary>
    public virtual async Task<(IEnumerable<T> items, int totalCount)> GetPagedAsync(
        string tableName, 
        int pageNumber, 
        int pageSize, 
        string? orderByColumn = "Id")
    {
        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var offset = (pageNumber - 1) * pageSize;
        
        var countSql = "SELECT COUNT(*) FROM {0}";
        var dataSql = "SELECT * FROM {0} ORDER BY {1} OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY";
        
        using (var connection = _connectionFactory.GetConnection())
        {
            var totalCount = await connection.ExecuteScalarAsync<int>(
                string.Format(countSql, tableName)
            );

            var items = await connection.QueryAsync<T>(
                string.Format(dataSql, tableName, orderByColumn ?? "Id"),
                new { Offset = offset, PageSize = pageSize }
            );

            return (items, totalCount);
        }
    }

    /// <summary>
    /// Executes a raw SQL query and returns results.
    /// </summary>
    public virtual async Task<IEnumerable<T>> QueryAsync(string sql, object? parameters = null)
    {
        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryAsync<T>(sql, parameters);
        }
    }

    /// <summary>
    /// Executes a raw SQL query and returns a single result.
    /// </summary>
    public virtual async Task<T?> QueryFirstOrDefaultAsync(string sql, object? parameters = null)
    {
        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryFirstOrDefaultAsync<T>(sql, parameters);
        }
    }

    /// <summary>
    /// Executes a command (INSERT, UPDATE, DELETE) and returns the number of affected rows.
    /// </summary>
    public virtual async Task<int> ExecuteAsync(string sql, object? parameters = null)
    {
        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.ExecuteAsync(sql, parameters);
        }
    }

    /// <summary>
    /// Executes a command and returns a scalar value (like COUNT or last inserted ID).
    /// </summary>
    public virtual async Task<T?> ExecuteScalarAsync(string sql, object? parameters = null)
    {
        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.ExecuteScalarAsync<T>(sql, parameters);
        }
    }

    /// <summary>
    /// Executes multiple commands in a transaction.
    /// </summary>
    public virtual async Task<bool> ExecuteTransactionAsync(Func<SqlConnection, Task> action)
    {
        using (var connection = _connectionFactory.GetConnection())
        {
            await connection.OpenAsync();
            using (var transaction = connection.BeginTransaction())
            {
                try
                {
                    // Note: Dapper doesn't have async support for transactions in this way
                    // This is a simplified version - for production, use SqlCommand directly
                    await action(connection);
                    transaction.Commit();
                    return true;
                }
                catch
                {
                    transaction.Rollback();
                    throw;
                }
            }
        }
    }
}
