-- ============================================================================
-- BuilderPro CRM - Complete Administration & Permission-Based Architecture
-- SQL Server Migration Script (Safe, Reviewed, and Idempotent)
-- ============================================================================

USE BuilderProDB;
GO

-- 1. Create Roles Table
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Roles')
BEGIN
    CREATE TABLE Roles (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(100) NOT NULL UNIQUE,
        Description NVARCHAR(500) NULL,
        Color NVARCHAR(50) NOT NULL DEFAULT 'gold',
        IsSystemRole BIT NOT NULL DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
    CREATE INDEX IX_Roles_Name ON Roles(Name);
    PRINT 'Created Roles table.';
END
GO

-- 2. Create Permissions Table
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Permissions')
BEGIN
    CREATE TABLE Permissions (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Code NVARCHAR(100) NOT NULL UNIQUE,
        Module NVARCHAR(100) NOT NULL,
        Submenu NVARCHAR(100) NOT NULL,
        Action NVARCHAR(100) NOT NULL,
        Name NVARCHAR(150) NOT NULL,
        Description NVARCHAR(500) NULL,
        Category NVARCHAR(100) NOT NULL DEFAULT 'General',
        IsSensitive BIT NOT NULL DEFAULT 0,
        SortOrder INT NOT NULL DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
    CREATE INDEX IX_Permissions_Code ON Permissions(Code);
    CREATE INDEX IX_Permissions_Module_Submenu ON Permissions(Module, Submenu);
    PRINT 'Created Permissions table.';
END
GO

-- 3. Create RolePermissions Table
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'RolePermissions')
BEGIN
    CREATE TABLE RolePermissions (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        RoleId INT NOT NULL,
        PermissionId INT NOT NULL,
        IsGranted BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_RolePermissions_Roles FOREIGN KEY (RoleId) REFERENCES Roles(Id) ON DELETE CASCADE,
        CONSTRAINT FK_RolePermissions_Permissions FOREIGN KEY (PermissionId) REFERENCES Permissions(Id) ON DELETE CASCADE,
        CONSTRAINT UQ_RolePermissions_RoleId_PermissionId UNIQUE (RoleId, PermissionId)
    );
    CREATE INDEX IX_RolePermissions_RoleId ON RolePermissions(RoleId);
    PRINT 'Created RolePermissions table.';
END
GO

-- 4. Create UserPermissions Table (for user-specific overrides)
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'UserPermissions')
BEGIN
    CREATE TABLE UserPermissions (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        PermissionId INT NOT NULL,
        IsGranted BIT NOT NULL DEFAULT 1, -- 1 = Grant Override, 0 = Deny Override
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_UserPermissions_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
        CONSTRAINT FK_UserPermissions_Permissions FOREIGN KEY (PermissionId) REFERENCES Permissions(Id) ON DELETE CASCADE,
        CONSTRAINT UQ_UserPermissions_UserId_PermissionId UNIQUE (UserId, PermissionId)
    );
    CREATE INDEX IX_UserPermissions_UserId ON UserPermissions(UserId);
    PRINT 'Created UserPermissions table.';
END
GO

-- 5. Create PermissionAuditLogs Table
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'PermissionAuditLogs')
BEGIN
    CREATE TABLE PermissionAuditLogs (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ChangedByUserId INT NULL,
        ChangedByName NVARCHAR(150) NOT NULL,
        TargetType NVARCHAR(50) NOT NULL, -- 'Role' or 'User'
        TargetId INT NOT NULL,
        TargetName NVARCHAR(150) NOT NULL,
        PermissionCode NVARCHAR(100) NOT NULL,
        PreviousState NVARCHAR(50) NOT NULL,
        NewState NVARCHAR(50) NOT NULL,
        Reason NVARCHAR(500) NULL,
        Timestamp DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
    CREATE INDEX IX_PermissionAuditLogs_Target ON PermissionAuditLogs(TargetType, TargetId);
    CREATE INDEX IX_PermissionAuditLogs_Timestamp ON PermissionAuditLogs(Timestamp DESC);
    PRINT 'Created PermissionAuditLogs table.';
END
GO

-- 6. Add RoleId column to Users table if missing
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'RoleId'
)
BEGIN
    ALTER TABLE Users ADD RoleId INT NULL;
    ALTER TABLE Users ADD CONSTRAINT FK_Users_Roles FOREIGN KEY (RoleId) REFERENCES Roles(Id);
    PRINT 'Added RoleId to Users table.';
END
GO

-- 7. Seed Standard Roles
IF NOT EXISTS (SELECT 1 FROM Roles WHERE Name = 'Super Admin')
    INSERT INTO Roles (Name, Description, Color, IsSystemRole) VALUES ('Super Admin', 'Full unrestricted enterprise control across all CRM, Administration, Financial, and OMS modules.', 'teal', 1);

IF NOT EXISTS (SELECT 1 FROM Roles WHERE Name = 'Sales Manager')
    INSERT INTO Roles (Name, Description, Color, IsSystemRole) VALUES ('Sales Manager', 'Oversees sales team pipeline, leads assignment, site visits, quotations, bookings, and team reports.', 'blue', 1);

IF NOT EXISTS (SELECT 1 FROM Roles WHERE Name = 'Sales Agent')
    INSERT INTO Roles (Name, Description, Color, IsSystemRole) VALUES ('Sales Agent', 'Frontline agent managing assigned leads, scheduling visits, generating quotes, and closing bookings.', 'amb', 1);

IF NOT EXISTS (SELECT 1 FROM Roles WHERE Name = 'Accounts')
    INSERT INTO Roles (Name, Description, Color, IsSystemRole) VALUES ('Accounts', 'Manages customer payments, receipts, installment schedules, broker commission approvals, and financial logs.', 'gold', 1);

IF NOT EXISTS (SELECT 1 FROM Roles WHERE Name = 'Channel Partner')
    INSERT INTO Roles (Name, Description, Color, IsSystemRole) VALUES ('Channel Partner', 'External broker partner submitting client leads, tracking deal closures, and commission claims.', 'purple', 1);
GO

-- 8. Synchronize existing Users table RoleId with Roles table
UPDATE U
SET U.RoleId = R.Id
FROM Users U
INNER JOIN Roles R ON (
    U.Role = R.Name 
    OR (U.Role = 'Manager' AND R.Name = 'Sales Manager')
    OR (U.Role = 'Accountant' AND R.Name = 'Accounts')
)
WHERE U.RoleId IS NULL;
GO

PRINT 'Roles seeded and users linked.';
