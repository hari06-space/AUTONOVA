-- =============================================================================
-- V335.0 — Leave Module Foreign Key Casing Naming Standards
-- =============================================================================
-- Scope      : HR_LEAVE_TRAVEL_APPLICATION
-- Purpose    : Rename remaining lowercase foreign key constraints to uppercase
--              to comply with the client's strict database naming policies.
-- Author     : Antigravity
-- Date       : 2026-06-23
-- =============================================================================

PRINT 'V335.0 — Leave Module FK Casing Standards — Starting...';
PRINT '======================================================';

-- 1. FK_HR_LEAVE_TRAVEL_APPLICATION_created_by -> FK_HR_LEAVE_TRAVEL_APPLICATION_CREATED_BY
IF EXISTS (
    SELECT 1 
    FROM sys.foreign_keys 
    WHERE parent_object_id = OBJECT_ID('HR_LEAVE_TRAVEL_APPLICATION') 
      AND name = 'FK_HR_LEAVE_TRAVEL_APPLICATION_created_by' 
      AND CAST(name AS VARCHAR(100)) COLLATE Latin1_General_BIN = 'FK_HR_LEAVE_TRAVEL_APPLICATION_created_by'
)
BEGIN
    PRINT '  Renaming FK: FK_HR_LEAVE_TRAVEL_APPLICATION_created_by -> FK_HR_LEAVE_TRAVEL_APPLICATION_CREATED_BY';
    EXEC sp_rename 'FK_HR_LEAVE_TRAVEL_APPLICATION_created_by', 'FK_HR_LEAVE_TRAVEL_APPLICATION_CREATED_BY', 'OBJECT';
END
ELSE
    PRINT '  FK_HR_LEAVE_TRAVEL_APPLICATION_created_by already compliant or does not exist';


-- 2. FK_HR_LEAVE_TRAVEL_APPLICATION_updated_by -> FK_HR_LEAVE_TRAVEL_APPLICATION_UPDATED_BY
IF EXISTS (
    SELECT 1 
    FROM sys.foreign_keys 
    WHERE parent_object_id = OBJECT_ID('HR_LEAVE_TRAVEL_APPLICATION') 
      AND name = 'FK_HR_LEAVE_TRAVEL_APPLICATION_updated_by' 
      AND CAST(name AS VARCHAR(100)) COLLATE Latin1_General_BIN = 'FK_HR_LEAVE_TRAVEL_APPLICATION_updated_by'
)
BEGIN
    PRINT '  Renaming FK: FK_HR_LEAVE_TRAVEL_APPLICATION_updated_by -> FK_HR_LEAVE_TRAVEL_APPLICATION_UPDATED_BY';
    EXEC sp_rename 'FK_HR_LEAVE_TRAVEL_APPLICATION_updated_by', 'FK_HR_LEAVE_TRAVEL_APPLICATION_UPDATED_BY', 'OBJECT';
END
ELSE
    PRINT '  FK_HR_LEAVE_TRAVEL_APPLICATION_updated_by already compliant or does not exist';

PRINT '';
PRINT 'V335.0 — Leave Module FK Casing Standards — COMPLETED SUCCESSFULLY.';
PRINT '=======================================================================';
