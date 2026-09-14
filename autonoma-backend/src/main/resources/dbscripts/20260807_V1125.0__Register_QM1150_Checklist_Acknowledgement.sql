-- =========================================================================================
-- Script Name: 20260807_V1125.0__Register_QM1150_Checklist_Acknowledgement.sql
-- Description: Register QM1150 (Checklist Acknowledgement) in BOS_PAGES and BOS_USER_PAGE_AUTH
-- Author: Autonoma ERP AI Agent
-- =========================================================================================

IF NOT EXISTS (SELECT 1 FROM BOS_PAGES WHERE PAGE_CODE = 'QM1150')
BEGIN
    DECLARE @NewPageId INT;

    INSERT INTO BOS_PAGES (mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon)
    VALUES (11, 111, 'QM1150', 'Checklist Acknowledgement', 1, '/qms/checklist/acknowledgement', 'IconUserCheck');

    SET @NewPageId = SCOPE_IDENTITY();

    IF @NewPageId IS NOT NULL
    BEGIN
        INSERT INTO BOS_USER_PAGE_AUTH (user_id, page_id, mod_id, sub_mod_id, enable, read_acs, write, delete_acs, export, approval, manager, additional1, additional2, add_task_enable, created_by, created_date)
        SELECT DISTINCT user_id, @NewPageId, 11, 111, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 'SYSTEM', GETDATE()
        FROM AD_USER_CREDENTIAL
        WHERE user_id IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM BOS_USER_PAGE_AUTH WHERE page_id = @NewPageId AND user_id = AD_USER_CREDENTIAL.user_id
        );
    END
END;
