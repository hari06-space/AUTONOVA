-- Migration: Add WHERE_FROM column to HR_OD_DETAILS table and standardize status values
-- Idempotent script for Microsoft SQL Server

IF NOT EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'HR_OD_DETAILS' AND COLUMN_NAME = 'WHERE_FROM'
)
BEGIN
    ALTER TABLE HR_OD_DETAILS ADD WHERE_FROM VARCHAR(100) NULL;
END;
GO

-- Update existing records where WHERE_FROM is NULL
UPDATE HR_OD_DETAILS
SET WHERE_FROM = 'HR OD Details'
WHERE WHERE_FROM IS NULL OR TRIM(WHERE_FROM) = '';
GO

-- Standardize existing statuses from 'Pending for Verify' / 'Pending Approval' to 'Pending to Verify'
UPDATE HR_OD_DETAILS
SET STATUS = 'Pending to Verify'
WHERE STATUS IS NULL OR UPPER(TRIM(STATUS)) IN ('PENDING FOR VERIFY', 'PENDING APPROVAL', 'PENDING');
GO

-- Standardize existing statuses from 'Approved' to 'Verified'
UPDATE HR_OD_DETAILS
SET STATUS = 'Verified'
WHERE UPPER(TRIM(STATUS)) IN ('APPROVED', 'APPROVED SUCCESSFULLY');
GO
