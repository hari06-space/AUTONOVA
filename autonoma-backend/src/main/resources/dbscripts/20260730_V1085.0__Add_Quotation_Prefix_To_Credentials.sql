-- --------------------------------------------------------
-- Flyway Script: Add Quotation Prefix Columns to Credentials
-- Description: Adds QUOTATION_PREFIX, QUOTATION_SUFFIX, and QUOTATION_DIGIT
--              to AD_PREFIX_CREDENTIALS for Supplier Quotation auto-numbering.
-- --------------------------------------------------------

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'QUOTATION_PREFIX' AND Object_ID = Object_ID(N'AD_PREFIX_CREDENTIALS'))
BEGIN
    ALTER TABLE [dbo].[AD_PREFIX_CREDENTIALS] 
    ADD [QUOTATION_PREFIX] NVARCHAR(20) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'QUOTATION_SUFFIX' AND Object_ID = Object_ID(N'AD_PREFIX_CREDENTIALS'))
BEGIN
    ALTER TABLE [dbo].[AD_PREFIX_CREDENTIALS] 
    ADD [QUOTATION_SUFFIX] NVARCHAR(20) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'QUOTATION_DIGIT' AND Object_ID = Object_ID(N'AD_PREFIX_CREDENTIALS'))
BEGIN
    ALTER TABLE [dbo].[AD_PREFIX_CREDENTIALS] 
    ADD [QUOTATION_DIGIT] INT NULL DEFAULT 5;
END
GO

-- Seed default values if needed
UPDATE [dbo].[AD_PREFIX_CREDENTIALS]
SET [QUOTATION_PREFIX] = 'QT/', 
    [QUOTATION_SUFFIX] = '', 
    [QUOTATION_DIGIT] = 5
WHERE [QUOTATION_PREFIX] IS NULL;
GO
