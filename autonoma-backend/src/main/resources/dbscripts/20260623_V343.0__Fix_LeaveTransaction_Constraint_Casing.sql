-- =============================================================================
-- V336.0 — Fix Mixed-Case FK and Index on HR_LEAVE_TRANSACTION
-- =============================================================================
-- Scope      : HR_LEAVE_TRANSACTION
-- Purpose    : Rename FK_LeaveTransaction_Employee (PascalCase) and
--              IX_LeaveTransaction_Employee (PascalCase) to fully UPPERCASE
--              SOP-compliant names.
-- Fix Note   : FK constraints must use sp_rename with 'OBJECT' type and
--              the bare constraint name (no table prefix).
--              Indexes use 'INDEX' type with 'TABLE.INDEX' prefix.
-- Author     : Antigravity
-- Date       : 2026-06-23
-- =============================================================================

PRINT 'V336.0 - Fix LeaveTransaction Constraint Casing - Starting...';
PRINT '===============================================================';

-- 1. Rename FK: FK_LeaveTransaction_Employee -> FK_HR_LEAVE_TRANSACTION_EMPLOYEE_ID
IF EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE name = 'FK_LeaveTransaction_Employee'
      AND parent_object_id = OBJECT_ID('HR_LEAVE_TRANSACTION')
)
BEGIN
    PRINT '  Renaming FK: FK_LeaveTransaction_Employee -> FK_HR_LEAVE_TRANSACTION_EMPLOYEE_ID';
    EXEC sp_rename 'FK_LeaveTransaction_Employee', 'FK_HR_LEAVE_TRANSACTION_EMPLOYEE_ID', 'OBJECT';
END
ELSE
    PRINT '  FK_LeaveTransaction_Employee not found — already renamed or does not exist.';
GO

-- 2. Rename Index: IX_LeaveTransaction_Employee -> IX_HR_LEAVE_TRANSACTION_EMPLOYEE_ID
IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_LeaveTransaction_Employee'
      AND object_id = OBJECT_ID('HR_LEAVE_TRANSACTION')
)
BEGIN
    PRINT '  Renaming Index: IX_LeaveTransaction_Employee -> IX_HR_LEAVE_TRANSACTION_EMPLOYEE_ID';
    EXEC sp_rename 'HR_LEAVE_TRANSACTION.IX_LeaveTransaction_Employee', 'IX_HR_LEAVE_TRANSACTION_EMPLOYEE_ID', 'INDEX';
END
ELSE
    PRINT '  IX_LeaveTransaction_Employee not found — already renamed or does not exist.';
GO

PRINT '';
PRINT 'V336.0 - Fix LeaveTransaction Constraint Casing - COMPLETED SUCCESSFULLY.';
PRINT '===========================================================================';
