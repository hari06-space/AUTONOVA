-- Alter table QMS_AUDIT_SCHEDULE to add PARENT_ID for recurring templates
-- Created: 2026-07-11

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[QMS_AUDIT_SCHEDULE]') AND name = 'PARENT_ID')
BEGIN
    ALTER TABLE [dbo].[QMS_AUDIT_SCHEDULE] ADD [PARENT_ID] BIGINT NULL;
END
GO
