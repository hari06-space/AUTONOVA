-- ============================================================================
-- SQL Migration: V1035.0 - Reclassify Employee Self-Care Leave Pages & Deduplicate
-- Created: 2026-07-20
-- Description:
--   1. Corrects MOD_ID (16 = Employee Self-Care) and SUB_MOD_ID (161 = Employee Self-Care)
--      for Employee Self-Care page codes: ESC1010, ESC1020, and ESC1050.
--   2. Renames ESC1050 to 'Leave Encashment Apply' to avoid page name collision with
--      HR/Payroll's HA1294 ('Leave Encashment Entry').
--   3. Removes any duplicate rows in BOS_PAGES and BOS_USER_PAGE_AUTH.
--   4. Ensures BOS_USER_PAGE_AUTH reflects MOD_ID = 16 and SUB_MOD_ID = 161.
-- ============================================================================

BEGIN TRANSACTION;

BEGIN TRY
    -- 1. Reclassify ESC1010, ESC1020, ESC1050 in BOS_PAGES to Module 16 (Employee Self-Care), Submodule 161
    UPDATE bos_pages
    SET mod_id = 16,
        sub_mod_id = 161
    WHERE page_code IN ('ESC1010', 'ESC1020', 'ESC1050');

    PRINT 'Updated MOD_ID=16 and SUB_MOD_ID=161 for ESC1010, ESC1020, ESC1050 in BOS_PAGES.';

    -- 2. Rename ESC1050 page name to 'Leave Encashment Apply' to eliminate visual duplication with HA1294
    UPDATE bos_pages
    SET page_name = 'Leave Encashment Apply'
    WHERE page_code = 'ESC1050';

    PRINT 'Renamed ESC1050 page_name to Leave Encashment Apply in BOS_PAGES.';

    -- 3. Update MOD_ID and SUB_MOD_ID in BOS_USER_PAGE_AUTH to match updated BOS_PAGES
    UPDATE upa
    SET upa.mod_id = p.mod_id,
        upa.sub_mod_id = p.sub_mod_id
    FROM bos_user_page_auth upa
    INNER JOIN bos_pages p ON upa.page_id = p.page_id
    WHERE p.page_code IN ('ESC1010', 'ESC1020', 'ESC1050');

    PRINT 'Updated MOD_ID and SUB_MOD_ID in BOS_USER_PAGE_AUTH for ESC leave pages.';

    -- 4. Deduplicate BOS_PAGES if any duplicate page_code entries exist
    -- Keep the row with MIN(page_id) for each page_code, re-map user auth to canonical page_id, then remove duplicate page rows.
    IF EXISTS (
        SELECT page_code FROM bos_pages GROUP BY page_code HAVING COUNT(*) > 1
    )
    BEGIN
        -- Re-link bos_user_page_auth entries pointing to duplicate page_ids to the canonical page_id
        WITH CanonicalPages AS (
            SELECT page_code, MIN(page_id) AS min_page_id
            FROM bos_pages
            GROUP BY page_code
        )
        UPDATE upa
        SET upa.page_id = cp.min_page_id
        FROM bos_user_page_auth upa
        INNER JOIN bos_pages p ON upa.page_id = p.page_id
        INNER JOIN CanonicalPages cp ON p.page_code = cp.page_code
        WHERE upa.page_id <> cp.min_page_id;

        -- Delete duplicate page rows in bos_pages
        WITH DuplicatePages AS (
            SELECT page_id,
                   ROW_NUMBER() OVER (PARTITION BY page_code ORDER BY page_id ASC) AS RowNum
            FROM bos_pages
        )
        DELETE FROM DuplicatePages WHERE RowNum > 1;

        PRINT 'Deduplicated BOS_PAGES rows and updated references in BOS_USER_PAGE_AUTH.';
    END;

    -- 5. Deduplicate BOS_USER_PAGE_AUTH rows if any duplicate (user_id, page_id) pairs exist
    IF EXISTS (
        SELECT user_id, page_id FROM bos_user_page_auth GROUP BY user_id, page_id HAVING COUNT(*) > 1
    )
    BEGIN
        WITH DuplicateUserAuth AS (
            SELECT id,
                   ROW_NUMBER() OVER (PARTITION BY user_id, page_id ORDER BY id ASC) AS RowNum
            FROM bos_user_page_auth
        )
        DELETE FROM DuplicateUserAuth WHERE RowNum > 1;

        PRINT 'Deduplicated BOS_USER_PAGE_AUTH rows.';
    END;

    COMMIT TRANSACTION;
    PRINT 'V1035.0 Migration completed successfully.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    RAISERROR(@ErrorMessage, 16, 1);
END CATCH;
