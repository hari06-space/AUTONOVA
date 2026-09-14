-- SQL Migration: Create Ledger Group Table and add pages
-- Created: 2026-07-07

BEGIN TRANSACTION;

-- 1. Create LEDGER_GROUP table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[LEDGER_GROUP]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[LEDGER_GROUP](
        [ID] [bigint] IDENTITY(1,1) NOT NULL,
        [GROUP_NAME] [nvarchar](100) NULL,
        [DESCRIPTION] [nvarchar](250) NULL,
        [LEVEL] [bigint] NULL,
        [PARENT_ID] [bigint] NULL,
        [PARENT_NAME] [nvarchar](100) NULL,
        [IS_ACTIVE] [bit] NULL DEFAULT 1,
        [CREATED_BY] [nvarchar](50) NOT NULL,
        [CREATED_DATE] [datetime] NULL,
        [UPDATED_BY] [nvarchar](50) NULL,
        [UPDATED_DATE] [datetime] NULL,
        CONSTRAINT [PK_LEDGER_GROUP] PRIMARY KEY CLUSTERED ([ID] ASC),
        CONSTRAINT [FK_LEDGER_GROUP_CREATED_BY] FOREIGN KEY([CREATED_BY]) REFERENCES [dbo].[AD_USER_CREDENTIAL] ([USER_ID]),
        CONSTRAINT [FK_LEDGER_GROUP_UPDATED_BY] FOREIGN KEY([UPDATED_BY]) REFERENCES [dbo].[AD_USER_CREDENTIAL] ([USER_ID]),
        CONSTRAINT [FK_LEDGER_GROUP_PARENT_ID] FOREIGN KEY([PARENT_ID]) REFERENCES [dbo].[LEDGER_GROUP] ([ID])
    );
END

-- 2. Insert Finance Submodule under Masters (mod_id = 1) if not exists
SET IDENTITY_INSERT bos_sub_modules ON;
BEGIN TRY 
    IF NOT EXISTS (SELECT * FROM bos_sub_modules WHERE sub_mod_code = 'M9000')
    BEGIN
        INSERT INTO bos_sub_modules (sub_mod_id, mod_id, parent_sub_mod_id, sub_mod_code, sub_mod_name) 
        VALUES (90, 1, NULL, 'M9000', 'Finance');
    END
END TRY BEGIN CATCH END CATCH;
SET IDENTITY_INSERT bos_sub_modules OFF;

-- 3. Insert Ledger Group Page under Finance Submodule
SET IDENTITY_INSERT bos_pages ON;
BEGIN TRY 
    IF NOT EXISTS (SELECT * FROM bos_pages WHERE page_code = 'M9110')
    BEGIN
        INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) 
        VALUES (180, 1, 90, 'M9110', 'Ledger Group', 1, '/master/finance/ledger-group', 'IconBook2');
    END
END TRY BEGIN CATCH END CATCH;
SET IDENTITY_INSERT bos_pages OFF;

COMMIT;
