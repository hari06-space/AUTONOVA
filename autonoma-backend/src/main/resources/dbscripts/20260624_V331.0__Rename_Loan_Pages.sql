-- Migration: Rename Loan pages and delete HRA Payroll Verification (HA1291)
-- Author: Antigravity

-- Delete HA1291 page and its references
DELETE FROM bos_user_page_auth WHERE PAGE_ID IN (SELECT PAGE_ID FROM bos_pages WHERE PAGE_CODE = 'HA1291');
DELETE FROM file_traceability_management WHERE PAGE_ID IN (SELECT PAGE_ID FROM bos_pages WHERE PAGE_CODE = 'HA1291');
DELETE FROM bos_pages WHERE PAGE_CODE = 'HA1291';

-- Update remaining page names
UPDATE bos_pages
SET PAGE_NAME = 'HRA Loan Issues'
WHERE PAGE_CODE = 'HA1292';

UPDATE bos_pages
SET PAGE_NAME = 'EMP Loan Apply'
WHERE PAGE_CODE = 'QM1410';

UPDATE bos_pages
SET PAGE_NAME = 'HR Loan Master'
WHERE PAGE_CODE = 'M2340';
