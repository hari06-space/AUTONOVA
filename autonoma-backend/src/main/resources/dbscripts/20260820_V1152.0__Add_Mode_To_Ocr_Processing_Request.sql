-- SQL Migration to add mode column to AD_OCR_PROCESSING_REQUEST
IF OBJECT_ID('dbo.AD_OCR_PROCESSING_REQUEST', 'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.AD_OCR_PROCESSING_REQUEST') AND name = 'mode')
    BEGIN
        ALTER TABLE dbo.AD_OCR_PROCESSING_REQUEST ADD mode NVARCHAR(50) DEFAULT 'OCR';
        PRINT 'Added mode column to AD_OCR_PROCESSING_REQUEST';
    END

    -- Update existing NULL or empty mode values to 'OCR'
    EXEC('UPDATE dbo.AD_OCR_PROCESSING_REQUEST SET mode = ''OCR'' WHERE mode IS NULL OR TRIM(mode) = '''';');
END
