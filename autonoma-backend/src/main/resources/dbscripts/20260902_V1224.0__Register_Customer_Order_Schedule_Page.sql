-- ============================================================================
-- V1224.0  Register Customer Order Schedule (SM1170) Page & Seed Permissions
-- Date  : 2026-09-02
-- ============================================================================

DECLARE @SmModId INT;
SELECT @SmModId = MODULE_ID FROM BOS_MODULES WHERE MOD_CODE = 'SM0000';
IF @SmModId IS NULL SET @SmModId = 4;

DECLARE @SmSubModId INT;
SELECT TOP 1 @SmSubModId = SUB_MOD_ID FROM BOS_SUB_MODULES WHERE MOD_ID = @SmModId;
IF @SmSubModId IS NULL SET @SmSubModId = 411;

-- 1. Register SM1170 (Customer Order Schedule)
IF NOT EXISTS (SELECT 1 FROM BOS_PAGES WHERE PAGE_CODE = 'SM1170')
BEGIN
    INSERT INTO BOS_PAGES (MOD_ID, SUB_MOD_ID, PAGE_CODE, PAGE_NAME, ENABLED, PAGE_URL, ICON)
    VALUES (@SmModId, @SmSubModId, 'SM1170', N'Customer Order Schedule', 1, '/sm/sales/customer/order-schedule', 'IconCalendarEvent');
    PRINT 'Page SM1170 (Customer Order Schedule) registered in BOS_PAGES.';
END
ELSE
BEGIN
    UPDATE BOS_PAGES
    SET PAGE_NAME = N'Customer Order Schedule',
        PAGE_URL = '/sm/sales/customer/order-schedule',
        ENABLED = 1,
        ICON = 'IconCalendarEvent'
    WHERE PAGE_CODE = 'SM1170';
    PRINT 'Page SM1170 updated in BOS_PAGES.';
END
GO

-- 2. Grant full permissions to all active users for SM1170
DECLARE @schedulePageId INT;
SELECT @schedulePageId = PAGE_ID FROM BOS_PAGES WHERE PAGE_CODE = 'SM1170';

DECLARE @SmModId INT;
SELECT @SmModId = MODULE_ID FROM BOS_MODULES WHERE MOD_CODE = 'SM0000';
IF @SmModId IS NULL SET @SmModId = 4;

DECLARE @SmSubModId INT;
SELECT TOP 1 @SmSubModId = SUB_MOD_ID FROM BOS_SUB_MODULES WHERE MOD_ID = @SmModId;
IF @SmSubModId IS NULL SET @SmSubModId = 411;

IF @schedulePageId IS NOT NULL
BEGIN
    INSERT INTO BOS_USER_PAGE_AUTH
        (USER_ID, PAGE_ID, SUB_MOD_ID, MOD_ID, ENABLE, READ_ACS, WRITE, DELETE_ACS,
         EXPORT, APPROVAL, MANAGER, ADDITIONAL1, ADDITIONAL2, ADD_TASK_ENABLE, CREATED_BY, CREATED_DATE)
    SELECT
        u.USER_ID, @schedulePageId, @SmSubModId, @SmModId,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 'SYSTEM', SYSDATETIME()
    FROM AD_USER_CREDENTIAL u
    WHERE u.USER_ID NOT IN (
        SELECT USER_ID FROM BOS_USER_PAGE_AUTH WHERE PAGE_ID = @schedulePageId
    );
    PRINT 'Access grants for SM1170 seeded for all users.';
END
GO

PRINT 'V1224.0 migration completed successfully.';
