-- ===================================================================================
-- Migration: 20260801_V1098.0__Add_Leave_OD_Allowed_To_Employee_Job_Profile.sql
-- Module: HR / Employee Master / Job Profile
-- Purpose: Add LEAVE_ALLOWED and OD_ALLOWED columns to HR_EMPLOYEE_JOB_PROFILE
-- ===================================================================================

IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('HR_EMPLOYEE_JOB_PROFILE') 
      AND name = 'LEAVE_ALLOWED'
)
BEGIN
    ALTER TABLE HR_EMPLOYEE_JOB_PROFILE ADD LEAVE_ALLOWED NVARCHAR(10) DEFAULT 'YES';
END
GO

IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('HR_EMPLOYEE_JOB_PROFILE') 
      AND name = 'OD_ALLOWED'
)
BEGIN
    ALTER TABLE HR_EMPLOYEE_JOB_PROFILE ADD OD_ALLOWED NVARCHAR(10) DEFAULT 'YES';
END
GO

-- Update any NULL values to default 'YES' for existing employee profiles
IF EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('HR_EMPLOYEE_JOB_PROFILE') 
      AND name = 'LEAVE_ALLOWED'
)
BEGIN
    EXEC('UPDATE HR_EMPLOYEE_JOB_PROFILE SET LEAVE_ALLOWED = ''YES'' WHERE LEAVE_ALLOWED IS NULL');
END
GO

IF EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('HR_EMPLOYEE_JOB_PROFILE') 
      AND name = 'OD_ALLOWED'
)
BEGIN
    EXEC('UPDATE HR_EMPLOYEE_JOB_PROFILE SET OD_ALLOWED = ''YES'' WHERE OD_ALLOWED IS NULL');
END
GO

IF EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('HR_EMPLOYEE_JOB_PROFILE') 
      AND name = 'PERMISSION_REQUEST'
)
BEGIN
    EXEC('UPDATE HR_EMPLOYEE_JOB_PROFILE SET PERMISSION_REQUEST = ''YES'' WHERE PERMISSION_REQUEST IS NULL');
END
GO
