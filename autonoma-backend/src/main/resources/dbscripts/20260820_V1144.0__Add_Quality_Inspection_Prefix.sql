IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AD_PREFIX_CREDENTIALS]') AND name = 'quality_inspection_prefix')
BEGIN
    ALTER TABLE [dbo].[AD_PREFIX_CREDENTIALS] ADD quality_inspection_prefix NVARCHAR(20) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AD_PREFIX_CREDENTIALS]') AND name = 'quality_inspection_suffix')
BEGIN
    ALTER TABLE [dbo].[AD_PREFIX_CREDENTIALS] ADD quality_inspection_suffix NVARCHAR(20) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AD_PREFIX_CREDENTIALS]') AND name = 'quality_inspection_digit')
BEGIN
    ALTER TABLE [dbo].[AD_PREFIX_CREDENTIALS] ADD quality_inspection_digit INT NULL;
END
GO
