-- ====================================================================
--  BuilderPro ERP — Material Master Database Setup Script (5,000+ Items)
--  Compatibility: PostgreSQL (Supabase / Neon / Render)
-- ====================================================================

-- ────────────────────────────────────────────────────────────────────
-- 1. CREATE SCHEMAS & DROP TABLES IF THEY EXIST
-- ────────────────────────────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS dbo;

DROP TABLE IF EXISTS dbo.material_master CASCADE;
DROP TABLE IF EXISTS dbo.material_variants CASCADE;
DROP TABLE IF EXISTS dbo.material_sizes CASCADE;
DROP TABLE IF EXISTS dbo.material_grades CASCADE;
DROP TABLE IF EXISTS dbo.vendors_master CASCADE;
DROP TABLE IF EXISTS dbo.warehouses_master CASCADE;
DROP TABLE IF EXISTS dbo.hsn_master CASCADE;
DROP TABLE IF EXISTS dbo.gst_master CASCADE;
DROP TABLE IF EXISTS dbo.units_master CASCADE;
DROP TABLE IF EXISTS dbo.brands_master CASCADE;
DROP TABLE IF EXISTS dbo.material_categories CASCADE;

-- ────────────────────────────────────────────────────────────────────
-- 2. CREATE SCHEMA AND TABLES
-- ────────────────────────────────────────────────────────────────────

CREATE TABLE dbo.material_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE
);

CREATE TABLE dbo.brands_master (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE
);

CREATE TABLE dbo.units_master (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE
);

CREATE TABLE dbo.gst_master (
    id SERIAL PRIMARY KEY,
    rate INT NOT NULL UNIQUE,
    label VARCHAR(50) NOT NULL
);

CREATE TABLE dbo.hsn_master (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES dbo.material_categories(id),
    code VARCHAR(20) NOT NULL UNIQUE,
    description VARCHAR(250) NULL
);

CREATE TABLE dbo.warehouses_master (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    location VARCHAR(250) NULL
);

CREATE TABLE dbo.vendors_master (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    email VARCHAR(100) NULL,
    phone VARCHAR(20) NULL,
    city VARCHAR(100) NULL
);

CREATE TABLE dbo.material_grades (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE dbo.material_sizes (
    id SERIAL PRIMARY KEY,
    value VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE dbo.material_variants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE dbo.material_master (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(250) NOT NULL,
    category_id INT REFERENCES dbo.material_categories(id),
    brand_id INT REFERENCES dbo.brands_master(id),
    unit_id INT REFERENCES dbo.units_master(id),
    hsn_code VARCHAR(20) NULL,
    gst_rate INT NULL,
    reorder_level INT NOT NULL DEFAULT 50,
    preferred_vendor_id INT REFERENCES dbo.vendors_master(id),
    default_warehouse_id INT REFERENCES dbo.warehouses_master(id),
    status VARCHAR(50) NOT NULL DEFAULT 'Active'
);

-- ────────────────────────────────────────────────────────────────────
-- 3. SEED MASTER TABLES WITH DENSE INDIAN ERP DATA
-- ────────────────────────────────────────────────────────────────────

-- Seeding Categories
INSERT INTO dbo.material_categories (name, code) VALUES
('Cement', 'CEM'),
('Steel', 'STL'),
('Sand', 'SND'),
('Aggregate', 'AGG'),
('Bricks', 'BRK'),
('Blocks', 'BLK'),
('Tiles', 'TIL'),
('Plumbing', 'PLM'),
('Electrical', 'ELC'),
('Paint', 'PNT'),
('Hardware', 'HWR'),
('Doors', 'DOR'),
('Windows', 'WIN'),
('Glass', 'GLS'),
('Roofing', 'RFG'),
('Waterproofing', 'WPF'),
('Chemicals', 'CHM'),
('Wood', 'WOD'),
('Plywood', 'PLY'),
('HVAC', 'HVC'),
('Safety', 'SFT');

-- Seeding Brands
INSERT INTO dbo.brands_master (name, code) VALUES
('UltraTech', 'ULT'),
('ACC', 'ACC'),
('Ambuja', 'AMB'),
('Tata Tiscon', 'TAT'),
('JSW Neosteel', 'JSW'),
('Jindal Panther', 'JIN'),
('Astral', 'AST'),
('Supreme', 'SUP'),
('Finolex', 'FIN'),
('Havells', 'HVL'),
('Polycab', 'POL'),
('Anchor', 'ANC'),
('Asian Paints', 'APN'),
('Berger', 'BER'),
('Kajaria', 'KAJ'),
('Somany', 'SOM'),
('Hindware', 'HND'),
('Jaquar', 'JAQ'),
('Dr. Fixit', 'DFX'),
('Fevicol', 'FEV'),
('Bosch', 'BSH');

-- Seeding Units
INSERT INTO dbo.units_master (name, code) VALUES
('Bag (50 Kg)', 'BAG'),
('Tons', 'TON'),
('Brass', 'BRS'),
('Meters', 'MTR'),
('Coils', 'COL'),
('Pieces', 'PCS'),
('Liters', 'LTR'),
('Square Feet', 'SQF');

-- Seeding GST Master
INSERT INTO dbo.gst_master (rate, label) VALUES
(5, '5% GST Bracket'),
(12, '12% GST Bracket'),
(18, '18% GST Bracket'),
(28, '28% GST Bracket');

-- Seeding Warehouses
INSERT INTO dbo.warehouses_master (name, location) VALUES
('Main Warehouse', 'Shed 1, Panvel Logistics Park'),
('Steel Yard', 'Open Plot 3, Panvel Site'),
('Electrical Store', 'Basement Unit B1, Panvel'),
('Plumbing & Sanit Store', 'Basement Unit B2, Panvel'),
('Chemical & Paint Shed', 'AC Room 4, Panvel');

-- Seeding Vendors
INSERT INTO dbo.vendors_master (name, email, phone, city) VALUES
('UltraTech Cement Ltd.', 'sales@ultratech.com', '18002100001', 'Mumbai'),
('Tata Steel Ltd.', 'order@tatasteel.com', '18002100002', 'Kolkata'),
('Supreme Pipes & Fittings', 'distributors@supreme.co.in', '022-26850001', 'Mumbai'),
('Havells India Ltd.', 'support@havells.com', '18001031313', 'Noida'),
('Polycab India Ltd.', 'info@polycab.com', '18002006666', 'Mumbai'),
('Asian Paints Ltd.', 'contractor@asianpaints.com', '18002095678', 'Mumbai'),
('Dr. Fixit Pidilite', 'drfixit@pidilite.com', '1800225566', 'Mumbai'),
('Kajaria Ceramics Ltd.', 'tiles@kajaria.com', '1800110101', 'Delhi');

-- Seeding Grades, Sizes, and Variants (for generating combinations)
INSERT INTO dbo.material_grades (name) VALUES
('OPC 53 Grade'),
('PPC Grade'),
('Fe 550D TMT'),
('Class A Solid'),
('Premium Waterproof'),
('Heavy Duty'),
('FR-LSH Wire'),
('Gloss Finish');

INSERT INTO dbo.material_sizes (value) VALUES
('50 Kg'),
('8mm'),
('10mm'),
('12mm'),
('16mm'),
('20mm'),
('25mm'),
('1.5 sqmm'),
('2.5 sqmm'),
('4.0 sqmm'),
('110mm OD'),
('75mm OD'),
('4 Liters'),
('20 Liters');

INSERT INTO dbo.material_variants (name) VALUES
('Bags'),
('Rods (12m)'),
('Coils (90m)'),
('Pipes (6m)'),
('Buckets'),
('Boxes');

-- ────────────────────────────────────────────────────────────────────
-- 4. CROSS-JOIN AUTOMATED SEEDING FOR 5,000+ DETAILED MATERIALS
-- ────────────────────────────────────────────────────────────────────

INSERT INTO dbo.material_master (
    code,
    name,
    category_id,
    brand_id,
    unit_id,
    hsn_code,
    gst_rate,
    reorder_level,
    preferred_vendor_id,
    default_warehouse_id,
    status
)
SELECT 
    -- 1. Material Code Generator
    UPPER(
        c.code || '-' || 
        b.code || '-' || 
        LEFT(REPLACE(g.name, ' ', ''), 4) || '-' || 
        LEFT(REPLACE(s.value, ' ', ''), 4) || '-' || 
        RIGHT('00000' || CAST(ROW_NUMBER() OVER (ORDER BY c.id, b.id, g.id, s.id, v.id) AS VARCHAR(10)), 5)
    ) AS code,

    -- 2. Complete Detailed Material Name
    b.name || ' ' || g.name || ' ' || c.name || ' (' || s.value || ' ' || v.name || ')' AS name,

    -- 3. Associations
    c.id AS category_id,
    b.id AS brand_id,
    
    -- Map Units logically based on Category
    CASE 
        WHEN c.name = 'Cement' THEN 1 -- Bags
        WHEN c.name = 'Steel' THEN 2 -- Tons
        WHEN c.name = 'Plumbing' THEN 4 -- Meters
        WHEN c.name = 'Electrical' THEN 5 -- Coils
        WHEN c.name IN ('Paint', 'Chemicals') THEN 7 -- Liters
        ELSE 6 -- Pieces
    END AS unit_id,

    -- Logically resolve HSN Codes based on categories
    CASE 
        WHEN c.name = 'Cement' THEN '25232910'
        WHEN c.name = 'Steel' THEN '72142090'
        WHEN c.name = 'Plumbing' THEN '39172310'
        WHEN c.name = 'Electrical' THEN '85444920'
        WHEN c.name = 'Paint' THEN '32089090'
        WHEN c.name = 'Tiles' THEN '69072100'
        ELSE '73089090'
    END AS hsn_code,

    -- Logically resolve GST Rates
    CASE 
        WHEN c.name = 'Cement' THEN 28
        WHEN c.name IN ('Steel', 'Electrical', 'Plumbing', 'Paint') THEN 18
        WHEN c.name IN ('Sand', 'Aggregate', 'Bricks') THEN 5
        ELSE 12
    END AS gst_rate,

    -- Dynamic reorder level
    CASE 
        WHEN c.name = 'Cement' THEN 150
        WHEN c.name = 'Steel' THEN 10
        WHEN c.name = 'Plumbing' THEN 50
        WHEN c.name = 'Electrical' THEN 30
        ELSE 20
    END AS reorder_level,

    -- Map Preferred Vendor dynamically
    CASE 
        WHEN c.name = 'Cement' THEN 1 -- UltraTech
        WHEN c.name = 'Steel' THEN 2 -- Tata Steel
        WHEN c.name = 'Plumbing' THEN 3 -- Supreme Pipes
        WHEN c.name = 'Electrical' THEN 4 -- Havells
        WHEN c.name = 'Paint' THEN 6 -- Asian Paints
        WHEN c.name = 'Waterproofing' THEN 7 -- Dr Fixit
        ELSE 8 -- Kajaria
    END AS preferred_vendor_id,

    -- Map Default Warehouse location
    CASE 
        WHEN c.name = 'Cement' THEN 1
        WHEN c.name = 'Steel' THEN 2
        WHEN c.name = 'Electrical' THEN 3
        WHEN c.name = 'Plumbing' THEN 4
        WHEN c.name IN ('Paint', 'Chemicals', 'Waterproofing') THEN 5
        ELSE 1
    END AS default_warehouse_id,

    'Active' AS status

FROM dbo.material_categories c
CROSS JOIN dbo.brands_master b
CROSS JOIN dbo.material_grades g
CROSS JOIN dbo.material_sizes s
CROSS JOIN dbo.material_variants v
-- Apply optimized seeding filters to generate 5,600+ unique construction materials
WHERE 
    -- Cement (UltraTech, ACC, Ambuja)
    (c.name = 'Cement' AND b.name IN ('UltraTech', 'ACC', 'Ambuja') AND g.name LIKE '%Grade%')
    OR
    -- Steel (Tata Tiscon, JSW, Jindal Panther)
    (c.name = 'Steel' AND b.name IN ('Tata Tiscon', 'JSW Neosteel', 'Jindal Panther') AND g.name LIKE '%TMT%' AND s.value IN ('8mm', '10mm', '12mm', '16mm', '20mm', '25mm'))
    OR
    -- Electrical (Havells, Polycab, Anchor, Finolex)
    (c.name = 'Electrical' AND b.name IN ('Havells', 'Polycab', 'Anchor', 'Finolex') AND s.value LIKE '%sqmm%' AND v.name = 'Coils (90m)')
    OR
    -- Plumbing (Astral, Supreme, Finolex)
    (c.name = 'Plumbing' AND b.name IN ('Astral', 'Supreme', 'Finolex') AND s.value LIKE '%OD%')
    OR
    -- Paint & Waterproofing (Asian Paints, Berger, Dr. Fixit)
    (c.name IN ('Paint', 'Waterproofing') AND b.name IN ('Asian Paints', 'Berger', 'Dr. Fixit') AND s.value LIKE '%Liters%')
    OR
    -- All other categories to cross-join realistically
    (c.name IN ('Bricks', 'Blocks', 'Tiles', 'Sand', 'Aggregate', 'Hardware', 'Doors', 'Windows', 'Glass', 'Roofing', 'Chemicals', 'Wood', 'Plywood', 'HVAC', 'Safety')
     AND b.name IN ('UltraTech', 'ACC', 'JSW Neosteel', 'Kajaria', 'Somany', 'Hindware', 'Jaquar', 'Bosch', 'Fevicol')
     AND g.name IN ('Class A Solid', 'Heavy Duty')
     AND s.value IN ('50 Kg', '12mm', '16mm', '20mm', '25mm'));
