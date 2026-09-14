-- Fix OCR Configuration default shared mailbox, tenant, and client ID
IF OBJECT_ID('[dbo].[AD_OCR_CONFIG]', 'U') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM [dbo].[AD_OCR_CONFIG] WHERE [COMPANY_CREDENTIAL_ID] = 1)
    BEGIN
        UPDATE [dbo].[AD_OCR_CONFIG]
        SET [OCR_SHARED_MAILBOX] = ISNULL(NULLIF([OCR_SHARED_MAILBOX], ''), 'darshan.k@technosprint.net'),
            [OCR_TENANT_ID] = ISNULL(NULLIF([OCR_TENANT_ID], ''), 'dc9c3a4c-20c8-4af8-beeb-e0fbd4d8be82'),
            [OCR_CLIENT_ID] = ISNULL(NULLIF([OCR_CLIENT_ID], ''), '66d2e052-616b-4c4b-b091-ea3aa08e5b4e'),
            [OCR_PROCESSED_FOLDER] = ISNULL(NULLIF([OCR_PROCESSED_FOLDER], ''), 'Processed')
        WHERE [COMPANY_CREDENTIAL_ID] = 1;
    END
    ELSE
    BEGIN
        INSERT INTO [dbo].[AD_OCR_CONFIG] ([COMPANY_CREDENTIAL_ID], [OCR_TENANT_ID], [OCR_CLIENT_ID], [OCR_SHARED_MAILBOX], [OCR_PROCESSED_FOLDER])
        VALUES (1, 'dc9c3a4c-20c8-4af8-beeb-e0fbd4d8be82', '66d2e052-616b-4c4b-b091-ea3aa08e5b4e', 'darshan.k@technosprint.net', 'Processed');
    END
END
GO
