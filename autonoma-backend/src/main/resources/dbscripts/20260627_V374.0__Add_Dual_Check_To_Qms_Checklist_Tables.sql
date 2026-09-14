-- Claimed Version: V374.0
-- Description: Add DUAL_CHECK columns to Checklist Assignment and Closed tables to propagate dual check flag

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[QMS_CHECKLIST_ASSIGNMENT]') 
      AND name = 'DUAL_CHECK'
)
BEGIN
    ALTER TABLE QMS_CHECKLIST_ASSIGNMENT ADD DUAL_CHECK VARCHAR(10) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[QMS_CHECKLIST_CLOSED]') 
      AND name = 'DUAL_CHECK'
)
BEGIN
    ALTER TABLE QMS_CHECKLIST_CLOSED ADD DUAL_CHECK VARCHAR(10) NULL;
END;
