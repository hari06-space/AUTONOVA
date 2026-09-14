-- Migration Script: Fix Relieving Order page_code in bos_pages from HA1390 to HA1388
-- Date: 2026-07-26

IF EXISTS (SELECT 1 FROM bos_pages WHERE page_name = 'Relieving Order' AND page_code = 'HA1390')
BEGIN
    UPDATE bos_pages
    SET page_code = 'HA1388'
    WHERE page_name = 'Relieving Order' AND page_code = 'HA1390';
    PRINT 'Updated page_code for Relieving Order from HA1390 to HA1388 in bos_pages.';
END;

IF OBJECT_ID('dbo.BOS_USER_PAGE_AUTH', 'U') IS NOT NULL
BEGIN
    UPDATE BOS_USER_PAGE_AUTH
    SET PAGE_CODE = 'HA1388'
    WHERE PAGE_CODE = 'HA1390' AND PAGE_NAME = 'Relieving Order';
END;
