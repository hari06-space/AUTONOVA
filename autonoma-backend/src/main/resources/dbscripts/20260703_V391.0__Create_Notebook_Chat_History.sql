-- ==============================================================================
-- Migration Script: V391.0 Create SYS_NOTEBOOK_CHAT for persistent chat history
-- Author: Antigravity AI
-- Date: 2026-07-03
-- ==============================================================================

IF OBJECT_ID('dbo.SYS_NOTEBOOK_CHAT', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.SYS_NOTEBOOK_CHAT (
        ID              BIGINT IDENTITY(1,1)    NOT NULL,
        NOTEBOOK_ID     BIGINT                  NOT NULL,
        SENDER          VARCHAR(20)             NOT NULL, -- 'user' | 'ai'
        MESSAGE_TEXT    NVARCHAR(MAX)           NOT NULL,
        CITATIONS_JSON  NVARCHAR(MAX)           NULL, -- JSON representation of citations
        CREATED_BY      NVARCHAR(50)            NOT NULL,
        CREATED_DATE    DATETIME                NOT NULL DEFAULT GETDATE(),
        ACTIVE_STATUS   CHAR(1)                 NOT NULL DEFAULT 'Y',
        CONSTRAINT PK_SYS_NOTEBOOK_CHAT PRIMARY KEY CLUSTERED (ID),
        CONSTRAINT FK_SYS_NB_CHAT_NOTEBOOK FOREIGN KEY (NOTEBOOK_ID) REFERENCES dbo.SYS_NOTEBOOK(ID) ON DELETE CASCADE,
        CONSTRAINT FK_SYS_NB_CHAT_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES dbo.AD_USER_CREDENTIAL(USER_ID)
    );
    CREATE NONCLUSTERED INDEX IX_SYS_NB_CHAT_NOTEBOOK ON dbo.SYS_NOTEBOOK_CHAT(NOTEBOOK_ID);
    CREATE NONCLUSTERED INDEX IX_SYS_NB_CHAT_ACTIVE ON dbo.SYS_NOTEBOOK_CHAT(ACTIVE_STATUS);
    PRINT 'Created SYS_NOTEBOOK_CHAT table';
END;
