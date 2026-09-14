-- -----------------------------------------------------------------------------
-- Migration: V1087.0 - Remove CTC Structure and Clean Job Profile Dynamic Components
-- Created At: 2026-07-30
-- Developer: Antigravity
-- Description: Drop potential CTC columns from HR_EMPLOYEE_JOB_PROFILE if any exist,
--              and clean up DYNAMIC_COMPONENTS dynamic JSON storage.
-- -----------------------------------------------------------------------------

-- 1. Reset DYNAMIC_COMPONENTS to clear saved dynamic JSON values for CTC Structure
UPDATE HR_EMPLOYEE_JOB_PROFILE 
SET DYNAMIC_COMPONENTS = NULL;

-- 2. Drop any legacy/manual columns created for CTC details if they exist in HR_EMPLOYEE_JOB_PROFILE
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HR_EMPLOYEE_JOB_PROFILE') AND name = 'monthlyCtc')
    ALTER TABLE HR_EMPLOYEE_JOB_PROFILE DROP COLUMN monthlyCtc;

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HR_EMPLOYEE_JOB_PROFILE') AND name = 'basicSalaryCtc')
    ALTER TABLE HR_EMPLOYEE_JOB_PROFILE DROP COLUMN basicSalaryCtc;

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HR_EMPLOYEE_JOB_PROFILE') AND name = 'daCtc')
    ALTER TABLE HR_EMPLOYEE_JOB_PROFILE DROP COLUMN daCtc;

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HR_EMPLOYEE_JOB_PROFILE') AND name = 'specialAllowanceCtc')
    ALTER TABLE HR_EMPLOYEE_JOB_PROFILE DROP COLUMN specialAllowanceCtc;

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HR_EMPLOYEE_JOB_PROFILE') AND name = 'canteenAllowance')
    ALTER TABLE HR_EMPLOYEE_JOB_PROFILE DROP COLUMN canteenAllowance;

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HR_EMPLOYEE_JOB_PROFILE') AND name = 'performanceIncentiveCtc')
    ALTER TABLE HR_EMPLOYEE_JOB_PROFILE DROP COLUMN performanceIncentiveCtc;

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HR_EMPLOYEE_JOB_PROFILE') AND name = 'esiCtc')
    ALTER TABLE HR_EMPLOYEE_JOB_PROFILE DROP COLUMN esiCtc;

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HR_EMPLOYEE_JOB_PROFILE') AND name = 'pfCtc')
    ALTER TABLE HR_EMPLOYEE_JOB_PROFILE DROP COLUMN pfCtc;

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HR_EMPLOYEE_JOB_PROFILE') AND name = 'grossCtc')
    ALTER TABLE HR_EMPLOYEE_JOB_PROFILE DROP COLUMN grossCtc;

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HR_EMPLOYEE_JOB_PROFILE') AND name = 'employerPf')
    ALTER TABLE HR_EMPLOYEE_JOB_PROFILE DROP COLUMN employerPf;

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HR_EMPLOYEE_JOB_PROFILE') AND name = 'employerEsi')
    ALTER TABLE HR_EMPLOYEE_JOB_PROFILE DROP COLUMN employerEsi;

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HR_EMPLOYEE_JOB_PROFILE') AND name = 'uniformAllowance')
    ALTER TABLE HR_EMPLOYEE_JOB_PROFILE DROP COLUMN uniformAllowance;

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HR_EMPLOYEE_JOB_PROFILE') AND name = 'shoeAllowance')
    ALTER TABLE HR_EMPLOYEE_JOB_PROFILE DROP COLUMN shoeAllowance;

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HR_EMPLOYEE_JOB_PROFILE') AND name = 'mobileAllowanceCug')
    ALTER TABLE HR_EMPLOYEE_JOB_PROFILE DROP COLUMN mobileAllowanceCug;

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HR_EMPLOYEE_JOB_PROFILE') AND name = 'annualCtc')
    ALTER TABLE HR_EMPLOYEE_JOB_PROFILE DROP COLUMN annualCtc;

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HR_EMPLOYEE_JOB_PROFILE') AND name = 'salaryCtc')
    ALTER TABLE HR_EMPLOYEE_JOB_PROFILE DROP COLUMN salaryCtc;

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HR_EMPLOYEE_JOB_PROFILE') AND name = 'gratuity')
    ALTER TABLE HR_EMPLOYEE_JOB_PROFILE DROP COLUMN gratuity;

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HR_EMPLOYEE_JOB_PROFILE') AND name = 'pfEmpContribution')
    ALTER TABLE HR_EMPLOYEE_JOB_PROFILE DROP COLUMN pfEmpContribution;

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HR_EMPLOYEE_JOB_PROFILE') AND name = 'esiEmpContribution')
    ALTER TABLE HR_EMPLOYEE_JOB_PROFILE DROP COLUMN esiEmpContribution;

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HR_EMPLOYEE_JOB_PROFILE') AND name = 'pfEmployerContribution')
    ALTER TABLE HR_EMPLOYEE_JOB_PROFILE DROP COLUMN pfEmployerContribution;

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HR_EMPLOYEE_JOB_PROFILE') AND name = 'esiEmployerContribution')
    ALTER TABLE HR_EMPLOYEE_JOB_PROFILE DROP COLUMN esiEmployerContribution;

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HR_EMPLOYEE_JOB_PROFILE') AND name = 'bonus')
    ALTER TABLE HR_EMPLOYEE_JOB_PROFILE DROP COLUMN bonus;

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HR_EMPLOYEE_JOB_PROFILE') AND name = 'specialIncentive')
    ALTER TABLE HR_EMPLOYEE_JOB_PROFILE DROP COLUMN specialIncentive;

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HR_EMPLOYEE_JOB_PROFILE') AND name = 'performanceLinkedIncentive')
    ALTER TABLE HR_EMPLOYEE_JOB_PROFILE DROP COLUMN performanceLinkedIncentive;

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HR_EMPLOYEE_JOB_PROFILE') AND name = 'healthInsurance')
    ALTER TABLE HR_EMPLOYEE_JOB_PROFILE DROP COLUMN healthInsurance;

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HR_EMPLOYEE_JOB_PROFILE') AND name = 'uniformAnnual')
    ALTER TABLE HR_EMPLOYEE_JOB_PROFILE DROP COLUMN uniformAnnual;

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HR_EMPLOYEE_JOB_PROFILE') AND name = 'shoeAnnual')
    ALTER TABLE HR_EMPLOYEE_JOB_PROFILE DROP COLUMN shoeAnnual;

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HR_EMPLOYEE_JOB_PROFILE') AND name = 'mobileCugAnnual')
    ALTER TABLE HR_EMPLOYEE_JOB_PROFILE DROP COLUMN mobileCugAnnual;
