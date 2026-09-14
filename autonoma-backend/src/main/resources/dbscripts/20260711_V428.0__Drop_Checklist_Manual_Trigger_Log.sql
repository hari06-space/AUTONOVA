-- ============================================================
-- Migration V428.0 : Drop Redundant QMS_CHECKLIST_MANUAL_TRIGGER_LOG Table
-- Created: 2026-07-11
-- ============================================================

IF EXISTS (
    SELECT 1 FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[QMS_CHECKLIST_MANUAL_TRIGGER_LOG]')
      AND type = 'U'
)
BEGIN
    DROP TABLE [dbo].[QMS_CHECKLIST_MANUAL_TRIGGER_LOG];
    PRINT 'Dropped redundant table QMS_CHECKLIST_MANUAL_TRIGGER_LOG';
END
ELSE
BEGIN
    PRINT 'Table QMS_CHECKLIST_MANUAL_TRIGGER_LOG does not exist – skipped.';
END;
