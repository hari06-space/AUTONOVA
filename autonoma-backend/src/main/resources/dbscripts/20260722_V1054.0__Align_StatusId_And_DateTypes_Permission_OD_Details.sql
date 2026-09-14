-- =================================================================================
-- Migration Script: Align STATUS_ID and DATETIME types for HR_PERMISSION_DETAILS & HR_OD_DETAILS
-- Date: 2026-07-22
-- Description: 
-- 1. Replace STATUS VARCHAR/NVARCHAR with STATUS_ID BIGINT NULL referencing AD_STATUS_MASTER.
-- 2. Ensure CREATED_DATE, UPDATED_DATE, VERIFIED_DATE (and OD date times) are DATETIME.
-- =================================================================================

-- ---------------------------------------------------------------------------------
-- 1. HR_PERMISSION_DETAILS
-- ---------------------------------------------------------------------------------
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'HR_PERMISSION_DETAILS')
BEGIN
    -- Add STATUS_ID if not existing
    IF COL_LENGTH('dbo.HR_PERMISSION_DETAILS', 'STATUS_ID') IS NULL
    BEGIN
        ALTER TABLE dbo.HR_PERMISSION_DETAILS ADD STATUS_ID BIGINT NULL;
    END

    -- Populate STATUS_ID from existing STATUS string or default PENDING FOR VERIFY
    IF COL_LENGTH('dbo.HR_PERMISSION_DETAILS', 'STATUS') IS NOT NULL
    BEGIN
        EXEC('
            UPDATE p
            SET p.STATUS_ID = COALESCE(s.ID, 10022)
            FROM dbo.HR_PERMISSION_DETAILS p
            LEFT JOIN dbo.AD_STATUS_MASTER s ON UPPER(TRIM(s.NAME)) = UPPER(TRIM(p.STATUS))
            WHERE p.STATUS_ID IS NULL;
        ');
        
        -- Drop default constraint on STATUS if it exists
        DECLARE @ConstraintNameP NVARCHAR(200);
        SELECT @ConstraintNameP = name
        FROM sys.default_constraints
        WHERE parent_object_id = OBJECT_ID('dbo.HR_PERMISSION_DETAILS')
          AND col_name(parent_object_id, parent_column_id) = 'STATUS';

        IF @ConstraintNameP IS NOT NULL
            EXEC('ALTER TABLE dbo.HR_PERMISSION_DETAILS DROP CONSTRAINT ' + @ConstraintNameP);

        -- Drop old STATUS column
        ALTER TABLE dbo.HR_PERMISSION_DETAILS DROP COLUMN STATUS;
    END

    -- Ensure default STATUS_ID default constraint if needed
    IF NOT EXISTS (
        SELECT * FROM sys.default_constraints 
        WHERE parent_object_id = OBJECT_ID('dbo.HR_PERMISSION_DETAILS') 
          AND col_name(parent_object_id, parent_column_id) = 'STATUS_ID'
    )
    BEGIN
        ALTER TABLE dbo.HR_PERMISSION_DETAILS ADD CONSTRAINT DF_HR_PERMISSION_DETAILS_STATUS_ID DEFAULT 10022 FOR STATUS_ID;
    END

    -- Alter Date columns to DATETIME
    ALTER TABLE dbo.HR_PERMISSION_DETAILS ALTER COLUMN CREATED_DATE DATETIME NOT NULL;
    ALTER TABLE dbo.HR_PERMISSION_DETAILS ALTER COLUMN UPDATED_DATE DATETIME NULL;
    ALTER TABLE dbo.HR_PERMISSION_DETAILS ALTER COLUMN VERIFIED_DATE DATETIME NULL;
END
GO

-- ---------------------------------------------------------------------------------
-- 2. HR_OD_DETAILS
-- ---------------------------------------------------------------------------------
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'HR_OD_DETAILS')
BEGIN
    -- Add STATUS_ID if not existing
    IF COL_LENGTH('dbo.HR_OD_DETAILS', 'STATUS_ID') IS NULL
    BEGIN
        ALTER TABLE dbo.HR_OD_DETAILS ADD STATUS_ID BIGINT NULL;
    END

    -- Populate STATUS_ID from existing STATUS string or default PENDING FOR VERIFY
    IF COL_LENGTH('dbo.HR_OD_DETAILS', 'STATUS') IS NOT NULL
    BEGIN
        EXEC('
            UPDATE o
            SET o.STATUS_ID = COALESCE(s.ID, 10008)
            FROM dbo.HR_OD_DETAILS o
            LEFT JOIN dbo.AD_STATUS_MASTER s ON UPPER(TRIM(s.NAME)) = UPPER(TRIM(o.STATUS))
            WHERE o.STATUS_ID IS NULL;
        ');
        
        -- Drop default constraint on STATUS if it exists
        DECLARE @ConstraintNameO NVARCHAR(200);
        SELECT @ConstraintNameO = name
        FROM sys.default_constraints
        WHERE parent_object_id = OBJECT_ID('dbo.HR_OD_DETAILS')
          AND col_name(parent_object_id, parent_column_id) = 'STATUS';

        IF @ConstraintNameO IS NOT NULL
            EXEC('ALTER TABLE dbo.HR_OD_DETAILS DROP CONSTRAINT ' + @ConstraintNameO);

        -- Drop old STATUS column
        ALTER TABLE dbo.HR_OD_DETAILS DROP COLUMN STATUS;
    END

    -- Ensure default STATUS_ID default constraint if needed
    IF NOT EXISTS (
        SELECT * FROM sys.default_constraints 
        WHERE parent_object_id = OBJECT_ID('dbo.HR_OD_DETAILS') 
          AND col_name(parent_object_id, parent_column_id) = 'STATUS_ID'
    )
    BEGIN
        ALTER TABLE dbo.HR_OD_DETAILS ADD CONSTRAINT DF_HR_OD_DETAILS_STATUS_ID DEFAULT 10008 FOR STATUS_ID;
    END

    -- Alter Date columns to DATETIME
    ALTER TABLE dbo.HR_OD_DETAILS ALTER COLUMN OD_FROM_DATE_TIME DATETIME NULL;
    ALTER TABLE dbo.HR_OD_DETAILS ALTER COLUMN OD_TO_DATE_TIME DATETIME NULL;
    ALTER TABLE dbo.HR_OD_DETAILS ALTER COLUMN CREATED_DATE DATETIME NULL;
    ALTER TABLE dbo.HR_OD_DETAILS ALTER COLUMN UPDATED_DATE DATETIME NULL;
    ALTER TABLE dbo.HR_OD_DETAILS ALTER COLUMN VERIFIED_DATE DATETIME NULL;
END
GO
