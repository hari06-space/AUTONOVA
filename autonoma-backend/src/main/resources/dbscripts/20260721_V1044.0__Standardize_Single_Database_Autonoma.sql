-- Idempotent Migration: Standardize to single database AUTONOMA across all company credentials
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'AD_COMPANY_CREDENTIAL')
BEGIN
    UPDATE AD_COMPANY_CREDENTIAL
    SET DB_SOURCE_NAME = 'AUTONOMA'
    WHERE DB_SOURCE_NAME IS NULL OR UPPER(TRIM(DB_SOURCE_NAME)) <> 'AUTONOMA';
END
