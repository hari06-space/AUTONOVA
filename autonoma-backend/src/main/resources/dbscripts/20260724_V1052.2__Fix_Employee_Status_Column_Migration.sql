-- =============================================================================
-- Fix: Complete the HR_EMPLOYEE STATUS column migration from NVARCHAR to BIGINT FK
-- Uses dynamic SQL to avoid column-not-found parse errors inside IF blocks.
-- Drops dependent constraints and indexes before dropping the STATUS column.
-- =============================================================================
SET NOCOUNT ON;

-- Step 1: Ensure all required statuses exist in AD_STATUS_MASTER
IF NOT EXISTS (SELECT 1 FROM AD_STATUS_MASTER WHERE UPPER(TRIM(NAME)) = 'ACTIVE')
    INSERT INTO AD_STATUS_MASTER (NAME) VALUES ('Active');

IF NOT EXISTS (SELECT 1 FROM AD_STATUS_MASTER WHERE UPPER(TRIM(NAME)) = 'INACTIVE')
    INSERT INTO AD_STATUS_MASTER (NAME) VALUES ('Inactive');

IF NOT EXISTS (SELECT 1 FROM AD_STATUS_MASTER WHERE UPPER(TRIM(NAME)) = 'APPLIED')
    INSERT INTO AD_STATUS_MASTER (NAME) VALUES ('APPLIED');

IF NOT EXISTS (SELECT 1 FROM AD_STATUS_MASTER WHERE UPPER(TRIM(NAME)) = 'SELECTED')
    INSERT INTO AD_STATUS_MASTER (NAME) VALUES ('SELECTED');

IF NOT EXISTS (SELECT 1 FROM AD_STATUS_MASTER WHERE UPPER(TRIM(NAME)) = 'ARCHIVED')
    INSERT INTO AD_STATUS_MASTER (NAME) VALUES ('ARCHIVED');

IF NOT EXISTS (SELECT 1 FROM AD_STATUS_MASTER WHERE UPPER(TRIM(NAME)) = 'REJECTED')
    INSERT INTO AD_STATUS_MASTER (NAME) VALUES ('REJECTED');

GO

-- Step 2: Only run if STATUS column is still NVARCHAR
IF EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'HR_EMPLOYEE'
      AND COLUMN_NAME = 'STATUS'
      AND DATA_TYPE = 'nvarchar'
)
BEGIN
    -- Add STATUS_ID column if not present
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'HR_EMPLOYEE' AND COLUMN_NAME = 'STATUS_ID'
    )
    BEGIN
        EXEC('ALTER TABLE HR_EMPLOYEE ADD STATUS_ID BIGINT NULL');
    END

    -- Map all STATUS values via dynamic SQL
    EXEC('
        UPDATE HR_EMPLOYEE
        SET STATUS_ID = (SELECT ID FROM AD_STATUS_MASTER WHERE UPPER(TRIM(NAME)) = ''ACTIVE'')
        WHERE UPPER(TRIM(STATUS)) = ''ACTIVE'';

        UPDATE HR_EMPLOYEE
        SET STATUS_ID = (SELECT ID FROM AD_STATUS_MASTER WHERE UPPER(TRIM(NAME)) = ''INACTIVE'')
        WHERE UPPER(TRIM(STATUS)) = ''INACTIVE'';

        UPDATE HR_EMPLOYEE
        SET STATUS_ID = (SELECT ID FROM AD_STATUS_MASTER WHERE UPPER(TRIM(NAME)) = ''APPLIED'')
        WHERE UPPER(TRIM(STATUS)) = ''APPLIED'';

        UPDATE HR_EMPLOYEE
        SET STATUS_ID = (SELECT ID FROM AD_STATUS_MASTER WHERE UPPER(TRIM(NAME)) = ''SELECTED'')
        WHERE UPPER(TRIM(STATUS)) = ''SELECTED'';

        UPDATE HR_EMPLOYEE
        SET STATUS_ID = (SELECT ID FROM AD_STATUS_MASTER WHERE UPPER(TRIM(NAME)) = ''ARCHIVED'')
        WHERE UPPER(TRIM(STATUS)) = ''ARCHIVED'';

        UPDATE HR_EMPLOYEE
        SET STATUS_ID = (SELECT ID FROM AD_STATUS_MASTER WHERE UPPER(TRIM(NAME)) = ''REJECTED'')
        WHERE UPPER(TRIM(STATUS)) = ''REJECTED'';

        UPDATE HR_EMPLOYEE
        SET STATUS_ID = (SELECT ID FROM AD_STATUS_MASTER WHERE UPPER(TRIM(NAME)) = ''ACTIVE'')
        WHERE STATUS_ID IS NULL;

        ALTER TABLE HR_EMPLOYEE ALTER COLUMN STATUS_ID BIGINT NOT NULL;
    ');

    -- Drop default constraints on STATUS column dynamically
    DECLARE @constraintName NVARCHAR(256);
    DECLARE @sql NVARCHAR(512);

    DECLARE constraint_cursor CURSOR FOR
        SELECT dc.name
        FROM sys.default_constraints dc
        INNER JOIN sys.columns c ON dc.parent_column_id = c.column_id AND dc.parent_object_id = c.object_id
        WHERE c.object_id = OBJECT_ID('HR_EMPLOYEE') AND c.name = 'STATUS';

    OPEN constraint_cursor;
    FETCH NEXT FROM constraint_cursor INTO @constraintName;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @sql = 'ALTER TABLE HR_EMPLOYEE DROP CONSTRAINT ' + QUOTENAME(@constraintName);
        EXEC(@sql);
        FETCH NEXT FROM constraint_cursor INTO @constraintName;
    END
    CLOSE constraint_cursor;
    DEALLOCATE constraint_cursor;

    -- Drop indexes on STATUS column dynamically
    DECLARE @indexName NVARCHAR(256);

    DECLARE index_cursor CURSOR FOR
        SELECT i.name
        FROM sys.indexes i
        INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
        INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
        WHERE i.object_id = OBJECT_ID('HR_EMPLOYEE')
          AND c.name = 'STATUS'
          AND i.is_primary_key = 0
          AND i.is_unique_constraint = 0;

    OPEN index_cursor;
    FETCH NEXT FROM index_cursor INTO @indexName;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @sql = 'DROP INDEX ' + QUOTENAME(@indexName) + ' ON HR_EMPLOYEE';
        EXEC(@sql);
        FETCH NEXT FROM index_cursor INTO @indexName;
    END
    CLOSE index_cursor;
    DEALLOCATE index_cursor;

    -- Now drop the old STATUS column
    EXEC('ALTER TABLE HR_EMPLOYEE DROP COLUMN STATUS');

    -- Rename STATUS_ID to STATUS
    EXEC('EXEC sp_rename ''HR_EMPLOYEE.STATUS_ID'', ''STATUS'', ''COLUMN''');

    -- Add FK constraint
    IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys
        WHERE name = 'FK_HR_EMPLOYEE_STATUS' AND parent_object_id = OBJECT_ID('HR_EMPLOYEE')
    )
    BEGIN
        EXEC('ALTER TABLE HR_EMPLOYEE ADD CONSTRAINT FK_HR_EMPLOYEE_STATUS FOREIGN KEY (STATUS) REFERENCES AD_STATUS_MASTER(ID)');
    END

    PRINT 'SUCCESS: HR_EMPLOYEE.STATUS column migration completed.';
END
ELSE
BEGIN
    PRINT 'SKIPPED: HR_EMPLOYEE.STATUS is already BIGINT.';
END

GO
