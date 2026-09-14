-- =================================================================================
-- Migration Script: Update Page URL for OD Apply (ESC1030)
-- =================================================================================

UPDATE BOS_PAGES
SET PAGE_URL = '/employee-self-care/leave/od-apply',
    PAGE_NAME = 'OD Apply'
WHERE PAGE_CODE = 'ESC1030';
GO
