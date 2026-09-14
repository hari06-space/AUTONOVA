-- =================================================================================
-- Migration Script: Standardize Page Names in BOS_PAGES for User Access
-- =================================================================================

-- 1. Change "Leave Application Form" (ESC1010) to "Leave Apply"
IF EXISTS (SELECT 1 FROM BOS_PAGES WHERE PAGE_CODE = 'ESC1010')
BEGIN
    UPDATE BOS_PAGES 
    SET PAGE_NAME = 'Leave Apply'
    WHERE PAGE_CODE = 'ESC1010';
    PRINT 'Updated ESC1010 page_name to Leave Apply.';
END
GO

-- 2. Change "Leave Entry" (M2390) to "Leave Details"
IF EXISTS (SELECT 1 FROM BOS_PAGES WHERE PAGE_CODE = 'M2390')
BEGIN
    UPDATE BOS_PAGES 
    SET PAGE_NAME = 'Leave Details',
        PAGE_URL = '/hra/attendance/leave-entry'
    WHERE PAGE_CODE = 'M2390';
    PRINT 'Updated M2390 page_name to Leave Details.';
END
GO

-- 3. Change "OD Entry" (HA1330) to "OD Details"
IF EXISTS (SELECT 1 FROM BOS_PAGES WHERE PAGE_CODE = 'HA1330')
BEGIN
    UPDATE BOS_PAGES 
    SET PAGE_NAME = 'OD Details',
        PAGE_URL = '/hra/attendance/od-details'
    WHERE PAGE_CODE = 'HA1330';
    PRINT 'Updated HA1330 page_name to OD Details.';
END
GO

-- 4. Change "On Duty Verification" (HA1342) to "OD Verification"
IF EXISTS (SELECT 1 FROM BOS_PAGES WHERE PAGE_CODE = 'HA1342')
BEGIN
    UPDATE BOS_PAGES 
    SET PAGE_NAME = 'OD Verification',
        PAGE_URL = '/hra/attendance/od-verify'
    WHERE PAGE_CODE = 'HA1342';
    PRINT 'Updated HA1342 page_name to OD Verification.';
END
GO

-- 5. Ensure ESC1030 is inserted/updated as "OD Apply"
IF NOT EXISTS (SELECT 1 FROM BOS_PAGES WHERE PAGE_CODE = 'ESC1030')
BEGIN
    INSERT INTO BOS_PAGES (MOD_ID, SUB_MOD_ID, PAGE_CODE, PAGE_NAME, ENABLED, PAGE_URL, ICON)
    VALUES (16, 161, 'ESC1030', 'OD Apply', 1, '/employee-self-care/leave/od-entry', 'IconClock');
    PRINT 'Inserted ESC1030 (OD Apply) into BOS_PAGES.';
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
    PRINT 'Updated ESC1030 (OD Apply) in BOS_PAGES.';
END
GO

-- 6. Ensure BOS_USER_PAGE_AUTH has active entries for all users for these pages
DECLARE @esc1010Id INT, @esc1030Id INT, @ha1330Id INT, @ha1342Id INT, @m2390Id INT;
SELECT @esc1010Id = PAGE_ID FROM BOS_PAGES WHERE PAGE_CODE = 'ESC1010';
SELECT @esc1030Id = PAGE_ID FROM BOS_PAGES WHERE PAGE_CODE = 'ESC1030';
SELECT @ha1330Id  = PAGE_ID FROM BOS_PAGES WHERE PAGE_CODE = 'HA1330';
SELECT @ha1342Id  = PAGE_ID FROM BOS_PAGES WHERE PAGE_CODE = 'HA1342';
SELECT @m2390Id   = PAGE_ID FROM BOS_PAGES WHERE PAGE_CODE = 'M2390';

IF @esc1030Id IS NOT NULL
BEGIN
    INSERT INTO BOS_USER_PAGE_AUTH (
        USER_ID, PAGE_ID, SUB_MOD_ID, MOD_ID,
        ENABLE, READ_ACS, WRITE, DELETE_ACS, EXPORT, APPROVAL, MANAGER, ADDITIONAL1, ADDITIONAL2, ADD_TASK_ENABLE
    )
    SELECT u.USER_ID, @esc1030Id, 161, 16, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0
    FROM AD_USER_CREDENTIAL u
    WHERE NOT EXISTS (
        SELECT 1 FROM BOS_USER_PAGE_AUTH a WHERE a.USER_ID = u.USER_ID AND a.PAGE_ID = @esc1030Id
    );
END
GO
