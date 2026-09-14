-- ==============================================================================
-- Migration Script: V375.0 Add Pending Activation Column to QMS_CHECKLIST_ASSIGNMENT
-- Description: Adds PENDING_ACTIVATION column to store activation queue state.
-- ==============================================================================

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('QMS_CHECKLIST_ASSIGNMENT') 
      AND name = 'PENDING_ACTIVATION'
)
BEGIN
    ALTER TABLE QMS_CHECKLIST_ASSIGNMENT ADD PENDING_ACTIVATION BIT NOT NULL DEFAULT 0;
END
GO
