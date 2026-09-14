-- =================================================================================
-- Migration Script: Remove Legacy Page M2392 (Leave Verification) from BOS_PAGES
-- =================================================================================

DELETE FROM BOS_USER_PAGE_AUTH 
WHERE PAGE_ID IN (SELECT PAGE_ID FROM BOS_PAGES WHERE PAGE_CODE = 'M2392')
   OR PAGE_ID = 181;

DELETE FROM BOS_PAGES 
WHERE PAGE_CODE = 'M2392' 
   OR PAGE_ID = 181;
GO
