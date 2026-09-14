-- =========================================================================================
-- Migration: Add ESSL_SYNC_INTERVAL_MINUTES into AD_APP_PREFERENCE for Dynamic Biometric Sync
-- =========================================================================================

IF OBJECT_ID('AD_APP_PREFERENCE') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM AD_APP_PREFERENCE WHERE PREF_NAME = 'ESSL_SYNC_INTERVAL_MINUTES')
    BEGIN
        INSERT INTO AD_APP_PREFERENCE (PREF_NAME, PREF_VALUE, COMMENTS, PREF_TYPE, CREATED_BY, CREATED_DATE)
        VALUES ('ESSL_SYNC_INTERVAL_MINUTES', '15', 'Biometric eSSL auto-sync interval in minutes (default: 15)', 'HRA', 'SYSTEM', GETDATE());
    END
END
