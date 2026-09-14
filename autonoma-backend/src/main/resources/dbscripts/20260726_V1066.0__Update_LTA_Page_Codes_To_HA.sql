-- Migration Script: Update LTA Page Codes from M2396/M2394 to HA1396/HA1394
-- Date: 2026-07-26

IF EXISTS (SELECT 1 FROM bos_pages WHERE page_code = 'M2396')
BEGIN
    UPDATE bos_pages SET page_code = 'HA1396' WHERE page_code = 'M2396';
    PRINT 'Updated page_code M2396 to HA1396 in bos_pages';
END;

IF EXISTS (SELECT 1 FROM bos_pages WHERE page_code = 'M2394')
BEGIN
    UPDATE bos_pages SET page_code = 'HA1394' WHERE page_code = 'M2394';
    PRINT 'Updated page_code M2394 to HA1394 in bos_pages';
END;

IF OBJECT_ID('dbo.BOS_USER_PAGE_AUTH', 'U') IS NOT NULL
BEGIN
    UPDATE BOS_USER_PAGE_AUTH SET PAGE_CODE = 'HA1396' WHERE PAGE_CODE = 'M2396';
    UPDATE BOS_USER_PAGE_AUTH SET PAGE_CODE = 'HA1394' WHERE PAGE_CODE = 'M2394';
    PRINT 'Updated PAGE_CODE in BOS_USER_PAGE_AUTH.';
END;
