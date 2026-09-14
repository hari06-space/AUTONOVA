-- =================================================================================
-- Migration Script: Reassign PAGE_ID 114 to Permission Apply (ESC1040) and Clean Up SC1410
-- =================================================================================

-- 1. Remove duplicate PAGE_ID 45005 if created previously
IF EXISTS (SELECT 1 FROM BOS_PAGES WHERE PAGE_ID = 45005)
BEGIN
    DELETE FROM BOS_USER_PAGE_AUTH WHERE PAGE_ID = 45005;
    DELETE FROM BOS_PAGES WHERE PAGE_ID = 45005;
    PRINT 'Cleaned up temporary PAGE_ID 45005.';
END
GO

-- 2. Update PAGE_ID 114 in BOS_PAGES to be ESC1040 (Permission Apply)
IF EXISTS (SELECT 1 FROM BOS_PAGES WHERE PAGE_ID = 114)
BEGIN
    UPDATE BOS_PAGES
    SET PAGE_CODE = 'ESC1040',
        PAGE_NAME = 'Permission Apply',
        PAGE_URL = '/employee-self-care/leave/permission-entry',
        MOD_ID = 16,
        SUB_MOD_ID = 161,
        ENABLED = 1,
        ICON = 'IconClock'
    WHERE PAGE_ID = 114;
    PRINT 'Updated PAGE_ID 114 to ESC1040 (Permission Apply).';
END
ELSE
BEGIN
    SET IDENTITY_INSERT BOS_PAGES ON;
    INSERT INTO BOS_PAGES (PAGE_ID, MOD_ID, SUB_MOD_ID, PAGE_CODE, PAGE_NAME, ENABLED, PAGE_URL, ICON)
    VALUES (114, 16, 161, 'ESC1040', 'Permission Apply', 1, '/employee-self-care/leave/permission-entry', 'IconClock');
    SET IDENTITY_INSERT BOS_PAGES OFF;
    PRINT 'Inserted PAGE_ID 114 (ESC1040) into BOS_PAGES.';
END
GO

-- 3. Delete any remaining references to SC1410 in BOS_PAGES
DELETE FROM BOS_USER_PAGE_AUTH WHERE PAGE_ID IN (SELECT PAGE_ID FROM BOS_PAGES WHERE PAGE_CODE = 'SC1410' AND PAGE_ID <> 114);
DELETE FROM BOS_PAGES WHERE PAGE_CODE = 'SC1410' AND PAGE_ID <> 114;
GO

-- 4. Ensure BOS_USER_PAGE_AUTH has active entries for all users for PAGE_ID 114
IF EXISTS (SELECT 1 FROM BOS_PAGES WHERE PAGE_ID = 114)
BEGIN
    INSERT INTO BOS_USER_PAGE_AUTH (
        USER_ID, PAGE_ID, SUB_MOD_ID, MOD_ID,
        ENABLE, READ_ACS, WRITE, DELETE_ACS, EXPORT, APPROVAL, MANAGER, ADDITIONAL1, ADDITIONAL2, ADD_TASK_ENABLE
    )
    SELECT u.USER_ID, 114, 161, 16, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0
    FROM AD_USER_CREDENTIAL u
    WHERE NOT EXISTS (
        SELECT 1 FROM BOS_USER_PAGE_AUTH a WHERE a.USER_ID = u.USER_ID AND a.PAGE_ID = 114
    );

    UPDATE BOS_USER_PAGE_AUTH
    SET ENABLE = 1, READ_ACS = 1, WRITE = 1, EXPORT = 1, MANAGER = 1
    WHERE PAGE_ID = 114;

    PRINT 'Granted active access to PAGE_ID 114 (ESC1040) for all users in BOS_USER_PAGE_AUTH.';
END
GO
