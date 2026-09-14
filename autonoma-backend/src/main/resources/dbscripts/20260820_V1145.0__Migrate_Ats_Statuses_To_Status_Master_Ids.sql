-- 1. Dynamically find and drop any check constraints on SELF_ASSESSMENT_STATUS in HR_EMPLOYEE_SELF_ASSESSMENT
DECLARE @ConstraintName NVARCHAR(MAX);
SELECT @ConstraintName = name 
FROM sys.check_constraints 
WHERE parent_object_id = OBJECT_ID('[dbo].[HR_EMPLOYEE_SELF_ASSESSMENT]') 
  AND parent_column_id = COLUMNPROPERTY(parent_object_id, 'SELF_ASSESSMENT_STATUS', 'ColumnId');

IF @ConstraintName IS NOT NULL
BEGIN
    EXEC('ALTER TABLE [dbo].[HR_EMPLOYEE_SELF_ASSESSMENT] DROP CONSTRAINT [' + @ConstraintName + ']');
END
GO

-- 2. Dynamically find and drop any check constraints on ACTIVE_STATUS in HR_ATS_REJECTED_DOCUMENT
DECLARE @ConstraintName2 NVARCHAR(MAX);
SELECT @ConstraintName2 = name 
FROM sys.check_constraints 
WHERE parent_object_id = OBJECT_ID('[dbo].[HR_ATS_REJECTED_DOCUMENT]') 
  AND parent_column_id = COLUMNPROPERTY(parent_object_id, 'ACTIVE_STATUS', 'ColumnId');

IF @ConstraintName2 IS NOT NULL
BEGIN
    EXEC('ALTER TABLE [dbo].[HR_ATS_REJECTED_DOCUMENT] DROP CONSTRAINT [' + @ConstraintName2 + ']');
END
GO

-- 3. Create EXPIRED status if it doesn't exist (case-sensitive check)
DECLARE @ExpiredId BIGINT;

IF NOT EXISTS (SELECT 1 FROM [dbo].[AD_STATUS_MASTER] WHERE [NAME] COLLATE SQL_Latin1_General_CP1_CS_AS = 'EXPIRED')
BEGIN
    INSERT INTO [dbo].[AD_STATUS_MASTER] ([NAME]) VALUES ('EXPIRED');
END

SELECT @ExpiredId = [ID] FROM [dbo].[AD_STATUS_MASTER] WHERE [NAME] COLLATE SQL_Latin1_General_CP1_CS_AS = 'EXPIRED';

-- 4. Safely add new columns to avoid data loss
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[HR_EMPLOYEE_SELF_ASSESSMENT]') AND name = 'SELF_ASSESSMENT_STATUS_ID')
BEGIN
    ALTER TABLE [dbo].[HR_EMPLOYEE_SELF_ASSESSMENT] ADD [SELF_ASSESSMENT_STATUS_ID] BIGINT NULL;
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[HR_ATS_REJECTED_DOCUMENT]') AND name = 'ACTIVE_STATUS_ID')
BEGIN
    ALTER TABLE [dbo].[HR_ATS_REJECTED_DOCUMENT] ADD [ACTIVE_STATUS_ID] BIGINT NULL;
END
GO

-- Declare variables in a new batch to avoid scope issues across GO boundary
DECLARE @ExpiredId BIGINT;
SELECT @ExpiredId = [ID] FROM [dbo].[AD_STATUS_MASTER] WHERE [NAME] COLLATE SQL_Latin1_General_CP1_CS_AS = 'EXPIRED';

-- 5. Migrate existing values to the matching IDs (idempotently and safely)
-- Note: Check if the source column exists and is a character type before trying to migrate from it
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[HR_EMPLOYEE_SELF_ASSESSMENT]') AND name = 'SELF_ASSESSMENT_STATUS' AND system_type_id IN (167, 231, 175, 239)) -- varchar, nvarchar, char, nchar
BEGIN
    EXEC('
        UPDATE [dbo].[HR_EMPLOYEE_SELF_ASSESSMENT]
        SET [SELF_ASSESSMENT_STATUS_ID] = CASE 
            WHEN [SELF_ASSESSMENT_STATUS] = ''DRAFT'' THEN 34
            WHEN [SELF_ASSESSMENT_STATUS] = ''IN_PROGRESS'' THEN 59
            WHEN [SELF_ASSESSMENT_STATUS] = ''SUBMITTED'' THEN 55
            WHEN [SELF_ASSESSMENT_STATUS] = ''CANCELLED'' THEN 5
            WHEN [SELF_ASSESSMENT_STATUS] = ''REJECTED'' THEN 9
            WHEN [SELF_ASSESSMENT_STATUS] = ''EXPIRED'' THEN ' + @ExpiredId + '
        END
        WHERE [SELF_ASSESSMENT_STATUS_ID] IS NULL;
    ');
END

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[HR_ATS_REJECTED_DOCUMENT]') AND name = 'ACTIVE_STATUS' AND system_type_id IN (167, 231, 175, 239)) -- varchar, nvarchar, char, nchar
BEGIN
    EXEC('
        UPDATE [dbo].[HR_ATS_REJECTED_DOCUMENT]
        SET [ACTIVE_STATUS_ID] = CASE 
            WHEN [ACTIVE_STATUS] = ''ACTIVE'' THEN 12
            WHEN [ACTIVE_STATUS] = ''SUBMITTED'' THEN 55
            WHEN [ACTIVE_STATUS] = ''RESOLVED'' THEN 3
        END
        WHERE [ACTIVE_STATUS_ID] IS NULL;
    ');
END
GO

-- 6. Drop old columns only if the new columns exist and the old columns are still character columns
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[HR_EMPLOYEE_SELF_ASSESSMENT]') AND name = 'SELF_ASSESSMENT_STATUS_ID')
   AND EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[HR_EMPLOYEE_SELF_ASSESSMENT]') AND name = 'SELF_ASSESSMENT_STATUS' AND system_type_id IN (167, 231, 175, 239))
BEGIN
    ALTER TABLE [dbo].[HR_EMPLOYEE_SELF_ASSESSMENT] DROP COLUMN [SELF_ASSESSMENT_STATUS];
END

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[HR_ATS_REJECTED_DOCUMENT]') AND name = 'ACTIVE_STATUS_ID')
   AND EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[HR_ATS_REJECTED_DOCUMENT]') AND name = 'ACTIVE_STATUS' AND system_type_id IN (167, 231, 175, 239))
BEGIN
    ALTER TABLE [dbo].[HR_ATS_REJECTED_DOCUMENT] DROP COLUMN [ACTIVE_STATUS];
END
GO

-- 7. Rename the ID columns to their original names
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[HR_EMPLOYEE_SELF_ASSESSMENT]') AND name = 'SELF_ASSESSMENT_STATUS_ID')
   AND NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[HR_EMPLOYEE_SELF_ASSESSMENT]') AND name = 'SELF_ASSESSMENT_STATUS')
BEGIN
    EXEC sp_rename 'dbo.HR_EMPLOYEE_SELF_ASSESSMENT.SELF_ASSESSMENT_STATUS_ID', 'SELF_ASSESSMENT_STATUS', 'COLUMN';
END

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[HR_ATS_REJECTED_DOCUMENT]') AND name = 'ACTIVE_STATUS_ID')
   AND NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[HR_ATS_REJECTED_DOCUMENT]') AND name = 'ACTIVE_STATUS')
BEGIN
    EXEC sp_rename 'dbo.HR_ATS_REJECTED_DOCUMENT.ACTIVE_STATUS_ID', 'ACTIVE_STATUS', 'COLUMN';
END
GO

-- 8. Apply the foreign key constraints to AD_STATUS_MASTER(ID)
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_HR_EMPLOYEE_SELF_ASSESSMENT_STATUS')
   AND EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[HR_EMPLOYEE_SELF_ASSESSMENT]') AND name = 'SELF_ASSESSMENT_STATUS' AND system_type_id = 127) -- bigint
BEGIN
    ALTER TABLE [dbo].[HR_EMPLOYEE_SELF_ASSESSMENT] ADD CONSTRAINT [FK_HR_EMPLOYEE_SELF_ASSESSMENT_STATUS] 
    FOREIGN KEY ([SELF_ASSESSMENT_STATUS]) REFERENCES [dbo].[AD_STATUS_MASTER] ([ID]);
END

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_HR_ATS_REJECTED_DOCUMENT_STATUS')
   AND EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[HR_ATS_REJECTED_DOCUMENT]') AND name = 'ACTIVE_STATUS' AND system_type_id = 127) -- bigint
BEGIN
    ALTER TABLE [dbo].[HR_ATS_REJECTED_DOCUMENT] ADD CONSTRAINT [FK_HR_ATS_REJECTED_DOCUMENT_STATUS] 
    FOREIGN KEY ([ACTIVE_STATUS]) REFERENCES [dbo].[AD_STATUS_MASTER] ([ID]);
END
GO
