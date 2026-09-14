-- Idempotent script to add CATEGORY_ID to HR_DEPARTMENT and seed existing records

-- Step 1: Add CATEGORY_ID column as NULLable first if it does not exist
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('HR_DEPARTMENT') AND name = 'CATEGORY_ID')
BEGIN
    ALTER TABLE [dbo].[HR_DEPARTMENT] ADD [CATEGORY_ID] INT NULL;
END
GO

-- Step 2: Populate CATEGORY_ID dynamically based on department name
-- Category 1 = QMS, 2 = Human Resource, 3 = Management
UPDATE [dbo].[HR_DEPARTMENT]
SET [CATEGORY_ID] = CASE 
    WHEN UPPER(TRIM(DEPARTMENT_NAME)) IN ('QUALITY', 'QMS', 'QUALITY ASSURANCE') THEN 1
    WHEN UPPER(TRIM(DEPARTMENT_NAME)) IN ('HRA', 'HUMAN RESOURCES') THEN 2
    ELSE 3
END
WHERE [CATEGORY_ID] IS NULL;
GO

-- Step 3: Set column to NOT NULL if it is still NULLable
IF EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('HR_DEPARTMENT') 
      AND name = 'CATEGORY_ID' 
      AND is_nullable = 1
)
BEGIN
    ALTER TABLE [dbo].[HR_DEPARTMENT] ALTER COLUMN [CATEGORY_ID] INT NOT NULL;
END
GO
