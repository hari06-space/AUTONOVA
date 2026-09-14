-- Migration Script: Update Page Name for LTA Verification in BOS_PAGES
-- Date: 2026-07-26

IF EXISTS (SELECT 1 FROM bos_pages WHERE page_code = 'M2394')
BEGIN
    UPDATE bos_pages
    SET page_name = 'Leave Travel Allowance Verification'
    WHERE page_code = 'M2394';
    PRINT 'Updated page_name for M2394 to Leave Travel Allowance Verification';
END;
