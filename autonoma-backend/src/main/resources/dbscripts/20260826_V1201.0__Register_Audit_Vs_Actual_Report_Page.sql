-- ============================================================================
-- V1201.0  Register Audit vs Actual Report (QM1280) and Grant User Page Auth
-- ============================================================================

IF NOT EXISTS (SELECT 1 FROM bos_pages WHERE page_code = 'QM1280')
BEGIN
    INSERT INTO bos_pages (mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon)
    VALUES (11, 112, 'QM1280', N'Audit vs Actual Report', 1, '/reports/qms/audit/vs-actual', 'IconScale');
    PRINT 'Page QM1280 registered in bos_pages.';
END
ELSE
BEGIN
    UPDATE bos_pages
    SET page_name = N'Audit vs Actual Report',
        page_url = '/reports/qms/audit/vs-actual',
        enabled = 1,
        icon = 'IconScale'
    WHERE page_code = 'QM1280';
    PRINT 'Page QM1280 updated in bos_pages.';
END
GO

-- Grant permissions to all active users based on QM1260 / QM1270 permissions
DECLARE @qm1280PageId INT;
SELECT @qm1280PageId = page_id FROM bos_pages WHERE page_code = 'QM1280';

IF @qm1280PageId IS NOT NULL
BEGIN
    INSERT INTO bos_user_page_auth (
        user_id, page_id, sub_mod_id, mod_id, enable, read_acs, write, delete_acs,
        export, approval, manager, additional1, additional2, add_task_enable,
        created_by, created_date
    )
    SELECT DISTINCT
        auth.user_id,
        @qm1280PageId,
        112,
        11,
        1,
        1,
        1,
        1,
        1,
        1,
        auth.manager,
        auth.additional1,
        auth.additional2,
        1,
        'SYSTEM',
        SYSDATETIME()
    FROM bos_user_page_auth auth
    INNER JOIN bos_pages p ON auth.page_id = p.page_id
    WHERE p.page_code IN ('QM1260', 'QM1270', 'QM1210')
      AND auth.user_id NOT IN (
          SELECT user_id FROM bos_user_page_auth WHERE page_id = @qm1280PageId
      );

    PRINT 'Permissions seeded for QM1280 in bos_user_page_auth.';
END
GO
