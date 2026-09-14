-- DML Migration Script to clean up seeded ATS in-app notification templates from HR_EMAIL_CONTENT

IF OBJECT_ID('HR_EMAIL_CONTENT', 'U') IS NOT NULL
BEGIN
    DELETE FROM HR_EMAIL_CONTENT 
    WHERE [TYPE] IN (N'ATS_INTERVIEW_ASSIGN', N'ATS_INTERVIEW_READY', N'ATS_INTERVIEW_REMINDER', N'ATS_INTERVIEW_CANCEL');
    
    PRINT 'Successfully cleaned up ATS notification templates from HR_EMAIL_CONTENT';
END
