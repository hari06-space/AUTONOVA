-- 20260824_V1166.0__Enable_Visitor_Pass_Page_Auth.sql
-- Idempotent grant of read/write/enable access to Visitor Pass (OM1000)

IF EXISTS (SELECT 1 FROM BOS_PAGES WHERE PAGE_CODE = 'OM1000')
BEGIN
    DECLARE @PageId BIGINT;
    SELECT @PageId = PAGE_ID FROM BOS_PAGES WHERE PAGE_CODE = 'OM1000';

    -- Enable for AKASH
    IF EXISTS (SELECT 1 FROM BOS_USER_PAGE_AUTH WHERE USER_ID = 'AKASH' AND PAGE_ID = @PageId)
    BEGIN
        UPDATE BOS_USER_PAGE_AUTH
        SET [ENABLE] = 1,
            READ_ACS = 1,
            [WRITE] = 1,
            DELETE_ACS = 1,
            ADD_TASK_ENABLE = 1
        WHERE USER_ID = 'AKASH' AND PAGE_ID = @PageId;
    END
    ELSE IF EXISTS (SELECT 1 FROM AD_USER_CREDENTIAL WHERE USER_ID = 'AKASH')
    BEGIN
        INSERT INTO BOS_USER_PAGE_AUTH (USER_ID, PAGE_ID, [ENABLE], READ_ACS, [WRITE], DELETE_ACS, ADD_TASK_ENABLE, CREATED_BY, CREATED_DATE)
        VALUES ('AKASH', @PageId, 1, 1, 1, 1, 1, 'SYSTEM', GETDATE());
    END

    -- Enable for ADMIN and SUPER BOSS
    UPDATE BOS_USER_PAGE_AUTH
    SET [ENABLE] = 1,
        READ_ACS = 1,
        [WRITE] = 1,
        DELETE_ACS = 1,
        ADD_TASK_ENABLE = 1
    WHERE PAGE_ID = @PageId AND USER_ID IN ('ADMIN', 'SUPER BOSS', 'superboss', 'admin');
END
