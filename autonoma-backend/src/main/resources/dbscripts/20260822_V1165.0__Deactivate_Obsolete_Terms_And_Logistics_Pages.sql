-- ===================================================================================
-- Migration: Deactivate Obsolete Terms and Logistics Pages (M5220, M5290, M5300)
-- Target Database: AT_NUTECH
-- Author: Antigravity AI
-- Date: 2026-08-22
-- Standard: Fully idempotent, no mock data, Unicode NVARCHAR
-- ===================================================================================

IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'bos_pages')
BEGIN
    UPDATE bos_pages
    SET enabled = 0
    WHERE page_code IN ('M5220', 'M5290', 'M5300');
END;
GO
