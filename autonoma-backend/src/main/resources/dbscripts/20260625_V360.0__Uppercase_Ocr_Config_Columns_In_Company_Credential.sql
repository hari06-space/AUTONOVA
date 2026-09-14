-- Rename OCR configuration columns in AD_COMPANY_CREDENTIAL to uppercase if they exist in lowercase, or create them in uppercase if missing.
IF OBJECT_ID('[dbo].[AD_COMPANY_CREDENTIAL]', 'U') IS NOT NULL
BEGIN
    -- 1. OCR_TENANT_ID
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[AD_COMPANY_CREDENTIAL]') AND name = 'OCR_TENANT_ID')
    BEGIN
        ALTER TABLE [dbo].[AD_COMPANY_CREDENTIAL] ADD [OCR_TENANT_ID] NVARCHAR(100);
        PRINT 'Added column OCR_TENANT_ID to AD_COMPANY_CREDENTIAL';
    END
    ELSE IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[AD_COMPANY_CREDENTIAL]') AND name = 'ocr_tenant_id' COLLATE Latin1_General_CS_AS)
    BEGIN
        EXEC sp_rename '[dbo].[AD_COMPANY_CREDENTIAL].[ocr_tenant_id]', 'OCR_TENANT_ID', 'COLUMN';
        PRINT 'Renamed column ocr_tenant_id to OCR_TENANT_ID';
    END

    -- 2. OCR_CLIENT_ID
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[AD_COMPANY_CREDENTIAL]') AND name = 'OCR_CLIENT_ID')
    BEGIN
        ALTER TABLE [dbo].[AD_COMPANY_CREDENTIAL] ADD [OCR_CLIENT_ID] NVARCHAR(100);
        PRINT 'Added column OCR_CLIENT_ID to AD_COMPANY_CREDENTIAL';
    END
    ELSE IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[AD_COMPANY_CREDENTIAL]') AND name = 'ocr_client_id' COLLATE Latin1_General_CS_AS)
    BEGIN
        EXEC sp_rename '[dbo].[AD_COMPANY_CREDENTIAL].[ocr_client_id]', 'OCR_CLIENT_ID', 'COLUMN';
        PRINT 'Renamed column ocr_client_id to OCR_CLIENT_ID';
    END

    -- 3. OCR_CLIENT_SECRET
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[AD_COMPANY_CREDENTIAL]') AND name = 'OCR_CLIENT_SECRET')
    BEGIN
        ALTER TABLE [dbo].[AD_COMPANY_CREDENTIAL] ADD [OCR_CLIENT_SECRET] NVARCHAR(255);
        PRINT 'Added column OCR_CLIENT_SECRET to AD_COMPANY_CREDENTIAL';
    END
    ELSE IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[AD_COMPANY_CREDENTIAL]') AND name = 'ocr_client_secret' COLLATE Latin1_General_CS_AS)
    BEGIN
        EXEC sp_rename '[dbo].[AD_COMPANY_CREDENTIAL].[ocr_client_secret]', 'OCR_CLIENT_SECRET', 'COLUMN';
        PRINT 'Renamed column ocr_client_secret to OCR_CLIENT_SECRET';
    END

    -- 4. OCR_SHARED_MAILBOX
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[AD_COMPANY_CREDENTIAL]') AND name = 'OCR_SHARED_MAILBOX')
    BEGIN
        ALTER TABLE [dbo].[AD_COMPANY_CREDENTIAL] ADD [OCR_SHARED_MAILBOX] NVARCHAR(100);
        PRINT 'Added column OCR_SHARED_MAILBOX to AD_COMPANY_CREDENTIAL';
    END
    ELSE IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[AD_COMPANY_CREDENTIAL]') AND name = 'ocr_shared_mailbox' COLLATE Latin1_General_CS_AS)
    BEGIN
        EXEC sp_rename '[dbo].[AD_COMPANY_CREDENTIAL].[ocr_shared_mailbox]', 'OCR_SHARED_MAILBOX', 'COLUMN';
        PRINT 'Renamed column ocr_shared_mailbox to OCR_SHARED_MAILBOX';
    END

    -- 5. OCR_PROCESSED_FOLDER
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[AD_COMPANY_CREDENTIAL]') AND name = 'OCR_PROCESSED_FOLDER')
    BEGIN
        ALTER TABLE [dbo].[AD_COMPANY_CREDENTIAL] ADD [OCR_PROCESSED_FOLDER] NVARCHAR(100);
        PRINT 'Added column OCR_PROCESSED_FOLDER to AD_COMPANY_CREDENTIAL';
    END
    ELSE IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[AD_COMPANY_CREDENTIAL]') AND name = 'ocr_processed_folder' COLLATE Latin1_General_CS_AS)
    BEGIN
        EXEC sp_rename '[dbo].[AD_COMPANY_CREDENTIAL].[ocr_processed_folder]', 'OCR_PROCESSED_FOLDER', 'COLUMN';
        PRINT 'Renamed column ocr_processed_folder to OCR_PROCESSED_FOLDER';
    END
END
GO
