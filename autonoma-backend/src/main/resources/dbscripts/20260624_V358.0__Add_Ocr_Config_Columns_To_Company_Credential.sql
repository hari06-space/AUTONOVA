-- Add OCR configuration columns to AD_COMPANY_CREDENTIAL if missing
IF OBJECT_ID('[dbo].[AD_COMPANY_CREDENTIAL]', 'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[AD_COMPANY_CREDENTIAL]') AND name = 'ocr_tenant_id')
    BEGIN
        ALTER TABLE [dbo].[AD_COMPANY_CREDENTIAL] ADD [ocr_tenant_id] NVARCHAR(100);
        PRINT 'Added column ocr_tenant_id to AD_COMPANY_CREDENTIAL';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[AD_COMPANY_CREDENTIAL]') AND name = 'ocr_client_id')
    BEGIN
        ALTER TABLE [dbo].[AD_COMPANY_CREDENTIAL] ADD [ocr_client_id] NVARCHAR(100);
        PRINT 'Added column ocr_client_id to AD_COMPANY_CREDENTIAL';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[AD_COMPANY_CREDENTIAL]') AND name = 'ocr_client_secret')
    BEGIN
        ALTER TABLE [dbo].[AD_COMPANY_CREDENTIAL] ADD [ocr_client_secret] NVARCHAR(255);
        PRINT 'Added column ocr_client_secret to AD_COMPANY_CREDENTIAL';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[AD_COMPANY_CREDENTIAL]') AND name = 'ocr_shared_mailbox')
    BEGIN
        ALTER TABLE [dbo].[AD_COMPANY_CREDENTIAL] ADD [ocr_shared_mailbox] NVARCHAR(100);
        PRINT 'Added column ocr_shared_mailbox to AD_COMPANY_CREDENTIAL';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[AD_COMPANY_CREDENTIAL]') AND name = 'ocr_processed_folder')
    BEGIN
        ALTER TABLE [dbo].[AD_COMPANY_CREDENTIAL] ADD [ocr_processed_folder] NVARCHAR(100);
        PRINT 'Added column ocr_processed_folder to AD_COMPANY_CREDENTIAL';
    END
END
GO
