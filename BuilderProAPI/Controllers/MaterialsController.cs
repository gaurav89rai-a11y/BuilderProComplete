using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BuilderProAPI.Data;
using System.Data;
using Microsoft.Data.SqlClient;

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
        var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            DECLARE @catId INT, @brandId INT, @unitId INT, @vendorId INT, @whId INT;
            
            -- Resolve category
            SELECT @catId = id FROM dbo.material_categories WHERE name = @Category;
            IF @catId IS NULL
            BEGIN
                INSERT INTO dbo.material_categories (name, code) VALUES (@Category, UPPER(LEFT(@Category, 3)));
                SET @catId = SCOPE_IDENTITY();
            END
            
            -- Resolve brand
            SELECT @brandId = id FROM dbo.brands_master WHERE name = @Brand;
            IF @brandId IS NULL
            BEGIN
                INSERT INTO dbo.brands_master (name, code) VALUES (@Brand, UPPER(LEFT(@Brand, 3)));
                SET @brandId = SCOPE_IDENTITY();
            END
            
            -- Resolve unit
            SELECT @unitId = id FROM dbo.units_master WHERE name = @Unit;
            IF @unitId IS NULL
            BEGIN
                INSERT INTO dbo.units_master (name, code) VALUES (@Unit, UPPER(LEFT(@Unit, 3)));
                SET @unitId = SCOPE_IDENTITY();
            END

            -- Resolve vendor
            SELECT @vendorId = id FROM dbo.vendors_master WHERE name = @Vendor;
            IF @vendorId IS NULL AND @Vendor IS NOT NULL AND @Vendor <> ''
            BEGIN
                INSERT INTO dbo.vendors_master (name) VALUES (@Vendor);
                SET @vendorId = SCOPE_IDENTITY();
            END

            -- Resolve warehouse
            SELECT @whId = id FROM dbo.warehouses_master WHERE name = @Warehouse;
            IF @whId IS NULL AND @Warehouse IS NOT NULL AND @Warehouse <> ''
            BEGIN
                INSERT INTO dbo.warehouses_master (name) VALUES (@Warehouse);
                SET @whId = SCOPE_IDENTITY();
            END

            INSERT INTO dbo.material_master (
                code, name, category_id, brand_id, unit_id, hsn_code, gst_rate, reorder_level, preferred_vendor_id, default_warehouse_id, status
            ) VALUES (
                @Code, @Name, @catId, @brandId, @unitId, @Hsn, @Gst, @ReorderLevel, @vendorId, @whId, 'Active'
            );
            
            SELECT SCOPE_IDENTITY();";

        var pCat = cmd.CreateParameter(); pCat.ParameterName = "@Category"; pCat.Value = dto.Category ?? ""; cmd.Parameters.Add(pCat);
        var pBrand = cmd.CreateParameter(); pBrand.ParameterName = "@Brand"; pBrand.Value = dto.Brand ?? ""; cmd.Parameters.Add(pBrand);
        var pUnit = cmd.CreateParameter(); pUnit.ParameterName = "@Unit"; pUnit.Value = dto.Unit ?? ""; cmd.Parameters.Add(pUnit);
        var pVendor = cmd.CreateParameter(); pVendor.ParameterName = "@Vendor"; pVendor.Value = dto.Vendor ?? (object)DBNull.Value; cmd.Parameters.Add(pVendor);
        var pWh = cmd.CreateParameter(); pWh.ParameterName = "@Warehouse"; pWh.Value = dto.Warehouse ?? (object)DBNull.Value; cmd.Parameters.Add(pWh);
        var pCode = cmd.CreateParameter(); pCode.ParameterName = "@Code"; pCode.Value = dto.Code ?? ""; cmd.Parameters.Add(pCode);
        var pName = cmd.CreateParameter(); pName.ParameterName = "@Name"; pName.Value = dto.Name ?? ""; cmd.Parameters.Add(pName);
        var pHsn = cmd.CreateParameter(); pHsn.ParameterName = "@Hsn"; pHsn.Value = dto.Hsn ?? (object)DBNull.Value; cmd.Parameters.Add(pHsn);
        var pGst = cmd.CreateParameter(); pGst.ParameterName = "@Gst"; pGst.Value = dto.Gst; cmd.Parameters.Add(pGst);
        var pReorder = cmd.CreateParameter(); pReorder.ParameterName = "@ReorderLevel"; pReorder.Value = dto.ReorderLevel; cmd.Parameters.Add(pReorder);

        try
        {
            if (conn.State != ConnectionState.Open)
                await conn.OpenAsync();

            var newIdObj = await cmd.ExecuteScalarAsync();
            int newId = Convert.ToInt32(newIdObj);
            dto.Id = newId;
            return Ok(dto);
        }
        finally
        {
            if (conn.State == ConnectionState.Open)
                await conn.CloseAsync();
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
