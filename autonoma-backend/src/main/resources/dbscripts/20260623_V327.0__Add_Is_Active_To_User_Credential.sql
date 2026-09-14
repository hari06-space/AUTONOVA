-- V327.0 Add IS_ACTIVE to AD_USER_CREDENTIAL
IF OBJECT_ID(N'[dbo].[AD_USER_CREDENTIAL]', 'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AD_USER_CREDENTIAL]') AND name = 'IS_ACTIVE')
    BEGIN
        ALTER TABLE [dbo].[AD_USER_CREDENTIAL] ADD [IS_ACTIVE] BIT DEFAULT 1;
    END
END
GO

IF OBJECT_ID(N'[dbo].[ad_user_credential]', 'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ad_user_credential]') AND name = 'IS_ACTIVE')
    BEGIN
        ALTER TABLE [dbo].[ad_user_credential] ADD [IS_ACTIVE] BIT DEFAULT 1;
    END
END
GO
