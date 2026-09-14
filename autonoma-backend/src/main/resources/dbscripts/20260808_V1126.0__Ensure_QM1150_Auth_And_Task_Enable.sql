-- =========================================================================================
-- Script Name: 20260808_V1126.0__Ensure_QM1150_Auth_And_Task_Enable.sql
-- Description: Ensure QM1150 (Checklist Acknowledgement) page and user authorization records exist with add_task_enable = 1
-- Author: Autonoma ERP AI Agent
-- =========================================================================================

-- 1. Ensure QM1150 exists in BOS_PAGES
IF NOT EXISTS (SELECT 1 FROM BOS_PAGES WHERE PAGE_CODE = 'QM1150')
BEGIN
    INSERT INTO BOS_PAGES (mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon)
    VALUES (11, 111, 'QM1150', 'Checklist Acknowledgement', 1, '/qms/checklist/acknowledgement', 'IconUserCheck');
END;

-- 2. Seed BOS_USER_PAGE_AUTH for all users for QM1150
DECLARE @PageId INT;
SELECT TOP 1 @PageId = PAGE_ID FROM BOS_PAGES WHERE PAGE_CODE = 'QM1150';

IF @PageId IS NOT NULL
BEGIN
    -- Insert missing user auth entries for QM1150
    INSERT INTO BOS_USER_PAGE_AUTH (user_id, page_id, mod_id, sub_mod_id, enable, read_acs, write, delete_acs, export, approval, manager, additional1, additional2, add_task_enable, created_by, created_date)
    SELECT DISTINCT user_id, @PageId, 11, 111, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 'SYSTEM', GETDATE()
    FROM AD_USER_CREDENTIAL
    WHERE user_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM BOS_USER_PAGE_AUTH WHERE page_id = @PageId AND UPPER(user_id) = UPPER(AD_USER_CREDENTIAL.user_id)
    );

    -- Ensure enable and add_task_enable are updated to 1 for all existing QM1150 records
    UPDATE BOS_USER_PAGE_AUTH
    SET enable = 1, read_acs = 1, add_task_enable = 1
    WHERE page_id = @PageId;
END;
