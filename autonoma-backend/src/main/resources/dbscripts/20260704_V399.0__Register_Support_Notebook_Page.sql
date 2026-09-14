-- Migration V399.0: Register Notebook Assistant Page
-- Description: Registers page S1130 (Notebook Assistant) in BOS_PAGES and grants default access.

IF NOT EXISTS (SELECT 1 FROM BOS_PAGES WHERE PAGE_CODE = 'S1130')
BEGIN
    INSERT INTO BOS_PAGES (MOD_ID, SUB_MOD_ID, PAGE_CODE, PAGE_NAME, ENABLED, PAGE_URL, ICON)
    VALUES (
        13,     -- Support Module
        131,    -- Support sub-module
        'S1130',
        'Notebook Assistant',
        1,
        '/support/notebook',
        'IconNotebook'
    );
    PRINT 'Registered page S1130 (Notebook Assistant)';
END
GO

-- Grant permissions to users who have access to S1110 (Support Ticket)
DECLARE @newPageId INT;
SELECT @newPageId = PAGE_ID FROM BOS_PAGES WHERE PAGE_CODE = 'S1130';

DECLARE @refPageId INT;
SELECT @refPageId = PAGE_ID FROM BOS_PAGES WHERE PAGE_CODE = 'S1110';

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
    PRINT 'Granted S1130 permissions from S1110 reference';
END
GO
