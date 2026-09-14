-- 1. Checklist Master SEARCH_TEXT & Descending Index
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('QMS_CHECKLIST_MASTER') AND name = 'SEARCH_TEXT')
BEGIN
    ALTER TABLE QMS_CHECKLIST_MASTER ADD SEARCH_TEXT NVARCHAR(1000);
END
GO
UPDATE QMS_CHECKLIST_MASTER 
SET SEARCH_TEXT = LOWER(
    COALESCE(SEQ_NO, '') + ' ' + 
    COALESCE(CHECKING_POINT, '') + ' ' + 
    COALESCE(CATEGORY, '') + ' ' + 
    COALESCE(FREQUENCY, '') + ' ' +
    COALESCE((
        SELECT STRING_AGG(d.DEPARTMENT_NAME, ' ')
        FROM QMS_CHECKLIST_DEPARTMENT cd
        JOIN HR_DEPARTMENT d ON cd.DEPARTMENT_ID = d.id
        WHERE cd.CHECKLIST_ID = QMS_CHECKLIST_MASTER.id
    ), '')
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('QMS_CHECKLIST_MASTER') AND name = 'IX_QMS_CHECKLIST_ID')
BEGIN
    CREATE INDEX IX_QMS_CHECKLIST_ID ON QMS_CHECKLIST_MASTER(ID DESC);
END
GO

-- 2. Audit Schedule SEARCH_TEXT & Descending Index
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('QMS_AUDIT_SCHEDULE') AND name = 'SEARCH_TEXT')
BEGIN
    ALTER TABLE QMS_AUDIT_SCHEDULE ADD SEARCH_TEXT NVARCHAR(1000);
END
GO
UPDATE QMS_AUDIT_SCHEDULE 
SET SEARCH_TEXT = LOWER(COALESCE(SCHEDULE_NO, '') + ' ' + COALESCE(AUDIT_TYPE, '') + ' ' + COALESCE(AUDIT_AREA, '') + ' ' + COALESCE(DEPARTMENT, '') + ' ' + COALESCE(AUDITOR, '') + ' ' + COALESCE(AUDITEE, ''));
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('QMS_AUDIT_SCHEDULE') AND name = 'IX_QMS_AUDIT_ROW_ID')
BEGIN
    CREATE INDEX IX_QMS_AUDIT_ROW_ID ON QMS_AUDIT_SCHEDULE(ID DESC);
END
GO

-- 3. Meeting Schedule SEARCH_TEXT & Descending Index
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('QMS_MEETING_SCHEDULE') AND name = 'SEARCH_TEXT')
BEGIN
    ALTER TABLE QMS_MEETING_SCHEDULE ADD SEARCH_TEXT NVARCHAR(1000);
END
GO
UPDATE QMS_MEETING_SCHEDULE 
SET SEARCH_TEXT = LOWER(
    COALESCE(SCHEDULE_NO, '') + ' ' + 
    COALESCE((
        SELECT m.MEETING_NAME 
        FROM QMS_MEETING_MASTER m 
        WHERE m.id = QMS_MEETING_SCHEDULE.MEETING_TYPE_ID
    ), '') + ' ' +
    COALESCE((
        SELECT e.EMPLOYEE_NAME 
        FROM HR_EMPLOYEE e 
        WHERE e.id = QMS_MEETING_SCHEDULE.CHAIRED_BY_ID
    ), '') + ' ' +
    COALESCE((
        SELECT e.EMPLOYEE_NAME 
        FROM HR_EMPLOYEE e 
        WHERE e.id = QMS_MEETING_SCHEDULE.HOST_BY_ID
    ), '') + ' ' +
    COALESCE(STATUS, '') + ' ' +
    COALESCE((
        SELECT STRING_AGG(d.DEPARTMENT_NAME, ' ')
        FROM QMS_MEETING_DEPARTMENT_MAPPING md
        JOIN HR_DEPARTMENT d ON md.DEPARTMENT_ID = d.id
        WHERE md.SCHEDULE_ID = QMS_MEETING_SCHEDULE.id
    ), '') + ' ' +
    COALESCE((
        SELECT STRING_AGG(e.EMPLOYEE_NAME, ' ')
        FROM QMS_MEETING_PARTICIPANT_MAPPING mp
        JOIN HR_EMPLOYEE e ON mp.EMPLOYEE_ID = e.id
        WHERE mp.SCHEDULE_ID = QMS_MEETING_SCHEDULE.id
    ), '')
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('QMS_MEETING_SCHEDULE') AND name = 'IX_QMS_MEETING_ROW_ID')
BEGIN
    CREATE INDEX IX_QMS_MEETING_ROW_ID ON QMS_MEETING_SCHEDULE(ID DESC);
END
GO

-- 4. Enable SQL Server Full-Text Indexing
IF FULLTEXTSERVICEPROPERTY('IsFullTextInstalled') = 1
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.fulltext_catalogs WHERE name = 'erp_ft_catalog')
    BEGIN
        EXEC('CREATE FULLTEXT CATALOG erp_ft_catalog AS DEFAULT');
    END;

    -- Master Checklist FTS Index
    IF NOT EXISTS (SELECT 1 FROM sys.fulltext_indexes fi JOIN sys.tables t ON fi.object_id = t.object_id WHERE t.name = 'QMS_CHECKLIST_MASTER')
    BEGIN
        DECLARE @pk_name NVARCHAR(255);
        SELECT @pk_name = name FROM sys.indexes WHERE object_id = OBJECT_ID('QMS_CHECKLIST_MASTER') AND is_primary_key = 1;
        DECLARE @sql NVARCHAR(MAX) = 'CREATE FULLTEXT INDEX ON QMS_CHECKLIST_MASTER(SEARCH_TEXT) KEY INDEX [' + @pk_name + '] ON erp_ft_catalog';
        EXEC(@sql);
    END;

    -- Audit Schedule FTS Index
    IF NOT EXISTS (SELECT 1 FROM sys.fulltext_indexes fi JOIN sys.tables t ON fi.object_id = t.object_id WHERE t.name = 'QMS_AUDIT_SCHEDULE')
    BEGIN
        DECLARE @pk_name_audit NVARCHAR(255);
        SELECT @pk_name_audit = name FROM sys.indexes WHERE object_id = OBJECT_ID('QMS_AUDIT_SCHEDULE') AND is_primary_key = 1;
        DECLARE @sql_audit NVARCHAR(MAX) = 'CREATE FULLTEXT INDEX ON QMS_AUDIT_SCHEDULE(SEARCH_TEXT) KEY INDEX [' + @pk_name_audit + '] ON erp_ft_catalog';
        EXEC(@sql_audit);
    END;

    -- Meeting Schedule FTS Index
    IF NOT EXISTS (SELECT 1 FROM sys.fulltext_indexes fi JOIN sys.tables t ON fi.object_id = t.object_id WHERE t.name = 'QMS_MEETING_SCHEDULE')
    BEGIN
        DECLARE @pk_name_meeting NVARCHAR(255);
        SELECT @pk_name_meeting = name FROM sys.indexes WHERE object_id = OBJECT_ID('QMS_MEETING_SCHEDULE') AND is_primary_key = 1;
        DECLARE @sql_meeting NVARCHAR(MAX) = 'CREATE FULLTEXT INDEX ON QMS_MEETING_SCHEDULE(SEARCH_TEXT) KEY INDEX [' + @pk_name_meeting + '] ON erp_ft_catalog';
        EXEC(@sql_meeting);
    END;
END
GO
