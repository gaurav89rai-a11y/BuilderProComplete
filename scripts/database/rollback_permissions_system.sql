-- ============================================================================
-- BuilderPro CRM - Rollback Script for Permissions System
-- ============================================================================

USE BuilderProDB;
GO

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'PermissionAuditLogs')
    DROP TABLE PermissionAuditLogs;

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'UserPermissions')
    DROP TABLE UserPermissions;

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'RolePermissions')
    DROP TABLE RolePermissions;

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Permissions')
    DROP TABLE Permissions;

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'RoleId')
BEGIN
    ALTER TABLE Users DROP CONSTRAINT FK_Users_Roles;
    ALTER TABLE Users DROP COLUMN RoleId;
END

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Roles')
    DROP TABLE Roles;

PRINT 'Rollback completed.';
GO
