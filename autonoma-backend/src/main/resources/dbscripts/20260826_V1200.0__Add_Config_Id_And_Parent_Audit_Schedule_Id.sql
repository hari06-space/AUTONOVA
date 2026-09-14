-- ===============================================================================
-- Migration Script: Add CONFIG_ID and PARENT_AUDIT_SCHEDULE_ID columns for Audit Scheduler
-- Date: 2026-08-26
-- ===============================================================================

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[QMS_AUDIT_SCHEDULER_CONFIG]') 
      AND name = N'PARENT_AUDIT_SCHEDULE_ID'
)
BEGIN
    ALTER TABLE QMS_AUDIT_SCHEDULER_CONFIG 
    ADD PARENT_AUDIT_SCHEDULE_ID BIGINT NULL;
END
GO

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[QMS_AUDIT_SCHEDULE]') 
      AND name = N'CONFIG_ID'
)
BEGIN
    ALTER TABLE QMS_AUDIT_SCHEDULE 
    ADD CONFIG_ID BIGINT NULL;
END
GO
