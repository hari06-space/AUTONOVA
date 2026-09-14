-- =============================================================================
-- Migration: Add Indexes to Employee Master and Child Tables to Optimize Performance
-- Developer: Antigravity
-- Date: 2026-07-27
-- Description: Adds non-clustered indexes on the join keys and status fields to 
--              accelerate lazy loaded queries on HR_EMPLOYEE relations.
-- =============================================================================

SET NOCOUNT ON;

-- 1. Index on HR_EMPLOYEE status column
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_HR_EMPLOYEE_STATUS' AND object_id = OBJECT_ID('[dbo].[HR_EMPLOYEE]'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_HR_EMPLOYEE_STATUS] ON [dbo].[HR_EMPLOYEE] ([STATUS]);
END;
GO

-- 2. Index on HR_EMPLOYEE_ORGANIZATION employee_id column
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_HR_EMPLOYEE_ORGANIZATION_EMPLOYEE_ID' AND object_id = OBJECT_ID('[dbo].[HR_EMPLOYEE_ORGANIZATION]'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_HR_EMPLOYEE_ORGANIZATION_EMPLOYEE_ID] ON [dbo].[HR_EMPLOYEE_ORGANIZATION] ([EMPLOYEE_ID]);
END;
GO

-- 3. Composite Index on HR_EMPLOYEE_ORGANIZATION department_id and designation_id columns
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_HR_EMPLOYEE_ORGANIZATION_DEPT_DESG' AND object_id = OBJECT_ID('[dbo].[HR_EMPLOYEE_ORGANIZATION]'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_HR_EMPLOYEE_ORGANIZATION_DEPT_DESG] ON [dbo].[HR_EMPLOYEE_ORGANIZATION] ([DEPARTMENT_ID], [DESIGNATION_ID]);
END;
GO

-- 4. Index on HR_EMPLOYEE_SCHEDULING employee_id column
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_HR_EMPLOYEE_SCHEDULING_EMPLOYEE_ID' AND object_id = OBJECT_ID('[dbo].[HR_EMPLOYEE_SCHEDULING]'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_HR_EMPLOYEE_SCHEDULING_EMPLOYEE_ID] ON [dbo].[HR_EMPLOYEE_SCHEDULING] ([EMPLOYEE_ID]);
END;
GO

-- 5. Index on HR_EMPLOYEE_REFERENCE employee_id column
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_HR_EMPLOYEE_REFERENCE_EMPLOYEE_ID' AND object_id = OBJECT_ID('[dbo].[HR_EMPLOYEE_REFERENCE]'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_HR_EMPLOYEE_REFERENCE_EMPLOYEE_ID] ON [dbo].[HR_EMPLOYEE_REFERENCE] ([EMPLOYEE_ID]);
END;
GO

-- 6. Index on HR_EMPLOYEE_ATS employee_id column
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_HR_EMPLOYEE_ATS_EMPLOYEE_ID' AND object_id = OBJECT_ID('[dbo].[HR_EMPLOYEE_ATS]'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_HR_EMPLOYEE_ATS_EMPLOYEE_ID] ON [dbo].[HR_EMPLOYEE_ATS] ([EMPLOYEE_ID]);
END;
GO

-- 7. Composite Index on HR_EMPLOYEE_ATS recruitment status columns
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_HR_EMPLOYEE_ATS_STATUSES' AND object_id = OBJECT_ID('[dbo].[HR_EMPLOYEE_ATS]'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_HR_EMPLOYEE_ATS_STATUSES] ON [dbo].[HR_EMPLOYEE_ATS] ([CALL_STATUS], [INTERVIEW_STATUS], [OFFER_STATUS], [VERIFICATION_STATUS]);
END;
GO
