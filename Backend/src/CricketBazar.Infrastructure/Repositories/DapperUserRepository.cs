using Dapper;
using CricketBazar.Infrastructure.Data;
using CricketBazar.Domain.Entities;
using CricketBazar.Domain.Interfaces;

namespace CricketBazar.Infrastructure.Repositories;

/// <summary>
/// Dapper-based repository for User entity.
/// </summary>
public class DapperUserRepository : DapperRepository<User>, IUserRepository
{
    public DapperUserRepository(ISqlConnectionFactory connectionFactory) 
        : base(connectionFactory)
    {
    }

    public async Task<User?> GetByIdAsync(int id)
    {
        const string sql = "SELECT * FROM dbo.Users WHERE Id = @Id";
        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryFirstOrDefaultAsync<User>(sql, new { Id = id });
        }
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        const string sql = "SELECT * FROM dbo.Users WHERE Email = @Email";
        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryFirstOrDefaultAsync<User>(sql, new { Email = email });
        }
    }

    public async Task<User?> GetByMobileAsync(string mobile)
    {
        const string sql = "SELECT * FROM dbo.Users WHERE Mobile = @Mobile";
        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryFirstOrDefaultAsync<User>(sql, new { Mobile = mobile });
        }
    }

    public async Task<int> AddAsync(User user)
    {
        const string sql = @"
            INSERT INTO dbo.Users (Name, Email, Mobile, PasswordHash, Role, CreatedAt)
            VALUES (@Name, @Email, @Mobile, @PasswordHash, @Role, @CreatedAt);
            SELECT CAST(SCOPE_IDENTITY() as int)";

        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryFirstAsync<int>(sql, user);
        }
    }

    public async Task<bool> UpdateAsync(User user)
    {
        const string sql = @"
            UPDATE dbo.Users 
            SET Name = @Name, Email = @Email, Mobile = @Mobile, PasswordHash = @PasswordHash, Role = @Role
            WHERE Id = @Id";

        using (var connection = _connectionFactory.GetConnection())
        {
            var rowsAffected = await connection.ExecuteAsync(sql, user);
            return rowsAffected > 0;
        }
    }

    public async Task<bool> DeleteAsync(int id)
    {
        const string sql = "DELETE FROM dbo.Users WHERE Id = @Id";
        using (var connection = _connectionFactory.GetConnection())
        {
            var rowsAffected = await connection.ExecuteAsync(sql, new { Id = id });
            return rowsAffected > 0;
        }
    }
}
