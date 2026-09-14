-- ============================================================================
-- DB Migration: 20260827_V1202.0__Add_Offer_Letter_Prefix_Credentials.sql
-- Description : Add OFFER_LETTER_PREFIX, OFFER_LETTER_SUFFIX, and OFFER_LETTER_DIGIT
--               columns to AD_PREFIX_CREDENTIALS for Offer Letter auto-numbering.
-- Module      : HRA / Onboarding / Offer Letter
-- Database    : AT_NUTECH
-- ============================================================================

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- 1. Add Offer Letter configuration columns to AD_PREFIX_CREDENTIALS
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AD_PREFIX_CREDENTIALS]') AND name = 'OFFER_LETTER_PREFIX')
BEGIN
    ALTER TABLE [dbo].[AD_PREFIX_CREDENTIALS] ADD [OFFER_LETTER_PREFIX] NVARCHAR(20) NULL;
END;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AD_PREFIX_CREDENTIALS]') AND name = 'OFFER_LETTER_SUFFIX')
BEGIN
    ALTER TABLE [dbo].[AD_PREFIX_CREDENTIALS] ADD [OFFER_LETTER_SUFFIX] NVARCHAR(20) NULL;
END;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AD_PREFIX_CREDENTIALS]') AND name = 'OFFER_LETTER_DIGIT')
BEGIN
    ALTER TABLE [dbo].[AD_PREFIX_CREDENTIALS] ADD [OFFER_LETTER_DIGIT] INT NULL;
END;
GO

PRINT 'SQL Migration 20260827_V1202.0__Add_Offer_Letter_Prefix_Credentials executed successfully.';
GO
