-- ============================================================================
-- V1210.0  Register Sales Invoice (SM1180) and Customer Order (SM1160) Pages & Seed Permissions
-- Date  : 2026-08-30
-- ============================================================================

DECLARE @SmModId INT;
SELECT @SmModId = MODULE_ID FROM BOS_MODULES WHERE MOD_CODE = 'SM0000';
IF @SmModId IS NULL SET @SmModId = 4;

DECLARE @SmSubModId INT;
SELECT TOP 1 @SmSubModId = SUB_MOD_ID FROM BOS_SUB_MODULES WHERE MOD_ID = @SmModId;
IF @SmSubModId IS NULL SET @SmSubModId = 411;

-- 1. Register SM1180 (Sales Invoice)
IF NOT EXISTS (SELECT 1 FROM BOS_PAGES WHERE PAGE_CODE = 'SM1180')
BEGIN
    INSERT INTO BOS_PAGES (MOD_ID, SUB_MOD_ID, PAGE_CODE, PAGE_NAME, ENABLED, PAGE_URL, ICON)
    VALUES (@SmModId, @SmSubModId, 'SM1180', N'Sales Invoice', 1, '/sm/sales/customer/invoices', 'IconFileInvoice');
    PRINT 'Page SM1180 (Sales Invoice) registered in BOS_PAGES.';
END
ELSE
BEGIN
    UPDATE BOS_PAGES
    SET PAGE_NAME = N'Sales Invoice',
        PAGE_URL = '/sm/sales/customer/invoices',
        ENABLED = 1,
        ICON = 'IconFileInvoice'
    WHERE PAGE_CODE = 'SM1180';
    PRINT 'Page SM1180 updated in BOS_PAGES.';
END
GO

-- 2. Register SM1160 (Customer Order)
DECLARE @SmModId INT;
SELECT @SmModId = MODULE_ID FROM BOS_MODULES WHERE MOD_CODE = 'SM0000';
IF @SmModId IS NULL SET @SmModId = 4;

DECLARE @SmSubModId INT;
SELECT TOP 1 @SmSubModId = SUB_MOD_ID FROM BOS_SUB_MODULES WHERE MOD_ID = @SmModId;
IF @SmSubModId IS NULL SET @SmSubModId = 411;

IF NOT EXISTS (SELECT 1 FROM BOS_PAGES WHERE PAGE_CODE = 'SM1160')
BEGIN
    INSERT INTO BOS_PAGES (MOD_ID, SUB_MOD_ID, PAGE_CODE, PAGE_NAME, ENABLED, PAGE_URL, ICON)
    VALUES (@SmModId, @SmSubModId, 'SM1160', N'Customer Order', 1, '/sm/sales/customer/order-management', 'IconPackage');
    PRINT 'Page SM1160 (Customer Order) registered in BOS_PAGES.';
END
ELSE
BEGIN
    UPDATE BOS_PAGES
    SET PAGE_NAME = N'Customer Order',
        PAGE_URL = '/sm/sales/customer/order-management',
        ENABLED = 1,
        ICON = 'IconPackage'
    WHERE PAGE_CODE = 'SM1160';
    PRINT 'Page SM1160 updated in BOS_PAGES.';
END
GO

-- 3. Grant full permissions to all active users for SM1180
DECLARE @invoicePageId INT;
SELECT @invoicePageId = PAGE_ID FROM BOS_PAGES WHERE PAGE_CODE = 'SM1180';

DECLARE @SmModId INT;
SELECT @SmModId = MODULE_ID FROM BOS_MODULES WHERE MOD_CODE = 'SM0000';
IF @SmModId IS NULL SET @SmModId = 4;

DECLARE @SmSubModId INT;
SELECT TOP 1 @SmSubModId = SUB_MOD_ID FROM BOS_SUB_MODULES WHERE MOD_ID = @SmModId;
IF @SmSubModId IS NULL SET @SmSubModId = 411;

IF @invoicePageId IS NOT NULL
BEGIN
    INSERT INTO BOS_USER_PAGE_AUTH
        (USER_ID, PAGE_ID, SUB_MOD_ID, MOD_ID, ENABLE, READ_ACS, WRITE, DELETE_ACS,
         EXPORT, APPROVAL, MANAGER, ADDITIONAL1, ADDITIONAL2, ADD_TASK_ENABLE, CREATED_BY, CREATED_DATE)
    SELECT
        u.USER_ID, @invoicePageId, @SmSubModId, @SmModId,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 'SYSTEM', SYSDATETIME()
    FROM AD_USER_CREDENTIAL u
    WHERE u.USER_ID NOT IN (
        SELECT USER_ID FROM BOS_USER_PAGE_AUTH WHERE PAGE_ID = @invoicePageId
    );
    PRINT 'Access grants for SM1180 seeded for all users.';
END
GO

-- 4. Grant full permissions to all active users for SM1160
DECLARE @orderPageId INT;
SELECT @orderPageId = PAGE_ID FROM BOS_PAGES WHERE PAGE_CODE = 'SM1160';

DECLARE @SmModId INT;
SELECT @SmModId = MODULE_ID FROM BOS_MODULES WHERE MOD_CODE = 'SM0000';
IF @SmModId IS NULL SET @SmModId = 4;

DECLARE @SmSubModId INT;
SELECT TOP 1 @SmSubModId = SUB_MOD_ID FROM BOS_SUB_MODULES WHERE MOD_ID = @SmModId;
IF @SmSubModId IS NULL SET @SmSubModId = 411;

IF @orderPageId IS NOT NULL
BEGIN
    INSERT INTO BOS_USER_PAGE_AUTH
        (USER_ID, PAGE_ID, SUB_MOD_ID, MOD_ID, ENABLE, READ_ACS, WRITE, DELETE_ACS,
         EXPORT, APPROVAL, MANAGER, ADDITIONAL1, ADDITIONAL2, ADD_TASK_ENABLE, CREATED_BY, CREATED_DATE)
    SELECT
        u.USER_ID, @orderPageId, @SmSubModId, @SmModId,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 'SYSTEM', SYSDATETIME()
    FROM AD_USER_CREDENTIAL u
    WHERE u.USER_ID NOT IN (
        SELECT USER_ID FROM BOS_USER_PAGE_AUTH WHERE PAGE_ID = @orderPageId
    );
    PRINT 'Access grants for SM1160 seeded for all users.';
END
GO

-- 5. Fix QMS_SCHEDULE_REMINDER_ACK_LOG EMPLOYEE_ID nullability and add USER_ID
IF EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[QMS_SCHEDULE_REMINDER_ACK_LOG]') 
      AND name = N'EMPLOYEE_ID'
      AND is_nullable = 0
)
BEGIN
    ALTER TABLE [dbo].[QMS_SCHEDULE_REMINDER_ACK_LOG]
    ALTER COLUMN [EMPLOYEE_ID] BIGINT NULL;
    PRINT 'Altered EMPLOYEE_ID in QMS_SCHEDULE_REMINDER_ACK_LOG to be nullable.';
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[QMS_SCHEDULE_REMINDER_ACK_LOG]') 
      AND name = N'USER_ID'
)
BEGIN
    ALTER TABLE [dbo].[QMS_SCHEDULE_REMINDER_ACK_LOG]
    ADD [USER_ID] NVARCHAR(100) NULL;
    PRINT 'Added USER_ID column to QMS_SCHEDULE_REMINDER_ACK_LOG.';
END
GO

PRINT 'V1210.0 migration completed successfully.';
