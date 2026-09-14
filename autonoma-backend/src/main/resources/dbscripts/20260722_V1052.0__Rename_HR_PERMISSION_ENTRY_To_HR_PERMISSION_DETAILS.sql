-- =================================================================================
-- Migration Script: Rename HR_PERMISSION_ENTRY to HR_PERMISSION_DETAILS & Add WHERE_FROM Column
-- Date: 2026-07-22
-- Description: Idempotent rename of table HR_PERMISSION_ENTRY to HR_PERMISSION_DETAILS
--              and adding WHERE_FROM column to match HR_OD_DETAILS schema structure.
-- =================================================================================

-- 1. Rename table from HR_PERMISSION_ENTRY to HR_PERMISSION_DETAILS
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'HR_PERMISSION_ENTRY')
   AND NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'HR_PERMISSION_DETAILS')
BEGIN
    EXEC sp_rename 'HR_PERMISSION_ENTRY', 'HR_PERMISSION_DETAILS';
    PRINT 'Renamed HR_PERMISSION_ENTRY to HR_PERMISSION_DETAILS';
END
GO

-- 2. Ensure WHERE_FROM column exists in HR_PERMISSION_DETAILS (matching HR_OD_DETAILS schema)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'HR_PERMISSION_DETAILS')
   AND COL_LENGTH('dbo.HR_PERMISSION_DETAILS', 'WHERE_FROM') IS NULL
BEGIN
    ALTER TABLE dbo.HR_PERMISSION_DETAILS ADD WHERE_FROM VARCHAR(100) NULL;
    PRINT 'Added WHERE_FROM column to HR_PERMISSION_DETAILS';
END
GO
