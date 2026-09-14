-- ==============================================================================
-- Migration Script: V352.0 Standardize Loan Pages
-- Description: Registers and updates QM1410, QM1420, QM1430, QM1440 pages.
-- ==============================================================================

-- 1. Standardize Loan Apply (QM1410)
IF EXISTS (SELECT 1 FROM bos_pages WHERE page_code = 'QM1410')
BEGIN
    UPDATE bos_pages
    SET page_name = 'Loan Apply',
        page_url = '/employee-self-care/loan-apply'
    WHERE page_code = 'QM1410';
END
ELSE
BEGIN
    INSERT INTO bos_pages (mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon)
    VALUES (1, 114, 'QM1410', 'Loan Apply', 1, '/employee-self-care/loan-apply', 'IconFileInvoice');
END
GO

-- 2. Standardize Loan Verification (QM1420)
IF NOT EXISTS (SELECT 1 FROM bos_pages WHERE page_code = 'QM1420')
BEGIN
    INSERT INTO bos_pages (mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon)
    VALUES (2, 211, 'QM1420', 'Loan Verification', 1, '/hra/payroll/loan-verification', 'IconShieldCheck');
END
ELSE
BEGIN
    UPDATE bos_pages
    SET page_name = 'Loan Verification',
        page_url = '/hra/payroll/loan-verification'
    WHERE page_code = 'QM1420';
END
GO

-- 3. Standardize Loan Issue (QM1430)
IF NOT EXISTS (SELECT 1 FROM bos_pages WHERE page_code = 'QM1430')
BEGIN
    INSERT INTO bos_pages (mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon)
    VALUES (2, 211, 'QM1430', 'HRA Loan Issues', 1, '/hra/payroll/loan-issue', 'IconCoin');
END
ELSE
BEGIN
    UPDATE bos_pages
    SET page_name = 'HRA Loan Issues',
        page_url = '/hra/payroll/loan-issue'
    WHERE page_code = 'QM1430';
END
GO

-- 4. Standardize Loan Short Close (QM1440)
IF NOT EXISTS (SELECT 1 FROM bos_pages WHERE page_code = 'QM1440')
BEGIN
    INSERT INTO bos_pages (mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon)
    VALUES (2, 211, 'QM1440', 'Loan Short Close', 1, '/hra/payroll/loan-short-close', 'IconCircleX');
END
ELSE
BEGIN
    UPDATE bos_pages
    SET page_name = 'Loan Short Close',
        page_url = '/hra/payroll/loan-short-close'
    WHERE page_code = 'QM1440';
END
GO

-- 5. Copy permissions from deleted / legacy page codes to new page codes if they exist
-- Copy HA1291 -> QM1420
IF EXISTS (SELECT 1 FROM bos_pages WHERE page_code = 'HA1291')
BEGIN
    INSERT INTO bos_user_page_auth (user_id, page_id, sub_mod_id, mod_id, enable, read_acs, [write], delete_acs, export, approval, manager, additional1, additional2, add_task_enable)
    SELECT 
        auth.user_id,
        p_new.page_id,
        p_new.sub_mod_id,
        p_new.mod_id,
        auth.enable, auth.read_acs, auth.[write], auth.delete_acs, auth.export, auth.approval, auth.manager, auth.additional1, auth.additional2, auth.add_task_enable
    FROM bos_user_page_auth auth
    JOIN bos_pages p_old ON auth.page_id = p_old.page_id
    CROSS JOIN bos_pages p_new
    WHERE p_old.page_code = 'HA1291' AND p_new.page_code = 'QM1420'
      AND NOT EXISTS (
          SELECT 1 FROM bos_user_page_auth a2 
          WHERE a2.user_id = auth.user_id AND a2.page_id = p_new.page_id
      );

    DELETE FROM bos_user_page_auth WHERE page_id IN (SELECT page_id FROM bos_pages WHERE page_code = 'HA1291');
    DELETE FROM bos_pages WHERE page_code = 'HA1291';
END
GO

-- Copy HA1292 -> QM1430
IF EXISTS (SELECT 1 FROM bos_pages WHERE page_code = 'HA1292')
BEGIN
    INSERT INTO bos_user_page_auth (user_id, page_id, sub_mod_id, mod_id, enable, read_acs, [write], delete_acs, export, approval, manager, additional1, additional2, add_task_enable)
    SELECT 
        auth.user_id,
        p_new.page_id,
        p_new.sub_mod_id,
        p_new.mod_id,
        auth.enable, auth.read_acs, auth.[write], auth.delete_acs, auth.export, auth.approval, auth.manager, auth.additional1, auth.additional2, auth.add_task_enable
    FROM bos_user_page_auth auth
    JOIN bos_pages p_old ON auth.page_id = p_old.page_id
    CROSS JOIN bos_pages p_new
    WHERE p_old.page_code = 'HA1292' AND p_new.page_code = 'QM1430'
      AND NOT EXISTS (
          SELECT 1 FROM bos_user_page_auth a2 
          WHERE a2.user_id = auth.user_id AND a2.page_id = p_new.page_id
      );

    DELETE FROM bos_user_page_auth WHERE page_id IN (SELECT page_id FROM bos_pages WHERE page_code = 'HA1292');
    DELETE FROM bos_pages WHERE page_code = 'HA1292';
END
GO

-- Copy HA1293 -> QM1440
IF EXISTS (SELECT 1 FROM bos_pages WHERE page_code = 'HA1293')
BEGIN
    INSERT INTO bos_user_page_auth (user_id, page_id, sub_mod_id, mod_id, enable, read_acs, [write], delete_acs, export, approval, manager, additional1, additional2, add_task_enable)
    SELECT 
        auth.user_id,
        p_new.page_id,
        p_new.sub_mod_id,
        p_new.mod_id,
        auth.enable, auth.read_acs, auth.[write], auth.delete_acs, auth.export, auth.approval, auth.manager, auth.additional1, auth.additional2, auth.add_task_enable
    FROM bos_user_page_auth auth
    JOIN bos_pages p_old ON auth.page_id = p_old.page_id
    CROSS JOIN bos_pages p_new
    WHERE p_old.page_code = 'HA1293' AND p_new.page_code = 'QM1440'
      AND NOT EXISTS (
          SELECT 1 FROM bos_user_page_auth a2 
          WHERE a2.user_id = auth.user_id AND a2.page_id = p_new.page_id
      );

    DELETE FROM bos_user_page_auth WHERE page_id IN (SELECT page_id FROM bos_pages WHERE page_code = 'HA1293');
    DELETE FROM bos_pages WHERE page_code = 'HA1293';
END
GO

-- 6. Ensure ALL existing users have permissions seeded for newly created pages
INSERT INTO bos_user_page_auth (user_id, page_id, sub_mod_id, mod_id, enable, read_acs, [write], delete_acs, export, approval, manager, additional1, additional2, add_task_enable)
SELECT 
    u.user_id, 
    p.page_id, 
    p.sub_mod_id, 
    p.mod_id, 
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1
FROM bos_pages p
CROSS JOIN ad_user_credential u
WHERE p.page_code IN ('QM1410', 'QM1420', 'QM1430', 'QM1440')
  AND NOT EXISTS (
      SELECT 1 FROM bos_user_page_auth a 
      WHERE a.user_id = u.user_id AND a.page_id = p.page_id
  );
GO
