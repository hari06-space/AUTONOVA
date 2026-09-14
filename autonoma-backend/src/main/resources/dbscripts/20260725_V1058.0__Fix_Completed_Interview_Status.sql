-- Database Migration: 20260725_V1058.0__Fix_Completed_Interview_Status.sql
-- Migrate overall candidate interview status from COMPLETED to In Progress in HR_EMPLOYEE_ATS.

SET NOCOUNT ON;

DECLARE @CompletedId BIGINT = (SELECT ID FROM AD_STATUS_MASTER WHERE UPPER(TRIM(NAME)) = 'COMPLETED');
DECLARE @InProgressId BIGINT = (SELECT ID FROM AD_STATUS_MASTER WHERE UPPER(TRIM(NAME)) = 'IN PROGRESS');

IF @CompletedId IS NOT NULL AND @InProgressId IS NOT NULL
BEGIN
    -- Check if any records in HR_EMPLOYEE_ATS are currently set to COMPLETED for INTERVIEW_STATUS
    IF EXISTS (SELECT 1 FROM HR_EMPLOYEE_ATS WHERE INTERVIEW_STATUS = @CompletedId)
    BEGIN
        UPDATE HR_EMPLOYEE_ATS 
        SET INTERVIEW_STATUS = @InProgressId 
        WHERE INTERVIEW_STATUS = @CompletedId;
        PRINT 'Successfully migrated HR_EMPLOYEE_ATS candidates from COMPLETED to In Progress';
    END
END
