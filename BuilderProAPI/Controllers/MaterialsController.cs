using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BuilderProAPI.Data;
using System.Data;
using System.Data.Common;

namespace BuilderProAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MaterialsController : ControllerBase
{
    private readonly BuilderProDbContext _db;
    public MaterialsController(BuilderProDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetMaterials()
    {
        var conn = _db.Database.GetDbConnection();
        var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            SELECT 
                m.id AS Id,
                m.name AS Name,
                c.name AS Category,
                m.code AS Code,
                b.name AS Brand,
                u.name AS Unit,
                m.hsn_code AS Hsn,
                m.gst_rate AS Gst,
                m.reorder_level AS ReorderLevel,
                w.name AS Warehouse,
                v.name AS Vendor,
                m.status AS Status
            FROM dbo.material_master m
            LEFT JOIN dbo.material_categories c ON m.category_id = c.id
            LEFT JOIN dbo.brands_master b ON m.brand_id = b.id
            LEFT JOIN dbo.units_master u ON m.unit_id = u.id
            LEFT JOIN dbo.warehouses_master w ON m.default_warehouse_id = w.id
            LEFT JOIN dbo.vendors_master v ON m.preferred_vendor_id = v.id
            ORDER BY m.id DESC";

        var list = new List<MaterialDto>();
        try
        {
            if (conn.State != ConnectionState.Open)
                await conn.OpenAsync();

            using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    list.Add(new MaterialDto {
                        Id = reader.GetInt32(0),
                        Name = reader.GetString(1),
                        Category = reader.IsDBNull(2) ? "" : reader.GetString(2),
                        Code = reader.GetString(3),
                        Brand = reader.IsDBNull(4) ? "" : reader.GetString(4),
                        Unit = reader.IsDBNull(5) ? "" : reader.GetString(5),
                        Hsn = reader.IsDBNull(6) ? "" : reader.GetString(6),
                        Gst = reader.IsDBNull(7) ? 0 : reader.GetInt32(7),
                        ReorderLevel = reader.GetInt32(8),
                        Warehouse = reader.IsDBNull(9) ? "" : reader.GetString(9),
                        Vendor = reader.IsDBNull(10) ? "" : reader.GetString(10),
                        Status = reader.GetString(11),
                        Price = 350 // Default mapping price for UI
                    });
                }
            }
        }
        finally
        {
            if (conn.State == ConnectionState.Open)
                await conn.CloseAsync();
        }

        return Ok(list);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] MaterialDto dto)
    {
        var conn = _db.Database.GetDbConnection();
        bool isPostgres = conn.GetType().Name.Contains("Npgsql");
        
        try
        {
            if (conn.State != ConnectionState.Open)
                await conn.OpenAsync();

            int? catId = await ResolveIdAsync(conn, isPostgres, "material_categories", dto.Category, true);
            int? brandId = await ResolveIdAsync(conn, isPostgres, "brands_master", dto.Brand, true);
            int? unitId = await ResolveIdAsync(conn, isPostgres, "units_master", dto.Unit, true);
            int? vendorId = await ResolveIdAsync(conn, isPostgres, "vendors_master", dto.Vendor, false);
            int? whId = await ResolveIdAsync(conn, isPostgres, "warehouses_master", dto.Warehouse, false);

            using (var cmd = conn.CreateCommand())
            {
                if (isPostgres)
                {
                    cmd.CommandText = @"
                        INSERT INTO dbo.material_master (
                            code, name, category_id, brand_id, unit_id, hsn_code, gst_rate, reorder_level, preferred_vendor_id, default_warehouse_id, status
                        ) VALUES (
                            @Code, @Name, @catId, @brandId, @unitId, @Hsn, @Gst, @ReorderLevel, @vendorId, @whId, 'Active'
                        ) RETURNING id;";
                }
                else
                {
                    cmd.CommandText = @"
                        INSERT INTO dbo.material_master (
                            code, name, category_id, brand_id, unit_id, hsn_code, gst_rate, reorder_level, preferred_vendor_id, default_warehouse_id, status
                        ) VALUES (
                            @Code, @Name, @catId, @brandId, @unitId, @Hsn, @Gst, @ReorderLevel, @vendorId, @whId, 'Active'
                        );
                        SELECT SCOPE_IDENTITY();";
                }

                AddParam(cmd, "@Code", dto.Code ?? "");
                AddParam(cmd, "@Name", dto.Name ?? "");
                AddParam(cmd, "@catId", (object?)catId ?? DBNull.Value);
                AddParam(cmd, "@brandId", (object?)brandId ?? DBNull.Value);
                AddParam(cmd, "@unitId", (object?)unitId ?? DBNull.Value);
                AddParam(cmd, "@Hsn", dto.Hsn ?? (object)DBNull.Value);
                AddParam(cmd, "@Gst", dto.Gst);
                AddParam(cmd, "@ReorderLevel", dto.ReorderLevel);
                AddParam(cmd, "@vendorId", (object?)vendorId ?? DBNull.Value);
                AddParam(cmd, "@whId", (object?)whId ?? DBNull.Value);

                var newIdObj = await cmd.ExecuteScalarAsync();
                dto.Id = Convert.ToInt32(newIdObj);
            }

            return Ok(dto);
        }
        finally
        {
            if (conn.State == ConnectionState.Open)
                await conn.CloseAsync();
        }
    }

    private void AddParam(DbCommand cmd, string name, object value)
    {
        var p = cmd.CreateParameter();
        p.ParameterName = name;
        p.Value = value;
        cmd.Parameters.Add(p);
    }

    private async Task<int?> ResolveIdAsync(DbConnection conn, bool isPostgres, string tableName, string? nameValue, bool generateCode)
    {
        if (string.IsNullOrWhiteSpace(nameValue)) return null;
        nameValue = nameValue.Trim();

        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = $"SELECT id FROM dbo.{tableName} WHERE name = @Name";
            var p = cmd.CreateParameter();
            p.ParameterName = "@Name";
            p.Value = nameValue;
            cmd.Parameters.Add(p);

            var val = await cmd.ExecuteScalarAsync();
            if (val != null && val != DBNull.Value)
            {
                return Convert.ToInt32(val);
            }
        }

        // Insert new
        using (var cmd = conn.CreateCommand())
        {
            if (generateCode)
            {
                string code = nameValue.Length > 3 ? nameValue.Substring(0, 3) : nameValue;
                code = code.ToUpper();

                if (isPostgres)
                {
                    cmd.CommandText = $"INSERT INTO dbo.{tableName} (name, code) VALUES (@Name, @Code) RETURNING id;";
                }
                else
                {
                    cmd.CommandText = $"INSERT INTO dbo.{tableName} (name, code) VALUES (@Name, @Code); SELECT SCOPE_IDENTITY();";
                }
                
                var pName = cmd.CreateParameter(); pName.ParameterName = "@Name"; pName.Value = nameValue; cmd.Parameters.Add(pName);
                var pCode = cmd.CreateParameter(); pCode.ParameterName = "@Code"; pCode.Value = code; cmd.Parameters.Add(pCode);
            }
            else
            {
                if (isPostgres)
                {
                    cmd.CommandText = $"INSERT INTO dbo.{tableName} (name) VALUES (@Name) RETURNING id;";
                }
                else
                {
                    cmd.CommandText = $"INSERT INTO dbo.{tableName} (name) VALUES (@Name); SELECT SCOPE_IDENTITY();";
                }
                
                var pName = cmd.CreateParameter(); pName.ParameterName = "@Name"; pName.Value = nameValue; cmd.Parameters.Add(pName);
            }

            var val = await cmd.ExecuteScalarAsync();
            return Convert.ToInt32(val);
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var conn = _db.Database.GetDbConnection();
        var cmd = conn.CreateCommand();
        cmd.CommandText = "DELETE FROM dbo.material_master WHERE id = @Id";
        
        var pId = cmd.CreateParameter();
        pId.ParameterName = "@Id";
        pId.Value = id;
        cmd.Parameters.Add(pId);

        try
        {
            if (conn.State != ConnectionState.Open)
                await conn.OpenAsync();

            await cmd.ExecuteNonQueryAsync();
            return NoContent();
        }
        finally
        {
            if (conn.State == ConnectionState.Open)
                await conn.CloseAsync();
        }
    }

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        var conn = _db.Database.GetDbConnection();
        var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT id, name, code FROM dbo.material_categories ORDER BY name";
        var list = new List<object>();
        try
        {
            if (conn.State != ConnectionState.Open)
                await conn.OpenAsync();

            using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    list.Add(new { 
                        id = reader.GetInt32(0), 
                        name = reader.GetString(1), 
                        code = reader.GetString(2) 
                    });
                }
            }
        }
        finally
        {
            if (conn.State == ConnectionState.Open)
                await conn.CloseAsync();
        }
        return Ok(list);
    }

    [HttpGet("brands")]
    public async Task<IActionResult> GetBrands()
    {
        var conn = _db.Database.GetDbConnection();
        var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT id, name, code FROM dbo.brands_master ORDER BY name";
        var list = new List<object>();
        try
        {
            if (conn.State != ConnectionState.Open)
                await conn.OpenAsync();

            using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    list.Add(new { 
                        id = reader.GetInt32(0), 
                        name = reader.GetString(1), 
                        code = reader.GetString(2) 
                    });
                }
            }
        }
        finally
        {
            if (conn.State == ConnectionState.Open)
                await conn.CloseAsync();
        }
        return Ok(list);
    }
}

public class MaterialDto
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Category { get; set; } = "";
    public string Code { get; set; } = "";
    public string Brand { get; set; } = "";
    public string Unit { get; set; } = "";
    public string Hsn { get; set; } = "";
    public int Gst { get; set; }
    public int ReorderLevel { get; set; }
    public string Warehouse { get; set; } = "";
    public string Vendor { get; set; } = "";
    public string Status { get; set; } = "";
    public decimal Price { get; set; }
}
