-- SQL Migration to add shared_mailbox column to AD_OCR_PROCESSING_REQUEST
IF OBJECT_ID('dbo.AD_OCR_PROCESSING_REQUEST', 'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.AD_OCR_PROCESSING_REQUEST') AND name = 'shared_mailbox')
    BEGIN
        ALTER TABLE dbo.AD_OCR_PROCESSING_REQUEST ADD shared_mailbox NVARCHAR(255);
        PRINT 'Added shared_mailbox column to AD_OCR_PROCESSING_REQUEST';
    END
END
