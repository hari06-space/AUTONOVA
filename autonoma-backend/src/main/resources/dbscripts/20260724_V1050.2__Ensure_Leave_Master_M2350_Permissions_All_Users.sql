-- ===================================================================================
-- Migration: 20260724_V1050.0__Ensure_Leave_Master_M2350_Permissions_All_Users.sql
-- Module: HR / Permission Security
-- Purpose: Idempotently seed and enable M2350 (Leave Master) read permissions for all active user credentials in BOS_USER_PAGE_AUTH
-- ===================================================================================

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'BOS_USER_PAGE_AUTH')
BEGIN
    DECLARE @page_id_m2350 INT;
    SELECT @page_id_m2350 = PAGE_ID FROM BOS_PAGES WHERE PAGE_CODE = 'M2350';

    IF @page_id_m2350 IS NOT NULL
    BEGIN
        -- 1. Insert missing BOS_USER_PAGE_AUTH records for active users
        INSERT INTO BOS_USER_PAGE_AUTH (USER_ID, PAGE_ID, ENABLE, READ_ACS, [WRITE], DELETE_ACS, EXPORT, APPROVAL, MANAGER, ADDITIONAL1, ADDITIONAL2, CREATED_BY, CREATED_DATE)
        SELECT u.USER_ID, @page_id_m2350, 1, 1, 1, 1, 1, 1, 1, 1, 1, 'SYSTEM', GETDATE()
        FROM AD_USER_CREDENTIAL u
        WHERE NOT EXISTS (
            SELECT 1 FROM BOS_USER_PAGE_AUTH auth WHERE auth.USER_ID = u.USER_ID AND auth.PAGE_ID = @page_id_m2350
        );

        -- 2. Ensure enable=1 and read_acs=1 for all existing records of M2350 where enable is currently 0
        UPDATE BOS_USER_PAGE_AUTH
        SET ENABLE = 1, READ_ACS = 1, [WRITE] = 1, UPDATED_BY = 'SYSTEM', UPDATED_DATE = GETDATE()
        WHERE PAGE_ID = @page_id_m2350 AND (ENABLE = 0 OR READ_ACS = 0);
    END
END
GO
