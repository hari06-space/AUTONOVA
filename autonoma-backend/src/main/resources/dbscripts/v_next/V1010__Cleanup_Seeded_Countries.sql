-- Delete standard countries seeded by SYSTEM
SET NOCOUNT ON;

DELETE FROM [dbo].[MST_COUNTRY] WHERE [CREATED_BY] = 'SYSTEM';

PRINT 'SYSTEM seeded countries cleaned up successfully!';
GO
