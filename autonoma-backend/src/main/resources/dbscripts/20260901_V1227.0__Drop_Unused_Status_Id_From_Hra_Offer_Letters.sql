-- =============================================================================
-- Organization: Nutech Wind Parts Pvt Ltd
-- Owner: Yuvanesh M
-- Created At: 2026-09-01
-- Description: V1227.0 - Safely drop unused STATUS_ID column, drop its foreign key
--              and rebuild composite index on authoritative STATUS column in
--              HRA_OFFER_LETTERS.
-- =============================================================================

SET NOCOUNT ON;
GO

-- 1. PROCEED ONLY IF HRA_OFFER_LETTERS TABLE EXISTS
IF OBJECT_ID('dbo.HRA_OFFER_LETTERS', 'U') IS NOT NULL
BEGIN
    -- 2. DROP FOREIGN KEY CONSTRAINT ON STATUS_ID IF PRESENT
    IF EXISTS (
        SELECT 1 
        FROM sys.foreign_keys 
        WHERE name = 'FK_HRA_OFFER_LETTERS_STATUS_ID' 
          AND parent_object_id = OBJECT_ID('dbo.HRA_OFFER_LETTERS')
    )
    BEGIN
        ALTER TABLE [dbo].[HRA_OFFER_LETTERS] DROP CONSTRAINT [FK_HRA_OFFER_LETTERS_STATUS_ID];
    END;

    -- Also check for any dynamic foreign key referencing STATUS_ID column
    DECLARE @fkName NVARCHAR(128);
    DECLARE fk_cursor CURSOR LOCAL FAST_FORWARD FOR
        SELECT DISTINCT fk.name
        FROM sys.foreign_keys fk
        JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
        JOIN sys.columns c ON fkc.parent_object_id = c.object_id AND fkc.parent_column_id = c.column_id
        WHERE fk.parent_object_id = OBJECT_ID('dbo.HRA_OFFER_LETTERS')
          AND c.name = 'STATUS_ID';

    OPEN fk_cursor;
    FETCH NEXT FROM fk_cursor INTO @fkName;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        EXEC('ALTER TABLE [dbo].[HRA_OFFER_LETTERS] DROP CONSTRAINT [' + @fkName + '];');
        FETCH NEXT FROM fk_cursor INTO @fkName;
    END;
    CLOSE fk_cursor;
    DEALLOCATE fk_cursor;

    -- 3. DROP ANY INDEX REFERENCING STATUS_ID
    DECLARE @idxName NVARCHAR(128);
    DECLARE idx_cursor CURSOR LOCAL FAST_FORWARD FOR
        SELECT DISTINCT i.name 
        FROM sys.indexes i
        JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
        JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
        WHERE i.object_id = OBJECT_ID('dbo.HRA_OFFER_LETTERS')
          AND c.name = 'STATUS_ID'
          AND i.is_primary_key = 0
          AND i.is_unique_constraint = 0;

    OPEN idx_cursor;
    FETCH NEXT FROM idx_cursor INTO @idxName;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        EXEC('DROP INDEX [' + @idxName + '] ON [dbo].[HRA_OFFER_LETTERS];');
        FETCH NEXT FROM idx_cursor INTO @idxName;
    END;
    CLOSE idx_cursor;
    DEALLOCATE idx_cursor;

    -- 4. DROP ANY DEFAULT CONSTRAINTS ON STATUS_ID
    DECLARE @defConstraint NVARCHAR(128);
    DECLARE def_cursor CURSOR LOCAL FAST_FORWARD FOR
        SELECT dc.name 
        FROM sys.default_constraints dc
        JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
        WHERE dc.parent_object_id = OBJECT_ID('dbo.HRA_OFFER_LETTERS')
          AND c.name = 'STATUS_ID';

    OPEN def_cursor;
    FETCH NEXT FROM def_cursor INTO @defConstraint;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        EXEC('ALTER TABLE [dbo].[HRA_OFFER_LETTERS] DROP CONSTRAINT [' + @defConstraint + '];');
        FETCH NEXT FROM def_cursor INTO @defConstraint;
    END;
    CLOSE def_cursor;
    DEALLOCATE def_cursor;

    -- 5. DROP UNUSED STATUS_ID COLUMN IF IT EXISTS
    IF COL_LENGTH('dbo.HRA_OFFER_LETTERS', 'STATUS_ID') IS NOT NULL
    BEGIN
        ALTER TABLE [dbo].[HRA_OFFER_LETTERS] DROP COLUMN [STATUS_ID];
    END;

    -- 6. RECREATE COMPOSITE INDEX ON (APPLICANT_ID, STATUS) PRESERVING ALL INCLUDED COLUMNS
    IF NOT EXISTS (
        SELECT 1 
        FROM sys.indexes 
        WHERE name = 'IX_HRA_OFFER_LETTERS_APPLICANT_STATUS' 
          AND object_id = OBJECT_ID('dbo.HRA_OFFER_LETTERS')
    ) AND COL_LENGTH('dbo.HRA_OFFER_LETTERS', 'STATUS') IS NOT NULL
    BEGIN
        CREATE NONCLUSTERED INDEX [IX_HRA_OFFER_LETTERS_APPLICANT_STATUS]
        ON [dbo].[HRA_OFFER_LETTERS] ([APPLICANT_ID] ASC, [STATUS] ASC)
        INCLUDE ([REF_NO], [LETTER_DATE], [JOINING_DATE], [ANNUAL_CTC], [GROSS_SALARY]);
    END;
END;
GO
