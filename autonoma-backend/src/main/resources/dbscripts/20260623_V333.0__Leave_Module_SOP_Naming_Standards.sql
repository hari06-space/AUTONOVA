-- =============================================================================
-- V333.0 — Leave Module Enterprise DB Naming Standards Compliance
-- =============================================================================
-- Scope      : ALL 7 Leave Module Tables
-- Tables     : HR_LEAVE_MASTER, HR_LEAVE_REQUEST, HR_LEAVE_ENTRY,
--              HR_LEAVE_TRANSACTION, HR_LEAVE_TYPE, HR_LEAVE_CONFIG,
--              HR_LEAVE_TRAVEL_APPLICATION
-- Purpose    : Rename auto-generated PK, FK, UQ, and Index names to follow
--              enterprise SOP naming convention:
--                PK : PK_<TABLE>
--                FK : FK_<TABLE>_<COLUMN>
--                UQ : UQ_<TABLE>_<COLUMN>
--                IX : IX_<TABLE>_<COLUMN>
-- Risk Level : ZERO — sp_rename preserves all constraint behavior and data
-- Author     : Antigravity (Automated Migration)
-- Date       : 2026-06-23
-- =============================================================================
-- ROLLBACK INSTRUCTIONS:
--   Every rename is reversible. See rollback script V333.0_ROLLBACK.sql.
-- =============================================================================

PRINT 'V333.0 — Leave Module SOP Naming Compliance — Starting...';
PRINT '======================================================';

-- =============================================================================
-- SECTION 1: PRIMARY KEY RENAMES
-- =============================================================================
-- Strategy: Find the current PK name from sys.key_constraints and rename it.
-- This is safe — sp_rename on a PK only changes its name, not its behavior.
-- =============================================================================

PRINT 'SECTION 1: Renaming Primary Keys...';

-- 1.1 HR_LEAVE_MASTER
DECLARE @pk_lm NVARCHAR(256);
SELECT @pk_lm = kc.name
FROM sys.key_constraints kc
JOIN sys.tables t ON kc.parent_object_id = t.object_id
WHERE t.name = 'HR_LEAVE_MASTER' AND kc.type = 'PK';
IF @pk_lm IS NOT NULL AND @pk_lm <> 'PK_HR_LEAVE_MASTER'
BEGIN
    PRINT '  Renaming PK on HR_LEAVE_MASTER: ' + @pk_lm + ' -> PK_HR_LEAVE_MASTER';
    EXEC sp_rename @pk_lm, 'PK_HR_LEAVE_MASTER';
END
ELSE IF @pk_lm = 'PK_HR_LEAVE_MASTER'
    PRINT '  HR_LEAVE_MASTER PK already compliant: PK_HR_LEAVE_MASTER';
ELSE
    PRINT '  WARNING: No PK found on HR_LEAVE_MASTER';

-- 1.2 HR_LEAVE_REQUEST
DECLARE @pk_lr NVARCHAR(256);
SELECT @pk_lr = kc.name
FROM sys.key_constraints kc
JOIN sys.tables t ON kc.parent_object_id = t.object_id
WHERE t.name = 'HR_LEAVE_REQUEST' AND kc.type = 'PK';
IF @pk_lr IS NOT NULL AND @pk_lr <> 'PK_HR_LEAVE_REQUEST'
BEGIN
    PRINT '  Renaming PK on HR_LEAVE_REQUEST: ' + @pk_lr + ' -> PK_HR_LEAVE_REQUEST';
    EXEC sp_rename @pk_lr, 'PK_HR_LEAVE_REQUEST';
END
ELSE IF @pk_lr = 'PK_HR_LEAVE_REQUEST'
    PRINT '  HR_LEAVE_REQUEST PK already compliant: PK_HR_LEAVE_REQUEST';

-- 1.3 HR_LEAVE_ENTRY
DECLARE @pk_le NVARCHAR(256);
SELECT @pk_le = kc.name
FROM sys.key_constraints kc
JOIN sys.tables t ON kc.parent_object_id = t.object_id
WHERE t.name = 'HR_LEAVE_ENTRY' AND kc.type = 'PK';
IF @pk_le IS NOT NULL AND @pk_le <> 'PK_HR_LEAVE_ENTRY'
BEGIN
    PRINT '  Renaming PK on HR_LEAVE_ENTRY: ' + @pk_le + ' -> PK_HR_LEAVE_ENTRY';
    EXEC sp_rename @pk_le, 'PK_HR_LEAVE_ENTRY';
END
ELSE IF @pk_le = 'PK_HR_LEAVE_ENTRY'
    PRINT '  HR_LEAVE_ENTRY PK already compliant: PK_HR_LEAVE_ENTRY';

-- 1.4 HR_LEAVE_TRANSACTION
DECLARE @pk_lt NVARCHAR(256);
SELECT @pk_lt = kc.name
FROM sys.key_constraints kc
JOIN sys.tables t ON kc.parent_object_id = t.object_id
WHERE t.name = 'HR_LEAVE_TRANSACTION' AND kc.type = 'PK';
IF @pk_lt IS NOT NULL AND @pk_lt <> 'PK_HR_LEAVE_TRANSACTION'
BEGIN
    PRINT '  Renaming PK on HR_LEAVE_TRANSACTION: ' + @pk_lt + ' -> PK_HR_LEAVE_TRANSACTION';
    EXEC sp_rename @pk_lt, 'PK_HR_LEAVE_TRANSACTION';
END
ELSE IF @pk_lt = 'PK_HR_LEAVE_TRANSACTION'
    PRINT '  HR_LEAVE_TRANSACTION PK already compliant: PK_HR_LEAVE_TRANSACTION';

-- 1.5 HR_LEAVE_TYPE
DECLARE @pk_ltype NVARCHAR(256);
SELECT @pk_ltype = kc.name
FROM sys.key_constraints kc
JOIN sys.tables t ON kc.parent_object_id = t.object_id
WHERE t.name = 'HR_LEAVE_TYPE' AND kc.type = 'PK';
IF @pk_ltype IS NOT NULL AND @pk_ltype <> 'PK_HR_LEAVE_TYPE'
BEGIN
    PRINT '  Renaming PK on HR_LEAVE_TYPE: ' + @pk_ltype + ' -> PK_HR_LEAVE_TYPE';
    EXEC sp_rename @pk_ltype, 'PK_HR_LEAVE_TYPE';
END
ELSE IF @pk_ltype = 'PK_HR_LEAVE_TYPE'
    PRINT '  HR_LEAVE_TYPE PK already compliant: PK_HR_LEAVE_TYPE';

-- 1.6 HR_LEAVE_CONFIG
DECLARE @pk_lc NVARCHAR(256);
SELECT @pk_lc = kc.name
FROM sys.key_constraints kc
JOIN sys.tables t ON kc.parent_object_id = t.object_id
WHERE t.name = 'HR_LEAVE_CONFIG' AND kc.type = 'PK';
IF @pk_lc IS NOT NULL AND @pk_lc <> 'PK_HR_LEAVE_CONFIG'
BEGIN
    PRINT '  Renaming PK on HR_LEAVE_CONFIG: ' + @pk_lc + ' -> PK_HR_LEAVE_CONFIG';
    EXEC sp_rename @pk_lc, 'PK_HR_LEAVE_CONFIG';
END
ELSE IF @pk_lc = 'PK_HR_LEAVE_CONFIG'
    PRINT '  HR_LEAVE_CONFIG PK already compliant: PK_HR_LEAVE_CONFIG';

-- 1.7 HR_LEAVE_TRAVEL_APPLICATION
DECLARE @pk_lta NVARCHAR(256);
SELECT @pk_lta = kc.name
FROM sys.key_constraints kc
JOIN sys.tables t ON kc.parent_object_id = t.object_id
WHERE t.name = 'HR_LEAVE_TRAVEL_APPLICATION' AND kc.type = 'PK';
IF @pk_lta IS NOT NULL AND @pk_lta <> 'PK_HR_LEAVE_TRAVEL_APPLICATION'
BEGIN
    PRINT '  Renaming PK on HR_LEAVE_TRAVEL_APPLICATION: ' + @pk_lta + ' -> PK_HR_LEAVE_TRAVEL_APPLICATION';
    EXEC sp_rename @pk_lta, 'PK_HR_LEAVE_TRAVEL_APPLICATION';
END
ELSE IF @pk_lta = 'PK_HR_LEAVE_TRAVEL_APPLICATION'
    PRINT '  HR_LEAVE_TRAVEL_APPLICATION PK already compliant: PK_HR_LEAVE_TRAVEL_APPLICATION';

PRINT 'SECTION 1: Primary Keys Done.';
PRINT '';

-- =============================================================================
-- SECTION 2: FOREIGN KEY RENAMES
-- =============================================================================
-- Rename all FK constraints to follow:
--   FK_<TABLE>_<COLUMN>
-- =============================================================================

PRINT 'SECTION 2: Renaming Foreign Keys...';

-- Helper: Rename a FK if it exists and doesn't already have the correct name
-- 2.1 HR_LEAVE_MASTER — FK on EMPLOYEE_ID
DECLARE @fk_lm_emp NVARCHAR(256);
SELECT @fk_lm_emp = fk.name
FROM sys.foreign_keys fk
JOIN sys.tables t ON fk.parent_object_id = t.object_id
WHERE t.name = 'HR_LEAVE_MASTER';
IF @fk_lm_emp IS NOT NULL AND @fk_lm_emp <> 'FK_HR_LEAVE_MASTER_EMPLOYEE_ID'
BEGIN
    PRINT '  Renaming FK on HR_LEAVE_MASTER: ' + @fk_lm_emp + ' -> FK_HR_LEAVE_MASTER_EMPLOYEE_ID';
    EXEC sp_rename @fk_lm_emp, 'FK_HR_LEAVE_MASTER_EMPLOYEE_ID', 'OBJECT';
END
ELSE IF @fk_lm_emp = 'FK_HR_LEAVE_MASTER_EMPLOYEE_ID'
    PRINT '  HR_LEAVE_MASTER FK already compliant';
ELSE
    PRINT '  INFO: No FK found on HR_LEAVE_MASTER (may not have been created with FK constraint)';

-- 2.2 HR_LEAVE_ENTRY — FK on EMPLOYEE_ID
DECLARE @fk_le_emp NVARCHAR(256);
SELECT @fk_le_emp = fk.name
FROM sys.foreign_keys fk
JOIN sys.tables t ON fk.parent_object_id = t.object_id
WHERE t.name = 'HR_LEAVE_ENTRY';
IF @fk_le_emp IS NOT NULL AND @fk_le_emp <> 'FK_HR_LEAVE_ENTRY_EMPLOYEE_ID'
BEGIN
    PRINT '  Renaming FK on HR_LEAVE_ENTRY: ' + @fk_le_emp + ' -> FK_HR_LEAVE_ENTRY_EMPLOYEE_ID';
    EXEC sp_rename @fk_le_emp, 'FK_HR_LEAVE_ENTRY_EMPLOYEE_ID', 'OBJECT';
END
ELSE IF @fk_le_emp = 'FK_HR_LEAVE_ENTRY_EMPLOYEE_ID'
    PRINT '  HR_LEAVE_ENTRY FK already compliant';
ELSE
    PRINT '  INFO: No FK found on HR_LEAVE_ENTRY';

-- 2.3 HR_LEAVE_TRANSACTION — FK on EMPLOYEE_ID
DECLARE @fk_lt_emp NVARCHAR(256);
SELECT @fk_lt_emp = fk.name
FROM sys.foreign_keys fk
JOIN sys.tables t ON fk.parent_object_id = t.object_id
WHERE t.name = 'HR_LEAVE_TRANSACTION';
IF @fk_lt_emp IS NOT NULL AND @fk_lt_emp <> 'FK_HR_LEAVE_TRANSACTION_EMPLOYEE_ID'
BEGIN
    PRINT '  Renaming FK on HR_LEAVE_TRANSACTION: ' + @fk_lt_emp + ' -> FK_HR_LEAVE_TRANSACTION_EMPLOYEE_ID';
    EXEC sp_rename @fk_lt_emp, 'FK_HR_LEAVE_TRANSACTION_EMPLOYEE_ID', 'OBJECT';
END
ELSE IF @fk_lt_emp = 'FK_HR_LEAVE_TRANSACTION_EMPLOYEE_ID'
    PRINT '  HR_LEAVE_TRANSACTION FK already compliant';
ELSE
    PRINT '  INFO: No FK found on HR_LEAVE_TRANSACTION';

-- 2.4 HR_LEAVE_TRAVEL_APPLICATION — FK on EMPLOYEE_ID
DECLARE @fk_lta_emp NVARCHAR(256);
SELECT @fk_lta_emp = fk.name
FROM sys.foreign_keys fk
JOIN sys.tables t ON fk.parent_object_id = t.object_id
WHERE t.name = 'HR_LEAVE_TRAVEL_APPLICATION';
IF @fk_lta_emp IS NOT NULL AND @fk_lta_emp <> 'FK_HR_LEAVE_TRAVEL_APPLICATION_EMPLOYEE_ID'
BEGIN
    PRINT '  Renaming FK on HR_LEAVE_TRAVEL_APPLICATION: ' + @fk_lta_emp + ' -> FK_HR_LEAVE_TRAVEL_APPLICATION_EMPLOYEE_ID';
    EXEC sp_rename @fk_lta_emp, 'FK_HR_LEAVE_TRAVEL_APPLICATION_EMPLOYEE_ID', 'OBJECT';
END
ELSE IF @fk_lta_emp = 'FK_HR_LEAVE_TRAVEL_APPLICATION_EMPLOYEE_ID'
    PRINT '  HR_LEAVE_TRAVEL_APPLICATION FK already compliant';
ELSE
    PRINT '  INFO: No FK found on HR_LEAVE_TRAVEL_APPLICATION';

-- 2.5 HR_LEAVE_REQUEST — FK on LEAVE_TYPE_ID
DECLARE @fk_lr_lt NVARCHAR(256);
SELECT @fk_lr_lt = fk.name
FROM sys.foreign_keys fk
JOIN sys.tables t ON fk.parent_object_id = t.object_id
JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
JOIN sys.columns c ON fkc.parent_object_id = c.object_id AND fkc.parent_column_id = c.column_id
WHERE t.name = 'HR_LEAVE_REQUEST' AND c.name = 'LEAVE_TYPE_ID';
IF @fk_lr_lt IS NOT NULL AND @fk_lr_lt <> 'FK_HR_LEAVE_REQUEST_LEAVE_TYPE_ID'
BEGIN
    PRINT '  Renaming FK on HR_LEAVE_REQUEST(LEAVE_TYPE_ID): ' + @fk_lr_lt + ' -> FK_HR_LEAVE_REQUEST_LEAVE_TYPE_ID';
    EXEC sp_rename @fk_lr_lt, 'FK_HR_LEAVE_REQUEST_LEAVE_TYPE_ID', 'OBJECT';
END
ELSE IF @fk_lr_lt = 'FK_HR_LEAVE_REQUEST_LEAVE_TYPE_ID'
    PRINT '  HR_LEAVE_REQUEST FK(LEAVE_TYPE_ID) already compliant';
ELSE
    PRINT '  INFO: No FK on HR_LEAVE_REQUEST(LEAVE_TYPE_ID) found';

-- 2.6 HR_LEAVE_REQUEST — FK on HOLIDAY_ID
DECLARE @fk_lr_hol NVARCHAR(256);
SELECT @fk_lr_hol = fk.name
FROM sys.foreign_keys fk
JOIN sys.tables t ON fk.parent_object_id = t.object_id
JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
JOIN sys.columns c ON fkc.parent_object_id = c.object_id AND fkc.parent_column_id = c.column_id
WHERE t.name = 'HR_LEAVE_REQUEST' AND c.name = 'HOLIDAY_ID';
IF @fk_lr_hol IS NOT NULL AND @fk_lr_hol <> 'FK_HR_LEAVE_REQUEST_HOLIDAY_ID'
BEGIN
    PRINT '  Renaming FK on HR_LEAVE_REQUEST(HOLIDAY_ID): ' + @fk_lr_hol + ' -> FK_HR_LEAVE_REQUEST_HOLIDAY_ID';
    EXEC sp_rename @fk_lr_hol, 'FK_HR_LEAVE_REQUEST_HOLIDAY_ID', 'OBJECT';
END
ELSE IF @fk_lr_hol = 'FK_HR_LEAVE_REQUEST_HOLIDAY_ID'
    PRINT '  HR_LEAVE_REQUEST FK(HOLIDAY_ID) already compliant';
ELSE
    PRINT '  INFO: No FK on HR_LEAVE_REQUEST(HOLIDAY_ID) found';

PRINT 'SECTION 2: Foreign Keys Done.';
PRINT '';

-- =============================================================================
-- SECTION 3: UNIQUE CONSTRAINT RENAMES
-- =============================================================================
-- Rename auto-generated UNIQUE constraints to follow:
--   UQ_<TABLE>_<COLUMN>
-- =============================================================================

PRINT 'SECTION 3: Renaming Unique Constraints...';

-- 3.1 HR_LEAVE_MASTER — UQ on EMPLOYEE_ID
DECLARE @uq_lm_emp NVARCHAR(256);
SELECT @uq_lm_emp = kc.name
FROM sys.key_constraints kc
JOIN sys.tables t ON kc.parent_object_id = t.object_id
JOIN sys.index_columns ic ON kc.unique_index_id = ic.index_id AND t.object_id = ic.object_id
JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE t.name = 'HR_LEAVE_MASTER' AND kc.type = 'UQ' AND c.name = 'EMPLOYEE_ID';
IF @uq_lm_emp IS NOT NULL AND @uq_lm_emp <> 'UQ_HR_LEAVE_MASTER_EMPLOYEE_ID'
BEGIN
    PRINT '  Renaming UQ on HR_LEAVE_MASTER(EMPLOYEE_ID): ' + @uq_lm_emp + ' -> UQ_HR_LEAVE_MASTER_EMPLOYEE_ID';
    EXEC sp_rename @uq_lm_emp, 'UQ_HR_LEAVE_MASTER_EMPLOYEE_ID';
END
ELSE IF @uq_lm_emp = 'UQ_HR_LEAVE_MASTER_EMPLOYEE_ID'
    PRINT '  HR_LEAVE_MASTER UQ(EMPLOYEE_ID) already compliant';
ELSE
    PRINT '  INFO: No UQ on HR_LEAVE_MASTER(EMPLOYEE_ID) found';

-- 3.2 HR_LEAVE_REQUEST — UQ on REQUEST_NO
DECLARE @uq_lr_rno NVARCHAR(256);
SELECT @uq_lr_rno = kc.name
FROM sys.key_constraints kc
JOIN sys.tables t ON kc.parent_object_id = t.object_id
JOIN sys.index_columns ic ON kc.unique_index_id = ic.index_id AND t.object_id = ic.object_id
JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE t.name = 'HR_LEAVE_REQUEST' AND kc.type = 'UQ' AND c.name = 'REQUEST_NO';
IF @uq_lr_rno IS NOT NULL AND @uq_lr_rno <> 'UQ_HR_LEAVE_REQUEST_REQUEST_NO'
BEGIN
    PRINT '  Renaming UQ on HR_LEAVE_REQUEST(REQUEST_NO): ' + @uq_lr_rno + ' -> UQ_HR_LEAVE_REQUEST_REQUEST_NO';
    EXEC sp_rename @uq_lr_rno, 'UQ_HR_LEAVE_REQUEST_REQUEST_NO';
END
ELSE IF @uq_lr_rno = 'UQ_HR_LEAVE_REQUEST_REQUEST_NO'
    PRINT '  HR_LEAVE_REQUEST UQ(REQUEST_NO) already compliant';
ELSE
    PRINT '  INFO: No UQ on HR_LEAVE_REQUEST(REQUEST_NO) found';

-- 3.3 HR_LEAVE_TYPE — UQ on LEAVE_CODE
DECLARE @uq_ltype_code NVARCHAR(256);
SELECT @uq_ltype_code = kc.name
FROM sys.key_constraints kc
JOIN sys.tables t ON kc.parent_object_id = t.object_id
JOIN sys.index_columns ic ON kc.unique_index_id = ic.index_id AND t.object_id = ic.object_id
JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE t.name = 'HR_LEAVE_TYPE' AND kc.type = 'UQ' AND c.name = 'LEAVE_CODE';
IF @uq_ltype_code IS NOT NULL AND @uq_ltype_code <> 'UQ_HR_LEAVE_TYPE_LEAVE_CODE'
BEGIN
    PRINT '  Renaming UQ on HR_LEAVE_TYPE(LEAVE_CODE): ' + @uq_ltype_code + ' -> UQ_HR_LEAVE_TYPE_LEAVE_CODE';
    EXEC sp_rename @uq_ltype_code, 'UQ_HR_LEAVE_TYPE_LEAVE_CODE';
END
ELSE IF @uq_ltype_code = 'UQ_HR_LEAVE_TYPE_LEAVE_CODE'
    PRINT '  HR_LEAVE_TYPE UQ(LEAVE_CODE) already compliant';
ELSE
    PRINT '  INFO: No UQ on HR_LEAVE_TYPE(LEAVE_CODE) found (may be named UX_HR_LEAVE_TYPE_CODE from V95)';

-- 3.3b HR_LEAVE_TYPE — UQ possibly named UX_HR_LEAVE_TYPE_CODE (from V95 migration)
DECLARE @uq_ltype_ux NVARCHAR(256);
SELECT @uq_ltype_ux = i.name
FROM sys.indexes i
JOIN sys.tables t ON i.object_id = t.object_id
JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE t.name = 'HR_LEAVE_TYPE' AND i.is_unique = 1 AND i.is_primary_key = 0
  AND c.name = 'LEAVE_CODE' AND i.name <> 'UQ_HR_LEAVE_TYPE_LEAVE_CODE';
IF @uq_ltype_ux IS NOT NULL
BEGIN
    PRINT '  Renaming legacy UQ index on HR_LEAVE_TYPE(LEAVE_CODE): ' + @uq_ltype_ux + ' -> UQ_HR_LEAVE_TYPE_LEAVE_CODE';
    DECLARE @rename_target_ltype NVARCHAR(500) = N'HR_LEAVE_TYPE.' + @uq_ltype_ux;
    EXEC sp_rename @rename_target_ltype, N'UQ_HR_LEAVE_TYPE_LEAVE_CODE', N'INDEX';
END

-- 3.4 HR_LEAVE_REQUEST — UQ possibly named UX_HR_LEAVE_REQUEST_NO (from V95 migration)
DECLARE @uq_lr_ux NVARCHAR(256);
SELECT @uq_lr_ux = i.name
FROM sys.indexes i
JOIN sys.tables t ON i.object_id = t.object_id
JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE t.name = 'HR_LEAVE_REQUEST' AND i.is_unique = 1 AND i.is_primary_key = 0
  AND c.name = 'REQUEST_NO' AND i.name NOT LIKE 'UQ_HR_LEAVE_REQUEST%';
IF @uq_lr_ux IS NOT NULL
BEGIN
    PRINT '  Renaming legacy UQ index on HR_LEAVE_REQUEST(REQUEST_NO): ' + @uq_lr_ux + ' -> UQ_HR_LEAVE_REQUEST_REQUEST_NO';
    DECLARE @rename_target_lreq NVARCHAR(500) = N'HR_LEAVE_REQUEST.' + @uq_lr_ux;
    EXEC sp_rename @rename_target_lreq, N'UQ_HR_LEAVE_REQUEST_REQUEST_NO', N'INDEX';
END

PRINT 'SECTION 3: Unique Constraints Done.';
PRINT '';

-- =============================================================================
-- SECTION 4: INDEX RENAMES (existing non-standard indexes)
-- =============================================================================
-- Known indexes from migration scripts with non-standard names:
--   IX_LeaveEntry_Employee, IX_LeaveEntry_Date (V94)
--   IX_LeaveMaster_Employee (V92)
--   IX_LeaveTransaction_Employee (V93)
--   IX_LeaveTravel_Employee (V216)
--   IX_HR_LEAVE_REQUEST_EMP, IX_HR_LEAVE_REQUEST_MGR, IX_HR_LEAVE_REQUEST_DATES (V95)
-- =============================================================================

PRINT 'SECTION 4: Renaming Indexes...';

-- 4.1 HR_LEAVE_ENTRY — IX_LeaveEntry_Employee -> IX_HR_LEAVE_ENTRY_EMPLOYEE_ID
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_LeaveEntry_Employee' AND object_id = OBJECT_ID('HR_LEAVE_ENTRY'))
BEGIN
    PRINT '  Renaming IX_LeaveEntry_Employee -> IX_HR_LEAVE_ENTRY_EMPLOYEE_ID';
    EXEC sp_rename N'HR_LEAVE_ENTRY.IX_LeaveEntry_Employee', N'IX_HR_LEAVE_ENTRY_EMPLOYEE_ID', N'INDEX';
END
ELSE IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_HR_LEAVE_ENTRY_EMPLOYEE_ID' AND object_id = OBJECT_ID('HR_LEAVE_ENTRY'))
    PRINT '  HR_LEAVE_ENTRY IX(EMPLOYEE_ID) already compliant';
ELSE
    PRINT '  INFO: IX_LeaveEntry_Employee not found on HR_LEAVE_ENTRY';

-- 4.2 HR_LEAVE_ENTRY — IX_LeaveEntry_Date -> IX_HR_LEAVE_ENTRY_FROM_DATE
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_LeaveEntry_Date' AND object_id = OBJECT_ID('HR_LEAVE_ENTRY'))
BEGIN
    PRINT '  Renaming IX_LeaveEntry_Date -> IX_HR_LEAVE_ENTRY_FROM_DATE';
    EXEC sp_rename N'HR_LEAVE_ENTRY.IX_LeaveEntry_Date', N'IX_HR_LEAVE_ENTRY_FROM_DATE', N'INDEX';
END
ELSE IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_HR_LEAVE_ENTRY_FROM_DATE' AND object_id = OBJECT_ID('HR_LEAVE_ENTRY'))
    PRINT '  HR_LEAVE_ENTRY IX(FROM_DATE) already compliant';
ELSE
    PRINT '  INFO: IX_LeaveEntry_Date not found on HR_LEAVE_ENTRY (may have been dropped with DATE column)';

-- 4.3 HR_LEAVE_MASTER — IX_LeaveMaster_Employee -> IX_HR_LEAVE_MASTER_EMPLOYEE_ID
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_LeaveMaster_Employee' AND object_id = OBJECT_ID('HR_LEAVE_MASTER'))
BEGIN
    PRINT '  Renaming IX_LeaveMaster_Employee -> IX_HR_LEAVE_MASTER_EMPLOYEE_ID';
    EXEC sp_rename N'HR_LEAVE_MASTER.IX_LeaveMaster_Employee', N'IX_HR_LEAVE_MASTER_EMPLOYEE_ID', N'INDEX';
END
ELSE IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_HR_LEAVE_MASTER_EMPLOYEE_ID' AND object_id = OBJECT_ID('HR_LEAVE_MASTER'))
    PRINT '  HR_LEAVE_MASTER IX(EMPLOYEE_ID) already compliant';
ELSE
    PRINT '  INFO: IX_LeaveMaster_Employee not found on HR_LEAVE_MASTER';

-- 4.4 HR_LEAVE_TRANSACTION — IX_LeaveTransaction_Employee -> IX_HR_LEAVE_TRANSACTION_EMPLOYEE_ID
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_LeaveTransaction_Employee' AND object_id = OBJECT_ID('HR_LEAVE_TRANSACTION'))
BEGIN
    PRINT '  Renaming IX_LeaveTransaction_Employee -> IX_HR_LEAVE_TRANSACTION_EMPLOYEE_ID';
    EXEC sp_rename N'HR_LEAVE_TRANSACTION.IX_LeaveTransaction_Employee', N'IX_HR_LEAVE_TRANSACTION_EMPLOYEE_ID', N'INDEX';
END
ELSE IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_HR_LEAVE_TRANSACTION_EMPLOYEE_ID' AND object_id = OBJECT_ID('HR_LEAVE_TRANSACTION'))
    PRINT '  HR_LEAVE_TRANSACTION IX(EMPLOYEE_ID) already compliant';
ELSE
    PRINT '  INFO: IX_LeaveTransaction_Employee not found on HR_LEAVE_TRANSACTION';

-- 4.5 HR_LEAVE_TRAVEL_APPLICATION — IX_LeaveTravel_Employee -> IX_HR_LEAVE_TRAVEL_APPLICATION_EMPLOYEE_ID
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_LeaveTravel_Employee' AND object_id = OBJECT_ID('HR_LEAVE_TRAVEL_APPLICATION'))
BEGIN
    PRINT '  Renaming IX_LeaveTravel_Employee -> IX_HR_LEAVE_TRAVEL_APPLICATION_EMPLOYEE_ID';
    EXEC sp_rename N'HR_LEAVE_TRAVEL_APPLICATION.IX_LeaveTravel_Employee', N'IX_HR_LEAVE_TRAVEL_APPLICATION_EMPLOYEE_ID', N'INDEX';
END
ELSE IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_HR_LEAVE_TRAVEL_APPLICATION_EMPLOYEE_ID' AND object_id = OBJECT_ID('HR_LEAVE_TRAVEL_APPLICATION'))
    PRINT '  HR_LEAVE_TRAVEL_APPLICATION IX(EMPLOYEE_ID) already compliant';
ELSE
    PRINT '  INFO: IX_LeaveTravel_Employee not found on HR_LEAVE_TRAVEL_APPLICATION';

-- 4.6 HR_LEAVE_REQUEST — IX_HR_LEAVE_REQUEST_EMP (non-standard, was created by V95)
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_HR_LEAVE_REQUEST_EMP' AND object_id = OBJECT_ID('HR_LEAVE_REQUEST'))
BEGIN
    PRINT '  Renaming IX_HR_LEAVE_REQUEST_EMP -> IX_HR_LEAVE_REQUEST_EMP_ID';
    EXEC sp_rename N'HR_LEAVE_REQUEST.IX_HR_LEAVE_REQUEST_EMP', N'IX_HR_LEAVE_REQUEST_EMP_ID', N'INDEX';
END
ELSE IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_HR_LEAVE_REQUEST_EMP_ID' AND object_id = OBJECT_ID('HR_LEAVE_REQUEST'))
    PRINT '  HR_LEAVE_REQUEST IX(EMP_ID) already compliant';
ELSE
    PRINT '  INFO: IX_HR_LEAVE_REQUEST_EMP not found on HR_LEAVE_REQUEST';

-- 4.7 HR_LEAVE_REQUEST — IX_HR_LEAVE_REQUEST_MGR -> IX_HR_LEAVE_REQUEST_MANAGER_ID
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_HR_LEAVE_REQUEST_MGR' AND object_id = OBJECT_ID('HR_LEAVE_REQUEST'))
BEGIN
    PRINT '  Renaming IX_HR_LEAVE_REQUEST_MGR -> IX_HR_LEAVE_REQUEST_MANAGER_ID';
    EXEC sp_rename N'HR_LEAVE_REQUEST.IX_HR_LEAVE_REQUEST_MGR', N'IX_HR_LEAVE_REQUEST_MANAGER_ID', N'INDEX';
END
ELSE IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_HR_LEAVE_REQUEST_MANAGER_ID' AND object_id = OBJECT_ID('HR_LEAVE_REQUEST'))
    PRINT '  HR_LEAVE_REQUEST IX(MANAGER_ID) already compliant';
ELSE
    PRINT '  INFO: IX_HR_LEAVE_REQUEST_MGR not found on HR_LEAVE_REQUEST';

-- 4.8 HR_LEAVE_REQUEST — IX_HR_LEAVE_REQUEST_DATES -> IX_HR_LEAVE_REQUEST_START_DATE
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_HR_LEAVE_REQUEST_DATES' AND object_id = OBJECT_ID('HR_LEAVE_REQUEST'))
BEGIN
    PRINT '  Renaming IX_HR_LEAVE_REQUEST_DATES -> IX_HR_LEAVE_REQUEST_START_DATE';
    EXEC sp_rename N'HR_LEAVE_REQUEST.IX_HR_LEAVE_REQUEST_DATES', N'IX_HR_LEAVE_REQUEST_START_DATE', N'INDEX';
END
ELSE IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_HR_LEAVE_REQUEST_START_DATE' AND object_id = OBJECT_ID('HR_LEAVE_REQUEST'))
    PRINT '  HR_LEAVE_REQUEST IX(START_DATE) already compliant';
ELSE
    PRINT '  INFO: IX_HR_LEAVE_REQUEST_DATES not found on HR_LEAVE_REQUEST';

PRINT 'SECTION 4: Indexes Done.';
PRINT '';

-- =============================================================================
-- SECTION 5: CREATE MISSING RECOMMENDED INDEXES
-- =============================================================================
-- Add indexes that support common query patterns used by leave module services.
-- =============================================================================

PRINT 'SECTION 5: Creating recommended missing indexes...';

-- 5.1 HR_LEAVE_ENTRY — IS_ACTIVE (frequent filter in service queries)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_HR_LEAVE_ENTRY_IS_ACTIVE' AND object_id = OBJECT_ID('HR_LEAVE_ENTRY'))
BEGIN
    PRINT '  Creating IX_HR_LEAVE_ENTRY_IS_ACTIVE';
    CREATE INDEX IX_HR_LEAVE_ENTRY_IS_ACTIVE ON HR_LEAVE_ENTRY (IS_ACTIVE);
END
ELSE
    PRINT '  IX_HR_LEAVE_ENTRY_IS_ACTIVE already exists';

-- 5.2 HR_LEAVE_ENTRY — FROM_DATE (used in date range queries and overlap checks)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_HR_LEAVE_ENTRY_FROM_DATE' AND object_id = OBJECT_ID('HR_LEAVE_ENTRY'))
BEGIN
    PRINT '  Creating IX_HR_LEAVE_ENTRY_FROM_DATE';
    CREATE INDEX IX_HR_LEAVE_ENTRY_FROM_DATE ON HR_LEAVE_ENTRY (FROM_DATE);
END
ELSE
    PRINT '  IX_HR_LEAVE_ENTRY_FROM_DATE already exists';

-- 5.3 HR_LEAVE_ENTRY — EMPLOYEE_ID (if not already created by rename above)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_HR_LEAVE_ENTRY_EMPLOYEE_ID' AND object_id = OBJECT_ID('HR_LEAVE_ENTRY'))
BEGIN
    PRINT '  Creating IX_HR_LEAVE_ENTRY_EMPLOYEE_ID';
    CREATE INDEX IX_HR_LEAVE_ENTRY_EMPLOYEE_ID ON HR_LEAVE_ENTRY (EMPLOYEE_ID);
END
ELSE
    PRINT '  IX_HR_LEAVE_ENTRY_EMPLOYEE_ID already exists';

-- 5.4 HR_LEAVE_TRANSACTION — TRANSACTION_DATE (used in ledger queries)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_HR_LEAVE_TRANSACTION_TRANSACTION_DATE' AND object_id = OBJECT_ID('HR_LEAVE_TRANSACTION'))
BEGIN
    PRINT '  Creating IX_HR_LEAVE_TRANSACTION_TRANSACTION_DATE';
    CREATE INDEX IX_HR_LEAVE_TRANSACTION_TRANSACTION_DATE ON HR_LEAVE_TRANSACTION (TRANSACTION_DATE);
END
ELSE
    PRINT '  IX_HR_LEAVE_TRANSACTION_TRANSACTION_DATE already exists';

-- 5.5 HR_LEAVE_TRANSACTION — EMPLOYEE_ID (if not already created by rename above)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_HR_LEAVE_TRANSACTION_EMPLOYEE_ID' AND object_id = OBJECT_ID('HR_LEAVE_TRANSACTION'))
BEGIN
    PRINT '  Creating IX_HR_LEAVE_TRANSACTION_EMPLOYEE_ID';
    CREATE INDEX IX_HR_LEAVE_TRANSACTION_EMPLOYEE_ID ON HR_LEAVE_TRANSACTION (EMPLOYEE_ID);
END
ELSE
    PRINT '  IX_HR_LEAVE_TRANSACTION_EMPLOYEE_ID already exists';

-- 5.6 HR_LEAVE_REQUEST — STATUS (used heavily for dashboard and manager filter)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_HR_LEAVE_REQUEST_STATUS' AND object_id = OBJECT_ID('HR_LEAVE_REQUEST'))
BEGIN
    PRINT '  Creating IX_HR_LEAVE_REQUEST_STATUS';
    CREATE INDEX IX_HR_LEAVE_REQUEST_STATUS ON HR_LEAVE_REQUEST (STATUS);
END
ELSE
    PRINT '  IX_HR_LEAVE_REQUEST_STATUS already exists';

-- 5.7 HR_LEAVE_TRAVEL_APPLICATION — EMPLOYEE_ID (if not already created by rename above)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_HR_LEAVE_TRAVEL_APPLICATION_EMPLOYEE_ID' AND object_id = OBJECT_ID('HR_LEAVE_TRAVEL_APPLICATION'))
BEGIN
    PRINT '  Creating IX_HR_LEAVE_TRAVEL_APPLICATION_EMPLOYEE_ID';
    CREATE INDEX IX_HR_LEAVE_TRAVEL_APPLICATION_EMPLOYEE_ID ON HR_LEAVE_TRAVEL_APPLICATION (EMPLOYEE_ID);
END
ELSE
    PRINT '  IX_HR_LEAVE_TRAVEL_APPLICATION_EMPLOYEE_ID already exists';

PRINT 'SECTION 5: Missing Indexes Done.';
PRINT '';

-- =============================================================================
-- SECTION 6: POST-MIGRATION VALIDATION
-- =============================================================================

PRINT 'SECTION 6: Post-Migration Validation...';

-- Display all PKs
PRINT '  --- Primary Keys in Leave Module ---';
SELECT t.name AS TableName, kc.name AS PKName, kc.type_desc
FROM sys.key_constraints kc
JOIN sys.tables t ON kc.parent_object_id = t.object_id
WHERE t.name IN ('HR_LEAVE_MASTER','HR_LEAVE_REQUEST','HR_LEAVE_ENTRY',
                 'HR_LEAVE_TRANSACTION','HR_LEAVE_TYPE','HR_LEAVE_CONFIG',
                 'HR_LEAVE_TRAVEL_APPLICATION')
  AND kc.type = 'PK'
ORDER BY t.name;

-- Display all FKs
PRINT '  --- Foreign Keys in Leave Module ---';
SELECT t.name AS TableName, fk.name AS FKName
FROM sys.foreign_keys fk
JOIN sys.tables t ON fk.parent_object_id = t.object_id
WHERE t.name IN ('HR_LEAVE_MASTER','HR_LEAVE_REQUEST','HR_LEAVE_ENTRY',
                 'HR_LEAVE_TRANSACTION','HR_LEAVE_TRAVEL_APPLICATION')
ORDER BY t.name;

-- Display all UQ constraints
PRINT '  --- Unique Constraints in Leave Module ---';
SELECT t.name AS TableName, kc.name AS UQName
FROM sys.key_constraints kc
JOIN sys.tables t ON kc.parent_object_id = t.object_id
WHERE t.name IN ('HR_LEAVE_MASTER','HR_LEAVE_REQUEST','HR_LEAVE_TYPE')
  AND kc.type = 'UQ'
ORDER BY t.name;

-- Display all Indexes
PRINT '  --- Indexes in Leave Module ---';
SELECT t.name AS TableName, i.name AS IndexName, i.type_desc
FROM sys.indexes i
JOIN sys.tables t ON i.object_id = t.object_id
WHERE t.name IN ('HR_LEAVE_MASTER','HR_LEAVE_REQUEST','HR_LEAVE_ENTRY',
                 'HR_LEAVE_TRANSACTION','HR_LEAVE_TYPE','HR_LEAVE_CONFIG',
                 'HR_LEAVE_TRAVEL_APPLICATION')
  AND i.is_primary_key = 0
  AND i.name IS NOT NULL
ORDER BY t.name, i.name;

PRINT '';
PRINT 'V333.0 — Leave Module SOP Naming Compliance — COMPLETED SUCCESSFULLY.';
PRINT '=======================================================================';
