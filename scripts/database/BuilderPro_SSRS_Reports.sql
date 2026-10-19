-- ============================================================================
-- BuilderPro ERP — SQL Server Reporting Services (SSRS) Stored Procedures & Views
-- Database: BuilderProDB
-- Compatible with: Microsoft SQL Server 2016+, Azure SQL Database, SSRS 2016-2022
-- ============================================================================

USE BuilderProDB;
GO

-- ────────────────────────────────────────────────────────────────────────────
-- 1. REPORT: Executive Portfolio & Financial Summary
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR ALTER PROCEDURE dbo.sp_Rpt_ExecutiveSummary
    @ProjectId INT = NULL,
    @FromDate DATETIME = NULL,
    @ToDate DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Aggregate high-level project KPIs
    SELECT
        COUNT(DISTINCT p.Id) AS TotalProjects,
        ISNULL(SUM(p.TotalUnits), 0) AS PlannedUnits,
        ISNULL(SUM(p.TotalValue), 0) AS TotalProjectPortfolioValue,
        COUNT(DISTINCT u.Id) AS TotalActualUnits,
        SUM(CASE WHEN u.Status = 'Available' THEN 1 ELSE 0 END) AS AvailableUnits,
        SUM(CASE WHEN u.Status = 'Booked' THEN 1 ELSE 0 END) AS BookedUnits,
        SUM(CASE WHEN u.Status = 'Sold' THEN 1 ELSE 0 END) AS SoldUnits,
        (SELECT COUNT(*) FROM Leads l 
         WHERE (@ProjectId IS NULL OR l.ProjectId = @ProjectId)
           AND (@FromDate IS NULL OR l.CreatedAt >= @FromDate)
           AND (@ToDate IS NULL OR l.CreatedAt <= @ToDate)) AS TotalLeadsGenerated,
        (SELECT COUNT(*) FROM Leads l 
         WHERE l.Stage = 'Booked'
           AND (@ProjectId IS NULL OR l.ProjectId = @ProjectId)
           AND (@FromDate IS NULL OR l.CreatedAt >= @FromDate)
           AND (@ToDate IS NULL OR l.CreatedAt <= @ToDate)) AS ConvertedLeadsCount,
        (SELECT ISNULL(SUM(c.TotalAmount), 0) FROM Customers c
         WHERE (@ProjectId IS NULL OR c.ProjectId = @ProjectId)) AS TotalBookedRevenue,
        (SELECT ISNULL(SUM(c.PaidAmount), 0) FROM Customers c
         WHERE (@ProjectId IS NULL OR c.ProjectId = @ProjectId)) AS TotalCollectionsRealized,
        (SELECT ISNULL(SUM(c.TotalAmount - c.PaidAmount), 0) FROM Customers c
         WHERE (@ProjectId IS NULL OR c.ProjectId = @ProjectId)) AS TotalOutstandingReceivables,
        (SELECT COUNT(*) FROM ChannelPartners) AS ActiveChannelPartners,
        (SELECT COUNT(*) FROM ServiceTickets st 
         LEFT JOIN Customers c ON st.CustomerId = c.Id
         WHERE st.Status = 'Open'
           AND (@ProjectId IS NULL OR c.ProjectId = @ProjectId)) AS OpenServiceTickets
    FROM Projects p
    LEFT JOIN Units u ON u.ProjectId = p.Id
    WHERE (@ProjectId IS NULL OR p.Id = @ProjectId);

    -- Portfolio breakdown by individual project
    SELECT
        p.Id AS ProjectId,
        p.Name AS ProjectName,
        p.Location,
        p.ReraNumber,
        p.Status AS ProjectStatus,
        p.Type AS ProjectType,
        p.ConstructionPct,
        COUNT(u.Id) AS TotalUnits,
        SUM(CASE WHEN u.Status = 'Available' THEN 1 ELSE 0 END) AS AvailableUnits,
        SUM(CASE WHEN u.Status = 'Booked' THEN 1 ELSE 0 END) AS BookedUnits,
        SUM(CASE WHEN u.Status = 'Sold' THEN 1 ELSE 0 END) AS SoldUnits,
        ISNULL(SUM(u.Price), 0) AS TotalInventoryValue,
        ISNULL((SELECT SUM(c.PaidAmount) FROM Customers c WHERE c.ProjectId = p.Id), 0) AS RealizedCollections,
        ISNULL((SELECT SUM(c.TotalAmount - c.PaidAmount) FROM Customers c WHERE c.ProjectId = p.Id), 0) AS PendingReceivables
    FROM Projects p
    LEFT JOIN Units u ON u.ProjectId = p.Id
    WHERE (@ProjectId IS NULL OR p.Id = @ProjectId)
    GROUP BY p.Id, p.Name, p.Location, p.ReraNumber, p.Status, p.Type, p.ConstructionPct
    ORDER BY p.Name;
END;
GO

-- ────────────────────────────────────────────────────────────────────────────
-- 2. REPORT: Lead Conversion & Pipeline Funnel
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR ALTER PROCEDURE dbo.sp_Rpt_LeadConversionPipeline
    @ProjectId INT = NULL,
    @Stage NVARCHAR(50) = NULL,
    @AssignedTo NVARCHAR(100) = NULL,
    @FromDate DATETIME = NULL,
    @ToDate DATETIME = NULL,
    @Search NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        l.Id AS LeadId,
        l.Name AS LeadName,
        l.Email,
        l.Phone,
        l.Source,
        l.Stage,
        ISNULL(l.Score, 50) AS Score,
        ISNULL(l.Budget, 0) AS Budget,
        l.AssignedTo AS AssignedAgent,
        ISNULL(p.Name, 'General Inquiry') AS ProjectName,
        ISNULL(cp.Name, 'Direct / Organic') AS ChannelPartnerName,
        l.NextFollowUpDate,
        l.CreatedAt AS LeadDate,
        CASE 
            WHEN l.Stage = 'Booked' THEN 'Converted'
            WHEN l.Stage = 'Lost' OR l.Stage = 'Dropped' THEN 'Lost'
            ELSE 'Active Pipeline'
        END AS ConversionStatus
    FROM Leads l
    LEFT JOIN Projects p ON l.ProjectId = p.Id
    LEFT JOIN ChannelPartners cp ON l.ChannelPartnerId = cp.Id
    WHERE (@ProjectId IS NULL OR l.ProjectId = @ProjectId)
      AND (@Stage IS NULL OR @Stage = '' OR l.Stage = @Stage)
      AND (@AssignedTo IS NULL OR @AssignedTo = '' OR l.AssignedTo = @AssignedTo)
      AND (@FromDate IS NULL OR l.CreatedAt >= @FromDate)
      AND (@ToDate IS NULL OR l.CreatedAt <= @ToDate)
      AND (@Search IS NULL OR @Search = '' 
           OR l.Name LIKE '%' + @Search + '%' 
           OR l.Phone LIKE '%' + @Search + '%' 
           OR l.Email LIKE '%' + @Search + '%')
    ORDER BY l.CreatedAt DESC;
END;
GO

-- ────────────────────────────────────────────────────────────────────────────
-- 3. REPORT: Site Visits & Prospect Engagement
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR ALTER PROCEDURE dbo.sp_Rpt_SiteVisits
    @ProjectId INT = NULL,
    @Status NVARCHAR(50) = NULL,
    @AssignedAgent NVARCHAR(100) = NULL,
    @FromDate DATETIME = NULL,
    @ToDate DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        sv.Id AS VisitId,
        sv.LeadId,
        ISNULL(l.Name, 'Walk-in Visitor') AS VisitorName,
        ISNULL(l.Phone, 'N/A') AS ContactNumber,
        ISNULL(p.Name, 'Not Specified') AS ProjectName,
        sv.VisitDate,
        sv.VisitTime,
        sv.Status AS VisitStatus,
        sv.AssignedAgent,
        sv.Interest,
        ISNULL(sv.Notes, 'No feedback logged') AS FeedbackNotes,
        sv.CreatedAt
    FROM SiteVisits sv
    LEFT JOIN Leads l ON sv.LeadId = l.Id
    LEFT JOIN Projects p ON sv.ProjectId = p.Id
    WHERE (@ProjectId IS NULL OR sv.ProjectId = @ProjectId)
      AND (@Status IS NULL OR @Status = '' OR sv.Status = @Status)
      AND (@AssignedAgent IS NULL OR @AssignedAgent = '' OR sv.AssignedAgent = @AssignedAgent)
      AND (@FromDate IS NULL OR sv.VisitDate >= @FromDate)
      AND (@ToDate IS NULL OR sv.VisitDate <= @ToDate)
    ORDER BY sv.VisitDate DESC;
END;
GO

-- ────────────────────────────────────────────────────────────────────────────
-- 4. REPORT: Collections & Financial Realization Ledger
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR ALTER PROCEDURE dbo.sp_Rpt_FinancialCollections
    @ProjectId INT = NULL,
    @PaymentMode NVARCHAR(50) = NULL,
    @Status NVARCHAR(50) = NULL,
    @FromDate DATETIME = NULL,
    @ToDate DATETIME = NULL,
    @Search NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        pay.Id AS PaymentId,
        CONCAT('RCP-', pay.Id) AS ReceiptNumber,
        pay.PaymentDate,
        c.Name AS CustomerName,
        c.Phone AS CustomerPhone,
        c.UnitNumber,
        ISNULL(p.Name, 'Abhay Buildcon Project') AS ProjectName,
        pay.Amount,
        pay.PaymentMode,
        ISNULL(pay.Remarks, '-') AS TransactionReference,
        ISNULL(pay.Status, 'Received') AS PaymentStatus,
        c.TotalAmount AS CustomerTotalAgreement,
        c.PaidAmount AS CustomerCumulativePaid
    FROM Payments pay
    INNER JOIN Customers c ON pay.CustomerId = c.Id
    LEFT JOIN Projects p ON c.ProjectId = p.Id
    WHERE (@ProjectId IS NULL OR c.ProjectId = @ProjectId)
      AND (@PaymentMode IS NULL OR @PaymentMode = '' OR pay.PaymentMode = @PaymentMode)
      AND (@Status IS NULL OR @Status = '' OR pay.Status = @Status)
      AND (@FromDate IS NULL OR pay.PaymentDate >= @FromDate)
      AND (@ToDate IS NULL OR pay.PaymentDate <= @ToDate)
      AND (@Search IS NULL OR @Search = '' 
           OR c.Name LIKE '%' + @Search + '%' 
           OR pay.Remarks LIKE '%' + @Search + '%')
    ORDER BY pay.PaymentDate DESC;
END;
GO

-- ────────────────────────────────────────────────────────────────────────────
-- 5. REPORT: Customer Receivables & Outstanding Aging
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR ALTER PROCEDURE dbo.sp_Rpt_CustomerReceivables
    @ProjectId INT = NULL,
    @Status NVARCHAR(50) = NULL,
    @Search NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        c.Id AS CustomerId,
        c.Name AS CustomerName,
        c.Email,
        c.Phone,
        c.UnitNumber,
        ISNULL(p.Name, 'General Portfolio') AS ProjectName,
        c.BookingDate,
        c.TotalAmount AS TotalContractValue,
        c.PaidAmount AS TotalPaid,
        (c.TotalAmount - c.PaidAmount) AS OutstandingBalance,
        CAST(CASE WHEN c.TotalAmount > 0 THEN (c.PaidAmount * 100.0 / c.TotalAmount) ELSE 0 END AS DECIMAL(5,1)) AS PaidPercentage,
        c.Status AS CustomerStatus,
        DATEDIFF(day, c.BookingDate, GETDATE()) AS DaysSinceBooking,
        (SELECT MAX(pay.PaymentDate) FROM Payments pay WHERE pay.CustomerId = c.Id) AS LastPaymentDate
    FROM Customers c
    LEFT JOIN Projects p ON c.ProjectId = p.Id
    WHERE (@ProjectId IS NULL OR c.ProjectId = @ProjectId)
      AND (@Status IS NULL OR @Status = '' OR c.Status = @Status)
      AND (@Search IS NULL OR @Search = '' 
           OR c.Name LIKE '%' + @Search + '%' 
           OR c.UnitNumber LIKE '%' + @Search + '%'
           OR c.Phone LIKE '%' + @Search + '%')
    ORDER BY (c.TotalAmount - c.PaidAmount) DESC;
END;
GO

-- ────────────────────────────────────────────────────────────────────────────
-- 6. REPORT: Channel Partner Commission & Sourcing Ledger
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR ALTER PROCEDURE dbo.sp_Rpt_ChannelPartnerCommission
    @PartnerId INT = NULL,
    @Status NVARCHAR(50) = NULL,
    @FromDate DATETIME = NULL,
    @ToDate DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        cp.Id AS PartnerId,
        cp.Name AS PartnerFirmName,
        cp.ContactPerson,
        cp.Phone,
        cp.Email,
        cp.City,
        cp.Status AS PartnerTier,
        cp.CommissionRate AS ContractedRatePct,
        cp.Rating,
        COUNT(DISTINCT l.Id) AS TotalLeadsSubmitted,
        COUNT(DISTINCT comm.BookingId) AS TotalDealsBooked,
        ISNULL(SUM(comm.Amount), 0) AS TotalCommissionEarned,
        ISNULL(SUM(CASE WHEN comm.Status = 'Paid' THEN comm.Amount ELSE 0 END), 0) AS CommissionPaidOut,
        ISNULL(SUM(CASE WHEN comm.Status = 'Payable' THEN comm.Amount ELSE 0 END), 0) AS CommissionPending,
        ISNULL(SUM(CASE WHEN comm.Status = 'Pending Approval' THEN comm.Amount ELSE 0 END), 0) AS CommissionInVerification
    FROM ChannelPartners cp
    LEFT JOIN Leads l ON l.ChannelPartnerId = cp.Id
    LEFT JOIN Commissions comm ON comm.PartnerId = cp.Id
        AND (@Status IS NULL OR @Status = '' OR comm.Status = @Status)
        AND (@FromDate IS NULL OR comm.CreatedAt >= @FromDate)
        AND (@ToDate IS NULL OR comm.CreatedAt <= @ToDate)
    WHERE (@PartnerId IS NULL OR cp.Id = @PartnerId)
    GROUP BY cp.Id, cp.Name, cp.ContactPerson, cp.Phone, cp.Email, cp.City, cp.Status, cp.CommissionRate, cp.Rating
    ORDER BY TotalCommissionEarned DESC;
END;
GO

-- ────────────────────────────────────────────────────────────────────────────
-- 7. REPORT: Unit Inventory & Availability Matrix
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR ALTER PROCEDURE dbo.sp_Rpt_UnitInventoryStatus
    @ProjectId INT = NULL,
    @Status NVARCHAR(50) = NULL,
    @UnitType NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        u.Id AS UnitId,
        u.UnitNumber,
        ISNULL(p.Name, 'Unassigned Project') AS ProjectName,
        p.Location AS ProjectLocation,
        u.UnitType,
        u.Floor,
        u.Area AS CarpetAreaSqFt,
        u.Price AS UnitPrice,
        u.Status AS UnitStatus,
        c.Name AS OccupantCustomer,
        c.BookingDate AS CustomerBookingDate
    FROM Units u
    INNER JOIN Projects p ON u.ProjectId = p.Id
    LEFT JOIN Customers c ON c.UnitNumber = u.UnitNumber AND c.ProjectId = p.Id
    WHERE (@ProjectId IS NULL OR u.ProjectId = @ProjectId)
      AND (@Status IS NULL OR @Status = '' OR u.Status = @Status)
      AND (@UnitType IS NULL OR @UnitType = '' OR u.UnitType = @UnitType)
    ORDER BY p.Name, u.Floor, u.UnitNumber;
END;
GO

-- ────────────────────────────────────────────────────────────────────────────
-- 8. REPORT: User Security, Roles & Permissions Audit
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR ALTER PROCEDURE dbo.sp_Rpt_UserRoleAudit
    @Role NVARCHAR(50) = NULL,
    @Search NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        u.Id AS UserId,
        u.Name AS FullName,
        u.Email,
        u.Role,
        ISNULL(u.Permissions, '') AS Permissions,
        u.ChannelPartnerId,
        cp.Name AS AssociatedPartnerFirm,
        cp.City AS PartnerCity,
        u.CreatedAt
    FROM Users u
    LEFT JOIN ChannelPartners cp ON u.ChannelPartnerId = cp.Id
    WHERE (@Role IS NULL OR @Role = '' OR u.Role = @Role)
      AND (@Search IS NULL OR @Search = '' 
           OR u.Name LIKE '%' + @Search + '%' 
           OR u.Email LIKE '%' + @Search + '%' 
           OR cp.Name LIKE '%' + @Search + '%')
    ORDER BY u.Role, u.Name;
END;
GO
