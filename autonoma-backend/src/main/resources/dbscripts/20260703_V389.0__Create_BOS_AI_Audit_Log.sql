-- ==============================================================================
-- Migration Script: V389.0 Create SYS_AI_AUDIT_LOG
-- Description: Creates professional database schema for AI audit logging
--              supporting intent classifications, API trace records, and
--              security audit tracking inside the BOS AI Gateway.
-- Audit Convention: CREATED_BY / UPDATED_BY link to AD_USER_CREDENTIAL.USER_ID.
-- ==============================================================================

IF OBJECT_ID('dbo.SYS_AI_AUDIT_LOG', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.SYS_AI_AUDIT_LOG (
        ID                  BIGINT IDENTITY(1,1)    NOT NULL,
        USER_ID             NVARCHAR(50)            NOT NULL, -- FK -> AD_USER_CREDENTIAL.USER_ID
        PROMPT              NVARCHAR(MAX)           NOT NULL,
        INTENT_CLASS        NVARCHAR(100)           NOT NULL, -- 'INFORMATION', 'ANALYTICS', 'WORKFLOW', 'MODIFICATION'
        MODULES_ACCESSED    NVARCHAR(255)           NULL,
        APIS_TRIGGERED      NVARCHAR(500)           NULL,
        RESPONSE_TIME_MS    INT                     NOT NULL DEFAULT 0,
        TOKENS_USED         INT                     NULL,
        TRACE_LOG           NVARCHAR(MAX)           NULL,
        CREATED_BY          NVARCHAR(50)            NOT NULL,
        CREATED_DATE        DATETIME                NOT NULL DEFAULT GETDATE(),
        UPDATED_BY          NVARCHAR(50)            NULL,
        UPDATED_DATE        DATETIME                NULL,
        ACTIVE_STATUS       CHAR(1)                 NOT NULL DEFAULT 'Y',
        CONSTRAINT PK_SYS_AI_AUDIT_LOG PRIMARY KEY CLUSTERED (ID),
        CONSTRAINT FK_SYS_AI_AUDIT_LOG_USER FOREIGN KEY (USER_ID) REFERENCES dbo.AD_USER_CREDENTIAL(USER_ID),
        CONSTRAINT FK_SYS_AI_AUDIT_LOG_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES dbo.AD_USER_CREDENTIAL(USER_ID),
        CONSTRAINT FK_SYS_AI_AUDIT_LOG_UPDATED_BY FOREIGN KEY (UPDATED_BY) REFERENCES dbo.AD_USER_CREDENTIAL(USER_ID)
    );
    CREATE NONCLUSTERED INDEX IX_SYS_AI_AUDIT_LOG_USER ON dbo.SYS_AI_AUDIT_LOG(USER_ID);
    CREATE NONCLUSTERED INDEX IX_SYS_AI_AUDIT_LOG_CLASS ON dbo.SYS_AI_AUDIT_LOG(INTENT_CLASS);
    CREATE NONCLUSTERED INDEX IX_SYS_AI_AUDIT_LOG_CREATED ON dbo.SYS_AI_AUDIT_LOG(CREATED_DATE);
    PRINT 'Created SYS_AI_AUDIT_LOG table';
END;
