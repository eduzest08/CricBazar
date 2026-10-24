using Dapper;
using CricketBazar.Infrastructure.Data;
using CricketBazar.Domain.Entities;
using CricketBazar.Domain.Interfaces;

namespace CricketBazar.Infrastructure.Repositories;

/// <summary>
/// Dapper-based repository for Order entity.
/// </summary>
public class DapperOrderRepository : DapperRepository<Order>, IOrderRepository
{
    public DapperOrderRepository(ISqlConnectionFactory connectionFactory) 
        : base(connectionFactory)
    {
    }

    public async Task<Order?> GetByIdAsync(int id)
    {
        const string sql = "SELECT * FROM dbo.Orders WHERE Id = @Id";
        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryFirstOrDefaultAsync<Order>(sql, new { Id = id });
        }
    }

    public async Task<Order?> GetByOrderNumberAsync(string orderNumber)
    {
        const string sql = "SELECT * FROM dbo.Orders WHERE OrderNo = @OrderNo";
        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryFirstOrDefaultAsync<Order>(sql, new { OrderNo = orderNumber });
        }
    }

    public async Task<IEnumerable<Order>> GetByUserIdAsync(int userId)
    {
        const string sql = "SELECT * FROM dbo.Orders WHERE UserId = @UserId ORDER BY CreatedAt DESC";
        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryAsync<Order>(sql, new { UserId = userId });
        }
    }

    public async Task<int> AddAsync(Order order)
    {
        const string sql = @"
            INSERT INTO dbo.Orders (OrderNo, UserId, Status, SubTotal, ShippingFee, Total, ShipFullName, ShipMobile, ShipAddress, ShipPincode, CreatedAt)
            VALUES (@OrderNo, @UserId, @Status, @SubTotal, @ShippingFee, @Total, @ShipFullName, @ShipMobile, @ShipAddress, @ShipPincode, @CreatedAt);
            SELECT CAST(SCOPE_IDENTITY() as int)";

        using (var connection = _connectionFactory.GetConnection())
        {
            return await connection.QueryFirstAsync<int>(sql, order);
        }
    }

    public async Task<bool> UpdateAsync(Order order)
    {
        const string sql = @"
            UPDATE dbo.Orders 
            SET Status = @Status, SubTotal = @SubTotal, ShippingFee = @ShippingFee, Total = @Total
            WHERE Id = @Id";

        using (var connection = _connectionFactory.GetConnection())
        {
            var rowsAffected = await connection.ExecuteAsync(sql, order);
            return rowsAffected > 0;
        }
    }

    public async Task<bool> DeleteAsync(int id)
    {
        const string sql = "DELETE FROM dbo.Orders WHERE Id = @Id";
        using (var connection = _connectionFactory.GetConnection())
        {
            var rowsAffected = await connection.ExecuteAsync(sql, new { Id = id });
            return rowsAffected > 0;
        }
    }
}
