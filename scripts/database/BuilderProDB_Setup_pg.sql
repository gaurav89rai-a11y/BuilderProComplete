-- ============================================================
--  BuilderPro ERP — PostgreSQL Database Script
--  Compatibility: PostgreSQL 14+ (Supabase / Neon / Render)
--  Run this in your PostgreSQL query editor after EF Core
--  initializes tables, to create extra performance indexes,
--  reporting views, stored functions, and triggers.
-- ============================================================

-- ─── PERFORMANCE INDEXES ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS "IX_Units_ProjectId_Status" ON "Units"("ProjectId", "Status");
CREATE INDEX IF NOT EXISTS "IX_Leads_Stage_AssignedTo" ON "Leads"("Stage", "AssignedTo");
CREATE INDEX IF NOT EXISTS "IX_Customers_Status" ON "Customers"("Status");
CREATE INDEX IF NOT EXISTS "IX_Payments_CustomerId" ON "Payments"("CustomerId");
CREATE INDEX IF NOT EXISTS "IX_SiteVisits_Status_VisitDate" ON "SiteVisits"("Status", "VisitDate");

-- ─── VIEW: Dashboard Summary ─────────────────────────────────
CREATE OR REPLACE VIEW "vw_DashboardSummary" AS
SELECT
    (SELECT COUNT(*) FROM "Projects")                                     AS "TotalProjects",
    (SELECT COUNT(*) FROM "Projects" WHERE "Status" = 'Active')            AS "ActiveProjects",
    (SELECT COUNT(*) FROM "Units")                                        AS "TotalUnits",
    (SELECT COUNT(*) FROM "Units" WHERE "Status" = 'Available')            AS "AvailableUnits",
    (SELECT COUNT(*) FROM "Units" WHERE "Status" = 'Sold')                 AS "SoldUnits",
    (SELECT COUNT(*) FROM "Units" WHERE "Status" = 'Booked')               AS "BookedUnits",
    (SELECT COUNT(*) FROM "Leads" WHERE "Stage" <> 'Booked')               AS "ActiveLeads",
    (SELECT COUNT(*) FROM "Customers")                                    AS "TotalCustomers",
    (SELECT COUNT(*) FROM "Customers" WHERE "Status" = 'Overdue')          AS "OverdueCustomers",
    (SELECT COUNT(*) FROM "ChannelPartners")                             AS "TotalPartners",
    (SELECT COALESCE(SUM("PaidAmount"), 0) FROM "Customers")             AS "TotalRevenue",
    (SELECT COUNT(*) FROM "SiteVisits" WHERE "Status" = 'Scheduled')      AS "ScheduledVisits",
    (SELECT COUNT(*) FROM "ServiceTickets" WHERE "Status" = 'Open')        AS "OpenTickets";

-- ─── VIEW: Project Portfolio ─────────────────────────────────
CREATE OR REPLACE VIEW "vw_ProjectPortfolio" AS
SELECT
    p."Id",
    p."Name",
    p."Location",
    p."ReraNumber",
    p."Status",
    p."Type",
    p."TotalUnits",
    p."ConstructionPct",
    p."TotalValue",
    COUNT(u."Id")                                                         AS "ActualUnits",
    SUM(CASE WHEN u."Status" = 'Available' THEN 1 ELSE 0 END)             AS "AvailableUnits",
    SUM(CASE WHEN u."Status" = 'Sold'      THEN 1 ELSE 0 END)             AS "SoldUnits",
    SUM(CASE WHEN u."Status" = 'Booked'    THEN 1 ELSE 0 END)             AS "BookedUnits",
    SUM(CASE WHEN u."Status" = 'Held'      THEN 1 ELSE 0 END)             AS "HeldUnits",
    COALESCE(SUM(u."Price"), 0)                                           AS "TotalInventoryValue"
FROM "Projects" p
LEFT JOIN "Units" u ON u."ProjectId" = p."Id"
GROUP BY p."Id", p."Name", p."Location", p."ReraNumber", p."Status", p."Type",
         p."TotalUnits", p."ConstructionPct", p."TotalValue";

-- ─── VIEW: Customer Payment Summary ─────────────────────────
CREATE OR REPLACE VIEW "vw_CustomerPaymentSummary" AS
SELECT
    c."Id",
    c."Name",
    c."Email",
    c."UnitNumber",
    c."Status",
    c."TotalAmount",
    c."PaidAmount",
    c."TotalAmount" - c."PaidAmount"                                       AS "PendingAmount",
    CAST(c."PaidAmount" * 100.0 / NULLIF(c."TotalAmount", 0) AS DECIMAL(5,1)) AS "PaidPct",
    p."Name"                                                               AS "ProjectName",
    c."BookingDate",
    COUNT(pay."Id")                                                        AS "PaymentCount",
    MAX(pay."PaymentDate")                                                 AS "LastPaymentDate"
FROM "Customers" c
LEFT JOIN "Projects" p ON p."Id" = c."ProjectId"
LEFT JOIN "Payments" pay ON pay."CustomerId" = c."Id"
GROUP BY c."Id", c."Name", c."Email", c."UnitNumber", c."Status",
         c."TotalAmount", c."PaidAmount", p."Name", c."BookingDate";

-- ─── VIEW: Lead Pipeline ─────────────────────────────────────
CREATE OR REPLACE VIEW "vw_LeadPipeline" AS
SELECT
    "Stage",
    COUNT(*)                              AS "LeadCount",
    AVG("Score")                          AS "AvgScore",
    SUM("Budget")                         AS "TotalPotentialValue",
    COUNT(DISTINCT "AssignedTo")          AS "AgentsWorking"
FROM "Leads"
GROUP BY "Stage";

-- ─── STORED FUNCTION: Monthly Revenue Report ─────────────────
CREATE OR REPLACE FUNCTION sp_monthly_revenue_report(p_year INT DEFAULT NULL)
RETURNS TABLE (
    "Month" DOUBLE PRECISION,
    "MonthName" TEXT,
    "PaymentCount" BIGINT,
    "TotalAmount" NUMERIC,
    "UniqueCustomers" BIGINT
) AS $$
BEGIN
    IF p_year IS NULL THEN
        p_year := EXTRACT(YEAR FROM CURRENT_DATE)::INT;
    END IF;

    RETURN QUERY
    SELECT
        EXTRACT(MONTH FROM pay."PaymentDate") AS "Month",
        TRIM(TO_CHAR(pay."PaymentDate", 'Month')) AS "MonthName",
        COUNT(pay."Id")                       AS "PaymentCount",
        COALESCE(SUM(pay."Amount"), 0)        AS "TotalAmount",
        COUNT(DISTINCT pay."CustomerId")      AS "UniqueCustomers"
    FROM "Payments" pay
    WHERE EXTRACT(YEAR FROM pay."PaymentDate") = p_year
      AND pay."Status" = 'Received'
    GROUP BY EXTRACT(MONTH FROM pay."PaymentDate"), TO_CHAR(pay."PaymentDate", 'Month')
    ORDER BY "Month";
END;
$$ LANGUAGE plpgsql;

-- ─── STORED FUNCTION: Lead Conversion Report ─────────────────
CREATE OR REPLACE FUNCTION sp_lead_conversion_report()
RETURNS TABLE (
    "Source" TEXT,
    "TotalLeads" BIGINT,
    "Converted" BIGINT,
    "ConversionPct" NUMERIC,
    "AvgScore" NUMERIC,
    "AvgBudget" NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        l."Source"::TEXT AS "Source",
        COUNT(*) AS "TotalLeads",
        SUM(CASE WHEN l."Stage" = 'Booked' THEN 1 ELSE 0 END) AS "Converted",
        ROUND(SUM(CASE WHEN l."Stage" = 'Booked' THEN 1.0 ELSE 0.0 END) / NULLIF(COUNT(*), 0) * 100, 2) AS "ConversionPct",
        ROUND(AVG(l."Score"), 2) AS "AvgScore",
        ROUND(AVG(l."Budget"), 2) AS "AvgBudget"
    FROM "Leads" l
    GROUP BY l."Source"
    ORDER BY "TotalLeads" DESC;
END;
$$ LANGUAGE plpgsql;

-- ─── STORED FUNCTION: Partner Performance Report ─────────────
CREATE OR REPLACE FUNCTION sp_partner_performance_report()
RETURNS TABLE (
    "Id" INT,
    "PartnerName" TEXT,
    "Status" TEXT,
    "City" TEXT,
    "TotalCommissions" BIGINT,
    "TotalEarned" NUMERIC,
    "PaidOut" NUMERIC,
    "Pending" NUMERIC,
    "Rating" NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        cp."Id",
        cp."Name"::TEXT AS "PartnerName",
        cp."Status"::TEXT,
        cp."City"::TEXT,
        COUNT(DISTINCT c."Id") AS "TotalCommissions",
        COALESCE(SUM(c."Amount"), 0) AS "TotalEarned",
        COALESCE(SUM(CASE WHEN c."Status" = 'Paid' THEN c."Amount" ELSE 0 END), 0) AS "PaidOut",
        COALESCE(SUM(CASE WHEN c."Status" = 'Payable' THEN c."Amount" ELSE 0 END), 0) AS "Pending",
        cp."Rating"
    FROM "ChannelPartners" cp
    LEFT JOIN "Commissions" c ON c."PartnerId" = cp."Id"
    GROUP BY cp."Id", cp."Name", cp."Status", cp."City", cp."Rating"
    ORDER BY "TotalEarned" DESC;
END;
$$ LANGUAGE plpgsql;

-- ─── TRIGGER: Auto-update unit status on booking ─────────────
CREATE OR REPLACE FUNCTION fn_trg_booking_created()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE "Units"
    SET "Status" = 'Booked'
    WHERE "Id" = NEW."UnitId";
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_booking_created ON "Bookings";
CREATE TRIGGER trg_booking_created
AFTER INSERT ON "Bookings"
FOR EACH ROW
EXECUTE FUNCTION fn_trg_booking_created();

-- ─── TRIGGER: Log overdue customers ──────────────────────────
CREATE OR REPLACE FUNCTION fn_trg_check_overdue()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE "Customers"
    SET "Status" = 'Active'
    WHERE "Id" = NEW."CustomerId"
      AND "Status" = 'Overdue'
      AND "PaidAmount" >= "TotalAmount" * 0.4;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_overdue ON "Payments";
CREATE TRIGGER trg_check_overdue
AFTER INSERT ON "Payments"
FOR EACH ROW
EXECUTE FUNCTION fn_trg_check_overdue();
