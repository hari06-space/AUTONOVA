-- Alter table QMS_AUDIT_SCHEDULE to drop constraint and column IS_DELETED
-- Created: 2026-08-13

DECLARE @ConstraintName NVARCHAR(256)
SELECT @ConstraintName = name
FROM sys.default_constraints
WHERE parent_object_id = OBJECT_ID('[dbo].[QMS_AUDIT_SCHEDULE]')
  AND parent_column_id = COLUMNPROPERTY(OBJECT_ID('[dbo].[QMS_AUDIT_SCHEDULE]'), 'IS_DELETED', 'ColumnId')

IF @ConstraintName IS NOT NULL
BEGIN
    EXEC('ALTER TABLE [dbo].[QMS_AUDIT_SCHEDULE] DROP CONSTRAINT ' + @ConstraintName)
END
GO

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[QMS_AUDIT_SCHEDULE]') AND name = 'IS_DELETED')
BEGIN
    ALTER TABLE [dbo].[QMS_AUDIT_SCHEDULE] DROP COLUMN [IS_DELETED];
END
GO
