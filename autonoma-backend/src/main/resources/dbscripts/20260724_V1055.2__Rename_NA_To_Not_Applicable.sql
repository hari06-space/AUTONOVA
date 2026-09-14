-- =============================================================================
-- Fix: Rename status master entry 'N/A' to 'Not Applicable'
-- =============================================================================
SET NOCOUNT ON;

IF EXISTS (SELECT 1 FROM AD_STATUS_MASTER WHERE UPPER(TRIM(NAME)) = 'N/A')
BEGIN
    UPDATE AD_STATUS_MASTER
    SET NAME = 'Not Applicable'
    WHERE UPPER(TRIM(NAME)) = 'N/A';
    PRINT 'SUCCESS: Status master renamed N/A to Not Applicable';
END
ELSE IF EXISTS (SELECT 1 FROM AD_STATUS_MASTER WHERE ID = 58 AND NAME = 'N/A')
BEGIN
    UPDATE AD_STATUS_MASTER
    SET NAME = 'Not Applicable'
    WHERE ID = 58;
    PRINT 'SUCCESS: Status master renamed ID 58 from N/A to Not Applicable';
END
ELSE
BEGIN
    PRINT 'SKIPPED: Status master already renamed or N/A not found';
END

GO
