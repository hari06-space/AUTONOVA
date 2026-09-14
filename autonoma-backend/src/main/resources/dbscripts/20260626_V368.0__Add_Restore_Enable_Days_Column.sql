-- ============================================================================
-- V368.0 Add restore_enable_days column to AD_COMPANY_CREDENTIAL
-- Date: 2026-06-26
-- ============================================================================

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE Name = 'restore_enable_days'
    AND Object_ID = Object_ID('AD_COMPANY_CREDENTIAL')
)
BEGIN
    ALTER TABLE AD_COMPANY_CREDENTIAL
    ADD restore_enable_days INT NULL DEFAULT (7);

    PRINT 'Column restore_enable_days added to AD_COMPANY_CREDENTIAL.';
END
ELSE
BEGIN
    PRINT 'Column restore_enable_days already exists in AD_COMPANY_CREDENTIAL.';
END
GO
