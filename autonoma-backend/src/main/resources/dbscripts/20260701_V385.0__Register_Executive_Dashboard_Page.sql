-- Migration V385.0: Register Executive Command Center Dashboard
-- Description: Creates the page for the Executive Command Center (DB1400) and configures authorizations.

DECLARE @subModId INT;
SELECT @subModId = ID FROM BOS_SUB_MODULE WHERE SUB_MOD_CODE = 'DB1100';

-- Fallback: check mod_id = 15 (Dashboard)
IF @subModId IS NULL
BEGIN
    SELECT TOP 1 @subModId = ID FROM BOS_SUB_MODULE WHERE MOD_ID = 15 ORDER BY ID;
END

IF NOT EXISTS (SELECT 1 FROM BOS_PAGES WHERE PAGE_CODE = 'DB1400')
BEGIN
    INSERT INTO BOS_PAGES (MOD_ID, SUB_MOD_ID, PAGE_CODE, PAGE_NAME, ENABLED, PAGE_URL, ICON)
    VALUES (
        15,
        @subModId,
        'DB1400',
        'Executive Command Center',
        1,
        '/dashboard/executive',
        'IconDeviceAnalytics'
    );
    PRINT 'Registered page DB1400 (Executive Command Center)';
END
GO

-- Grant permissions to Level >= 5 (BOS Admin) and Level 1 (Admin) or users who have access to DB1110 (Default Dashboard)
DECLARE @newPageId INT;
SELECT @newPageId = PAGE_ID FROM BOS_PAGES WHERE PAGE_CODE = 'DB1400';

DECLARE @refPageId INT;
SELECT @refPageId = PAGE_ID FROM BOS_PAGES WHERE PAGE_CODE = 'DB1110';

IF @newPageId IS NOT NULL AND @refPageId IS NOT NULL
BEGIN
    INSERT INTO BOS_USER_PAGE_AUTH (USER_ID, PAGE_ID, SUB_MOD_ID, MOD_ID, ENABLE, READ_ACS, [WRITE], DELETE_ACS, EXPORT, APPROVAL, MANAGER, ADDITIONAL1, ADDITIONAL2)
    SELECT
        upa.USER_ID,
        @newPageId,
        upa.SUB_MOD_ID,
        upa.MOD_ID,
        upa.ENABLE,
        upa.READ_ACS,
        upa.WRITE,
        upa.DELETE_ACS,
        upa.EXPORT,
        upa.APPROVAL,
        upa.MANAGER,
        upa.ADDITIONAL1,
        upa.ADDITIONAL2
    FROM BOS_USER_PAGE_AUTH upa
    WHERE upa.PAGE_ID = @refPageId
      AND NOT EXISTS (
          SELECT 1 FROM BOS_USER_PAGE_AUTH x
          WHERE x.USER_ID = upa.USER_ID AND x.PAGE_ID = @newPageId
      );
    PRINT 'Granted DB1400 permissions from DB1110 reference';
END
GO
