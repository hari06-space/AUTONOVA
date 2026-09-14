-- =================================================================================
-- Migration Script: Register and Update OD Apply, OD Details, and Leave Details Pages in BOS_PAGES
-- =================================================================================

-- 1. Register ESC1030 (OD Apply) under Module 16 (Employee Self-Care), Submodule 161
IF NOT EXISTS (SELECT 1 FROM BOS_PAGES WHERE PAGE_CODE = 'ESC1030')
BEGIN
    INSERT INTO BOS_PAGES (MOD_ID, SUB_MOD_ID, PAGE_CODE, PAGE_NAME, ENABLED, PAGE_URL, ICON)
    VALUES (16, 161, 'ESC1030', 'OD Apply', 1, '/employee-self-care/leave/od-entry', 'IconClock');
    PRINT 'Registered ESC1030 (OD Apply) in BOS_PAGES.';
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
END
GO

-- 2. Update HA1330 in BOS_PAGES to "OD Details" under Module 2, Submodule 203 (Attendance)
IF EXISTS (SELECT 1 FROM BOS_PAGES WHERE PAGE_CODE = 'HA1330')
BEGIN
    UPDATE BOS_PAGES
    SET PAGE_NAME = 'OD Details',
        PAGE_URL = '/hra/attendance/od-details',
        ENABLED = 1
    WHERE PAGE_CODE = 'HA1330';
    PRINT 'Updated HA1330 page_name to OD Details in BOS_PAGES.';
END
GO

-- 3. Ensure M2390 in BOS_PAGES is updated to "Leave Details"
IF EXISTS (SELECT 1 FROM BOS_PAGES WHERE PAGE_CODE = 'M2390')
BEGIN
    UPDATE BOS_PAGES
    SET PAGE_NAME = 'Leave Details',
        PAGE_URL = '/hra/attendance/leave-entry',
        ENABLED = 1
    WHERE PAGE_CODE = 'M2390';
    PRINT 'Updated M2390 page_name to Leave Details in BOS_PAGES.';
END
GO

-- 4. Seed access in BOS_USER_PAGE_AUTH for ESC1030 (OD Apply)
DECLARE @esc1030PageId INT;
SELECT @esc1030PageId = PAGE_ID FROM BOS_PAGES WHERE PAGE_CODE = 'ESC1030';

IF @esc1030PageId IS NOT NULL
BEGIN
    INSERT INTO BOS_USER_PAGE_AUTH (
        USER_ID, PAGE_ID, SUB_MOD_ID, MOD_ID,
        ENABLE, READ_ACS, WRITE, DELETE_ACS, EXPORT, APPROVAL, MANAGER, ADDITIONAL1, ADDITIONAL2, ADD_TASK_ENABLE
    )
    SELECT 
        u.USER_ID, @esc1030PageId, 161, 16,
        1, 1, 1, 1, 1, 1, 1, 0, 0, 0
    FROM AD_USER_CREDENTIAL u
    WHERE NOT EXISTS (
        SELECT 1 FROM BOS_USER_PAGE_AUTH a WHERE a.USER_ID = u.USER_ID AND a.PAGE_ID = @esc1030PageId
    );
    PRINT 'Seeded permissions in BOS_USER_PAGE_AUTH for ESC1030.';
END
GO
