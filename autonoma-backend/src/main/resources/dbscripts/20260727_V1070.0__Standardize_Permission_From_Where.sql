-- Migration: Standardize FROM_WHERE in HR_PERMISSION_ENTRY
-- Date: 2026-07-27

IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'HR_PERMISSION_ENTRY')
BEGIN
    -- Update 'HR Permission Details' or 'Permission Details' to 'HRA Module'
    UPDATE dbo.HR_PERMISSION_ENTRY
    SET FROM_WHERE = 'HRA Module'
    WHERE FROM_WHERE IN ('HR Permission Details', 'Permission Details');

    -- Default NULL or empty FROM_WHERE to 'Employee Self Care'
    UPDATE dbo.HR_PERMISSION_ENTRY
    SET FROM_WHERE = 'Employee Self Care'
    WHERE FROM_WHERE IS NULL OR TRIM(FROM_WHERE) = '';

    PRINT 'Successfully standardized FROM_WHERE in HR_PERMISSION_ENTRY';
END
GO
