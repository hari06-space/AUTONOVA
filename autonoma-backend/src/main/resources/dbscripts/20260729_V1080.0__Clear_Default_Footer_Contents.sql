-- Migration: Clear Default Footer Contents in HR_EMAIL_CONTENT to allow displaying placeholders
-- Date: 2026-07-29

UPDATE HR_EMAIL_CONTENT
SET FOOTER_CONTENT = ''
WHERE FOOTER_CONTENT = 'Autonoma ERP Corp HR Team'
   OR FOOTER_CONTENT = 'Autonoma ERP Corp Recruitment Team'
   OR FOOTER_CONTENT = 'Autonoma ERP Corp Talent Acquisition';
GO
