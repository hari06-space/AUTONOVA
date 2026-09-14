-- V1013__Alter_Email_Content_Yours_Windfully_Nullable.sql
-- Resolution for Yours Windfully required field bug in Email Master

IF EXISTS (
    SELECT * 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'HR_EMAIL_CONTENT' 
      AND COLUMN_NAME = 'YOURS_WINDFULLY' 
      AND IS_NULLABLE = 'NO'
)
BEGIN
    ALTER TABLE HR_EMAIL_CONTENT ALTER COLUMN YOURS_WINDFULLY NVARCHAR(200) NULL;
    PRINT 'YOURS_WINDFULLY column in HR_EMAIL_CONTENT table altered to NULL.';
END
ELSE
BEGIN
    PRINT 'YOURS_WINDFULLY column in HR_EMAIL_CONTENT table is already NULL or table does not exist.';
END
