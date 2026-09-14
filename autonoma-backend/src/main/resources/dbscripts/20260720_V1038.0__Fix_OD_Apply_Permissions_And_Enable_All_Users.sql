-- =================================================================================
-- Migration Script: Fix OD Apply (ESC1030) Page & Permissions for All Users
-- =================================================================================

-- 1. Ensure ESC1030 exists in BOS_PAGES under Module 16 (Employee Self-Care), Submodule 161
IF NOT EXISTS (SELECT 1 FROM BOS_PAGES WHERE PAGE_CODE = 'ESC1030')
BEGIN
    INSERT INTO BOS_PAGES (MOD_ID, SUB_MOD_ID, PAGE_CODE, PAGE_NAME, ENABLED, PAGE_URL, ICON)
    VALUES (16, 161, 'ESC1030', 'OD Apply', 1, '/employee-self-care/leave/od-entry', 'IconClock');
    PRINT 'Created page ESC1030 (OD Apply) in BOS_PAGES.';
END
ELSE
BEGIN
    UPDATE BOS_PAGES
    SET PAGE_NAME = 'OD Apply',
        PAGE_URL = '/employee-self-care/leave/od-entry',
        MOD_ID = 16,
        SUB_MOD_ID = 161,
        ENABLED = 1
    WHERE PAGE_CODE = 'ESC1030';
    PRINT 'Updated page ESC1030 (OD Apply) in BOS_PAGES.';
END
GO

-- 2. Ensure ALL existing user accounts in AD_USER_CREDENTIAL have enable = 1 for ESC1030 in BOS_USER_PAGE_AUTH
INSERT INTO BOS_USER_PAGE_AUTH (
    USER_ID, PAGE_ID, SUB_MOD_ID, MOD_ID,
    ENABLE, READ_ACS, WRITE, DELETE_ACS, EXPORT, APPROVAL, MANAGER, ADDITIONAL1, ADDITIONAL2, ADD_TASK_ENABLE
)
SELECT 
    u.USER_ID,
    p.PAGE_ID,
    p.SUB_MOD_ID,
    p.MOD_ID,
    1, 1, 1, 1, 1, 1, 1, 0, 0, 0
FROM AD_USER_CREDENTIAL u
CROSS JOIN BOS_PAGES p
WHERE p.PAGE_CODE = 'ESC1030'
  AND NOT EXISTS (
      SELECT 1 FROM BOS_USER_PAGE_AUTH a WHERE a.USER_ID = u.USER_ID AND a.PAGE_ID = p.PAGE_ID
  );
GO

-- 3. Also update any existing BOS_USER_PAGE_AUTH records for ESC1030 to ensure ENABLE = 1
UPDATE a
SET a.ENABLE = 1,
    a.READ_ACS = 1,
    a.WRITE = 1,
    a.EXPORT = 1
FROM BOS_USER_PAGE_AUTH a
JOIN BOS_PAGES p ON a.PAGE_ID = p.PAGE_ID
WHERE p.PAGE_CODE = 'ESC1030';
GO

-- 4. Ensure HA1330 (OD Details) has ENABLED = 1 and name = 'OD Details'
UPDATE BOS_PAGES
SET PAGE_NAME = 'OD Details',
    PAGE_URL = '/hra/attendance/od-details',
    ENABLED = 1
WHERE PAGE_CODE = 'HA1330';
GO

-- 5. Ensure HA1342 (OD Verification) has ENABLED = 1 and name = 'OD Verification'
UPDATE BOS_PAGES
SET PAGE_NAME = 'OD Verification',
    PAGE_URL = '/hra/attendance/od-verify',
    ENABLED = 1
WHERE PAGE_CODE = 'HA1342';
GO

-- 6. Ensure M2390 (Leave Details) has ENABLED = 1 and name = 'Leave Details'
UPDATE BOS_PAGES
SET PAGE_NAME = 'Leave Details',
    PAGE_URL = '/hra/attendance/leave-entry',
    ENABLED = 1
WHERE PAGE_CODE = 'M2390';
GO

-- 7. Ensure ESC1010 (Leave Apply) has ENABLED = 1 and name = 'Leave Apply'
UPDATE BOS_PAGES
SET PAGE_NAME = 'Leave Apply',
    PAGE_URL = '/employee-self-care/leave-application',
    ENABLED = 1
WHERE PAGE_CODE = 'ESC1010';
GO
