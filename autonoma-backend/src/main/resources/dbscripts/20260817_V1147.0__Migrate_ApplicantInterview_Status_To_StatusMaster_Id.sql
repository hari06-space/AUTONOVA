-- =============================================================================
-- Migration: Update HR_APPLICANT_INTERVIEW.STATUS column from string name ('ACTIVE'/'INACTIVE')
-- to the corresponding AD_STATUS_MASTER ID string value.
-- =============================================================================
SET NOCOUNT ON;

DECLARE @ActiveId NVARCHAR(50);
DECLARE @InactiveId NVARCHAR(50);

SELECT TOP 1 @ActiveId = CAST(ID AS NVARCHAR(50)) FROM AD_STATUS_MASTER WHERE UPPER(TRIM(NAME)) = 'ACTIVE';
SELECT TOP 1 @InactiveId = CAST(ID AS NVARCHAR(50)) FROM AD_STATUS_MASTER WHERE UPPER(TRIM(NAME)) = 'INACTIVE';

IF @ActiveId IS NOT NULL
BEGIN
    UPDATE HR_APPLICANT_INTERVIEW 
    SET STATUS = @ActiveId 
    WHERE UPPER(TRIM(STATUS)) = 'ACTIVE';
END

IF @InactiveId IS NOT NULL
BEGIN
    UPDATE HR_APPLICANT_INTERVIEW 
    SET STATUS = @InactiveId 
    WHERE UPPER(TRIM(STATUS)) = 'INACTIVE';
END
GO
