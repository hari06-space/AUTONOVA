-- SQL Migration Script: Add Indexes to Master Tables for Performance Optimization
-- This script adds non-clustered indexes to frequently queried columns in core master tables.

-- 1. HR_DEPARTMENT
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_hr_department_is_active' AND object_id = OBJECT_ID('HR_DEPARTMENT'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_hr_department_is_active ON HR_DEPARTMENT(IS_ACTIVE) INCLUDE (DEPARTMENT_NAME);
END
GO

-- 2. HR_DESIGNATION
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_hr_designation_is_active' AND object_id = OBJECT_ID('HR_DESIGNATION'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_hr_designation_is_active ON HR_DESIGNATION(IS_ACTIVE) INCLUDE (DESIGNATION_NAME);
END
GO

-- 3. HR_LEVEL
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_hr_level_is_active' AND object_id = OBJECT_ID('HR_LEVEL'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_hr_level_is_active ON HR_LEVEL(IS_ACTIVE) INCLUDE (LEVEL_NAME);
END
GO

-- 4. HR_EMPLOYEE
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_hr_employee_is_active' AND object_id = OBJECT_ID('HR_EMPLOYEE'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_hr_employee_is_active ON HR_EMPLOYEE(IS_ACTIVE) INCLUDE (EMP_CODE, EMPLOYEE_NAME);
END
GO

-- 5. HR_GRADE_DETAIL
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_hr_grade_detail_status' AND object_id = OBJECT_ID('HR_GRADE_DETAIL'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_hr_grade_detail_status ON HR_GRADE_DETAIL(STATUS) INCLUDE (GRADE_CODE, GRADE_NAME);
END
GO

-- 6. AD_DIVISION
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ad_division_is_active' AND object_id = OBJECT_ID('AD_DIVISION'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_ad_division_is_active ON AD_DIVISION(IS_ACTIVE) INCLUDE (DIVISION_NAME);
END
GO

