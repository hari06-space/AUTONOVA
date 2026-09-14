-- ============================================================================
-- V1204.0  Register Audit Score Report (QM1270) and Grant User Page Auth
-- ============================================================================

IF NOT EXISTS (SELECT 1 FROM bos_pages WHERE page_code = 'QM1270')
BEGIN
    INSERT INTO bos_pages (mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon)
    VALUES (11, 112, 'QM1270', N'Audit Score Report', 1, '/reports/qms/audit/score-report', 'IconReportAnalytics');
    PRINT 'Page QM1270 registered in bos_pages.';
END
ELSE
BEGIN
    UPDATE bos_pages
    SET page_name = N'Audit Score Report',
        page_url = '/reports/qms/audit/score-report',
        enabled = 1,
        icon = 'IconReportAnalytics'
    WHERE page_code = 'QM1270';
    PRINT 'Page QM1270 updated in bos_pages.';
END
GO

-- Revoke / Remove access for QM1270 for all users in bos_user_page_auth
DELETE FROM bos_user_page_auth 
WHERE page_id IN (SELECT page_id FROM bos_pages WHERE page_code = 'QM1270');

PRINT 'Permissions revoked for QM1270 in bos_user_page_auth (No users have access).';
GO
