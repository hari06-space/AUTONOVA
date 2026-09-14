-- Claimed Version: V330.0
-- Description: Refactor Leave Entry attachments to use HR_ATTACHMENT_PATH instead of FILE_PATHS column and drop HR_LEAVE_ENTRY_FILE_MAPPING

-- 1. Copy existing file paths from HR_LEAVE_ENTRY_FILE_MAPPING to HR_ATTACHMENT_PATH if mapping table exists
IF OBJECT_ID('HR_LEAVE_ENTRY_FILE_MAPPING', 'U') IS NOT NULL AND OBJECT_ID('HR_ATTACHMENT_PATH', 'U') IS NOT NULL
BEGIN
    INSERT INTO HR_ATTACHMENT_PATH (PAGE_CODE, REF_ID, DOC_TYPE, PATH, FILE_NAME, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE, UPDATED_USER)
    SELECT
        'M2390' AS PAGE_CODE,
        LEAVE_ENTRY_ID AS REF_ID,
        'LEAVE_ENTRY_ATTACHMENT' AS DOC_TYPE,
        FILE_PATH AS PATH,
        CASE 
            WHEN CHARINDEX('/', FILE_PATH) > 0 
            THEN SUBSTRING(FILE_PATH, LEN(FILE_PATH) - CHARINDEX('/', REVERSE(FILE_PATH)) + 2, LEN(FILE_PATH))
            ELSE FILE_PATH 
        END AS FILE_NAME,
        ISNULL(CREATED_BY, 'SYSTEM') AS CREATED_BY,
        ISNULL(CREATED_DATE, GETDATE()) AS CREATED_DATE,
        UPDATED_BY,
        UPDATED_DATE,
        UPDATED_BY AS UPDATED_USER
    FROM HR_LEAVE_ENTRY_FILE_MAPPING m
    WHERE NOT EXISTS (
        SELECT 1 FROM HR_ATTACHMENT_PATH a
        WHERE a.PAGE_CODE = 'M2390' 
          AND a.REF_ID = m.LEAVE_ENTRY_ID 
          AND a.DOC_TYPE = 'LEAVE_ENTRY_ATTACHMENT'
          AND a.PATH = m.FILE_PATH
    );
    PRINT 'Migrated leave entry attachments to HR_ATTACHMENT_PATH.';
END
GO

-- 2. Drop the redundant mapping table HR_LEAVE_ENTRY_FILE_MAPPING
IF OBJECT_ID('HR_LEAVE_ENTRY_FILE_MAPPING', 'U') IS NOT NULL
BEGIN
    DROP TABLE HR_LEAVE_ENTRY_FILE_MAPPING;
    PRINT 'Dropped redundant HR_LEAVE_ENTRY_FILE_MAPPING table.';
END
GO

-- 3. Drop the legacy FILE_PATHS column from HR_LEAVE_ENTRY
IF OBJECT_ID('HR_LEAVE_ENTRY', 'U') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('HR_LEAVE_ENTRY') AND name = 'FILE_PATHS')
    BEGIN
        -- Check and drop any default constraints on FILE_PATHS column
        DECLARE @ConstraintName NVARCHAR(128);
        SELECT @ConstraintName = d.name
        FROM sys.default_constraints d
        INNER JOIN sys.columns c ON d.parent_column_id = c.column_id AND d.parent_object_id = c.object_id
        WHERE d.parent_object_id = OBJECT_ID('HR_LEAVE_ENTRY') AND c.name = 'FILE_PATHS';

        IF @ConstraintName IS NOT NULL
        BEGIN
            EXEC('ALTER TABLE HR_LEAVE_ENTRY DROP CONSTRAINT ' + @ConstraintName);
            PRINT 'Dropped default constraint ' + @ConstraintName + ' from HR_LEAVE_ENTRY.FILE_PATHS';
        END

        ALTER TABLE HR_LEAVE_ENTRY DROP COLUMN FILE_PATHS;
        PRINT 'Dropped legacy FILE_PATHS column from HR_LEAVE_ENTRY.';
    END
END
GO
