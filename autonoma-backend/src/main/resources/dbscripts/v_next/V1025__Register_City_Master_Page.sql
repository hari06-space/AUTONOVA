-- Register City Master Page
SET IDENTITY_INSERT BOS_PAGES ON;
BEGIN TRY 
    INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) 
    VALUES (184, 1, 52, 'M5265', 'City Master', 1, '/master/admin/city', 'IconCategory'); 
END TRY BEGIN CATCH END CATCH;
SET IDENTITY_INSERT BOS_PAGES OFF;

-- Grant default full access to all existing users for City Master page
INSERT INTO bos_user_page_auth (user_id, page_id, sub_mod_id, mod_id, enable, read_acs, [write], delete_acs, export, approval, manager, additional1, additional2, add_task_enable)
SELECT 
    u.user_id, 
    184, 
    52, 
    1, 
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1
FROM ad_user_credential u
WHERE NOT EXISTS (
    SELECT 1 FROM bos_user_page_auth WHERE user_id = u.user_id AND page_id = 184
);
