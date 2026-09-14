-- =================================================================================
-- Migration Script: Remove APPROVED_BY, APPROVED_DATE, REJECTED_BY, REJECTED_DATE, IS_ACTIVE from HR_PERMISSION_DETAILS
-- Date: 2026-07-22
-- Description: Idempotently drop unneeded columns from HR_PERMISSION_DETAILS table.
-- =================================================================================

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'HR_PERMISSION_DETAILS')
BEGIN
    IF COL_LENGTH('dbo.HR_PERMISSION_DETAILS', 'APPROVED_BY') IS NOT NULL
        ALTER TABLE dbo.HR_PERMISSION_DETAILS DROP COLUMN APPROVED_BY;

    IF COL_LENGTH('dbo.HR_PERMISSION_DETAILS', 'APPROVED_DATE') IS NOT NULL
        ALTER TABLE dbo.HR_PERMISSION_DETAILS DROP COLUMN APPROVED_DATE;

    IF COL_LENGTH('dbo.HR_PERMISSION_DETAILS', 'REJECTED_BY') IS NOT NULL
        ALTER TABLE dbo.HR_PERMISSION_DETAILS DROP COLUMN REJECTED_BY;

    IF COL_LENGTH('dbo.HR_PERMISSION_DETAILS', 'REJECTED_DATE') IS NOT NULL
        ALTER TABLE dbo.HR_PERMISSION_DETAILS DROP COLUMN REJECTED_DATE;

    -- Drop default constraint on IS_ACTIVE if it exists before dropping column
    DECLARE @ConstraintName NVARCHAR(200);
    SELECT @ConstraintName = name
    FROM sys.default_constraints
    WHERE parent_object_id = OBJECT_ID('dbo.HR_PERMISSION_DETAILS')
      AND col_name(parent_object_id, parent_column_id) = 'IS_ACTIVE';

    IF @ConstraintName IS NOT NULL
        EXEC('ALTER TABLE dbo.HR_PERMISSION_DETAILS DROP CONSTRAINT ' + @ConstraintName);

    IF COL_LENGTH('dbo.HR_PERMISSION_DETAILS', 'IS_ACTIVE') IS NOT NULL
        ALTER TABLE dbo.HR_PERMISSION_DETAILS DROP COLUMN IS_ACTIVE;

    PRINT 'Dropped APPROVED_BY, APPROVED_DATE, REJECTED_BY, REJECTED_DATE, IS_ACTIVE columns from HR_PERMISSION_DETAILS';
END
GO
