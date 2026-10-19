-- ============================================================================
-- BuilderPro CRM - Seed Permissions Matrix & Role-Permission Mappings
-- Safe & Idempotent script for SQL Server
-- ============================================================================

USE BuilderProDB;
GO

-- Helper procedure to add permission if not exists
CREATE OR ALTER PROCEDURE #AddPermission
    @Code NVARCHAR(100),
    @Module NVARCHAR(100),
    @Submenu NVARCHAR(100),
    @Action NVARCHAR(100),
    @Name NVARCHAR(150),
    @Description NVARCHAR(500),
    @Category NVARCHAR(100),
    @IsSensitive BIT,
    @SortOrder INT
AS
BEGIN
    IF NOT EXISTS (SELECT 1 FROM Permissions WHERE Code = @Code)
    BEGIN
        INSERT INTO Permissions (Code, Module, Submenu, Action, Name, Description, Category, IsSensitive, SortOrder)
        VALUES (@Code, @Module, @Submenu, @Action, @Name, @Description, @Category, @IsSensitive, @SortOrder);
    END
    ELSE
    BEGIN
        UPDATE Permissions 
        SET Module = @Module, Submenu = @Submenu, Action = @Action, 
            Name = @Name, Description = @Description, Category = @Category, 
            IsSensitive = @IsSensitive, SortOrder = @SortOrder
        WHERE Code = @Code;
    END
END;
GO

-- ────────────────────────────────────────────────────────────────────────────
-- 1. SEED ALL PERMISSIONS
-- ────────────────────────────────────────────────────────────────────────────

-- CRM / Leads
EXEC #AddPermission 'crm.leads.view', 'CRM', 'Leads', 'View', 'View Leads', 'View leads and pipeline data', 'CRM', 0, 10;
EXEC #AddPermission 'crm.leads.create', 'CRM', 'Leads', 'Create', 'Create Leads', 'Add new sales leads into CRM', 'CRM', 0, 11;
EXEC #AddPermission 'crm.leads.edit', 'CRM', 'Leads', 'Edit', 'Edit Leads', 'Update lead details, notes and call history', 'CRM', 0, 12;
EXEC #AddPermission 'crm.leads.delete', 'CRM', 'Leads', 'Delete', 'Delete Leads', 'Permanently delete leads', 'CRM', 0, 13;
EXEC #AddPermission 'crm.leads.search_filter', 'CRM', 'Leads', 'Search / Filter', 'Search & Filter Leads', 'Filter leads by project, budget, stage', 'CRM', 0, 14;
EXEC #AddPermission 'crm.leads.assign_reassign', 'CRM', 'Leads', 'Assign / Reassign', 'Assign & Reassign Leads', 'Transfer lead ownership to sales agents', 'CRM', 0, 15;
EXEC #AddPermission 'crm.leads.change_status', 'CRM', 'Leads', 'Change Status', 'Change Lead Stage', 'Transition lead through pipeline stages', 'CRM', 0, 16;
EXEC #AddPermission 'crm.leads.import_export', 'CRM', 'Leads', 'Import / Export', 'Import & Export Leads', 'Bulk CSV export/import of leads', 'CRM', 0, 17;
EXEC #AddPermission 'crm.leads.upload_download', 'CRM', 'Leads', 'Upload / Download', 'Upload & Download Lead Files', 'Attach KYC and documents to leads', 'CRM', 0, 18;
EXEC #AddPermission 'crm.leads.view_sensitive_data', 'CRM', 'Leads', 'View Sensitive Data', 'View Sensitive Lead Data', 'View client PAN, budget, confidential notes', 'Security', 1, 19;

-- CRM / Bookings
EXEC #AddPermission 'crm.bookings.view', 'CRM', 'Bookings', 'View', 'View Bookings', 'View active customer flat bookings and registry', 'CRM', 0, 20;
EXEC #AddPermission 'crm.bookings.create', 'CRM', 'Bookings', 'Create', 'Create Booking', 'Create new unit flat bookings', 'CRM', 0, 21;
EXEC #AddPermission 'crm.bookings.edit', 'CRM', 'Bookings', 'Edit', 'Edit Booking', 'Modify booking pricing, terms, agent assignments', 'CRM', 0, 22;
EXEC #AddPermission 'crm.bookings.delete', 'CRM', 'Bookings', 'Delete', 'Cancel & Delete Booking', 'Revoke or cancel bookings', 'CRM', 0, 23;
EXEC #AddPermission 'crm.bookings.search_filter', 'CRM', 'Bookings', 'Search / Filter', 'Search Bookings', 'Search bookings by unit, buyer, project', 'CRM', 0, 24;
EXEC #AddPermission 'crm.bookings.approve_reject', 'CRM', 'Bookings', 'Approve / Reject', 'Approve & Confirm Booking', 'Approve booking discounts and confirmation', 'Approvals', 0, 25;
EXEC #AddPermission 'crm.bookings.change_status', 'CRM', 'Bookings', 'Change Status', 'Change Booking Status', 'Transition between Confirmed and Signed', 'CRM', 0, 26;
EXEC #AddPermission 'crm.bookings.upload_download', 'CRM', 'Bookings', 'Upload / Download', 'Upload & Download Agreement', 'Manage signed agreement PDFs and deeds', 'CRM', 0, 27;
EXEC #AddPermission 'crm.bookings.print', 'CRM', 'Bookings', 'Print', 'Print Allotment & Agreement', 'Print and export allotment letter', 'CRM', 0, 28;
EXEC #AddPermission 'crm.bookings.view_sensitive_data', 'CRM', 'Bookings', 'View Sensitive Data', 'View Booking Financial Secrets', 'View confidential payment terms and discounts', 'Security', 1, 29;

-- CRM / Customers
EXEC #AddPermission 'crm.customers.view', 'CRM', 'Customers', 'View', 'View Customers', 'Access customer directory and profiles', 'CRM', 0, 30;
EXEC #AddPermission 'crm.customers.create', 'CRM', 'Customers', 'Create', 'Create Customer', 'Register new buyers into customer base', 'CRM', 0, 31;
EXEC #AddPermission 'crm.customers.edit', 'CRM', 'Customers', 'Edit', 'Edit Customer', 'Update contact, address, co-applicant details', 'CRM', 0, 32;
EXEC #AddPermission 'crm.customers.delete', 'CRM', 'Customers', 'Delete', 'Delete Customer', 'Delete customer records', 'CRM', 0, 33;
EXEC #AddPermission 'crm.customers.search_filter', 'CRM', 'Customers', 'Search / Filter', 'Search Customers', 'Filter customer directory', 'CRM', 0, 34;
EXEC #AddPermission 'crm.customers.view_sensitive_data', 'CRM', 'Customers', 'View Sensitive Data', 'View Sensitive Customer Data', 'View Aadhaar, PAN numbers and loan data', 'Security', 1, 35;

-- CRM / Site Visits & Follow-ups
EXEC #AddPermission 'crm.visits.view', 'CRM', 'Site Visits', 'View', 'View Site Visits', 'View visit schedules and feedback', 'CRM', 0, 40;
EXEC #AddPermission 'crm.visits.create', 'CRM', 'Site Visits', 'Create', 'Schedule Site Visit', 'Book new client site visits to towers', 'CRM', 0, 41;
EXEC #AddPermission 'crm.visits.edit', 'CRM', 'Site Visits', 'Edit', 'Update Visit Details', 'Modify visit times and vehicle pickup', 'CRM', 0, 42;
EXEC #AddPermission 'crm.visits.delete', 'CRM', 'Site Visits', 'Delete', 'Cancel Visit', 'Cancel or remove site visit records', 'CRM', 0, 43;
EXEC #AddPermission 'crm.visits.change_status', 'CRM', 'Site Visits', 'Change Status', 'Update Visit Status', 'Mark visit Completed or Cancelled', 'CRM', 0, 44;

-- CRM / Channel Partners
EXEC #AddPermission 'crm.partners.view', 'CRM', 'Channel Partners', 'View', 'View Channel Partners', 'Browse partner brokers and tier rankings', 'CRM', 0, 50;
EXEC #AddPermission 'crm.partners.create', 'CRM', 'Channel Partners', 'Create', 'Onboard Channel Partner', 'Register new partner agency firm', 'CRM', 0, 51;
EXEC #AddPermission 'crm.partners.edit', 'CRM', 'Channel Partners', 'Edit', 'Edit Channel Partner', 'Update partner firm, contact, commission rate', 'CRM', 0, 52;
EXEC #AddPermission 'crm.partners.delete', 'CRM', 'Channel Partners', 'Delete', 'Deactivate Partner', 'Deactivate partner association', 'CRM', 0, 53;
EXEC #AddPermission 'crm.partners.approve_reject', 'CRM', 'Channel Partners', 'Approve / Reject', 'Verify & Approve Partner', 'Approve RERA broker verification', 'Approvals', 0, 54;
EXEC #AddPermission 'crm.partners.view_sensitive_data', 'CRM', 'Channel Partners', 'View Sensitive Data', 'View Partner Financials', 'View commission rates and bank account details', 'Security', 1, 55;

-- Construction / Projects & Inventory
EXEC #AddPermission 'construction.projects.view', 'Construction', 'Projects', 'View', 'View Projects', 'View real estate projects and master plans', 'Construction', 0, 60;
EXEC #AddPermission 'construction.projects.create', 'Construction', 'Projects', 'Create', 'Create Project', 'Launch new tower/township development', 'Construction', 0, 61;
EXEC #AddPermission 'construction.projects.edit', 'Construction', 'Projects', 'Edit', 'Edit Project', 'Update project milestones, RERA info', 'Construction', 0, 62;
EXEC #AddPermission 'construction.projects.delete', 'Construction', 'Projects', 'Delete', 'Delete Project', 'Remove development project', 'Construction', 0, 63;
EXEC #AddPermission 'construction.units.view', 'Construction', 'Units', 'View', 'View Units Inventory', 'Browse flats, shops and unit availability', 'Construction', 0, 64;
EXEC #AddPermission 'construction.units.create', 'Construction', 'Units', 'Create', 'Add Unit / Flat', 'Add flats, pricing and square footage', 'Construction', 0, 65;
EXEC #AddPermission 'construction.units.edit', 'Construction', 'Units', 'Edit', 'Edit Unit / Flat', 'Modify floor plan, price, area, view', 'Construction', 0, 66;
EXEC #AddPermission 'construction.units.delete', 'Construction', 'Units', 'Delete', 'Delete Unit', 'Remove flat inventory entry', 'Construction', 0, 67;
EXEC #AddPermission 'construction.units.change_status', 'Construction', 'Units', 'Change Status', 'Change Unit Status', 'Toggle unit between Available, Held, Booked, Sold', 'Construction', 0, 68;
EXEC #AddPermission 'construction.daily_progress.view', 'Construction', 'Daily Progress', 'View', 'View Progress Logs', 'View daily construction reports and logs', 'Construction', 0, 69;
EXEC #AddPermission 'construction.daily_progress.create', 'Construction', 'Daily Progress', 'Create', 'Log Daily Progress', 'Submit daily site execution logs', 'Construction', 0, 70;

-- Finance / Payments, Invoices & Commissions
EXEC #AddPermission 'finance.payments.view', 'Finance', 'Receipts', 'View', 'View Receipts & Payments', 'View payment transaction ledger', 'Finance', 0, 80;
EXEC #AddPermission 'finance.payments.create', 'Finance', 'Receipts', 'Create', 'Record Receipt / Payment', 'Record new token, installment payment', 'Finance', 0, 81;
EXEC #AddPermission 'finance.payments.edit', 'Finance', 'Receipts', 'Edit', 'Edit Payment Entry', 'Modify payment mode, reference ID, remarks', 'Finance', 0, 82;
EXEC #AddPermission 'finance.payments.delete', 'Finance', 'Receipts', 'Delete', 'Delete Payment Entry', 'Void or delete transaction ledger entry', 'Finance', 0, 83;
EXEC #AddPermission 'finance.payments.approve_reject', 'Finance', 'Receipts', 'Approve / Reject', 'Approve Payment Clearance', 'Confirm cheque/NEFT bank reconciliation', 'Finance', 0, 84;
EXEC #AddPermission 'finance.payments.print', 'Finance', 'Receipts', 'Print', 'Print Payment Receipt', 'Generate and print official payment receipts', 'Finance', 0, 85;
EXEC #AddPermission 'finance.payments.view_sensitive_data', 'Finance', 'Receipts', 'View Sensitive Data', 'View Bank Transaction Secrets', 'View bank accounts, transaction balances', 'Security', 1, 86;
EXEC #AddPermission 'finance.payment_schedule.view', 'Finance', 'Payment Schedule', 'View', 'View Installment Schedules', 'View milestone-linked installment plans', 'Finance', 0, 87;
EXEC #AddPermission 'finance.payment_schedule.edit', 'Finance', 'Payment Schedule', 'Edit', 'Configure Installments', 'Modify payment milestones and due dates', 'Finance', 0, 88;
EXEC #AddPermission 'finance.invoices.view', 'Finance', 'Invoices', 'View', 'View Invoices', 'Access buyer GST tax invoices', 'Finance', 0, 89;
EXEC #AddPermission 'finance.invoices.create', 'Finance', 'Invoices', 'Create', 'Generate Tax Invoice', 'Issue demand letters and GST invoices', 'Finance', 0, 90;
EXEC #AddPermission 'finance.expenses.view', 'Finance', 'Expenses', 'View', 'View Expenses', 'View operational and site expenditure logs', 'Finance', 0, 91;
EXEC #AddPermission 'finance.expenses.create', 'Finance', 'Expenses', 'Create', 'Record Expense', 'Enter project construction expenses', 'Finance', 0, 92;
EXEC #AddPermission 'finance.commissions.view', 'Finance', 'Commissions', 'View', 'View Broker Commissions', 'View partner commission ledger', 'Finance', 0, 93;
EXEC #AddPermission 'finance.commissions.create', 'Finance', 'Commissions', 'Create', 'Calculate Commission', 'Generate commission bills on closed deals', 'Finance', 0, 94;
EXEC #AddPermission 'finance.commissions.approve_reject', 'Finance', 'Commissions', 'Approve / Reject', 'Approve Commission Payout', 'Authorize commission release to partners', 'Approvals', 0, 95;

-- OMS / Materials & Store
EXEC #AddPermission 'oms.material_master.view', 'OMS', 'Material Master', 'View', 'View Material Master', 'View construction material catalogue', 'OMS', 0, 100;
EXEC #AddPermission 'oms.material_master.create', 'OMS', 'Material Master', 'Create', 'Add Material Item', 'Define new materials, grades and HSN codes', 'OMS', 0, 101;
EXEC #AddPermission 'oms.material_master.edit', 'OMS', 'Material Master', 'Edit', 'Edit Material Item', 'Update units, variants, GST rates', 'OMS', 0, 102;
EXEC #AddPermission 'oms.stock.view', 'OMS', 'Stock', 'View', 'View Stock Levels', 'View warehouse inventory and stock reorders', 'OMS', 0, 103;
EXEC #AddPermission 'oms.orders.view', 'OMS', 'Procurement', 'View', 'View Purchase Orders', 'View procurement POs and delivery schedules', 'OMS', 0, 104;
EXEC #AddPermission 'oms.orders.create', 'OMS', 'Procurement', 'Create', 'Create Purchase Order', 'Draft new vendor purchase orders', 'OMS', 0, 105;
EXEC #AddPermission 'oms.vendors.view', 'OMS', 'Vendors', 'View', 'View Vendors', 'View supplier contacts and GSTINs', 'OMS', 0, 106;

-- HRMS
EXEC #AddPermission 'hrms.employees.view', 'HRMS', 'Employees', 'View', 'View Employees', 'Browse staff directory and designations', 'HRMS', 0, 110;
EXEC #AddPermission 'hrms.employees.create', 'HRMS', 'Employees', 'Create', 'Add Employee', 'Onboard company personnel', 'HRMS', 0, 111;
EXEC #AddPermission 'hrms.employees.edit', 'HRMS', 'Employees', 'Edit', 'Edit Employee', 'Update salary, role, contact info', 'HRMS', 0, 112;
EXEC #AddPermission 'hrms.employees.view_sensitive_data', 'HRMS', 'Employees', 'View Sensitive Data', 'View Salary & HR Records', 'View confidential payroll and identity records', 'Security', 1, 113;
EXEC #AddPermission 'hrms.attendance.view', 'HRMS', 'Attendance', 'View', 'View Attendance', 'View employee attendance logs', 'HRMS', 0, 114;
EXEC #AddPermission 'hrms.leaves.view', 'HRMS', 'Leaves', 'View', 'View Leave Applications', 'View pending leave requests', 'HRMS', 0, 115;
EXEC #AddPermission 'hrms.leaves.approve_reject', 'HRMS', 'Leaves', 'Approve / Reject', 'Approve / Reject Leaves', 'Sanction casual and sick leaves', 'Approvals', 0, 116;

-- Customer Support
EXEC #AddPermission 'support.tickets.view', 'Support', 'Tickets', 'View', 'View Support Tickets', 'Track resident and buyer support requests', 'Support', 0, 120;
EXEC #AddPermission 'support.tickets.create', 'Support', 'Tickets', 'Create', 'Create Support Ticket', 'Log maintenance and possession issues', 'Support', 0, 121;
EXEC #AddPermission 'support.tickets.edit', 'Support', 'Tickets', 'Edit', 'Resolve Tickets', 'Assign technician and post resolutions', 'Support', 0, 122;

-- Reports & BI
EXEC #AddPermission 'reports.bi.view', 'Reports', 'BI & Analytics', 'View', 'View BI Reports', 'Access SSRS and analytics dashboards', 'Reports', 0, 130;
EXEC #AddPermission 'reports.bi.export', 'Reports', 'BI & Analytics', 'Import / Export', 'Export Reports (PDF/Excel)', 'Export reports to PDF, Excel, CSV formats', 'Reports', 0, 131;
EXEC #AddPermission 'reports.bi.print', 'Reports', 'BI & Analytics', 'Print', 'Print Reports', 'Print management summaries and statements', 'Reports', 0, 132;
EXEC #AddPermission 'reports.bi.view_sensitive_data', 'Reports', 'BI & Analytics', 'View Sensitive Data', 'View Financial BI Metrics', 'Access executive revenue and profit metrics', 'Security', 1, 133;

-- ────────────────────────────────────────────────────────────────────────────
-- ADMINISTRATION MODULE PERMISSIONS (Section 1 of requirements)
-- ────────────────────────────────────────────────────────────────────────────
EXEC #AddPermission 'administration.users.view', 'Administration', 'User Management', 'View', 'View Users', 'Browse system user accounts', 'Admin', 0, 140;
EXEC #AddPermission 'administration.users.create', 'Administration', 'User Management', 'Create', 'Create User', 'Provision new staff or partner user accounts', 'Admin', 0, 141;
EXEC #AddPermission 'administration.users.edit', 'Administration', 'User Management', 'Edit', 'Edit User', 'Update user profiles, emails and assignments', 'Admin', 0, 142;
EXEC #AddPermission 'administration.users.delete', 'Administration', 'User Management', 'Delete', 'Delete User', 'Remove user accounts', 'Admin', 0, 143;
EXEC #AddPermission 'administration.users.assign_reassign', 'Administration', 'User Management', 'Assign / Reassign', 'Assign User Roles', 'Assign system roles to user accounts', 'Admin', 0, 144;
EXEC #AddPermission 'administration.users.activate_deactivate', 'Administration', 'User Management', 'Activate / Deactivate', 'Deactivate / Lock User', 'Disable user login access', 'Admin', 0, 145;

EXEC #AddPermission 'administration.roles.view', 'Administration', 'Role Management', 'View', 'View Roles', 'View enterprise role directory', 'Admin', 0, 150;
EXEC #AddPermission 'administration.roles.create', 'Administration', 'Role Management', 'Create', 'Create Role', 'Create new custom enterprise roles', 'Admin', 0, 151;
EXEC #AddPermission 'administration.roles.edit', 'Administration', 'Role Management', 'Edit', 'Edit Role', 'Update role name, color, description', 'Admin', 0, 152;
EXEC #AddPermission 'administration.roles.delete', 'Administration', 'Role Management', 'Delete', 'Delete Custom Role', 'Delete unassigned custom roles', 'Admin', 0, 153;

EXEC #AddPermission 'administration.permissions.view', 'Administration', 'Roles & Permissions', 'View', 'View Permissions Matrix', 'Inspect role and user permission assignments', 'Admin', 0, 160;
EXEC #AddPermission 'administration.permissions.manage', 'Administration', 'Roles & Permissions', 'Manage Permissions', 'Configure Permissions', 'Modify role permissions and user overrides', 'Admin', 1, 161;

EXEC #AddPermission 'administration.departments.view', 'Administration', 'Department & Teams', 'View', 'View Departments', 'View company department structure', 'Admin', 0, 170;
EXEC #AddPermission 'administration.departments.create', 'Administration', 'Department & Teams', 'Create', 'Create Department', 'Add company department or team', 'Admin', 0, 171;
EXEC #AddPermission 'administration.departments.edit', 'Administration', 'Department & Teams', 'Edit', 'Edit Department', 'Update department managers and hierarchy', 'Admin', 0, 172;

EXEC #AddPermission 'administration.statuses.view', 'Administration', 'Status Management', 'View', 'View Lifecycle Statuses', 'View stages for leads, units, bookings', 'Admin', 0, 180;
EXEC #AddPermission 'administration.statuses.edit', 'Administration', 'Status Management', 'Configure Settings', 'Configure Statuses', 'Add and update dropdown status codes', 'Admin', 0, 181;

EXEC #AddPermission 'administration.masters.view', 'Administration', 'Master Data', 'View', 'View Masters', 'View system master data records', 'Admin', 0, 190;
EXEC #AddPermission 'administration.masters.edit', 'Administration', 'Master Data', 'Configure Settings', 'Configure Masters', 'Modify bank masters, GST slabs, units', 'Admin', 0, 191;

EXEC #AddPermission 'administration.workflows.view', 'Administration', 'Workflow & Approvals', 'View', 'View Workflows', 'Inspect approval rules and escalation policies', 'Admin', 0, 200;
EXEC #AddPermission 'administration.workflows.edit', 'Administration', 'Workflow & Approvals', 'Configure Settings', 'Configure Workflows', 'Set discount thresholds and approval limits', 'Admin', 0, 201;

EXEC #AddPermission 'administration.notifications.view', 'Administration', 'Notifications', 'View', 'View Notification Rules', 'View SMS, Email and webhook triggers', 'Admin', 0, 210;
EXEC #AddPermission 'administration.notifications.configure_settings', 'Administration', 'Notifications', 'Configure Settings', 'Configure Notifications', 'Manage SMS and WhatsApp notification templates', 'Admin', 0, 211;

EXEC #AddPermission 'administration.audit_logs.view', 'Administration', 'Audit Logs', 'View', 'View Audit Trail', 'Inspect audit history and security events', 'Admin', 0, 220;
EXEC #AddPermission 'administration.audit_logs.import_export', 'Administration', 'Audit Logs', 'Import / Export', 'Export Audit Logs', 'Download compliance security audit trail', 'Admin', 0, 221;

EXEC #AddPermission 'administration.system_settings.view', 'Administration', 'System Settings', 'View', 'View System Settings', 'View enterprise branding and ERP preferences', 'Admin', 0, 230;
EXEC #AddPermission 'administration.system_settings.configure_settings', 'Administration', 'System Settings', 'Configure Settings', 'Configure System Settings', 'Update company logo, fiscal year, defaults', 'Admin', 0, 231;

EXEC #AddPermission 'administration.import_export.view', 'Administration', 'Import/Export Settings', 'View', 'View Import/Export', 'View data migration templates and logs', 'Admin', 0, 240;
EXEC #AddPermission 'administration.import_export.configure_settings', 'Administration', 'Import/Export Settings', 'Configure Settings', 'Configure Import/Export', 'Manage bulk data mappings and schedules', 'Admin', 0, 241;

EXEC #AddPermission 'administration.documents.view', 'Administration', 'Document Management', 'View', 'View Documents Archive', 'View all enterprise legal documents', 'Admin', 0, 250;
EXEC #AddPermission 'administration.documents.upload_download', 'Administration', 'Document Management', 'Upload / Download', 'Upload & Download Documents', 'Manage project deeds and KYC store', 'Admin', 0, 251;
EXEC #AddPermission 'administration.documents.delete', 'Administration', 'Document Management', 'Delete', 'Delete Documents', 'Purge archived document records', 'Admin', 0, 252;

EXEC #AddPermission 'administration.reports_settings.view', 'Administration', 'Reports & Dashboards', 'View', 'View Dashboard Settings', 'Inspect SSRS catalog and widget configs', 'Admin', 0, 260;
EXEC #AddPermission 'administration.reports_settings.configure_settings', 'Administration', 'Reports & Dashboards', 'Configure Settings', 'Configure Dashboard Settings', 'Customize KPI cards and reporting endpoints', 'Admin', 0, 261;
GO

DROP PROCEDURE #AddPermission;
GO

PRINT 'Permissions seeded successfully.';
GO

-- ────────────────────────────────────────────────────────────────────────────
-- 2. SEED DEFAULT ROLE-PERMISSION MAPPINGS FOR THE 5 STANDARD ROLES
-- ────────────────────────────────────────────────────────────────────────────

DECLARE @SuperAdminRoleId INT = (SELECT Id FROM Roles WHERE Name = 'Super Admin');
DECLARE @SalesManagerRoleId INT = (SELECT Id FROM Roles WHERE Name = 'Sales Manager');
DECLARE @SalesAgentRoleId INT = (SELECT Id FROM Roles WHERE Name = 'Sales Agent');
DECLARE @AccountsRoleId INT = (SELECT Id FROM Roles WHERE Name = 'Accounts');
DECLARE @ChannelPartnerRoleId INT = (SELECT Id FROM Roles WHERE Name = 'Channel Partner');

-- A) Super Admin: ALL permissions
INSERT INTO RolePermissions (RoleId, PermissionId, IsGranted)
SELECT @SuperAdminRoleId, P.Id, 1
FROM Permissions P
WHERE NOT EXISTS (
    SELECT 1 FROM RolePermissions RP 
    WHERE RP.RoleId = @SuperAdminRoleId AND RP.PermissionId = P.Id
);

-- B) Sales Manager: CRM (all except sensitive), Construction View/Units, Reports, HRMS View
INSERT INTO RolePermissions (RoleId, PermissionId, IsGranted)
SELECT @SalesManagerRoleId, P.Id, 1
FROM Permissions P
WHERE (
    P.Code LIKE 'crm.leads.%'
    OR P.Code LIKE 'crm.bookings.%'
    OR P.Code LIKE 'crm.customers.%'
    OR P.Code LIKE 'crm.visits.%'
    OR P.Code LIKE 'crm.partners.%'
    OR P.Code IN ('construction.projects.view', 'construction.units.view', 'construction.units.search_filter', 'construction.daily_progress.view')
    OR P.Code IN ('reports.bi.view', 'reports.bi.export', 'reports.bi.print')
    OR P.Code = 'hrms.employees.view'
    OR P.Code = 'support.tickets.view'
)
AND P.IsSensitive = 0
AND NOT EXISTS (
    SELECT 1 FROM RolePermissions RP 
    WHERE RP.RoleId = @SalesManagerRoleId AND RP.PermissionId = P.Id
);

-- C) Sales Agent: Assigned Leads, Bookings, Customers, Visits, Inventory View
INSERT INTO RolePermissions (RoleId, PermissionId, IsGranted)
SELECT @SalesAgentRoleId, P.Id, 1
FROM Permissions P
WHERE (
    P.Code IN (
        'crm.leads.view', 'crm.leads.create', 'crm.leads.edit', 'crm.leads.search_filter', 'crm.leads.change_status', 'crm.leads.upload_download',
        'crm.bookings.view', 'crm.bookings.create', 'crm.bookings.upload_download', 'crm.bookings.print',
        'crm.customers.view', 'crm.customers.create', 'crm.customers.edit', 'crm.customers.search_filter',
        'crm.visits.view', 'crm.visits.create', 'crm.visits.edit', 'crm.visits.change_status',
        'construction.projects.view', 'construction.units.view', 'construction.units.search_filter'
    )
)
AND NOT EXISTS (
    SELECT 1 FROM RolePermissions RP 
    WHERE RP.RoleId = @SalesAgentRoleId AND RP.PermissionId = P.Id
);

-- D) Accounts: Receipts, Invoices, Expenses, Commissions, Bookings View/Print, Reports
INSERT INTO RolePermissions (RoleId, PermissionId, IsGranted)
SELECT @AccountsRoleId, P.Id, 1
FROM Permissions P
WHERE (
    P.Code LIKE 'finance.payments.%'
    OR P.Code LIKE 'finance.payment_schedule.%'
    OR P.Code LIKE 'finance.invoices.%'
    OR P.Code LIKE 'finance.expenses.%'
    OR P.Code LIKE 'finance.commissions.%'
    OR P.Code IN (
        'crm.bookings.view', 'crm.bookings.print', 'crm.customers.view',
        'reports.bi.view', 'reports.bi.export', 'reports.bi.print', 'reports.bi.view_sensitive_data'
    )
)
AND NOT EXISTS (
    SELECT 1 FROM RolePermissions RP 
    WHERE RP.RoleId = @AccountsRoleId AND RP.PermissionId = P.Id
);

-- E) Channel Partner: Own Leads, Bookings, Visits, Commissions
INSERT INTO RolePermissions (RoleId, PermissionId, IsGranted)
SELECT @ChannelPartnerRoleId, P.Id, 1
FROM Permissions P
WHERE (
    P.Code IN (
        'crm.leads.view', 'crm.leads.create', 'crm.leads.search_filter', 'crm.leads.upload_download',
        'crm.bookings.view', 'crm.bookings.upload_download',
        'crm.customers.view',
        'crm.visits.view', 'crm.visits.create',
        'finance.commissions.view',
        'reports.bi.view'
    )
)
AND NOT EXISTS (
    SELECT 1 FROM RolePermissions RP 
    WHERE RP.RoleId = @ChannelPartnerRoleId AND RP.PermissionId = P.Id
);
GO

PRINT 'Default Role-Permission mappings seeded successfully.';
GO
