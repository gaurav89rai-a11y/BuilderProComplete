-- ============================================================================
-- BuilderPro CRM - PostgreSQL Migration Script for Permissions System
-- ============================================================================

CREATE TABLE IF NOT EXISTS "Roles" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL UNIQUE,
    "Description" VARCHAR(500) NULL,
    "Color" VARCHAR(50) NOT NULL DEFAULT 'gold',
    "IsSystemRole" BOOLEAN NOT NULL DEFAULT FALSE,
    "CreatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    "UpdatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE TABLE IF NOT EXISTS "Permissions" (
    "Id" SERIAL PRIMARY KEY,
    "Code" VARCHAR(100) NOT NULL UNIQUE,
    "Module" VARCHAR(100) NOT NULL,
    "Submenu" VARCHAR(100) NOT NULL,
    "Action" VARCHAR(100) NOT NULL,
    "Name" VARCHAR(150) NOT NULL,
    "Description" VARCHAR(500) NULL,
    "Category" VARCHAR(100) NOT NULL DEFAULT 'General',
    "IsSensitive" BOOLEAN NOT NULL DEFAULT FALSE,
    "SortOrder" INT NOT NULL DEFAULT 0,
    "CreatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE TABLE IF NOT EXISTS "RolePermissions" (
    "Id" SERIAL PRIMARY KEY,
    "RoleId" INT NOT NULL REFERENCES "Roles"("Id") ON DELETE CASCADE,
    "PermissionId" INT NOT NULL REFERENCES "Permissions"("Id") ON DELETE CASCADE,
    "IsGranted" BOOLEAN NOT NULL DEFAULT TRUE,
    "CreatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    CONSTRAINT "UQ_RolePermissions" UNIQUE ("RoleId", "PermissionId")
);

CREATE TABLE IF NOT EXISTS "UserPermissions" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" INT NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
    "PermissionId" INT NOT NULL REFERENCES "Permissions"("Id") ON DELETE CASCADE,
    "IsGranted" BOOLEAN NOT NULL DEFAULT TRUE,
    "CreatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    CONSTRAINT "UQ_UserPermissions" UNIQUE ("UserId", "PermissionId")
);

CREATE TABLE IF NOT EXISTS "PermissionAuditLogs" (
    "Id" SERIAL PRIMARY KEY,
    "ChangedByUserId" INT NULL,
    "ChangedByName" VARCHAR(150) NOT NULL,
    "TargetType" VARCHAR(50) NOT NULL,
    "TargetId" INT NOT NULL,
    "TargetName" VARCHAR(150) NOT NULL,
    "PermissionCode" VARCHAR(100) NOT NULL,
    "PreviousState" VARCHAR(50) NOT NULL,
    "NewState" VARCHAR(50) NOT NULL,
    "Reason" VARCHAR(500) NULL,
    "Timestamp" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Users' AND column_name = 'RoleId'
    ) THEN
        ALTER TABLE "Users" ADD COLUMN "RoleId" INT NULL REFERENCES "Roles"("Id");
    END IF;
END $$;
