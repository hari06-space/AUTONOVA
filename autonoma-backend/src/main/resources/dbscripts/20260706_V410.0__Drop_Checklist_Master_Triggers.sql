-- Migration: Drop triggers on QMS_CHECKLIST_MASTER to prevent unwanted expiry_date mutation on close
DECLARE @triggerName NVARCHAR(255);
DECLARE trigger_cursor CURSOR FOR
SELECT name FROM sys.triggers WHERE parent_id = OBJECT_ID('QMS_CHECKLIST_MASTER');

OPEN trigger_cursor;
FETCH NEXT FROM trigger_cursor INTO @triggerName;

WHILE @@FETCH_STATUS = 0
BEGIN
    DECLARE @sql NVARCHAR(MAX) = 'DROP TRIGGER [dbo].[' + @triggerName + ']';
    EXEC sp_executesql @sql;
    FETCH NEXT FROM trigger_cursor INTO @triggerName;
END;

CLOSE trigger_cursor;
DEALLOCATE trigger_cursor;
