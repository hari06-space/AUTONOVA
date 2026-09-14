-- ============================================================================
-- Created At  : 2026-08-30
-- Description : Add covering nonclustered index on HRA_OFFER_LETTERS for rapid summary table queries
-- Module      : HRA / Onboarding / Offer Letter (HA1360)
-- Target DB   : Application-configured primary database
-- Note        : V1225.0 converts STATUS to BIGINT and recreates this index afterwards.
-- ============================================================================

IF OBJECT_ID('dbo.HRA_OFFER_LETTERS', 'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes 
        WHERE name = 'IX_HRA_OFFER_LETTERS_TYPE_ID' 
          AND object_id = OBJECT_ID('dbo.HRA_OFFER_LETTERS')
    )
    BEGIN
        PRINT 'Creating covering nonclustered index [IX_HRA_OFFER_LETTERS_TYPE_ID] on [dbo].[HRA_OFFER_LETTERS]...';
        
        CREATE NONCLUSTERED INDEX [IX_HRA_OFFER_LETTERS_TYPE_ID]
        ON [dbo].[HRA_OFFER_LETTERS] (
            [LETTER_TYPE] ASC,
            [ID] DESC
        )
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
        
        PRINT 'Index [IX_HRA_OFFER_LETTERS_TYPE_ID] created successfully.';
    END
    ELSE
    BEGIN
        PRINT 'Index [IX_HRA_OFFER_LETTERS_TYPE_ID] already exists on [dbo].[HRA_OFFER_LETTERS]. Skipping creation.';
    END
END
ELSE
BEGIN
    PRINT 'Table [dbo].[HRA_OFFER_LETTERS] does not exist. Skipping index creation.';
END
GO

PRINT 'SQL Migration 20260901_V1222.0__Add_Covering_Index_Hra_Offer_Letters executed successfully.';
