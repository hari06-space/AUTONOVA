-- ============================================================
-- Migration V379.0 : Checklist Manual Trigger – Log Table & BOS Page Registration
-- Created: 2026-06-29
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Create QMS_CHECKLIST_MANUAL_TRIGGER_LOG table
-- ────────────────────────────────────────────────────────────
IF NOT EXISTS (
    SELECT 1 FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[QMS_CHECKLIST_MANUAL_TRIGGER_LOG]')
      AND type = 'U'
)
BEGIN
    CREATE TABLE [dbo].[QMS_CHECKLIST_MANUAL_TRIGGER_LOG] (
        [ID]               BIGINT         IDENTITY(1,1) NOT NULL,
        [TRIGGERED_BY]     NVARCHAR(100)  NOT NULL,
        [TRIGGER_DATE]     DATE           NOT NULL,
        [TRIGGER_TIME]     TIME           NOT NULL,
        [STATUS]           NVARCHAR(20)   NOT NULL,          -- SUCCESS | FAILED
        [CHECKLIST_COUNT]  INT            NOT NULL DEFAULT 0,
        [FAILURE_REASON]   NVARCHAR(MAX)  NULL,
        [CREATED_DATE]     DATETIME2      NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_QMS_CHECKLIST_MANUAL_TRIGGER_LOG] PRIMARY KEY ([ID])
    );

    -- Index to quickly fetch latest logs
    CREATE INDEX [IX_QMS_CHECKLIST_MANUAL_TRIGGER_LOG_TRIGGER_DATE]
        ON [dbo].[QMS_CHECKLIST_MANUAL_TRIGGER_LOG] ([TRIGGER_DATE] DESC);

    PRINT 'Created table QMS_CHECKLIST_MANUAL_TRIGGER_LOG';
END
ELSE
BEGIN
    PRINT 'Table QMS_CHECKLIST_MANUAL_TRIGGER_LOG already exists – skipped.';
END;

-- ────────────────────────────────────────────────────────────
-- 2. Register new BOS page: Admin → BOS → Process Automation → Trigger
--    mod_id=14 (Admin), sub_mod_id=142 (BOS(S) Admin), page_code=AD1290
-- ────────────────────────────────────────────────────────────
IF NOT EXISTS (
    SELECT 1 FROM bos_pages WHERE page_code = 'AD1290'
)
BEGIN
    INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon)
    VALUES (121, 14, 142, 'AD1290', 'Trigger', 1, '/admin/process-trigger', 'IconPlayerPlay');

    PRINT 'Registered BOS page AD1290 – Trigger';
END
ELSE
BEGIN
    PRINT 'BOS page AD1290 already registered – skipped.';
END;
