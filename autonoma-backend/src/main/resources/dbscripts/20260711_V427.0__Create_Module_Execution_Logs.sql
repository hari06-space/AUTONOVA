-- ============================================================
-- Migration V427.0 : Separate Scheduler Execution Logs by Module
-- Created: 2026-07-11
-- ============================================================

-- 1. Create QMS_CHECKLIST_EXECUTION_LOG table
IF NOT EXISTS (
    SELECT 1 FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[QMS_CHECKLIST_EXECUTION_LOG]')
      AND type = 'U'
)
BEGIN
    CREATE TABLE [dbo].[QMS_CHECKLIST_EXECUTION_LOG] (
        [ROW_ID]          BIGINT         IDENTITY(1,1) NOT NULL,
        [CONFIG_ID]       BIGINT         NOT NULL,
        [SCHEDULER_NAME]  VARCHAR(150)   NOT NULL,
        [TRIGGER_TIME]    DATETIME       NOT NULL,
        [DURATION_MS]     BIGINT         NOT NULL,
        [SUCCESS_COUNT]   INT            NOT NULL,
        [FAILURE_COUNT]   INT            NOT NULL,
        [STATUS]          VARCHAR(50)    NOT NULL,
        [ERROR_DETAILS]   NVARCHAR(MAX)  NULL,
        [CREATED_DATE]    DATETIME       NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_QMS_CHECKLIST_EXECUTION_LOG] PRIMARY KEY CLUSTERED ([ROW_ID])
    );
    CREATE INDEX [IX_QMS_CHECKLIST_EXEC_CONFIG] ON [dbo].[QMS_CHECKLIST_EXECUTION_LOG] ([CONFIG_ID]);
    PRINT 'Created table QMS_CHECKLIST_EXECUTION_LOG';
END
ELSE
BEGIN
    PRINT 'Table QMS_CHECKLIST_EXECUTION_LOG already exists – skipped.';
END;

-- 2. Create MEETING_EXECUTION_LOG table
IF NOT EXISTS (
    SELECT 1 FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[MEETING_EXECUTION_LOG]')
      AND type = 'U'
)
BEGIN
    CREATE TABLE [dbo].[MEETING_EXECUTION_LOG] (
        [ROW_ID]          BIGINT         IDENTITY(1,1) NOT NULL,
        [CONFIG_ID]       BIGINT         NOT NULL,
        [SCHEDULER_NAME]  VARCHAR(150)   NOT NULL,
        [TRIGGER_TIME]    DATETIME       NOT NULL,
        [DURATION_MS]     BIGINT         NOT NULL,
        [SUCCESS_COUNT]   INT            NOT NULL,
        [FAILURE_COUNT]   INT            NOT NULL,
        [STATUS]          VARCHAR(50)    NOT NULL,
        [ERROR_DETAILS]   NVARCHAR(MAX)  NULL,
        [CREATED_DATE]    DATETIME       NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_MEETING_EXECUTION_LOG] PRIMARY KEY CLUSTERED ([ROW_ID])
    );
    CREATE INDEX [IX_MEETING_EXEC_CONFIG] ON [dbo].[MEETING_EXECUTION_LOG] ([CONFIG_ID]);
    PRINT 'Created table MEETING_EXECUTION_LOG';
END
ELSE
BEGIN
    PRINT 'Table MEETING_EXECUTION_LOG already exists – skipped.';
END;

-- 3. Create AUDIT_EXECUTION_LOG table
IF NOT EXISTS (
    SELECT 1 FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[AUDIT_EXECUTION_LOG]')
      AND type = 'U'
)
BEGIN
    CREATE TABLE [dbo].[AUDIT_EXECUTION_LOG] (
        [ROW_ID]          BIGINT         IDENTITY(1,1) NOT NULL,
        [CONFIG_ID]       BIGINT         NOT NULL,
        [SCHEDULER_NAME]  VARCHAR(150)   NOT NULL,
        [TRIGGER_TIME]    DATETIME       NOT NULL,
        [DURATION_MS]     BIGINT         NOT NULL,
        [SUCCESS_COUNT]   INT            NOT NULL,
        [FAILURE_COUNT]   INT            NOT NULL,
        [STATUS]          VARCHAR(50)    NOT NULL,
        [ERROR_DETAILS]   NVARCHAR(MAX)  NULL,
        [CREATED_DATE]    DATETIME       NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_AUDIT_EXECUTION_LOG] PRIMARY KEY CLUSTERED ([ROW_ID])
    );
    CREATE INDEX [IX_AUDIT_EXEC_CONFIG] ON [dbo].[AUDIT_EXECUTION_LOG] ([CONFIG_ID]);
    PRINT 'Created table AUDIT_EXECUTION_LOG';
END
ELSE
BEGIN
    PRINT 'Table AUDIT_EXECUTION_LOG already exists – skipped.';
END;
