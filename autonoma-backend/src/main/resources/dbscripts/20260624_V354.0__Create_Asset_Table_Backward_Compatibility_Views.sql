-- ==============================================================================
-- Migration Script: V354.0 Create Asset Table Backward Compatibility Views
-- Description: Creates HR_ASSET_GROUP, HR_ASSET_TYPE, and HR_ASSET_SUB_TYPE views
--              pointing to the restructured ASSET_GROUP, ASSET_TYPE, and ASSET_SUB_TYPE tables.
-- ==============================================================================

-- 1. Create HR_ASSET_GROUP view
IF OBJECT_ID('dbo.HR_ASSET_GROUP', 'V') IS NULL
BEGIN
    EXEC('
    CREATE VIEW dbo.HR_ASSET_GROUP AS 
    SELECT 
        ID, 
        GROUP_NAME, 
        STATUS, 
        CREATED_BY, 
        CREATED_DATE, 
        UPDATED_BY, 
        UPDATED_DATE
    FROM dbo.ASSET_GROUP;
    ');
END
GO

-- 2. Create HR_ASSET_TYPE view
IF OBJECT_ID('dbo.HR_ASSET_TYPE', 'V') IS NULL
BEGIN
    EXEC('
    CREATE VIEW dbo.HR_ASSET_TYPE AS
    SELECT 
        ID,
        GROUP_ID,
        TYPE,
        IS_AUTO_GENERATED_CODE,
        TYPE_PREFIX,
        STATUS,
        CREATED_BY,
        CREATED_DATE,
        UPDATED_BY,
        UPDATED_DATE
    FROM dbo.ASSET_TYPE;
    ');
END
GO

-- 3. Create HR_ASSET_SUB_TYPE view
IF OBJECT_ID('dbo.HR_ASSET_SUB_TYPE', 'V') IS NULL
BEGIN
    EXEC('
    CREATE VIEW dbo.HR_ASSET_SUB_TYPE AS
    SELECT 
        ID,
        GROUP_ID,
        TYPE_ID,
        SUB_TYPE_NAME,
        STATUS,
        CREATED_BY,
        CREATED_DATE,
        UPDATED_BY,
        UPDATED_DATE
    FROM dbo.ASSET_SUB_TYPE;
    ');
END
GO
