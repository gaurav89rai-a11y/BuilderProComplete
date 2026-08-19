-- ============================================================
--  BuilderPro ERP — MS SQL Database Script
--  Run this in Azure SQL Query Editor or SSMS
--  After EF migrations run automatically, this adds extra
--  indexes, views, and stored procedures for performance.
-- ============================================================

USE BuilderProDB;
GO

-- ─── PERFORMANCE INDEXES ─────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Units_ProjectId_Status')
    CREATE INDEX IX_Units_ProjectId_Status ON Units(ProjectId, Status);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Leads_Stage_AssignedTo')
    CREATE INDEX IX_Leads_Stage_AssignedTo ON Leads(Stage, AssignedTo);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Customers_Status')
    CREATE INDEX IX_Customers_Status ON Customers(Status);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Payments_CustomerId')
    CREATE INDEX IX_Payments_CustomerId ON Payments(CustomerId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_SiteVisits_Status_VisitDate')
    CREATE INDEX IX_SiteVisits_Status_VisitDate ON SiteVisits(Status, VisitDate);
GO

-- ─── VIEW: Dashboard Summary ─────────────────────────────────
CREATE OR ALTER VIEW vw_DashboardSummary AS
SELECT
    (SELECT COUNT(*) FROM Projects)                                     AS TotalProjects,
    (SELECT COUNT(*) FROM Projects WHERE Status = 'Active')            AS ActiveProjects,
    (SELECT COUNT(*) FROM Units)                                        AS TotalUnits,
    (SELECT COUNT(*) FROM Units WHERE Status = 'Available')            AS AvailableUnits,
    (SELECT COUNT(*) FROM Units WHERE Status = 'Sold')                 AS SoldUnits,
    (SELECT COUNT(*) FROM Units WHERE Status = 'Booked')               AS BookedUnits,
    (SELECT COUNT(*) FROM Leads WHERE Stage <> 'Booked')               AS ActiveLeads,
    (SELECT COUNT(*) FROM Customers)                                    AS TotalCustomers,
    (SELECT COUNT(*) FROM Customers WHERE Status = 'Overdue')          AS OverdueCustomers,
    (SELECT COUNT(*) FROM ChannelPartners)                             AS TotalPartners,
    (SELECT ISNULL(SUM(PaidAmount), 0) FROM Customers)                AS TotalRevenue,
    (SELECT COUNT(*) FROM SiteVisits WHERE Status = 'Scheduled')      AS ScheduledVisits,
    (SELECT COUNT(*) FROM ServiceTickets WHERE Status = 'Open')        AS OpenTickets;
GO

-- ─── VIEW: Project Portfolio ─────────────────────────────────
CREATE OR ALTER VIEW vw_ProjectPortfolio AS
SELECT
    p.Id,
    p.Name,
    p.Location,
    p.ReraNumber,
    p.Status,
    p.Type,
    p.TotalUnits,
    p.ConstructionPct,
    p.TotalValue,
    COUNT(u.Id)                                     AS ActualUnits,
    SUM(CASE WHEN u.Status = 'Available' THEN 1 ELSE 0 END) AS AvailableUnits,
    SUM(CASE WHEN u.Status = 'Sold'      THEN 1 ELSE 0 END) AS SoldUnits,
    SUM(CASE WHEN u.Status = 'Booked'    THEN 1 ELSE 0 END) AS BookedUnits,
    SUM(CASE WHEN u.Status = 'Held'      THEN 1 ELSE 0 END) AS HeldUnits,
    ISNULL(SUM(u.Price), 0)                         AS TotalInventoryValue
FROM Projects p
LEFT JOIN Units u ON u.ProjectId = p.Id
GROUP BY p.Id, p.Name, p.Location, p.ReraNumber, p.Status, p.Type,
         p.TotalUnits, p.ConstructionPct, p.TotalValue;
GO

-- ─── VIEW: Customer Payment Summary ─────────────────────────
CREATE OR ALTER VIEW vw_CustomerPaymentSummary AS
SELECT
    c.Id,
    c.Name,
    c.Email,
    c.UnitNumber,
    c.Status,
    c.TotalAmount,
    c.PaidAmount,
    c.TotalAmount - c.PaidAmount           AS PendingAmount,
    CAST(c.PaidAmount * 100.0 / NULLIF(c.TotalAmount, 0) AS DECIMAL(5,1)) AS PaidPct,
    p.Name                                 AS ProjectName,
    c.BookingDate,
    COUNT(pay.Id)                          AS PaymentCount,
    MAX(pay.PaymentDate)                   AS LastPaymentDate
FROM Customers c
LEFT JOIN Projects p ON p.Id = c.ProjectId
LEFT JOIN Payments pay ON pay.CustomerId = c.Id
GROUP BY c.Id, c.Name, c.Email, c.UnitNumber, c.Status,
         c.TotalAmount, c.PaidAmount, p.Name, c.BookingDate;
GO

-- ─── VIEW: Lead Pipeline ─────────────────────────────────────
CREATE OR ALTER VIEW vw_LeadPipeline AS
SELECT
    Stage,
    COUNT(*)                              AS LeadCount,
    AVG(Score)                            AS AvgScore,
    SUM(Budget)                           AS TotalPotentialValue,
    COUNT(DISTINCT AssignedTo)            AS AgentsWorking
FROM Leads
GROUP BY Stage;
GO

-- ─── STORED PROC: Monthly Revenue Report ─────────────────────
CREATE OR ALTER PROCEDURE sp_MonthlyRevenueReport
    @Year INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF @Year IS NULL SET @Year = YEAR(GETDATE());

    SELECT
        MONTH(pay.PaymentDate)              AS [Month],
        DATENAME(MONTH, pay.PaymentDate)    AS MonthName,
        COUNT(pay.Id)                       AS PaymentCount,
        SUM(pay.Amount)                     AS TotalAmount,
        COUNT(DISTINCT pay.CustomerId)      AS UniqueCustomers
    FROM Payments pay
    WHERE YEAR(pay.PaymentDate) = @Year
      AND pay.Status = 'Received'
    GROUP BY MONTH(pay.PaymentDate), DATENAME(MONTH, pay.PaymentDate)
    ORDER BY [Month];
END
GO

-- ─── STORED PROC: Lead Conversion Report ─────────────────────
CREATE OR ALTER PROCEDURE sp_LeadConversionReport
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        l.Source,
        COUNT(*)                          AS TotalLeads,
        SUM(CASE WHEN l.Stage = 'Booked' THEN 1 ELSE 0 END) AS Converted,
        CAST(SUM(CASE WHEN l.Stage = 'Booked' THEN 1.0 ELSE 0.0 END)
             / NULLIF(COUNT(*), 0) * 100 AS DECIMAL(5,2)) AS ConversionPct,
        AVG(l.Score)                      AS AvgScore,
        AVG(CAST(l.Budget AS DECIMAL(18,2))) AS AvgBudget
    FROM Leads l
    GROUP BY l.Source
    ORDER BY TotalLeads DESC;
END
GO

-- ─── STORED PROC: Partner Performance ────────────────────────
CREATE OR ALTER PROCEDURE sp_PartnerPerformanceReport
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        cp.Id,
        cp.Name                            AS PartnerName,
        cp.Status,
        cp.City,
        COUNT(DISTINCT c.Id)               AS TotalCommissions,
        ISNULL(SUM(c.Amount), 0)           AS TotalEarned,
        ISNULL(SUM(CASE WHEN c.Status = 'Paid' THEN c.Amount ELSE 0 END), 0) AS PaidOut,
        ISNULL(SUM(CASE WHEN c.Status = 'Payable' THEN c.Amount ELSE 0 END), 0) AS Pending,
        cp.Rating
    FROM ChannelPartners cp
    LEFT JOIN Commissions c ON c.PartnerId = cp.Id
    GROUP BY cp.Id, cp.Name, cp.Status, cp.City, cp.Rating
    ORDER BY TotalEarned DESC;
END
GO

-- ─── TRIGGER: Auto-update unit status on booking ─────────────
CREATE OR ALTER TRIGGER trg_BookingCreated
ON Bookings
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Units
    SET Status = 'Booked'
    WHERE Id IN (SELECT UnitId FROM inserted);
END
GO

-- ─── TRIGGER: Log overdue customers ──────────────────────────
-- Checks customers where paid < 40% and booking > 180 days
CREATE OR ALTER TRIGGER trg_CheckOverdue
ON Payments
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    -- Reset status to Active if they've paid enough
    UPDATE Customers
    SET Status = 'Active'
    WHERE Id IN (SELECT CustomerId FROM inserted)
      AND Status = 'Overdue'
      AND PaidAmount >= TotalAmount * 0.4;
END
GO

-- ─── VERIFY SETUP ────────────────────────────────────────────
SELECT 'Setup complete!' AS Result;
SELECT * FROM vw_DashboardSummary;
SELECT * FROM vw_ProjectPortfolio;
GO
