-- -----------------------------------------------------------------------------
-- Migration: V1088.0 - Create HR_EMPLOYEE_SALARY_COMPONENT Table
-- Created At: 2026-07-30
-- Developer: Antigravity
-- Description: Create dedicated table for employee salary components storage using NVARCHAR.
-- -----------------------------------------------------------------------------

CREATE TABLE HR_EMPLOYEE_SALARY_COMPONENT (
    ID BIGINT IDENTITY(1,1) PRIMARY KEY,
    EMPLOYEE_ID BIGINT NOT NULL,
    COMPONENT_ID BIGINT,
    COMPONENT_CODE NVARCHAR(50),
    COMPONENT_NAME NVARCHAR(100),
    FORMULA NVARCHAR(255),
    AMOUNT DECIMAL(18,2),
    CREATED_BY NVARCHAR(50) NOT NULL,
    CREATED_DATE DATETIME,
    UPDATED_BY NVARCHAR(50),
    UPDATED_DATE DATETIME
);

-- Add index on EMPLOYEE_ID for faster lookup
CREATE INDEX IX_HR_EMPLOYEE_SALARY_COMPONENT_EMPLOYEE_ID ON HR_EMPLOYEE_SALARY_COMPONENT(EMPLOYEE_ID);
