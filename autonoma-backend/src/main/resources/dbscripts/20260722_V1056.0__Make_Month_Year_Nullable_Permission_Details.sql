-- =================================================================================
-- Migration Script: Make MONTH and YEAR columns NULLable in HR_PERMISSION_DETAILS
-- Date: 2026-07-22
-- Description: Allow NULL or auto-populated values for MONTH and YEAR in HR_PERMISSION_DETAILS.
-- =================================================================================

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'HR_PERMISSION_DETAILS')
BEGIN
    IF COL_LENGTH('dbo.HR_PERMISSION_DETAILS', 'MONTH') IS NOT NULL
    BEGIN
        ALTER TABLE dbo.HR_PERMISSION_DETAILS ALTER COLUMN [MONTH] NVARCHAR(50) NULL;
        PRINT 'Altered [MONTH] column to NVARCHAR(50) NULL in HR_PERMISSION_DETAILS';
    END
    ELSE
    BEGIN
        ALTER TABLE dbo.HR_PERMISSION_DETAILS ADD [MONTH] NVARCHAR(50) NULL;
        PRINT 'Added [MONTH] column to HR_PERMISSION_DETAILS';
    END

    IF COL_LENGTH('dbo.HR_PERMISSION_DETAILS', 'YEAR') IS NOT NULL
    BEGIN
        ALTER TABLE dbo.HR_PERMISSION_DETAILS ALTER COLUMN [YEAR] INT NULL;
        PRINT 'Altered [YEAR] column to INT NULL in HR_PERMISSION_DETAILS';
    END
    ELSE
    BEGIN
        ALTER TABLE dbo.HR_PERMISSION_DETAILS ADD [YEAR] INT NULL;
        PRINT 'Added [YEAR] column to HR_PERMISSION_DETAILS';
    END
END
GO
