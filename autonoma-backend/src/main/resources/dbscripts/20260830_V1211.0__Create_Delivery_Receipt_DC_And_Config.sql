-- ============================================================================
-- V1211.0  Add Delivery Receipt (DC) docType, Prefix Config & Register Page SM1190
-- Date  : 2026-08-30
-- ============================================================================

-- 1. Add DOC_TYPE to SM_INVOICE_HEADER
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[SM_INVOICE_HEADER]') 
      AND name = N'DOC_TYPE'
)
BEGIN
    ALTER TABLE [dbo].[SM_INVOICE_HEADER]
    ADD [DOC_TYPE] NVARCHAR(30) NOT NULL CONSTRAINT DF_SM_INVOICE_HEADER_DOC_TYPE DEFAULT 'INVOICE';
    PRINT 'Added DOC_TYPE column to SM_INVOICE_HEADER.';
END
GO

-- Backfill any NULL DOC_TYPE to INVOICE
UPDATE [dbo].[SM_INVOICE_HEADER]
SET [DOC_TYPE] = 'INVOICE'
WHERE [DOC_TYPE] IS NULL;
GO

-- Performance index for filtered document type lookups
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = N'IX_SM_INVOICE_HEADER_DOC_TYPE' 
      AND object_id = OBJECT_ID(N'[dbo].[SM_INVOICE_HEADER]')
)
BEGIN
    CREATE NONCLUSTERED INDEX [IX_SM_INVOICE_HEADER_DOC_TYPE] 
    ON [dbo].[SM_INVOICE_HEADER] ([DOC_TYPE] ASC, [ID] DESC);
    PRINT 'Created index IX_SM_INVOICE_HEADER_DOC_TYPE.';
END
GO

-- 2. Add DC Prefix / Suffix / Digit columns to AD_PREFIX_CREDENTIALS
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[AD_PREFIX_CREDENTIALS]') 
      AND name = N'DC_PREFIX'
)
BEGIN
    ALTER TABLE [dbo].[AD_PREFIX_CREDENTIALS]
    ADD [DC_PREFIX] NVARCHAR(20) NULL;
    PRINT 'Added DC_PREFIX column to AD_PREFIX_CREDENTIALS.';
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[AD_PREFIX_CREDENTIALS]') 
      AND name = N'DC_SUFFIX'
)
BEGIN
    ALTER TABLE [dbo].[AD_PREFIX_CREDENTIALS]
    ADD [DC_SUFFIX] NVARCHAR(20) NULL;
    PRINT 'Added DC_SUFFIX column to AD_PREFIX_CREDENTIALS.';
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[AD_PREFIX_CREDENTIALS]') 
      AND name = N'DC_DIGIT'
)
BEGIN
    ALTER TABLE [dbo].[AD_PREFIX_CREDENTIALS]
    ADD [DC_DIGIT] INT NULL;
    PRINT 'Added DC_DIGIT column to AD_PREFIX_CREDENTIALS.';
END
GO

-- 3. Register SM1190 (Delivery Receipt (DC)) in BOS_PAGES
DECLARE @SmModId INT;
SELECT @SmModId = MODULE_ID FROM BOS_MODULES WHERE MOD_CODE = 'SM0000';
IF @SmModId IS NULL SET @SmModId = 4;

DECLARE @SmSubModId INT;
SELECT TOP 1 @SmSubModId = SUB_MOD_ID FROM BOS_SUB_MODULES WHERE MOD_ID = @SmModId;
IF @SmSubModId IS NULL SET @SmSubModId = 411;

IF NOT EXISTS (SELECT 1 FROM BOS_PAGES WHERE PAGE_CODE = 'SM1190')
BEGIN
    INSERT INTO BOS_PAGES (MOD_ID, SUB_MOD_ID, PAGE_CODE, PAGE_NAME, ENABLED, PAGE_URL, ICON)
    VALUES (@SmModId, @SmSubModId, 'SM1190', N'Delivery Receipt (DC)', 1, '/sm/sales/customer/delivery-receipts', 'IconTruckDelivery');
    PRINT 'Page SM1190 (Delivery Receipt (DC)) registered in BOS_PAGES.';
END
ELSE
BEGIN
    UPDATE BOS_PAGES
    SET PAGE_NAME = N'Delivery Receipt (DC)',
        PAGE_URL = '/sm/sales/customer/delivery-receipts',
        ENABLED = 1,
        ICON = 'IconTruckDelivery'
    WHERE PAGE_CODE = 'SM1190';
    PRINT 'Page SM1190 updated in BOS_PAGES.';
END
GO

-- 4. Grant full permissions to all active users for SM1190
DECLARE @dcPageId INT;
SELECT @dcPageId = PAGE_ID FROM BOS_PAGES WHERE PAGE_CODE = 'SM1190';

DECLARE @SmModId INT;
SELECT @SmModId = MODULE_ID FROM BOS_MODULES WHERE MOD_CODE = 'SM0000';
IF @SmModId IS NULL SET @SmModId = 4;

DECLARE @SmSubModId INT;
SELECT TOP 1 @SmSubModId = SUB_MOD_ID FROM BOS_SUB_MODULES WHERE MOD_ID = @SmModId;
IF @SmSubModId IS NULL SET @SmSubModId = 411;

IF @dcPageId IS NOT NULL
BEGIN
    INSERT INTO BOS_USER_PAGE_AUTH
        (USER_ID, PAGE_ID, SUB_MOD_ID, MOD_ID, ENABLE, READ_ACS, WRITE, DELETE_ACS,
         EXPORT, APPROVAL, MANAGER, ADDITIONAL1, ADDITIONAL2, ADD_TASK_ENABLE, CREATED_BY, CREATED_DATE)
    SELECT
        u.USER_ID, @dcPageId, @SmSubModId, @SmModId,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 'SYSTEM', SYSDATETIME()
    FROM AD_USER_CREDENTIAL u
    WHERE u.USER_ID NOT IN (
        SELECT USER_ID FROM BOS_USER_PAGE_AUTH WHERE PAGE_ID = @dcPageId
    );
    PRINT 'Access grants for SM1190 seeded for all users.';
END
GO

PRINT 'V1211.0 migration completed successfully.';
