-- V432.0: Promote user DARSHAN to Admin (USER_LEVEL = 1) to enable default dashboard widgets access.
IF EXISTS (SELECT 1 FROM [dbo].[AD_USER_CREDENTIAL] WHERE [USER_ID] = 'DARSHAN')
BEGIN
    UPDATE [dbo].[AD_USER_CREDENTIAL]
    SET [USER_LEVEL] = 1
    WHERE [USER_ID] = 'DARSHAN';
END
GO
