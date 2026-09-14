-- SQL Migration: Seed Trigger Configuration Page under Admin > BOS(S)
-- Created: 2026-06-30

BEGIN TRANSACTION;

SET IDENTITY_INSERT bos_pages ON;

-- Admin Pages (mod_id = 14)
-- sub_mod_id 141 is Admin Hub (BOS(S))
BEGIN TRY 
    INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) 
    VALUES (1300, 14, 141, 'AD1300', 'Trigger Configuration', 1, '/admin/trigger-configuration', 'IconSettings'); 
END TRY 
BEGIN CATCH 
END CATCH;

SET IDENTITY_INSERT bos_pages OFF;

COMMIT TRANSACTION;
