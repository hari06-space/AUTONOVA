DECLARE @ActiveStatusId BIGINT;
SELECT @ActiveStatusId = ID FROM AD_STATUS_MASTER WHERE UPPER(TRIM(NAME)) = 'ACTIVE';

-- Master 1: Normal Inspection, Level II, AQL 2.5
IF NOT EXISTS (SELECT 1 FROM QMC_AQL_MASTER WHERE AQL_CODE = 'AQL-0001')
BEGIN
    INSERT INTO QMC_AQL_MASTER (AQL_CODE, AQL_NAME, INSPECTION_LEVEL, INSPECTION_TYPE, AQL_VALUE, REMARKS, STATUS, CREATED_BY, CREATED_DATE)
    VALUES ('AQL-0001', 'Normal Inspection, Level II, AQL 2.5', 'Level II', 'Normal', 2.500, 'Standard ANSI/ASQ Z1.4 sampling plan for general inspection.', @ActiveStatusId, 'SYSTEM', GETDATE());
    
    DECLARE @AqlMasterId1 BIGINT = SCOPE_IDENTITY();
    
    INSERT INTO QMC_AQL_SAMPLING_RULES (AQL_MASTER_ID, LOT_SIZE_FROM, LOT_SIZE_TO, SAMPLE_SIZE, ACCEPTANCE_QTY, REJECTION_QTY, CREATED_BY, CREATED_DATE)
    VALUES 
    (@AqlMasterId1, 2, 8, 2, 0, 1, 'SYSTEM', GETDATE()),
    (@AqlMasterId1, 9, 15, 3, 0, 1, 'SYSTEM', GETDATE()),
    (@AqlMasterId1, 16, 25, 5, 0, 1, 'SYSTEM', GETDATE()),
    (@AqlMasterId1, 26, 50, 8, 0, 1, 'SYSTEM', GETDATE()),
    (@AqlMasterId1, 51, 90, 13, 1, 2, 'SYSTEM', GETDATE()),
    (@AqlMasterId1, 91, 150, 20, 1, 2, 'SYSTEM', GETDATE()),
    (@AqlMasterId1, 151, 280, 32, 2, 3, 'SYSTEM', GETDATE()),
    (@AqlMasterId1, 281, 500, 50, 3, 4, 'SYSTEM', GETDATE()),
    (@AqlMasterId1, 501, 1200, 80, 5, 6, 'SYSTEM', GETDATE()),
    (@AqlMasterId1, 1201, 3200, 125, 7, 8, 'SYSTEM', GETDATE()),
    (@AqlMasterId1, 3201, 10000, 200, 10, 11, 'SYSTEM', GETDATE()),
    (@AqlMasterId1, 10001, 35000, 315, 14, 15, 'SYSTEM', GETDATE());
END
GO

-- Master 2: Tightened Inspection, Level III, AQL 1.0
DECLARE @ActiveStatusId BIGINT;
SELECT @ActiveStatusId = ID FROM AD_STATUS_MASTER WHERE UPPER(TRIM(NAME)) = 'ACTIVE';

IF NOT EXISTS (SELECT 1 FROM QMC_AQL_MASTER WHERE AQL_CODE = 'AQL-0002')
BEGIN
    INSERT INTO QMC_AQL_MASTER (AQL_CODE, AQL_NAME, INSPECTION_LEVEL, INSPECTION_TYPE, AQL_VALUE, REMARKS, STATUS, CREATED_BY, CREATED_DATE)
    VALUES ('AQL-0002', 'Tightened Inspection, Level III, AQL 1.0', 'Level III', 'Tightened', 1.000, 'Strict sampling plan for high reliability components.', @ActiveStatusId, 'SYSTEM', GETDATE());
    
    DECLARE @AqlMasterId2 BIGINT = SCOPE_IDENTITY();
    
    INSERT INTO QMC_AQL_SAMPLING_RULES (AQL_MASTER_ID, LOT_SIZE_FROM, LOT_SIZE_TO, SAMPLE_SIZE, ACCEPTANCE_QTY, REJECTION_QTY, CREATED_BY, CREATED_DATE)
    VALUES 
    (@AqlMasterId2, 2, 8, 3, 0, 1, 'SYSTEM', GETDATE()),
    (@AqlMasterId2, 9, 15, 5, 0, 1, 'SYSTEM', GETDATE()),
    (@AqlMasterId2, 16, 25, 8, 0, 1, 'SYSTEM', GETDATE()),
    (@AqlMasterId2, 26, 50, 13, 0, 1, 'SYSTEM', GETDATE()),
    (@AqlMasterId2, 51, 90, 20, 0, 1, 'SYSTEM', GETDATE()),
    (@AqlMasterId2, 91, 150, 32, 0, 1, 'SYSTEM', GETDATE()),
    (@AqlMasterId2, 151, 280, 50, 1, 2, 'SYSTEM', GETDATE()),
    (@AqlMasterId2, 281, 500, 80, 1, 2, 'SYSTEM', GETDATE()),
    (@AqlMasterId2, 501, 1200, 125, 2, 3, 'SYSTEM', GETDATE()),
    (@AqlMasterId2, 1201, 3200, 200, 3, 4, 'SYSTEM', GETDATE()),
    (@AqlMasterId2, 3201, 10000, 315, 5, 6, 'SYSTEM', GETDATE());
END
GO
