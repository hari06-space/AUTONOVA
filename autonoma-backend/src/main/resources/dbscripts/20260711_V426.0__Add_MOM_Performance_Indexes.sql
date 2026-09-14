-- ============================================================
-- V426.0 -- Add indexes for QMS_MOM_MASTER performance
-- Date: 2026-07-11
-- ============================================================

-- Index for QMS_MOM_DETAILS parent-child lookup (most critical for JOIN performance)
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID('QMS_MOM_DETAILS') AND name = 'IX_QMS_MOM_DETAILS_MOM_ID'
)
BEGIN
    CREATE INDEX IX_QMS_MOM_DETAILS_MOM_ID ON QMS_MOM_DETAILS (MOM_ID);
END
GO

-- Index for QMS_MOM_DETAILS status filtering
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID('QMS_MOM_DETAILS') AND name = 'IX_QMS_MOM_DETAILS_STATUS'
)
BEGIN
    CREATE INDEX IX_QMS_MOM_DETAILS_STATUS ON QMS_MOM_DETAILS (STATUS);
END
GO

-- Index for QMS_MOM_DETAILS process type (for action item filtering)
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID('QMS_MOM_DETAILS') AND name = 'IX_QMS_MOM_DETAILS_PROCESS_TYPE'
)
BEGIN
    CREATE INDEX IX_QMS_MOM_DETAILS_PROCESS_TYPE ON QMS_MOM_DETAILS (PROCESS_TYPE_ID);
END
GO
