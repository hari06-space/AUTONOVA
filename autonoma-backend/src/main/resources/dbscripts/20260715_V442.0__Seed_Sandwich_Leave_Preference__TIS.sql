-- Seed SANDWICH_LEAVE preference if not exists
IF NOT EXISTS (SELECT 1 FROM [dbo].[AD_APP_PREFERENCE] WITH (NOLOCK) WHERE [pref_name] = 'SANDWICH_LEAVE')
BEGIN
    INSERT INTO [dbo].[AD_APP_PREFERENCE] (pref_name, pref_value, comments, pref_type, CREATED_BY, CREATED_DATE)
    VALUES ('SANDWICH_LEAVE', 'No', 'Enable or disable Sandwich Leave rule (yes/no)', 'Leave Settings', 'SYSTEM', GETDATE());
END
GO
