-- ============================================================
-- Migration V1021.0 : Create QMS_CHECKLIST_RENEWAL_AUDIT_LOG Table
-- Created: 2026-07-18
-- ============================================================

IF NOT EXISTS (
    SELECT 1 FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[QMS_CHECKLIST_RENEWAL_AUDIT_LOG]')
      AND type = 'U'
)
BEGIN
    CREATE TABLE [dbo].[QMS_CHECKLIST_RENEWAL_AUDIT_LOG] (
        [ID]                      BIGINT         IDENTITY(1,1) NOT NULL,
        [MASTER_CHECKLIST_ID]     BIGINT         NOT NULL,
        [RENEWAL_CHECKLIST_ID]    BIGINT         NULL,
        [REMINDER_DATE]           DATE           NULL,
        [PREV_REMINDER_DATE]      DATE           NULL,
        [UPDATED_REMINDER_DATE]   DATE           NULL,
        [FREQUENCY]               NVARCHAR(50)   NULL,
        [TRIGGER_TIME]            DATETIME       NULL,
        [STATUS]                  NVARCHAR(20)   NULL,
        [ERROR_MESSAGE]           NVARCHAR(MAX)  NULL,
        CONSTRAINT [PK_QMS_CHECKLIST_RENEWAL_AUDIT_LOG] PRIMARY KEY ([ID])
    );

    PRINT 'Created table QMS_CHECKLIST_RENEWAL_AUDIT_LOG';
END
ELSE
BEGIN
    PRINT 'Table QMS_CHECKLIST_RENEWAL_AUDIT_LOG already exists – skipped.';
END;
