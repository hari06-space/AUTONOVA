-- ==========================================================
-- Migration V1169.0: Register Product 360 & Inventory Intelligence Dashboard
-- Description: Registers page DB1500 and grants authorizations based on default dashboard references.
-- ==========================================================

DECLARE @subModId INT;
SELECT @subModId = ID FROM BOS_SUB_MODULE WHERE SUB_MOD_CODE = 'DB1100';

-- Fallback: check mod_id = 15 (Dashboard)
IF @subModId IS NULL
BEGIN
    SELECT TOP 1 @subModId = ID FROM BOS_SUB_MODULE WHERE MOD_ID = 15 ORDER BY ID;
END

IF NOT EXISTS (SELECT 1 FROM BOS_PAGES WHERE PAGE_CODE = 'DB1500')
BEGIN
    INSERT INTO BOS_PAGES (MOD_ID, SUB_MOD_ID, PAGE_CODE, PAGE_NAME, ENABLED, PAGE_URL, ICON)
    VALUES (
        15,
        @subModId,
        'DB1500',
        'Product 360 & Inventory Intelligence',
        1,
        '/dashboard/product-360',
        'IconChartDots3'
    );
    PRINT 'Registered page DB1500 (Product 360 & Inventory Intelligence)';
END
ELSE
BEGIN
    UPDATE BOS_PAGES 
    SET PAGE_NAME = 'Product 360 & Inventory Intelligence',
        PAGE_URL = '/dashboard/product-360',
        ICON = 'IconChartDots3',
        ENABLED = 1
    WHERE PAGE_CODE = 'DB1500';
    PRINT 'Updated page DB1500';
END
GO

-- Grant permissions to users who have access to DB1110 (Default Dashboard) or DB1400
DECLARE @newPageId INT;
SELECT @newPageId = PAGE_ID FROM BOS_PAGES WHERE PAGE_CODE = 'DB1500';

DECLARE @refPageId INT;
SELECT @refPageId = PAGE_ID FROM BOS_PAGES WHERE PAGE_CODE = 'DB1110';

IF @refPageId IS NULL
BEGIN
    SELECT TOP 1 @refPageId = PAGE_ID FROM BOS_PAGES WHERE PAGE_CODE IN ('DB1170', 'DB1160', 'DB1400');
END

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
    PRINT 'Granted DB1500 permissions from reference page';
END
GO
