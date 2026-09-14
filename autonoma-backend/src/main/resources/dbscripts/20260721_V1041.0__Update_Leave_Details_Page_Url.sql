-- =================================================================================
-- Migration Script: Update Page URL for Leave Details (HA1390)
-- =================================================================================

UPDATE BOS_PAGES
SET PAGE_URL = '/hra/attendance/leave-details',
    PAGE_NAME = 'Leave Details'
WHERE PAGE_CODE = 'HA1390';
GO
