-- Migration Script: Update Page Icons for LTA Pages in BOS_PAGES to FlightTakeoff / IconPlaneTilt
-- Date: 2026-07-26

UPDATE bos_pages
SET icon = 'FlightTakeoff'
WHERE page_code IN ('ESC1020', 'M2396', 'M2394');
PRINT 'Updated icon to FlightTakeoff for LTA Apply, Details, and Verification pages in BOS_PAGES.';
