-- Migration Script: Set Default Constraint and Default Values for SELF_ASSESSMENT_STATUS in HR_EMPLOYEE_SELF_ASSESSMENT
-- Rule: Idempotent DDL/DML script with guards for production deployment.

DECLARE @DraftStatusId BIGINT;
SELECT TOP 1 @DraftStatusId = [ID] FROM [dbo].[AD_STATUS_MASTER] WHERE UPPER(TRIM([NAME])) = 'DRAFT';

IF @DraftStatusId IS NULL
BEGIN
    SELECT TOP 1 @DraftStatusId = [ID] FROM [dbo].[AD_STATUS_MASTER] WHERE UPPER(TRIM([NAME])) = 'ACTIVE';
END

IF @DraftStatusId IS NULL SET @DraftStatusId = 34;

-- 1. Update any existing NULL values in HR_EMPLOYEE_SELF_ASSESSMENT
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[HR_EMPLOYEE_SELF_ASSESSMENT]') AND name = 'SELF_ASSESSMENT_STATUS')
BEGIN
    DECLARE @UpdateSql NVARCHAR(MAX) = 'UPDATE [dbo].[HR_EMPLOYEE_SELF_ASSESSMENT] SET [SELF_ASSESSMENT_STATUS] = ' + CAST(@DraftStatusId AS NVARCHAR(20)) + ' WHERE [SELF_ASSESSMENT_STATUS] IS NULL;';
    EXEC sp_executesql @UpdateSql;
END

-- 2. Add Default Constraint for SELF_ASSESSMENT_STATUS column if not exists
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[HR_EMPLOYEE_SELF_ASSESSMENT]') AND name = 'SELF_ASSESSMENT_STATUS')
   AND NOT EXISTS (
       SELECT 1 FROM sys.default_constraints dc
       JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
       WHERE dc.parent_object_id = OBJECT_ID('[dbo].[HR_EMPLOYEE_SELF_ASSESSMENT]') AND c.name = 'SELF_ASSESSMENT_STATUS'
   )
BEGIN
    DECLARE @ConstraintSql NVARCHAR(MAX) = 'ALTER TABLE [dbo].[HR_EMPLOYEE_SELF_ASSESSMENT] ADD CONSTRAINT [DF_HR_EMPLOYEE_SELF_ASSESSMENT_STATUS] DEFAULT (' + CAST(@DraftStatusId AS NVARCHAR(20)) + ') FOR [SELF_ASSESSMENT_STATUS];';
    EXEC sp_executesql @ConstraintSql;
END
