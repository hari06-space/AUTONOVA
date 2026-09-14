-- DML Migration Script to clean up seeded ATS in-app notification templates from HR_EMAIL_CONTENT

DELETE FROM HR_EMAIL_CONTENT 
WHERE [TYPE] IN ('ATS_INTERVIEW_ASSIGN', 'ATS_INTERVIEW_READY', 'ATS_INTERVIEW_REMINDER', 'ATS_INTERVIEW_CANCEL');

PRINT 'Successfully cleaned up ATS notification templates from HR_EMAIL_CONTENT';
