-- ==============================================================================
-- Migration: 20260826_V1171.0__Add_6Digit_Company_Code_Support.sql
-- Description: Ensure CLIENT_CODE exists on AD_COMPANY_CREDENTIAL, populate 6-digit default, and create index
-- Target DB: AT_NUTECH
-- ==============================================================================

IF OBJECT_ID('AD_COMPANY_CREDENTIAL', 'U') IS NOT NULL
BEGIN
    -- 1. Ensure CLIENT_CODE column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM sys.columns 
        WHERE object_id = OBJECT_ID('AD_COMPANY_CREDENTIAL') 
          AND name = 'CLIENT_CODE'
    )
    BEGIN
        ALTER TABLE AD_COMPANY_CREDENTIAL 
        ADD CLIENT_CODE NVARCHAR(50) NULL;
    END

    -- 2. Populate dynamic 6-digit Company Code based on company ID for existing records without a code
    UPDATE AD_COMPANY_CREDENTIAL
    SET CLIENT_CODE = RIGHT('100000' + CAST(id AS NVARCHAR(10)), 6)
    WHERE (CLIENT_CODE IS NULL OR LTRIM(RTRIM(CLIENT_CODE)) = '');

    -- 3. Create high-performance index on CLIENT_CODE for instant O(1) login resolution
    IF NOT EXISTS (
        SELECT 1 
        FROM sys.indexes 
        WHERE name = 'IDX_AD_COMPANY_CRED_CLIENT_CODE' 
          AND object_id = OBJECT_ID('AD_COMPANY_CREDENTIAL')
    )
    BEGIN
        CREATE NONCLUSTERED INDEX IDX_AD_COMPANY_CRED_CLIENT_CODE
        ON AD_COMPANY_CREDENTIAL (CLIENT_CODE)
        INCLUDE (id, COMPANY_NAME, SHORT_NAME, LOGO_FILE_NAME, DB_SOURCE_NAME, IS_ACTIVE);
    END
END
GO
