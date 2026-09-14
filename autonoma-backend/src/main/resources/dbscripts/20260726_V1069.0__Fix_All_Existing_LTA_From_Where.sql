-- Migration Script: Update existing HR_LEAVE_TRAVEL_DETAILS records to Employee Self Care
-- Date: 2026-07-26

IF OBJECT_ID('dbo.HR_LEAVE_TRAVEL_DETAILS', 'U') IS NOT NULL
BEGIN
    UPDATE HR_LEAVE_TRAVEL_DETAILS
    SET FROM_WHERE = 'Employee Self Care'
    WHERE FROM_WHERE IS NULL OR FROM_WHERE = 'HRA Module' OR FROM_WHERE = 'Self Care';
    PRINT 'Updated existing HR_LEAVE_TRAVEL_DETAILS records to Employee Self Care.';
END;
