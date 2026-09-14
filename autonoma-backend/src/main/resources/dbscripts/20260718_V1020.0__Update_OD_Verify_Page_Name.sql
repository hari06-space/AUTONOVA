-- ============================================================
-- Migration: Update OD Verify Page Name and URL
-- Date: 2026-07-18
-- ============================================================

IF EXISTS (SELECT 1 FROM BOS_PAGES WHERE PAGE_CODE = 'HA1342')
BEGIN
    UPDATE BOS_PAGES 
    SET PAGE_NAME = 'OD Verify',
        PAGE_URL = '/hra/attendance/od-verify'
    WHERE PAGE_CODE = 'HA1342';
    PRINT 'Updated HA1342 page name to OD Verify and url to /hra/attendance/od-verify';
END
GO
