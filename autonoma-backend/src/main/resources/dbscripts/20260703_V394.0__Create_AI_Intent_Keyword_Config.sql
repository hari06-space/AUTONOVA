-- =============================================================================
-- Migration: V394.0 Create SYS_AI_INTENT_KEYWORD table
-- Purpose: DB-managed keyword/synonym sets for BosIntentEngine.
--          Allows admins to add keywords without code redeployment.
-- =============================================================================

IF OBJECT_ID('dbo.SYS_AI_INTENT_KEYWORD', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.SYS_AI_INTENT_KEYWORD (
        ID              INT IDENTITY(1,1) NOT NULL,
        MODULE_KEY      NVARCHAR(50)      NOT NULL,
        KEYWORD         NVARCHAR(200)     NOT NULL,
        LANGUAGE        VARCHAR(10)       NOT NULL DEFAULT 'en',
        IS_INJECTION    BIT               NOT NULL DEFAULT 0,
        CREATED_BY      NVARCHAR(50)      NOT NULL,
        CREATED_DATE    DATETIME          NOT NULL DEFAULT GETDATE(),
        ACTIVE_STATUS   CHAR(1)           NOT NULL DEFAULT 'Y',
        CONSTRAINT PK_SYS_AI_INTENT_KEYWORD PRIMARY KEY CLUSTERED (ID),
        CONSTRAINT FK_SYS_AI_IK_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES dbo.AD_USER_CREDENTIAL(USER_ID)
    );
    CREATE NONCLUSTERED INDEX IX_SYS_AI_IK_MODULE ON dbo.SYS_AI_INTENT_KEYWORD(MODULE_KEY);
    CREATE NONCLUSTERED INDEX IX_SYS_AI_IK_LANG ON dbo.SYS_AI_INTENT_KEYWORD(LANGUAGE);
    PRINT 'Created SYS_AI_INTENT_KEYWORD';
END;

PRINT 'V394.0 completed.';
