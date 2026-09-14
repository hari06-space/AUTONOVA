-- 20260805_V1119.0__Add_Outgoing_Email_Columns_To_Ocr_Processing_Request.sql
-- Add support columns for tracking outgoing reply emails as separate rows on the dashboard

IF OBJECT_ID('dbo.AD_OCR_PROCESSING_REQUEST', 'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.AD_OCR_PROCESSING_REQUEST') AND name = 'parent_enquiry_id')
    BEGIN
        EXEC('ALTER TABLE dbo.AD_OCR_PROCESSING_REQUEST ADD parent_enquiry_id BIGINT NULL;');
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.AD_OCR_PROCESSING_REQUEST') AND name = 'conversation_thread_id')
    BEGIN
        EXEC('ALTER TABLE dbo.AD_OCR_PROCESSING_REQUEST ADD conversation_thread_id NVARCHAR(500) NULL;');
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.AD_OCR_PROCESSING_REQUEST') AND name = 'direction')
    BEGIN
        EXEC('ALTER TABLE dbo.AD_OCR_PROCESSING_REQUEST ADD direction NVARCHAR(50) NULL;');
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.AD_OCR_PROCESSING_REQUEST') AND name = 'email_type')
    BEGIN
        EXEC('ALTER TABLE dbo.AD_OCR_PROCESSING_REQUEST ADD email_type NVARCHAR(100) NULL;');
    END
END
