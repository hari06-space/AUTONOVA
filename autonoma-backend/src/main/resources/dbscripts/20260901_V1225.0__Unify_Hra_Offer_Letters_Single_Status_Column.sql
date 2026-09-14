-- =====================================================================================
-- Migration Script: V1225.0 - Unify HRA_OFFER_LETTERS Single Status Architecture
-- Target Database   : Application-configured primary database
-- Module            : HRA -> Onboarding -> Offer Letter (HA1360)
-- Description       : Consolidates STATUS (NVARCHAR) and STATUS_ID (BIGINT) into a
--                     single authoritative STATUS BIGINT NOT NULL column referencing
--                     dbo.AD_STATUS_MASTER(ID), unifying HA1360 with the ATS status model.
--                     Status values are resolved by NAME against AD_STATUS_MASTER; no
--                     status ID is hardcoded, because those identities are per-database.
-- =====================================================================================

SET NOCOUNT ON;

-- 0. ENSURE EVERY CANONICAL OFFER LETTER STATUS EXISTS BY NAME (IDEMPOTENT)
--    Name resolution below depends on these rows being present.
DECLARE @canonicalStatuses TABLE ([NAME] NVARCHAR(100) NOT NULL);
INSERT INTO @canonicalStatuses ([NAME])
VALUES ('Draft'), ('Sent'), ('Resent'), ('To Be Verified'), ('Verified'),
       ('Approved'), ('Accepted'), ('Joined'), ('Rejected'), ('Cancelled'), ('Pending');

INSERT INTO [dbo].[AD_STATUS_MASTER] ([NAME])
SELECT c.[NAME]
FROM @canonicalStatuses c
WHERE NOT EXISTS (
    SELECT 1 FROM [dbo].[AD_STATUS_MASTER] sm
    WHERE UPPER(LTRIM(RTRIM(sm.[NAME]))) = UPPER(c.[NAME])
);
GO

-- 1. ADD TEMPORARY BIGINT COLUMN (IF NOT ALREADY MIGRATED)
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'HRA_OFFER_LETTERS' AND COLUMN_NAME = 'STATUS' AND DATA_TYPE IN ('nvarchar', 'varchar', 'char', 'nchar'))
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'HRA_OFFER_LETTERS' AND COLUMN_NAME = 'NEW_STATUS')
    BEGIN
        ALTER TABLE [dbo].[HRA_OFFER_LETTERS] ADD [NEW_STATUS] BIGINT NULL;
    END

    -- 2. BACKFILL AND RECONCILE DATA DEFENSIVELY (STRICT PRIORITY ARCHITECTURE)
    -- =========================================================================
    -- CRITICAL SAFETY RULE:
    -- [STATUS] is the authoritative column written by the application.
    -- [STATUS_ID] is an obsolete transitional column from V1223.0 that may contain stale Draft (27) data.
    -- Therefore, a populated [STATUS_ID] MUST NEVER OVERRIDE a valid [STATUS].

    -- PRIORITY 1: Resolve numeric STATUS values (e.g. '34', '53', '27', '12') directly against AD_STATUS_MASTER(ID)
    EXEC('
        UPDATE hol
        SET hol.NEW_STATUS = sm.[ID]
        FROM [dbo].[HRA_OFFER_LETTERS] hol
        INNER JOIN [dbo].[AD_STATUS_MASTER] sm
            ON sm.[ID] = TRY_CAST(LTRIM(RTRIM(hol.[STATUS])) AS BIGINT)
        WHERE hol.NEW_STATUS IS NULL
          AND hol.[STATUS] IS NOT NULL
          AND TRY_CAST(LTRIM(RTRIM(hol.[STATUS])) AS BIGINT) IS NOT NULL;
    ');

    -- PRIORITY 2: Resolve textual STATUS values directly against AD_STATUS_MASTER by NAME (e.g. ''Sent'', ''Draft'', ''Resent'')
    EXEC('
        UPDATE hol
        SET hol.NEW_STATUS = sm.[ID]
        FROM [dbo].[HRA_OFFER_LETTERS] hol
        INNER JOIN [dbo].[AD_STATUS_MASTER] sm
            ON UPPER(LTRIM(RTRIM(sm.[NAME]))) = UPPER(LTRIM(RTRIM(hol.[STATUS])))
        WHERE hol.NEW_STATUS IS NULL
          AND hol.[STATUS] IS NOT NULL
          AND LTRIM(RTRIM(hol.[STATUS])) <> '''';
    ');

    -- PRIORITY 3: Map legacy/aliased status text onto its canonical AD_STATUS_MASTER name
    EXEC('
        UPDATE hol
        SET hol.NEW_STATUS = sm.[ID]
        FROM [dbo].[HRA_OFFER_LETTERS] hol
        INNER JOIN (VALUES
            (''OPEN'',               ''Draft''),
            (''EMAIL_SENT'',         ''Sent''),
            (''EMAIL SENT'',         ''Sent''),
            (''TO BE VERIFY'',       ''To Be Verified''),
            (''SUBMITTED'',          ''To Be Verified''),
            (''CONFIRM'',            ''Verified''),
            (''CANDIDATE ACCEPTED'', ''Accepted'')
        ) AS alias([LEGACY_NAME], [CANONICAL_NAME])
            ON alias.[LEGACY_NAME] = UPPER(LTRIM(RTRIM(hol.[STATUS])))
        INNER JOIN [dbo].[AD_STATUS_MASTER] sm
            ON UPPER(LTRIM(RTRIM(sm.[NAME]))) = UPPER(alias.[CANONICAL_NAME])
        WHERE hol.NEW_STATUS IS NULL
          AND hol.[STATUS] IS NOT NULL
          AND LTRIM(RTRIM(hol.[STATUS])) <> '''';
    ');

    -- PRIORITY 4: Fallback to STATUS_ID ONLY IF STATUS itself was genuinely NULL/empty/unresolvable
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'HRA_OFFER_LETTERS' AND COLUMN_NAME = 'STATUS_ID')
    BEGIN
        EXEC('
            UPDATE hol
            SET hol.NEW_STATUS = hol.STATUS_ID
            FROM [dbo].[HRA_OFFER_LETTERS] hol
            WHERE hol.NEW_STATUS IS NULL
              AND hol.STATUS_ID IS NOT NULL
              AND hol.STATUS_ID IN (SELECT ID FROM [dbo].[AD_STATUS_MASTER]);
        ');
    END

    -- PRIORITY 5: If both STATUS and STATUS_ID are NULL or unresolvable, default to Draft (resolved dynamically by name)
    EXEC('
        UPDATE hol
        SET hol.NEW_STATUS = sm.[ID]
        FROM [dbo].[HRA_OFFER_LETTERS] hol
        INNER JOIN [dbo].[AD_STATUS_MASTER] sm
            ON UPPER(LTRIM(RTRIM(sm.[NAME]))) = ''DRAFT''
        WHERE hol.NEW_STATUS IS NULL;
    ');

    -- 3. VALIDATION GATE: FAIL IF ANY ROW HAS AN UNMAPPED STATUS
    EXEC('
        IF EXISTS (SELECT 1 FROM [dbo].[HRA_OFFER_LETTERS] WHERE [NEW_STATUS] IS NULL OR [NEW_STATUS] NOT IN (SELECT ID FROM [dbo].[AD_STATUS_MASTER]))
        BEGIN
            THROW 50001, ''Migration V1225.0 Aborted: Found unmapped or invalid status values in HRA_OFFER_LETTERS.'', 1;
        END
    ');

    -- 4. DROP FOREIGN KEYS AND CONSTRAINTS ON OLD COLUMNS
    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_HRA_OFFER_LETTERS_STATUS_ID')
    BEGIN
        ALTER TABLE [dbo].[HRA_OFFER_LETTERS] DROP CONSTRAINT [FK_HRA_OFFER_LETTERS_STATUS_ID];
    END

    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_HRA_OFFER_LETTERS_STATUS')
    BEGIN
        ALTER TABLE [dbo].[HRA_OFFER_LETTERS] DROP CONSTRAINT [FK_HRA_OFFER_LETTERS_STATUS];
    END

    -- Drop indexes on STATUS or STATUS_ID if any exist
    DECLARE @indexName NVARCHAR(128);
    DECLARE index_cursor CURSOR FOR
        SELECT i.name 
        FROM sys.indexes i
        JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
        JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
        WHERE i.object_id = OBJECT_ID('dbo.HRA_OFFER_LETTERS')
          AND c.name IN ('STATUS', 'STATUS_ID')
          AND i.is_primary_key = 0
          AND i.is_unique_constraint = 0;

    OPEN index_cursor;
    FETCH NEXT FROM index_cursor INTO @indexName;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        EXEC('DROP INDEX [' + @indexName + '] ON [dbo].[HRA_OFFER_LETTERS];');
        FETCH NEXT FROM index_cursor INTO @indexName;
    END
    CLOSE index_cursor;
    DEALLOCATE index_cursor;

    -- Drop default constraints on STATUS
    DECLARE @defConstraintName NVARCHAR(128);
    DECLARE def_cursor CURSOR FOR
        SELECT dc.name 
        FROM sys.default_constraints dc
        JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
        WHERE dc.parent_object_id = OBJECT_ID('dbo.HRA_OFFER_LETTERS')
          AND c.name = 'STATUS';

    OPEN def_cursor;
    FETCH NEXT FROM def_cursor INTO @defConstraintName;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        EXEC('ALTER TABLE [dbo].[HRA_OFFER_LETTERS] DROP CONSTRAINT [' + @defConstraintName + '];');
        FETCH NEXT FROM def_cursor INTO @defConstraintName;
    END
    CLOSE def_cursor;
    DEALLOCATE def_cursor;

    -- 5. DROP OLD NVARCHAR STATUS AND OLD STATUS_ID COLUMNS
    ALTER TABLE [dbo].[HRA_OFFER_LETTERS] DROP COLUMN [STATUS];

    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'HRA_OFFER_LETTERS' AND COLUMN_NAME = 'STATUS_ID')
    BEGIN
        ALTER TABLE [dbo].[HRA_OFFER_LETTERS] DROP COLUMN [STATUS_ID];
    END

    -- 6. RENAME NEW_STATUS TO STATUS
    EXEC sp_rename 'dbo.HRA_OFFER_LETTERS.NEW_STATUS', 'STATUS', 'COLUMN';

    -- Set NOT NULL
    ALTER TABLE [dbo].[HRA_OFFER_LETTERS] ALTER COLUMN [STATUS] BIGINT NOT NULL;

    PRINT 'HRA_OFFER_LETTERS.STATUS successfully converted to BIGINT NOT NULL';
END
GO

-- 7. ESTABLISH CANONICAL FOREIGN KEY TO AD_STATUS_MASTER(ID)
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_HRA_OFFER_LETTERS_STATUS')
BEGIN
    ALTER TABLE [dbo].[HRA_OFFER_LETTERS]
    ADD CONSTRAINT [FK_HRA_OFFER_LETTERS_STATUS]
    FOREIGN KEY ([STATUS]) REFERENCES [dbo].[AD_STATUS_MASTER] ([ID]);
    PRINT 'FK_HRA_OFFER_LETTERS_STATUS created successfully';
END
GO

-- 8. RECREATE STATUS PERFORMANCE INDEX
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_HRA_OFFER_LETTERS_STATUS' AND object_id = OBJECT_ID('dbo.HRA_OFFER_LETTERS'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_HRA_OFFER_LETTERS_STATUS]
    ON [dbo].[HRA_OFFER_LETTERS] ([STATUS])
    INCLUDE ([ID], [REF_NO], [LETTER_TYPE], [APPLICANT_ID], [EMPLOYEE_NAME]);
    PRINT 'IX_HRA_OFFER_LETTERS_STATUS created successfully';
END
GO

-- 9. RECREATE THE LIST COVERING INDEX FROM V1222.0
--    Step 4 drops every non-key index that references STATUS, which includes
--    IX_HRA_OFFER_LETTERS_TYPE_ID (STATUS is in its INCLUDE list). Without this
--    block the covering index for the offer letter list query is lost.
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_HRA_OFFER_LETTERS_TYPE_ID' AND object_id = OBJECT_ID('dbo.HRA_OFFER_LETTERS'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_HRA_OFFER_LETTERS_TYPE_ID]
    ON [dbo].[HRA_OFFER_LETTERS] ([LETTER_TYPE] ASC, [ID] DESC)
    INCLUDE (
        [REF_NO],
        [LETTER_DATE],
        [EMPLOYEE_CODE],
        [EMPLOYEE_NAME],
        [DEPARTMENT],
        [DESIGNATION],
        [STATUS],
        [CREATED_BY],
        [CREATED_DATE]
    );
    PRINT 'IX_HRA_OFFER_LETTERS_TYPE_ID recreated successfully';
END
GO

-- 10. RECREATE THE APPLICANT/STATUS INDEX FROM V1223.0
--     Also dropped by step 4 because its key includes the old STATUS_ID column.
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_HRA_OFFER_LETTERS_APPLICANT_STATUS' AND object_id = OBJECT_ID('dbo.HRA_OFFER_LETTERS'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_HRA_OFFER_LETTERS_APPLICANT_STATUS]
    ON [dbo].[HRA_OFFER_LETTERS] ([APPLICANT_ID] ASC, [STATUS] ASC)
    INCLUDE ([REF_NO], [LETTER_DATE], [JOINING_DATE], [ANNUAL_CTC], [GROSS_SALARY]);
    PRINT 'IX_HRA_OFFER_LETTERS_APPLICANT_STATUS recreated successfully';
END
GO
