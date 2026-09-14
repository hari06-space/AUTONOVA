-- =========================================================================================
-- MIGRATION SCRIPT: Add High Concurrency & Multi-User Performance Indexes
-- Version: V1170.0
-- Database: AT_NUTECH
-- Description: Creates essential indexes on authentication, permissions, status, notifications,
--              and session tables to accelerate query execution and eliminate lock contention.
-- =========================================================================================

-- 1. BOS_USER_PAGE_AUTH: Fast-path user permission resolution
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'BOS_USER_PAGE_AUTH')
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_BOS_USER_PAGE_AUTH_USER_ENABLE' AND object_id = OBJECT_ID('BOS_USER_PAGE_AUTH'))
    BEGIN
        CREATE NONCLUSTERED INDEX IX_BOS_USER_PAGE_AUTH_USER_ENABLE
        ON dbo.BOS_USER_PAGE_AUTH (user_id, enable)
        INCLUDE (page_id, read_acs, write_acs, delete_acs, export_acs, approval_acs, manager_acs);
        PRINT 'Created index IX_BOS_USER_PAGE_AUTH_USER_ENABLE';
    END
END;

-- 2. AD_USER_CREDENTIAL: Fast employee & status lookup
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'AD_USER_CREDENTIAL')
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AD_USER_CREDENTIAL_EMP_ID' AND object_id = OBJECT_ID('AD_USER_CREDENTIAL'))
    BEGIN
        CREATE NONCLUSTERED INDEX IX_AD_USER_CREDENTIAL_EMP_ID
        ON dbo.AD_USER_CREDENTIAL (EMP_ID)
        WHERE EMP_ID IS NOT NULL;
        PRINT 'Created index IX_AD_USER_CREDENTIAL_EMP_ID';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AD_USER_CREDENTIAL_STATUS' AND object_id = OBJECT_ID('AD_USER_CREDENTIAL'))
    BEGIN
        CREATE NONCLUSTERED INDEX IX_AD_USER_CREDENTIAL_STATUS
        ON dbo.AD_USER_CREDENTIAL (STATUS)
        INCLUDE (USER_ID, EMP_ID, USER_LEVEL);
        PRINT 'Created index IX_AD_USER_CREDENTIAL_STATUS';
    END
END;

-- 3. AD_STATUS_MASTER: Fast status name lookup
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'AD_STATUS_MASTER')
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AD_STATUS_MASTER_NAME' AND object_id = OBJECT_ID('AD_STATUS_MASTER'))
    BEGIN
        CREATE NONCLUSTERED INDEX IX_AD_STATUS_MASTER_NAME
        ON dbo.AD_STATUS_MASTER (NAME)
        INCLUDE (ID);
        PRINT 'Created index IX_AD_STATUS_MASTER_NAME';
    END
END;

-- 4. CLI_NOTIFICATION_LOG: Fast user acknowledgment log resolution
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'CLI_NOTIFICATION_LOG')
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CLI_NOTIF_LOG_CLIENT_USER_STATUS' AND object_id = OBJECT_ID('CLI_NOTIFICATION_LOG'))
    BEGIN
        CREATE NONCLUSTERED INDEX IX_CLI_NOTIF_LOG_CLIENT_USER_STATUS
        ON dbo.CLI_NOTIFICATION_LOG (CLIENT_CODE, USER_ID, STATUS)
        INCLUDE (NOTIFICATION_ID);
        PRINT 'Created index IX_CLI_NOTIF_LOG_CLIENT_USER_STATUS';
    END
END;

-- 5. AD_USER_SESSION: Fast active session scanning & cleanup
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'AD_USER_SESSION')
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AD_USER_SESSION_STATUS' AND object_id = OBJECT_ID('AD_USER_SESSION'))
    BEGIN
        CREATE NONCLUSTERED INDEX IX_AD_USER_SESSION_STATUS
        ON dbo.AD_USER_SESSION (STATUS)
        INCLUDE (USER_ID, LOGIN_TIME);
        PRINT 'Created index IX_AD_USER_SESSION_STATUS';
    END
END;

-- 6. OM_VISITOR_GATE_PASS: Fast auto-close & date range queries
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'OM_VISITOR_GATE_PASS')
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_OM_VISITOR_GATE_PASS_DATE_STATUS' AND object_id = OBJECT_ID('OM_VISITOR_GATE_PASS'))
    BEGIN
        CREATE NONCLUSTERED INDEX IX_OM_VISITOR_GATE_PASS_DATE_STATUS
        ON dbo.OM_VISITOR_GATE_PASS (VISITOR_DATE, STATUS);
        PRINT 'Created index IX_OM_VISITOR_GATE_PASS_DATE_STATUS';
    END
END;
