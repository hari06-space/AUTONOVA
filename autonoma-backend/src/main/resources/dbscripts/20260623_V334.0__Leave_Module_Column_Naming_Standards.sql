-- =============================================================================
-- V334.0 — Leave Module Column Naming Casing Standards
-- =============================================================================
-- Scope      : HR_LEAVE_MASTER and HR_LEAVE_TRAVEL_APPLICATION
-- Purpose    : Enforce uppercase column names for all columns in both tables.
--              No data changes are made, only column renaming to comply with
--              the client's strict database naming policies.
-- Author     : Antigravity
-- Date       : 2026-06-23
-- =============================================================================

PRINT 'V334.0 — Leave Module Column Naming Casing Standards — Starting...';
PRINT '======================================================';

-- 1. HR_LEAVE_MASTER
PRINT 'SECTION 1: Renaming columns in HR_LEAVE_MASTER...';

IF EXISTS (
    SELECT 1 
    FROM sys.columns c 
    JOIN sys.tables t ON c.object_id = t.object_id 
    WHERE t.name = 'HR_LEAVE_MASTER' 
      AND c.name = 'lop' 
      AND CAST(c.name AS VARCHAR(100)) COLLATE Latin1_General_BIN = 'lop'
)
BEGIN
    PRINT '  Renaming HR_LEAVE_MASTER.lop -> LOP';
    EXEC sp_rename 'HR_LEAVE_MASTER.lop', 'LOP', 'COLUMN';
END
ELSE
    PRINT '  HR_LEAVE_MASTER.lop already compliant or does not exist';


-- 2. HR_LEAVE_TRAVEL_APPLICATION
PRINT 'SECTION 2: Renaming columns in HR_LEAVE_TRAVEL_APPLICATION...';

-- Helper variables for sp_rename targets (concatenations are not allowed directly in EXEC params)
DECLARE @rename_id NVARCHAR(256) = 'HR_LEAVE_TRAVEL_APPLICATION.id';
DECLARE @rename_employee_id NVARCHAR(256) = 'HR_LEAVE_TRAVEL_APPLICATION.employee_id';
DECLARE @rename_description NVARCHAR(256) = 'HR_LEAVE_TRAVEL_APPLICATION.description';
DECLARE @rename_from_date NVARCHAR(256) = 'HR_LEAVE_TRAVEL_APPLICATION.from_date';
DECLARE @rename_to_date NVARCHAR(256) = 'HR_LEAVE_TRAVEL_APPLICATION.to_date';
DECLARE @rename_total_days NVARCHAR(256) = 'HR_LEAVE_TRAVEL_APPLICATION.total_days';
DECLARE @rename_amount NVARCHAR(256) = 'HR_LEAVE_TRAVEL_APPLICATION.amount';
DECLARE @rename_status NVARCHAR(256) = 'HR_LEAVE_TRAVEL_APPLICATION.status';
DECLARE @rename_is_active NVARCHAR(256) = 'HR_LEAVE_TRAVEL_APPLICATION.is_active';
DECLARE @rename_created_by NVARCHAR(256) = 'HR_LEAVE_TRAVEL_APPLICATION.created_by';
DECLARE @rename_created_date NVARCHAR(256) = 'HR_LEAVE_TRAVEL_APPLICATION.created_date';
DECLARE @rename_updated_by NVARCHAR(256) = 'HR_LEAVE_TRAVEL_APPLICATION.updated_by';
DECLARE @rename_updated_date NVARCHAR(256) = 'HR_LEAVE_TRAVEL_APPLICATION.updated_date';

-- id
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('HR_LEAVE_TRAVEL_APPLICATION') AND name = 'id' AND CAST(name AS VARCHAR(100)) COLLATE Latin1_General_BIN = 'id')
BEGIN
    PRINT '  Renaming HR_LEAVE_TRAVEL_APPLICATION.id -> ID';
    EXEC sp_rename @rename_id, 'ID', 'COLUMN';
END

-- employee_id
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('HR_LEAVE_TRAVEL_APPLICATION') AND name = 'employee_id' AND CAST(name AS VARCHAR(100)) COLLATE Latin1_General_BIN = 'employee_id')
BEGIN
    PRINT '  Renaming HR_LEAVE_TRAVEL_APPLICATION.employee_id -> EMPLOYEE_ID';
    EXEC sp_rename @rename_employee_id, 'EMPLOYEE_ID', 'COLUMN';
END

-- description
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('HR_LEAVE_TRAVEL_APPLICATION') AND name = 'description' AND CAST(name AS VARCHAR(100)) COLLATE Latin1_General_BIN = 'description')
BEGIN
    PRINT '  Renaming HR_LEAVE_TRAVEL_APPLICATION.description -> DESCRIPTION';
    EXEC sp_rename @rename_description, 'DESCRIPTION', 'COLUMN';
END

-- from_date
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('HR_LEAVE_TRAVEL_APPLICATION') AND name = 'from_date' AND CAST(name AS VARCHAR(100)) COLLATE Latin1_General_BIN = 'from_date')
BEGIN
    PRINT '  Renaming HR_LEAVE_TRAVEL_APPLICATION.from_date -> FROM_DATE';
    EXEC sp_rename @rename_from_date, 'FROM_DATE', 'COLUMN';
END

-- to_date
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('HR_LEAVE_TRAVEL_APPLICATION') AND name = 'to_date' AND CAST(name AS VARCHAR(100)) COLLATE Latin1_General_BIN = 'to_date')
BEGIN
    PRINT '  Renaming HR_LEAVE_TRAVEL_APPLICATION.to_date -> TO_DATE';
    EXEC sp_rename @rename_to_date, 'TO_DATE', 'COLUMN';
END

-- total_days
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('HR_LEAVE_TRAVEL_APPLICATION') AND name = 'total_days' AND CAST(name AS VARCHAR(100)) COLLATE Latin1_General_BIN = 'total_days')
BEGIN
    PRINT '  Renaming HR_LEAVE_TRAVEL_APPLICATION.total_days -> TOTAL_DAYS';
    EXEC sp_rename @rename_total_days, 'TOTAL_DAYS', 'COLUMN';
END

-- amount
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('HR_LEAVE_TRAVEL_APPLICATION') AND name = 'amount' AND CAST(name AS VARCHAR(100)) COLLATE Latin1_General_BIN = 'amount')
BEGIN
    PRINT '  Renaming HR_LEAVE_TRAVEL_APPLICATION.amount -> AMOUNT';
    EXEC sp_rename @rename_amount, 'AMOUNT', 'COLUMN';
END

-- status
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('HR_LEAVE_TRAVEL_APPLICATION') AND name = 'status' AND CAST(name AS VARCHAR(100)) COLLATE Latin1_General_BIN = 'status')
BEGIN
    PRINT '  Renaming HR_LEAVE_TRAVEL_APPLICATION.status -> STATUS';
    EXEC sp_rename @rename_status, 'STATUS', 'COLUMN';
END

-- is_active
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('HR_LEAVE_TRAVEL_APPLICATION') AND name = 'is_active' AND CAST(name AS VARCHAR(100)) COLLATE Latin1_General_BIN = 'is_active')
BEGIN
    PRINT '  Renaming HR_LEAVE_TRAVEL_APPLICATION.is_active -> IS_ACTIVE';
    EXEC sp_rename @rename_is_active, 'IS_ACTIVE', 'COLUMN';
END

-- created_by
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('HR_LEAVE_TRAVEL_APPLICATION') AND name = 'created_by' AND CAST(name AS VARCHAR(100)) COLLATE Latin1_General_BIN = 'created_by')
BEGIN
    PRINT '  Renaming HR_LEAVE_TRAVEL_APPLICATION.created_by -> CREATED_BY';
    EXEC sp_rename @rename_created_by, 'CREATED_BY', 'COLUMN';
END

-- created_date
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('HR_LEAVE_TRAVEL_APPLICATION') AND name = 'created_date' AND CAST(name AS VARCHAR(100)) COLLATE Latin1_General_BIN = 'created_date')
BEGIN
    PRINT '  Renaming HR_LEAVE_TRAVEL_APPLICATION.created_date -> CREATED_DATE';
    EXEC sp_rename @rename_created_date, 'CREATED_DATE', 'COLUMN';
END

-- updated_by
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('HR_LEAVE_TRAVEL_APPLICATION') AND name = 'updated_by' AND CAST(name AS VARCHAR(100)) COLLATE Latin1_General_BIN = 'updated_by')
BEGIN
    PRINT '  Renaming HR_LEAVE_TRAVEL_APPLICATION.updated_by -> UPDATED_BY';
    EXEC sp_rename @rename_updated_by, 'UPDATED_BY', 'COLUMN';
END

-- updated_date
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('HR_LEAVE_TRAVEL_APPLICATION') AND name = 'updated_date' AND CAST(name AS VARCHAR(100)) COLLATE Latin1_General_BIN = 'updated_date')
BEGIN
    PRINT '  Renaming HR_LEAVE_TRAVEL_APPLICATION.updated_date -> UPDATED_DATE';
    EXEC sp_rename @rename_updated_date, 'UPDATED_DATE', 'COLUMN';
END

PRINT '';
PRINT 'V334.0 — Leave Module Column Naming Casing Standards — COMPLETED SUCCESSFULLY.';
PRINT '=======================================================================';
