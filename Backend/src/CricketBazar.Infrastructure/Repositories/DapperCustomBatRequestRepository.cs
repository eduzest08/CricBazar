using Dapper;
using CricketBazar.Infrastructure.Data;
using CricketBazar.Domain.Entities;
using CricketBazar.Domain.Interfaces;

namespace CricketBazar.Infrastructure.Repositories;

/// <summary>
/// Dapper-based repository for CustomBatRequest entity.
/// </summary>
public class DapperCustomBatRequestRepository : DapperRepository<CustomBatRequest>, ICustomBatRequestRepository
{
    public DapperCustomBatRequestRepository(ISqlConnectionFactory connectionFactory) 
        : base(connectionFactory)
    {
    }

    public async Task<CustomBatRequest?> GetByIdAsync(int id)
    {
        const string sql = "SELECT * FROM dbo.CustomBatRequests WHERE Id = @Id";
        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryFirstOrDefaultAsync<CustomBatRequest>(sql, new { Id = id });
        }
    }

    public async Task<IEnumerable<CustomBatRequest>> GetByUserIdAsync(int userId)
    {
        const string sql = "SELECT * FROM dbo.CustomBatRequests WHERE UserId = @UserId ORDER BY CreatedAt DESC";
        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryAsync<CustomBatRequest>(sql, new { UserId = userId });
        }
    }

    public async Task<IEnumerable<CustomBatRequest>> GetPendingAsync()
    {
        const string sql = "SELECT * FROM dbo.CustomBatRequests WHERE Status = 'New' OR Status = 'In Progress' ORDER BY CreatedAt";
        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryAsync<CustomBatRequest>(sql);
        }
    }

    public async Task<IEnumerable<CustomBatRequest>> GetByStatusAsync(string status)
    {
        const string sql = "SELECT * FROM dbo.CustomBatRequests WHERE Status = @Status ORDER BY CreatedAt DESC";
        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryAsync<CustomBatRequest>(sql, new { Status = status });
        }
    }

    public async Task<int> AddAsync(CustomBatRequest request)
    {
        const string sql = @"
            INSERT INTO dbo.CustomBatRequests (UserId, Name, Mobile, Specs, Status, CreatedAt)
            VALUES (@UserId, @Name, @Mobile, @Specs, @Status, @CreatedAt);
            SELECT CAST(SCOPE_IDENTITY() as int)";

        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryFirstAsync<int>(sql, request);
        }
    }

    public async Task<bool> UpdateAsync(CustomBatRequest request)
    {
        const string sql = @"
            UPDATE dbo.CustomBatRequests 
            SET Status = @Status
            WHERE Id = @Id";

        using (var connection = _connectionFactory.GetConnection())
        {
            var rowsAffected = await connection.ExecuteAsync(sql, request);
            return rowsAffected > 0;
        }
    }

    public async Task<bool> DeleteAsync(int id)
    {
        const string sql = "DELETE FROM dbo.CustomBatRequests WHERE Id = @Id";
        using (var connection = _connectionFactory.GetConnection())
        {
            var rowsAffected = await connection.ExecuteAsync(sql, new { Id = id });
            return rowsAffected > 0;
        }
    }

    public async Task<IEnumerable<CustomBatRequest>> GetAllAsync()
    {
        const string sql = "SELECT * FROM dbo.CustomBatRequests ORDER BY CreatedAt DESC";
        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryAsync<CustomBatRequest>(sql);
        }
    }
}
