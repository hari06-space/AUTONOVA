-- ============================================================================
-- DB Migration: 20260811_V1133.0__Rename_Hra_Letters_To_Hra_Offer_Letters.sql
-- Description : Rename database table HRA_LETTERS to HRA_OFFER_LETTERS with full idempotency guards
-- Module      : HRA / Onboarding / Offer Letter
-- ============================================================================

IF OBJECT_ID('dbo.HRA_LETTERS', 'U') IS NOT NULL AND OBJECT_ID('dbo.HRA_OFFER_LETTERS', 'U') IS NULL
BEGIN
    PRINT 'Renaming table [dbo].[HRA_LETTERS] to [dbo].[HRA_OFFER_LETTERS]...';
    EXEC sp_rename 'dbo.HRA_LETTERS', 'HRA_OFFER_LETTERS';
END
GO

IF OBJECT_ID('dbo.HRA_OFFER_LETTERS', 'U') IS NULL
BEGIN
    PRINT 'Creating table [dbo].[HRA_OFFER_LETTERS]...';
    CREATE TABLE [dbo].[HRA_OFFER_LETTERS] (
        [ID]                BIGINT IDENTITY(1,1) NOT NULL,
        [LETTER_TYPE]       NVARCHAR(50) NOT NULL,
        [REF_NO]            NVARCHAR(100) NOT NULL,
        [LETTER_DATE]       DATETIME NOT NULL,
        [EMPLOYEE_CODE]     NVARCHAR(100) NULL,
        [EMPLOYEE_NAME]     NVARCHAR(200) NULL,
        [DEPARTMENT]        NVARCHAR(100) NULL,
        [DESIGNATION]       NVARCHAR(100) NULL,
        [FORM_DATA]         NVARCHAR(MAX) NULL,
        [STATUS]            NVARCHAR(50) NOT NULL CONSTRAINT [DF_HRA_OFFER_LETTERS_STATUS] DEFAULT ('DRAFT'),
        [APPROVAL_COMMENTS] NVARCHAR(MAX) NULL,
        [CREATED_BY]        NVARCHAR(50) NOT NULL,
        [CREATED_DATE]      DATETIME NOT NULL CONSTRAINT [DF_HRA_OFFER_LETTERS_CREATED_DATE] DEFAULT (GETDATE()),
        [UPDATED_BY]        NVARCHAR(50) NULL,
        [UPDATED_DATE]      DATETIME NULL,
        CONSTRAINT [PK_HRA_OFFER_LETTERS] PRIMARY KEY CLUSTERED ([ID] ASC)
    );
END
GO

-- Standardize foreign key constraints for audit columns if not existing
IF OBJECT_ID('dbo.HRA_OFFER_LETTERS', 'U') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_HRA_OFFER_LETTERS_CREATED_BY')
BEGIN
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'AD_USER_CREDENTIAL')
    BEGIN
        ALTER TABLE [dbo].[HRA_OFFER_LETTERS] WITH CHECK ADD CONSTRAINT [FK_HRA_OFFER_LETTERS_CREATED_BY] FOREIGN KEY([CREATED_BY])
        REFERENCES [dbo].[AD_USER_CREDENTIAL] ([USER_ID]);
    END
END
GO

IF OBJECT_ID('dbo.HRA_OFFER_LETTERS', 'U') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_HRA_OFFER_LETTERS_UPDATED_BY')
BEGIN
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'AD_USER_CREDENTIAL')
    BEGIN
        ALTER TABLE [dbo].[HRA_OFFER_LETTERS] WITH CHECK ADD CONSTRAINT [FK_HRA_OFFER_LETTERS_UPDATED_BY] FOREIGN KEY([UPDATED_BY])
        REFERENCES [dbo].[AD_USER_CREDENTIAL] ([USER_ID]);
    END
END
GO

PRINT 'SQL Migration 20260811_V1133.0__Rename_Hra_Letters_To_Hra_Offer_Letters executed successfully.';
