-- ============================================================================
-- V338.0  Register Leave Encashment Entry pages and grant access
-- Date  : 2026-06-24
-- ============================================================================

-- 1. Register page HA1294 (Leave Encashment Entry) under HRA > Payroll
IF NOT EXISTS (SELECT 1 FROM BOS_PAGES WHERE PAGE_CODE = 'HA1294')
BEGIN
    INSERT INTO BOS_PAGES (MOD_ID, SUB_MOD_ID, PAGE_CODE, PAGE_NAME, ENABLED, PAGE_URL, ICON)
    VALUES (2, 211, 'HA1294', 'Leave Encashment Entry', 1, '/hra/payroll/leave-encashment-entry', 'IconCash');
    PRINT 'Page HA1294 (Leave Encashment Entry) registered in BOS_PAGES.';
END
ELSE
BEGIN
    PRINT 'Page HA1294 already exists in BOS_PAGES — skipped.';
END
GO

-- 2. Register page ESC1050 (Leave Encashment Entry) under Employee Self Care
IF NOT EXISTS (SELECT 1 FROM BOS_PAGES WHERE PAGE_CODE = 'ESC1050')
BEGIN
    INSERT INTO BOS_PAGES (MOD_ID, SUB_MOD_ID, PAGE_CODE, PAGE_NAME, ENABLED, PAGE_URL, ICON)
    VALUES (1, 24, 'ESC1050', 'Leave Encashment Entry', 1, '/employee-self-care/leave-encashment-entry', 'IconCash');
    PRINT 'Page ESC1050 (Leave Encashment Entry - Self Care) registered in BOS_PAGES.';
END
ELSE
BEGIN
    PRINT 'Page ESC1050 already exists in BOS_PAGES — skipped.';
END
GO

-- 3. Grant all current Penalty-page (HA1290, PAGE_ID=130) users full access to HA1294
DECLARE @ha1294PageId INT;
SELECT @ha1294PageId = PAGE_ID FROM BOS_PAGES WHERE PAGE_CODE = 'HA1294';

IF @ha1294PageId IS NOT NULL
BEGIN
    INSERT INTO BOS_USER_PAGE_AUTH
        (USER_ID, PAGE_ID, SUB_MOD_ID, MOD_ID, ENABLE, READ_ACS, WRITE, DELETE_ACS,
         EXPORT, APPROVAL, MANAGER, ADDITIONAL1, ADDITIONAL2, ADD_TASK_ENABLE, CREATED_BY, CREATED_DATE)
    SELECT
        USER_ID, @ha1294PageId, 211, 2,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 'SYSTEM', SYSDATETIME()
    FROM BOS_USER_PAGE_AUTH
    WHERE PAGE_ID = 130
      AND USER_ID NOT IN (
          SELECT USER_ID FROM BOS_USER_PAGE_AUTH WHERE PAGE_ID = @ha1294PageId
      );
    PRINT 'Access grants for HA1294 seeded.';
END
GO

-- 4. Grant all current Penalty-page (HA1290, PAGE_ID=130) users full access to ESC1050
DECLARE @esc1050PageId INT;
SELECT @esc1050PageId = PAGE_ID FROM BOS_PAGES WHERE PAGE_CODE = 'ESC1050';

IF @esc1050PageId IS NOT NULL
BEGIN
    INSERT INTO BOS_USER_PAGE_AUTH
        (USER_ID, PAGE_ID, SUB_MOD_ID, MOD_ID, ENABLE, READ_ACS, WRITE, DELETE_ACS,
         EXPORT, APPROVAL, MANAGER, ADDITIONAL1, ADDITIONAL2, ADD_TASK_ENABLE, CREATED_BY, CREATED_DATE)
    SELECT
        USER_ID, @esc1050PageId, 24, 1,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 'SYSTEM', SYSDATETIME()
    FROM BOS_USER_PAGE_AUTH
    WHERE PAGE_ID = 130
      AND USER_ID NOT IN (
          SELECT USER_ID FROM BOS_USER_PAGE_AUTH WHERE PAGE_ID = @esc1050PageId
      );
    PRINT 'Access grants for ESC1050 seeded.';
END
GO

PRINT 'V338.0 migration completed successfully.';
