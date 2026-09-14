-- =========================================================================================
-- MIGRATION SCRIPT: Add Notification Performance Indexes to Eliminate Deadlocks
-- Version: V1206.0
-- Database: AT_NUTECH / AUTONOMA
-- Description: Creates essential indexes on SYS_APP_NOTIFICATION to eliminate full table scans
--              and deadlock contention under concurrent multi-user notification requests.
-- =========================================================================================

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'SYS_APP_NOTIFICATION')
BEGIN
    -- 1. Index on recipient_emp_id and CREATED_DATE for fast notification retrieval by employee
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_SYS_APP_NOTIF_RECIP_CREATED' AND object_id = OBJECT_ID('SYS_APP_NOTIFICATION'))
    BEGIN
        CREATE NONCLUSTERED INDEX IX_SYS_APP_NOTIF_RECIP_CREATED
        ON dbo.SYS_APP_NOTIFICATION (recipient_emp_id, CREATED_DATE DESC)
        INCLUDE (is_read, title, message, link_url, REF_TYPE, REF_ID);
        PRINT 'Created index IX_SYS_APP_NOTIF_RECIP_CREATED';
    END;

    -- 2. Index on recipient_emp_id, is_read and CREATED_DATE for unread notifications lookup
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_SYS_APP_NOTIF_RECIP_READ_CREATED' AND object_id = OBJECT_ID('SYS_APP_NOTIFICATION'))
    BEGIN
        CREATE NONCLUSTERED INDEX IX_SYS_APP_NOTIF_RECIP_READ_CREATED
        ON dbo.SYS_APP_NOTIFICATION (recipient_emp_id, is_read, CREATED_DATE DESC)
        INCLUDE (title, message, link_url, REF_TYPE, REF_ID);
        PRINT 'Created index IX_SYS_APP_NOTIF_RECIP_READ_CREATED';
    END;

    -- 3. Index on is_read and CREATED_DATE for global unread notifications lookup (empId = 0)
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_SYS_APP_NOTIF_READ_CREATED' AND object_id = OBJECT_ID('SYS_APP_NOTIFICATION'))
    BEGIN
        CREATE NONCLUSTERED INDEX IX_SYS_APP_NOTIF_READ_CREATED
        ON dbo.SYS_APP_NOTIFICATION (is_read, CREATED_DATE DESC)
        INCLUDE (recipient_emp_id, title, message, link_url, REF_TYPE, REF_ID);
        PRINT 'Created index IX_SYS_APP_NOTIF_READ_CREATED';
    END;

    -- 4. Index on REF_TYPE and REF_ID for ref-based lookup and soft-close operations
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_SYS_APP_NOTIF_REF' AND object_id = OBJECT_ID('SYS_APP_NOTIFICATION'))
    BEGIN
        CREATE NONCLUSTERED INDEX IX_SYS_APP_NOTIF_REF
        ON dbo.SYS_APP_NOTIFICATION (REF_TYPE, REF_ID, recipient_emp_id)
        INCLUDE (is_read, title);
        PRINT 'Created index IX_SYS_APP_NOTIF_REF';
    END;
END;
