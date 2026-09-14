-- Migration script to rename Permission Entry to Permission Details (HA1310)
IF EXISTS (SELECT 1 FROM BOS_PAGES WHERE PAGE_CODE = 'HA1310')
BEGIN
    UPDATE BOS_PAGES SET PAGE_NAME = 'Permission Details' WHERE PAGE_CODE = 'HA1310';
    PRINT 'Updated BOS_PAGES PAGE_NAME to Permission Details for HA1310.';
END
GO
