-- Idempotent script to populate legacy NULL shared_mailbox fields with the default mailbox address
IF EXISTS (SELECT 1 FROM AD_OCR_PROCESSING_REQUEST WHERE shared_mailbox IS NULL)
BEGIN
    UPDATE AD_OCR_PROCESSING_REQUEST
    SET shared_mailbox = 'digitech@nutechwindparts.com'
    WHERE shared_mailbox IS NULL;
END
