-- =====================================================================================
-- Migration Script: V1224.0 - Remove Unused Columns from HRA_OFFER_LETTERS
-- Target Database   : Application-configured primary database
-- Module            : HRA -> Onboarding -> Offer Letter (HA1360)
-- Description       : Safely drops REPORTING_MANAGER_ID, REPORTING_MANAGER,
--                     COMPANY_GSTIN, and APPROVAL_COMMENTS from dbo.HRA_OFFER_LETTERS.
--                     These fields remain available in FORM_DATA and Master Profiles where needed.
--                     V1223.0 no longer creates the first three; this script stays so that
--                     databases which already ran the earlier numbering are cleaned up, and
--                     to drop the legacy APPROVAL_COMMENTS column.
-- =====================================================================================

SET NOCOUNT ON;

-- 1. DROP REPORTING_MANAGER_ID COLUMN IF IT EXISTS
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'HRA_OFFER_LETTERS' AND COLUMN_NAME = 'REPORTING_MANAGER_ID')
BEGIN
    ALTER TABLE [dbo].[HRA_OFFER_LETTERS] DROP COLUMN [REPORTING_MANAGER_ID];
END
GO

-- 2. DROP REPORTING_MANAGER COLUMN IF IT EXISTS
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'HRA_OFFER_LETTERS' AND COLUMN_NAME = 'REPORTING_MANAGER')
BEGIN
    ALTER TABLE [dbo].[HRA_OFFER_LETTERS] DROP COLUMN [REPORTING_MANAGER];
END
GO

-- 3. DROP COMPANY_GSTIN COLUMN IF IT EXISTS
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'HRA_OFFER_LETTERS' AND COLUMN_NAME = 'COMPANY_GSTIN')
BEGIN
    ALTER TABLE [dbo].[HRA_OFFER_LETTERS] DROP COLUMN [COMPANY_GSTIN];
END
GO

-- 4. DROP APPROVAL_COMMENTS COLUMN IF IT EXISTS
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'HRA_OFFER_LETTERS' AND COLUMN_NAME = 'APPROVAL_COMMENTS')
BEGIN
    ALTER TABLE [dbo].[HRA_OFFER_LETTERS] DROP COLUMN [APPROVAL_COMMENTS];
END
GO
