-- ===================================================================================
-- Migration: 20260801_V1104.0__Remove_Obsolete_Essl_Timeout_And_Auto_Sync_Columns.sql
-- Module: HR / Overtime & Biometric eSSL Policy Settings
-- Purpose: Remove obsolete eSSL Connection Timeout and eSSL Auto-Sync Engine preferences
--          (ESSL_CONNECTION_TIMEOUT_SECONDS, ESSL_AUTO_SYNC_ENABLED / ESSL_AUTO_MIGRATION_ACTIVE)
--          from HR_SETTING_MASTER & AD_APP_PREFERENCE tables.
-- ===================================================================================

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('HR_SETTING_MASTER') AND name = 'ESSL_AUTO_MIGRATION_ACTIVE')
BEGIN
    ALTER TABLE HR_SETTING_MASTER DROP COLUMN ESSL_AUTO_MIGRATION_ACTIVE;
END
GO

-- Clean up obsolete preference entries from AD_APP_PREFERENCE table if present
DELETE FROM AD_APP_PREFERENCE WHERE PREF_NAME IN (
    'ESSL_CONNECTION_TIMEOUT_SECONDS',
    'ESSL_AUTO_SYNC_ENABLED',
    'ESSL_AUTO_MIGRATION_ACTIVE'
);
GO
