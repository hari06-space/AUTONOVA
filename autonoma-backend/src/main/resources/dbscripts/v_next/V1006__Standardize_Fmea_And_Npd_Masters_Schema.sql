-- ============================================================================
-- V1006 Standardize FMEA and NPD Masters Schema
-- Renames audit columns to UPPERCASE and corrects probability_of_failure typo
-- ============================================================================

-- 1. SEVERITY_FMEA
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SEVERITY_FMEA') AND name COLLATE Latin1_General_BIN = 'created_by')
    EXEC sp_rename 'SEVERITY_FMEA.created_by', 'CREATED_BY', 'COLUMN';
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SEVERITY_FMEA') AND name COLLATE Latin1_General_BIN = 'created_date')
    EXEC sp_rename 'SEVERITY_FMEA.created_date', 'CREATED_DATE', 'COLUMN';
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SEVERITY_FMEA') AND name COLLATE Latin1_General_BIN = 'updated_by')
    EXEC sp_rename 'SEVERITY_FMEA.updated_by', 'UPDATED_BY', 'COLUMN';
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SEVERITY_FMEA') AND name COLLATE Latin1_General_BIN = 'updated_date')
    EXEC sp_rename 'SEVERITY_FMEA.updated_date', 'UPDATED_DATE', 'COLUMN';
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SEVERITY_FMEA') AND name COLLATE Latin1_General_BIN = 'status')
    EXEC sp_rename 'SEVERITY_FMEA.status', 'STATUS', 'COLUMN';
GO

-- 2. DETECTION_FMEA
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('DETECTION_FMEA') AND name COLLATE Latin1_General_BIN = 'created_by')
    EXEC sp_rename 'DETECTION_FMEA.created_by', 'CREATED_BY', 'COLUMN';
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('DETECTION_FMEA') AND name COLLATE Latin1_General_BIN = 'created_date')
    EXEC sp_rename 'DETECTION_FMEA.created_date', 'CREATED_DATE', 'COLUMN';
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('DETECTION_FMEA') AND name COLLATE Latin1_General_BIN = 'updated_by')
    EXEC sp_rename 'DETECTION_FMEA.updated_by', 'UPDATED_BY', 'COLUMN';
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('DETECTION_FMEA') AND name COLLATE Latin1_General_BIN = 'updated_date')
    EXEC sp_rename 'DETECTION_FMEA.updated_date', 'UPDATED_DATE', 'COLUMN';
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('DETECTION_FMEA') AND name COLLATE Latin1_General_BIN = 'status')
    EXEC sp_rename 'DETECTION_FMEA.status', 'STATUS', 'COLUMN';
GO

-- 3. OCCURANCE_FMEA
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('OCCURANCE_FMEA') AND name COLLATE Latin1_General_BIN = 'probablity_of_failure')
    EXEC sp_rename 'OCCURANCE_FMEA.probablity_of_failure', 'PROBABILITY_OF_FAILURE', 'COLUMN';
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('OCCURANCE_FMEA') AND name COLLATE Latin1_General_BIN = 'probability_of_failure')
    EXEC sp_rename 'OCCURANCE_FMEA.probability_of_failure', 'PROBABILITY_OF_FAILURE', 'COLUMN';

IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('OCCURANCE_FMEA') AND name COLLATE Latin1_General_BIN = 'created_by')
    EXEC sp_rename 'OCCURANCE_FMEA.created_by', 'CREATED_BY', 'COLUMN';
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('OCCURANCE_FMEA') AND name COLLATE Latin1_General_BIN = 'created_date')
    EXEC sp_rename 'OCCURANCE_FMEA.created_date', 'CREATED_DATE', 'COLUMN';
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('OCCURANCE_FMEA') AND name COLLATE Latin1_General_BIN = 'updated_by')
    EXEC sp_rename 'OCCURANCE_FMEA.updated_by', 'UPDATED_BY', 'COLUMN';
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('OCCURANCE_FMEA') AND name COLLATE Latin1_General_BIN = 'updated_date')
    EXEC sp_rename 'OCCURANCE_FMEA.updated_date', 'UPDATED_DATE', 'COLUMN';
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('OCCURANCE_FMEA') AND name COLLATE Latin1_General_BIN = 'status')
    EXEC sp_rename 'OCCURANCE_FMEA.status', 'STATUS', 'COLUMN';
GO

-- 4. NPD_CHARACTER_SPECIFICATION
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('NPD_CHARACTER_SPECIFICATION') AND name COLLATE Latin1_General_BIN = 'created_by')
    EXEC sp_rename 'NPD_CHARACTER_SPECIFICATION.created_by', 'CREATED_BY', 'COLUMN';
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('NPD_CHARACTER_SPECIFICATION') AND name COLLATE Latin1_General_BIN = 'created_date')
    EXEC sp_rename 'NPD_CHARACTER_SPECIFICATION.created_date', 'CREATED_DATE', 'COLUMN';
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('NPD_CHARACTER_SPECIFICATION') AND name COLLATE Latin1_General_BIN = 'updated_by')
    EXEC sp_rename 'NPD_CHARACTER_SPECIFICATION.updated_by', 'UPDATED_BY', 'COLUMN';
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('NPD_CHARACTER_SPECIFICATION') AND name COLLATE Latin1_General_BIN = 'updated_date')
    EXEC sp_rename 'NPD_CHARACTER_SPECIFICATION.updated_date', 'UPDATED_DATE', 'COLUMN';
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('NPD_CHARACTER_SPECIFICATION') AND name COLLATE Latin1_General_BIN = 'status')
    EXEC sp_rename 'NPD_CHARACTER_SPECIFICATION.status', 'STATUS', 'COLUMN';
GO

-- 5. NPD_SAMPLE_SIZE
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('NPD_SAMPLE_SIZE') AND name COLLATE Latin1_General_BIN = 'created_by')
    EXEC sp_rename 'NPD_SAMPLE_SIZE.created_by', 'CREATED_BY', 'COLUMN';
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('NPD_SAMPLE_SIZE') AND name COLLATE Latin1_General_BIN = 'created_date')
    EXEC sp_rename 'NPD_SAMPLE_SIZE.created_date', 'CREATED_DATE', 'COLUMN';
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('NPD_SAMPLE_SIZE') AND name COLLATE Latin1_General_BIN = 'updated_by')
    EXEC sp_rename 'NPD_SAMPLE_SIZE.updated_by', 'UPDATED_BY', 'COLUMN';
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('NPD_SAMPLE_SIZE') AND name COLLATE Latin1_General_BIN = 'updated_date')
    EXEC sp_rename 'NPD_SAMPLE_SIZE.updated_date', 'UPDATED_DATE', 'COLUMN';
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('NPD_SAMPLE_SIZE') AND name COLLATE Latin1_General_BIN = 'status')
    EXEC sp_rename 'NPD_SAMPLE_SIZE.status', 'STATUS', 'COLUMN';
GO

-- 6. NPD_SAMPLE_FREQUENCY
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('NPD_SAMPLE_FREQUENCY') AND name COLLATE Latin1_General_BIN = 'created_by')
    EXEC sp_rename 'NPD_SAMPLE_FREQUENCY.created_by', 'CREATED_BY', 'COLUMN';
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('NPD_SAMPLE_FREQUENCY') AND name COLLATE Latin1_General_BIN = 'created_date')
    EXEC sp_rename 'NPD_SAMPLE_FREQUENCY.created_date', 'CREATED_DATE', 'COLUMN';
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('NPD_SAMPLE_FREQUENCY') AND name COLLATE Latin1_General_BIN = 'updated_by')
    EXEC sp_rename 'NPD_SAMPLE_FREQUENCY.updated_by', 'UPDATED_BY', 'COLUMN';
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('NPD_SAMPLE_FREQUENCY') AND name COLLATE Latin1_General_BIN = 'updated_date')
    EXEC sp_rename 'NPD_SAMPLE_FREQUENCY.updated_date', 'UPDATED_DATE', 'COLUMN';
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('NPD_SAMPLE_FREQUENCY') AND name COLLATE Latin1_General_BIN = 'status')
    EXEC sp_rename 'NPD_SAMPLE_FREQUENCY.status', 'STATUS', 'COLUMN';
GO

-- 7. NPD_CONTROL_METHOD
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('NPD_CONTROL_METHOD') AND name COLLATE Latin1_General_BIN = 'created_by')
    EXEC sp_rename 'NPD_CONTROL_METHOD.created_by', 'CREATED_BY', 'COLUMN';
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('NPD_CONTROL_METHOD') AND name COLLATE Latin1_General_BIN = 'created_date')
    EXEC sp_rename 'NPD_CONTROL_METHOD.created_date', 'CREATED_DATE', 'COLUMN';
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('NPD_CONTROL_METHOD') AND name COLLATE Latin1_General_BIN = 'updated_by')
    EXEC sp_rename 'NPD_CONTROL_METHOD.updated_by', 'UPDATED_BY', 'COLUMN';
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('NPD_CONTROL_METHOD') AND name COLLATE Latin1_General_BIN = 'updated_date')
    EXEC sp_rename 'NPD_CONTROL_METHOD.updated_date', 'UPDATED_DATE', 'COLUMN';
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('NPD_CONTROL_METHOD') AND name COLLATE Latin1_General_BIN = 'status')
    EXEC sp_rename 'NPD_CONTROL_METHOD.status', 'STATUS', 'COLUMN';
GO

-- 8. NPD_FEASIBILITY_CATEGORY
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('NPD_FEASIBILITY_CATEGORY') AND name COLLATE Latin1_General_BIN = 'created_by')
    EXEC sp_rename 'NPD_FEASIBILITY_CATEGORY.created_by', 'CREATED_BY', 'COLUMN';
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('NPD_FEASIBILITY_CATEGORY') AND name COLLATE Latin1_General_BIN = 'created_date')
    EXEC sp_rename 'NPD_FEASIBILITY_CATEGORY.created_date', 'CREATED_DATE', 'COLUMN';
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('NPD_FEASIBILITY_CATEGORY') AND name COLLATE Latin1_General_BIN = 'updated_by')
    EXEC sp_rename 'NPD_FEASIBILITY_CATEGORY.updated_by', 'UPDATED_BY', 'COLUMN';
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('NPD_FEASIBILITY_CATEGORY') AND name COLLATE Latin1_General_BIN = 'updated_date')
    EXEC sp_rename 'NPD_FEASIBILITY_CATEGORY.updated_date', 'UPDATED_DATE', 'COLUMN';
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('NPD_FEASIBILITY_CATEGORY') AND name COLLATE Latin1_General_BIN = 'status')
    EXEC sp_rename 'NPD_FEASIBILITY_CATEGORY.status', 'STATUS', 'COLUMN';
GO

-- 9. NPD_CORRECTIVE_ACTION
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('NPD_CORRECTIVE_ACTION') AND name COLLATE Latin1_General_BIN = 'created_by')
    EXEC sp_rename 'NPD_CORRECTIVE_ACTION.created_by', 'CREATED_BY', 'COLUMN';
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('NPD_CORRECTIVE_ACTION') AND name COLLATE Latin1_General_BIN = 'created_date')
    EXEC sp_rename 'NPD_CORRECTIVE_ACTION.created_date', 'CREATED_DATE', 'COLUMN';
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('NPD_CORRECTIVE_ACTION') AND name COLLATE Latin1_General_BIN = 'updated_by')
    EXEC sp_rename 'NPD_CORRECTIVE_ACTION.updated_by', 'UPDATED_BY', 'COLUMN';
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('NPD_CORRECTIVE_ACTION') AND name COLLATE Latin1_General_BIN = 'updated_date')
    EXEC sp_rename 'NPD_CORRECTIVE_ACTION.updated_date', 'UPDATED_DATE', 'COLUMN';
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('NPD_CORRECTIVE_ACTION') AND name COLLATE Latin1_General_BIN = 'status')
    EXEC sp_rename 'NPD_CORRECTIVE_ACTION.status', 'STATUS', 'COLUMN';
GO

-- 10. NPD_REACTION_PLAN
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('NPD_REACTION_PLAN') AND name COLLATE Latin1_General_BIN = 'created_by')
    EXEC sp_rename 'NPD_REACTION_PLAN.created_by', 'CREATED_BY', 'COLUMN';
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('NPD_REACTION_PLAN') AND name COLLATE Latin1_General_BIN = 'created_date')
    EXEC sp_rename 'NPD_REACTION_PLAN.created_date', 'CREATED_DATE', 'COLUMN';
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('NPD_REACTION_PLAN') AND name COLLATE Latin1_General_BIN = 'updated_by')
    EXEC sp_rename 'NPD_REACTION_PLAN.updated_by', 'UPDATED_BY', 'COLUMN';
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('NPD_REACTION_PLAN') AND name COLLATE Latin1_General_BIN = 'updated_date')
    EXEC sp_rename 'NPD_REACTION_PLAN.updated_date', 'UPDATED_DATE', 'COLUMN';
IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('NPD_REACTION_PLAN') AND name COLLATE Latin1_General_BIN = 'status')
    EXEC sp_rename 'NPD_REACTION_PLAN.status', 'STATUS', 'COLUMN';
GO
