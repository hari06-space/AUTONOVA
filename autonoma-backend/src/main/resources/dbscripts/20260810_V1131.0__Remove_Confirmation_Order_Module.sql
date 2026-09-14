-- ===============================================================================
-- MIGRATION SCRIPT: Remove Confirmation Order Module and Database Tables
-- Date: 2026-08-10
-- Description: Completely purges Confirmation Order page references, permissions,
--              and drops table HR_ONBOARD_CONFIRMATION_ORDER.
-- ===============================================================================

BEGIN TRY
    -- 1. Remove Page Authorization entries
    DELETE FROM [dbo].[bos_user_page_auth]
    WHERE [page_id] IN (
        SELECT [page_id] FROM [dbo].[bos_pages]
        WHERE [page_url] LIKE '%confirmation-order%' OR [page_code] = 'HA1380'
    );

    -- 2. Remove Page Definition from BOS_PAGES
    DELETE FROM [dbo].[bos_pages]
    WHERE [page_url] LIKE '%confirmation-order%' OR [page_code] = 'HA1380';

    -- 3. Drop Constraints and Table HR_ONBOARD_CONFIRMATION_ORDER
    IF OBJECT_ID('[dbo].[HR_ONBOARD_CONFIRMATION_ORDER]', 'U') IS NOT NULL
    BEGIN
        DROP TABLE [dbo].[HR_ONBOARD_CONFIRMATION_ORDER];
    END
END TRY
BEGIN CATCH
    PRINT 'Migration 20260810_V1131.0 warning: ' + ERROR_MESSAGE();
END CATCH
