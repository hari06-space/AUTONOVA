-- Migration script to rename processing_request and email_processing_log tables to AD_OCR prefixed standard
IF OBJECT_ID('dbo.processing_request', 'U') IS NOT NULL AND OBJECT_ID('dbo.AD_OCR_PROCESSING_REQUEST', 'U') IS NULL
BEGIN
    EXEC sp_rename 'processing_request', 'AD_OCR_PROCESSING_REQUEST';
    PRINT 'Renamed processing_request to AD_OCR_PROCESSING_REQUEST';
END

IF OBJECT_ID('dbo.email_processing_log', 'U') IS NOT NULL AND OBJECT_ID('dbo.AD_OCR_PROCESSING_LOG', 'U') IS NULL
BEGIN
    EXEC sp_rename 'email_processing_log', 'AD_OCR_PROCESSING_LOG';
    PRINT 'Renamed email_processing_log to AD_OCR_PROCESSING_LOG';
END
