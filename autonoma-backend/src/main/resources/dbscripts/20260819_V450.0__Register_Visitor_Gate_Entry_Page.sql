-- SQL Migration Script: Register Visitor Gate Entry (OM1001) Page & Seed Permissions
-- Module: Order (mod_id = 17) | Submodule: Material / Order (sub_mod_id = 171)

BEGIN TRANSACTION;

-- 1. Clean up duplicate / obsolete page entries for Visitor Gate Entry or OM1001
DELETE FROM bos_user_page_auth 
WHERE page_id IN (
    SELECT page_id FROM bos_pages 
    WHERE (page_code = 'OM1001' OR page_url = '/order/visitor-gate-entry' OR LOWER(page_name) LIKE '%visitor gate entry%')
      AND page_code <> 'OM1001'
);

DELETE FROM bos_pages 
WHERE (page_code = 'OM1001' OR page_url = '/order/visitor-gate-entry' OR LOWER(page_name) LIKE '%visitor gate entry%')
  AND page_code <> 'OM1001';

-- 2. Insert Visitor Gate Entry Page into bos_pages if not exists
IF NOT EXISTS (SELECT 1 FROM bos_pages WHERE page_code = 'OM1001' OR page_url = '/order/visitor-gate-entry')
BEGIN
    DECLARE @MaxPageId INT;
    SELECT @MaxPageId = ISNULL(MAX(page_id), 0) + 1 FROM bos_pages;

    SET IDENTITY_INSERT bos_pages ON;

    INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon)
    VALUES (
        @MaxPageId,
        17,                           -- Order Module (mod_id = 17)
        171,                          -- Sub-module (sub_mod_id = 171)
        'OM1001',                     -- Page Code
        'Visitor Gate Entry',          -- Page Name
        1,                            -- Enabled (1 = Active)
        '/order/visitor-gate-entry',  -- Page Route URL
        'IconDoorEnter'               -- Navigation Icon
    );

    SET IDENTITY_INSERT bos_pages OFF;
    PRINT 'Page OM1001 (Visitor Gate Entry) successfully registered in bos_pages with page_id: ' + CAST(@MaxPageId AS VARCHAR);
END
ELSE
BEGIN
    PRINT 'Page OM1001 or URL /order/visitor-gate-entry already exists in bos_pages.';
END

-- 3. Grant full page permissions to all existing active users in bos_user_page_auth
INSERT INTO bos_user_page_auth (
    user_id, 
    page_id, 
    sub_mod_id, 
    mod_id, 
    enable, 
    read_acs, 
    [write], 
    delete_acs, 
    export, 
    approval, 
    manager, 
    additional1, 
    additional2, 
    add_task_enable
)
SELECT 
    u.user_id, 
    p.page_id, 
    p.sub_mod_id, 
    p.mod_id, 
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1
FROM bos_pages p
CROSS JOIN ad_user_credential u
WHERE p.page_code = 'OM1001'
  AND NOT EXISTS (
      SELECT 1 FROM bos_user_page_auth a 
      WHERE a.user_id = u.user_id AND a.page_id = p.page_id
  );

PRINT 'Page permissions for OM1001 successfully granted to all active users.';

COMMIT TRANSACTION;
