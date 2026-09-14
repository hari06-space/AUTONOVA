-- =============================================================================
-- Migration: Add Indexes to Optimize ATS Application Tracking System Loading
-- Developer: Antigravity
-- Date: 2026-08-10
-- Description: Adds non-clustered indexes on the filter and mapping columns used by ATS.
-- =============================================================================

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;

-- 1. Index on FROMWHERE column of HR_EMPLOYEE to optimize ATS filtering
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_hr_employee_fromwhere' AND object_id = OBJECT_ID('[dbo].[HR_EMPLOYEE]'))
BEGIN
    CREATE NONCLUSTERED INDEX [idx_hr_employee_fromwhere] ON [dbo].[HR_EMPLOYEE] ([FROMWHERE]);
END;
GO

-- 2. Index on EMPLOYEE_ID column of HR_EMPLOYEE_PERSONAL for fast personal details lookup
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_hr_employee_personal_empid' AND object_id = OBJECT_ID('[dbo].[HR_EMPLOYEE_PERSONAL]'))
BEGIN
    CREATE NONCLUSTERED INDEX [idx_hr_employee_personal_empid] ON [dbo].[HR_EMPLOYEE_PERSONAL] ([EMPLOYEE_ID]);
END;
GO

-- 3. Index on EMPLOYEE_ID column of HR_APPLICANT_INTERVIEW for fast candidate interviews lookup
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_hr_applicant_interview_empid' AND object_id = OBJECT_ID('[dbo].[HR_APPLICANT_INTERVIEW]'))
BEGIN
    CREATE NONCLUSTERED INDEX [idx_hr_applicant_interview_empid] ON [dbo].[HR_APPLICANT_INTERVIEW] ([EMPLOYEE_ID]);
END;
GO
