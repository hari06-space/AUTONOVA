-- ==========================================================
-- SQL Migration: Redesign and Rename SM_PAYMENT_TERMS to MST_TERMS_MASTER
-- Version: V1164.0
-- Created: 2026-08-22
-- Target DB: AT_NUTECH
-- ==========================================================

-- 1. Create MST_TERMS_MASTER table if it does not exist
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[MST_TERMS_MASTER]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[MST_TERMS_MASTER] (
        [ID] BIGINT IDENTITY(1,1) NOT NULL,
        [CODE] NVARCHAR(250) NULL,
        [TYPE] NVARCHAR(100) NOT NULL,
        [DESCRIPTION] NVARCHAR(MAX) NOT NULL,
        [STATUS] BIT NOT NULL CONSTRAINT [DF_MST_TERMS_MASTER_STATUS] DEFAULT (1),
        [DIVISION] BIGINT NULL,
        [CREATED_BY] NVARCHAR(50) NOT NULL,
        [CREATED_DATE] DATETIME NULL CONSTRAINT [DF_MST_TERMS_MASTER_CREATED_DATE] DEFAULT (GETDATE()),
        [UPDATED_BY] NVARCHAR(50) NULL,
        [UPDATED_DATE] DATETIME NULL,
        CONSTRAINT [PK_MST_TERMS_MASTER] PRIMARY KEY CLUSTERED ([ID])
    );
END;
GO

-- 2. Migrate existing data from SM_PAYMENT_TERMS if it exists
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SM_PAYMENT_TERMS]') AND type in (N'U'))
BEGIN
    -- Copy data if MST_TERMS_MASTER is currently empty
    IF NOT EXISTS (SELECT 1 FROM [dbo].[MST_TERMS_MASTER])
    BEGIN
        SET IDENTITY_INSERT [dbo].[MST_TERMS_MASTER] ON;

        INSERT INTO [dbo].[MST_TERMS_MASTER] (
            [ID],
            [CODE],
            [TYPE],
            [DESCRIPTION],
            [STATUS],
            [CREATED_BY],
            [CREATED_DATE],
            [UPDATED_BY],
            [UPDATED_DATE]
        )
        SELECT 
            [ID],
            ISNULL([TERM_CODE], ''),
            'PAYMENT',
            ISNULL([DESCRIPTION], ISNULL([TERM_NAME], 'Payment Term')),
            CASE 
                WHEN UPPER(LTRIM(RTRIM(ISNULL([STATUS], '1')))) IN ('0', 'INACTIVE', 'FALSE') THEN 0 
                ELSE 1 
            END,
            ISNULL([CREATED_BY], 'Admin'),
            ISNULL([CREATED_DATE], GETDATE()),
            [UPDATED_BY],
            [UPDATED_DATE]
        FROM [dbo].[SM_PAYMENT_TERMS];

        SET IDENTITY_INSERT [dbo].[MST_TERMS_MASTER] OFF;
    END;

    -- Drop foreign keys referencing SM_PAYMENT_TERMS if any
    IF EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_SALES_PRICE_LIST_MASTER_PAY_TERM]'))
    BEGIN
        ALTER TABLE [dbo].[SALES_PRICE_LIST_MASTER] DROP CONSTRAINT [FK_SALES_PRICE_LIST_MASTER_PAY_TERM];
    END;

    IF EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_SM_PAYMENT_TERMS_CREATED_BY]'))
    BEGIN
        ALTER TABLE [dbo].[SM_PAYMENT_TERMS] DROP CONSTRAINT [FK_SM_PAYMENT_TERMS_CREATED_BY];
    END;

    IF EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_SM_PAYMENT_TERMS_UPDATED_BY]'))
    BEGIN
        ALTER TABLE [dbo].[SM_PAYMENT_TERMS] DROP CONSTRAINT [FK_SM_PAYMENT_TERMS_UPDATED_BY];
    END;

    -- Drop legacy table SM_PAYMENT_TERMS
    DROP TABLE [dbo].[SM_PAYMENT_TERMS];
END;
GO

-- 3. Add Foreign Key constraints to MST_TERMS_MASTER
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[MST_TERMS_MASTER]') AND type in (N'U'))
BEGIN
    -- FK for CREATED_BY
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_MST_TERMS_MASTER_CREATED_BY]'))
       AND EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AD_USER_CREDENTIAL]') AND type in (N'U'))
    BEGIN
        ALTER TABLE [dbo].[MST_TERMS_MASTER] WITH CHECK
        ADD CONSTRAINT [FK_MST_TERMS_MASTER_CREATED_BY] FOREIGN KEY ([CREATED_BY])
        REFERENCES [dbo].[AD_USER_CREDENTIAL] ([USER_ID]);
    END;

    -- FK for UPDATED_BY
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_MST_TERMS_MASTER_UPDATED_BY]'))
       AND EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AD_USER_CREDENTIAL]') AND type in (N'U'))
    BEGIN
        ALTER TABLE [dbo].[MST_TERMS_MASTER] WITH CHECK
        ADD CONSTRAINT [FK_MST_TERMS_MASTER_UPDATED_BY] FOREIGN KEY ([UPDATED_BY])
        REFERENCES [dbo].[AD_USER_CREDENTIAL] ([USER_ID]);
    END;

    -- FK for DIVISION
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_MST_TERMS_MASTER_DIVISION]'))
       AND EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AD_DIVISION]') AND type in (N'U'))
    BEGIN
        ALTER TABLE [dbo].[MST_TERMS_MASTER] WITH CHECK
        ADD CONSTRAINT [FK_MST_TERMS_MASTER_DIVISION] FOREIGN KEY ([DIVISION])
        REFERENCES [dbo].[AD_DIVISION] ([ID]);
    END;
END;
GO

-- 4. Re-link SALES_PRICE_LIST_MASTER to MST_TERMS_MASTER
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SALES_PRICE_LIST_MASTER]') AND type in (N'U'))
   AND EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SALES_PRICE_LIST_MASTER]') AND name = 'PAYMENT_TERM_ID')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_SALES_PRICE_LIST_MASTER_PAY_TERM]'))
    BEGIN
        ALTER TABLE [dbo].[SALES_PRICE_LIST_MASTER] WITH CHECK
        ADD CONSTRAINT [FK_SALES_PRICE_LIST_MASTER_PAY_TERM] FOREIGN KEY ([PAYMENT_TERM_ID])
        REFERENCES [dbo].[MST_TERMS_MASTER] ([ID]);
    END;
END;
GO

-- 5. Indexes for performance and search
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[MST_TERMS_MASTER]') AND type in (N'U'))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_MST_TERMS_MASTER_TYPE' AND object_id = OBJECT_ID(N'[dbo].[MST_TERMS_MASTER]'))
    BEGIN
        CREATE NONCLUSTERED INDEX [IX_MST_TERMS_MASTER_TYPE] ON [dbo].[MST_TERMS_MASTER] ([TYPE]);
    END;

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_MST_TERMS_MASTER_STATUS' AND object_id = OBJECT_ID(N'[dbo].[MST_TERMS_MASTER]'))
    BEGIN
        CREATE NONCLUSTERED INDEX [IX_MST_TERMS_MASTER_STATUS] ON [dbo].[MST_TERMS_MASTER] ([STATUS]);
    END;

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_MST_TERMS_MASTER_CODE' AND object_id = OBJECT_ID(N'[dbo].[MST_TERMS_MASTER]'))
    BEGIN
        CREATE NONCLUSTERED INDEX [IX_MST_TERMS_MASTER_CODE] ON [dbo].[MST_TERMS_MASTER] ([CODE]);
    END;

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_MST_TERMS_MASTER_DIVISION' AND object_id = OBJECT_ID(N'[dbo].[MST_TERMS_MASTER]'))
    BEGIN
        CREATE NONCLUSTERED INDEX [IX_MST_TERMS_MASTER_DIVISION] ON [dbo].[MST_TERMS_MASTER] ([DIVISION]);
    END;
END;
GO

-- 6. Update BOS_PAGES name for Page Code M5210
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[BOS_PAGES]') AND type in (N'U'))
BEGIN
    UPDATE [dbo].[BOS_PAGES]
    SET [PAGE_NAME] = 'Terms Master'
    WHERE [PAGE_CODE] = 'M5210';
END;
GO
