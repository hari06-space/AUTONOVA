-- =========================================================================
-- V365.0 | Fix Master Checklist Attachment Page Code
-- Description: Updates the page code for existing master checklist attachments
--              from QM1110 (Checklist Verify) to M1210 (Check List Master).
-- Date: 2026-06-25
-- =========================================================================

UPDATE dbo.QMS_ATTACHMENT_PATH
SET PAGE_CODE = 'M1210'
WHERE PAGE_CODE = 'QM1110'
  AND DOC_TYPE IN ('MASTER CHECKLIST', 'MASTER CHECKLIST SCANNED');
