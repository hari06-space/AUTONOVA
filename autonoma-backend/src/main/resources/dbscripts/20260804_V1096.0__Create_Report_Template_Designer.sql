-- Migration Script to create REPORT_TEMPLATE_MASTER and REPORT_TEMPLATE_HISTORY for the dynamic PDF Report Template Designer
-- Exposes configuration-driven template design configurations and maintains automatic version history.

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[REPORT_TEMPLATE_MASTER]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[REPORT_TEMPLATE_MASTER] (
        [ID] BIGINT IDENTITY(1,1) NOT NULL,
        [TEMPLATE_NAME] NVARCHAR(255) NOT NULL,
        [TEMPLATE_CODE] NVARCHAR(100) NOT NULL,
        [TEMPLATE_TYPE] NVARCHAR(50) NOT NULL,
        [PAGE_ID] INT NOT NULL, -- unique ID of the page (from bos_pages)
        [VERSION] INT DEFAULT 1,
        [DESCRIPTION] NVARCHAR(500) NULL,
        [STATUS] INT DEFAULT 1,
        [IS_DEFAULT] INT DEFAULT 0,
        [TEMPLATE_CONFIG] NVARCHAR(MAX) NOT NULL,
        
        -- Mandatory Audit Columns
        [CREATED_BY] NVARCHAR(50) NOT NULL,
        [CREATED_DATE] DATETIME DEFAULT GETDATE(),
        [UPDATED_BY] NVARCHAR(50) NULL,
        [UPDATED_DATE] DATETIME NULL,
        
        CONSTRAINT [PK_REPORT_TEMPLATE_MASTER] PRIMARY KEY CLUSTERED ([ID] ASC),
        CONSTRAINT [UQ_REPORT_TEMPLATE_CODE] UNIQUE ([TEMPLATE_CODE])
    );

    PRINT 'Created table REPORT_TEMPLATE_MASTER successfully.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[REPORT_TEMPLATE_HISTORY]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[REPORT_TEMPLATE_HISTORY] (
        [ID] BIGINT IDENTITY(1,1) NOT NULL,
        [TEMPLATE_ID] BIGINT NOT NULL,
        [VERSION] INT NOT NULL,
        [TEMPLATE_CONFIG] NVARCHAR(MAX) NOT NULL,
        [CHANGE_LOG] NVARCHAR(500) NULL,
        [CREATED_BY] NVARCHAR(50) NOT NULL,
        [CREATED_DATE] DATETIME DEFAULT GETDATE(),
        
        CONSTRAINT [PK_REPORT_TEMPLATE_HISTORY] PRIMARY KEY CLUSTERED ([ID] ASC),
        CONSTRAINT [FK_REPORT_TEMPLATE_HISTORY_MASTER] FOREIGN KEY ([TEMPLATE_ID]) REFERENCES [REPORT_TEMPLATE_MASTER]([ID]) ON DELETE CASCADE
    );

    PRINT 'Created table REPORT_TEMPLATE_HISTORY successfully.';
END
GO

-- Register Report Template Designer under Admin -> Document & File Management
IF NOT EXISTS (SELECT 1 FROM bos_pages WHERE page_code = 'AD1200')
BEGIN
    BEGIN TRY 
        DECLARE @NewPageId INT = (SELECT ISNULL(MAX(page_id), 0) + 1 FROM bos_pages);
        
        INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) 
        VALUES (
            @NewPageId,
            14, 141, 'AD1200', 'Report Template Designer', 1, '/admin/report-template-designer', 'IconTemplate'
        );
        PRINT 'Registered Report Template Designer successfully.';

        -- Grant access to SUPER BOSS and ADMIN
        INSERT INTO bos_user_page_auth (user_id, page_id, enable)
        SELECT u.user_id, @NewPageId, 1
        FROM ad_user_credential u
        WHERE u.user_level >= 5 OR u.user_id IN ('SUPER BOSS', 'ADMIN')
        AND NOT EXISTS (SELECT 1 FROM bos_user_page_auth a WHERE a.user_id = u.user_id AND a.page_id = @NewPageId);
        
        PRINT 'Granted permissions successfully.';
    END TRY 
    BEGIN CATCH 
        PRINT 'Error registering Report Template Designer page: ' + ERROR_MESSAGE();
    END CATCH;
END
GO
