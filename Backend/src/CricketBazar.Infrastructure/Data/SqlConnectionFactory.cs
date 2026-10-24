using Microsoft.Data.SqlClient;

namespace CricketBazar.Infrastructure.Data;

/// <summary>
/// Factory for creating SQL Server database connections.
/// Manages connection string configuration and provides connections for Dapper operations.
/// </summary>
public interface ISqlConnectionFactory
{
    SqlConnection GetConnection();
}

/// <summary>
/// Implementation of SqlConnectionFactory using dependency injection.
/// </summary>
public class SqlConnectionFactory : ISqlConnectionFactory
{
    private readonly string _connectionString;

    public SqlConnectionFactory(string connectionString)
    {
        if (string.IsNullOrEmpty(connectionString))
            throw new ArgumentNullException(nameof(connectionString), "Connection string cannot be null or empty");
        
        _connectionString = connectionString;
    }

    /// <summary>
    /// Creates and returns a new SQL Server connection.
    /// </summary>
    public SqlConnection GetConnection()
    {
        return new SqlConnection(_connectionString);
    }
}
