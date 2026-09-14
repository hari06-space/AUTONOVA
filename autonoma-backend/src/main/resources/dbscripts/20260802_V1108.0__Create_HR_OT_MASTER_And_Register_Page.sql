-- =========================================================================================
-- Migration Script: Create HR_OT_MASTER Table and Register OT Details & OT Verify Pages
-- Date: 2026-08-02
-- Author: Autonoma ERP AI
-- =========================================================================================

-- 1. Create HR_OT_MASTER Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[HR_OT_MASTER]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[HR_OT_MASTER] (
        [ID] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [COMPANY_ID] BIGINT NOT NULL,
        [DIVISION_ID] BIGINT NULL,
        [EMPLOYEE_ID] BIGINT NOT NULL,
        [OT_DATE] DATE NOT NULL,
        [DURATION_MINUTES] INT NOT NULL, -- Stored strictly in minutes for aggregate queries
        [STATUS_ID] INT NOT NULL,
        [VERIFICATION_STATUS] NVARCHAR(50) DEFAULT 'PENDING_VERIFICATION',
        [VERTICAL_HEAD_ID] BIGINT NULL,
        [VERIFIED_BY] NVARCHAR(50) NULL,
        [VERIFIED_DATE] DATETIME NULL,
        [REJECT_REASON] NVARCHAR(500) NULL,
        [REMARKS] NVARCHAR(500) NULL,
        [FROM_WHERE] NVARCHAR(25) DEFAULT 'OT Master',
        
        -- Mandatory Audit Columns
        [CREATED_BY] NVARCHAR(50) NOT NULL,
        [CREATED_DATE] DATETIME NOT NULL DEFAULT GETDATE(),
        [UPDATED_BY] NVARCHAR(50) NULL,
        [UPDATED_DATE] DATETIME NULL,
        [ACTIVE_STATUS] BIT NOT NULL DEFAULT 1,

        CONSTRAINT [FK_HR_OT_MASTER_USER_CREATED] FOREIGN KEY ([CREATED_BY]) REFERENCES [dbo].[AD_USER_CREDENTIAL]([USER_ID]),
        CONSTRAINT [FK_HR_OT_MASTER_USER_UPDATED] FOREIGN KEY ([UPDATED_BY]) REFERENCES [dbo].[AD_USER_CREDENTIAL]([USER_ID])
    );

    CREATE INDEX [IX_HR_OT_MASTER_EMP_DATE] ON [dbo].[HR_OT_MASTER] ([EMPLOYEE_ID], [OT_DATE]);
    CREATE INDEX [IX_HR_OT_MASTER_STATUS] ON [dbo].[HR_OT_MASTER] ([STATUS_ID], [VERIFICATION_STATUS]);
END
GO

-- 2. Seed Default Application Preference for OT Verification Requirement
IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AD_APP_PREFERENCE]') AND type in (N'U'))
BEGIN
    IF NOT EXISTS (SELECT 1 FROM [dbo].[AD_APP_PREFERENCE] WHERE [PREF_NAME] = 'HR_OT_VERIFICATION_REQUIRED')
    BEGIN
        INSERT INTO [dbo].[AD_APP_PREFERENCE] ([PREF_NAME], [PREF_VALUE], [COMMENTS], [PREF_TYPE], [CREATED_BY], [CREATED_DATE])
        VALUES ('HR_OT_VERIFICATION_REQUIRED', 'YES', 'Controls whether OT entries require HOD/Vertical Head verification before payroll calculation', 'HRA', 'ADMIN', GETDATE());
    END
END
GO

-- 3. Register BOS Pages: HA1347 (OT Details), HA1348 (OT Verify), HA1130 (OT Master)
SET IDENTITY_INSERT [dbo].[bos_pages] ON;
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[bos_pages] WHERE [page_code] = 'HA1347')
BEGIN
    INSERT INTO [dbo].[bos_pages] ([page_id], [mod_id], [sub_mod_id], [page_code], [page_name], [enabled], [page_url], [icon])
    VALUES (43050, 2, 203, 'HA1347', 'Overtime (OT) Details', 1, '/hra/attendance/ot-details', 'IconClock');
END
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[bos_pages] WHERE [page_code] = 'HA1348')
BEGIN
    INSERT INTO [dbo].[bos_pages] ([page_id], [mod_id], [sub_mod_id], [page_code], [page_name], [enabled], [page_url], [icon])
    VALUES (43051, 2, 203, 'HA1348', 'Overtime (OT) Verification', 1, '/hra/attendance/ot-verify', 'IconChecklist');
END
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[bos_pages] WHERE [page_code] = 'HA1130')
BEGIN
    INSERT INTO [dbo].[bos_pages] ([page_id], [mod_id], [sub_mod_id], [page_code], [page_name], [enabled], [page_url], [icon])
    VALUES (43052, 2, 203, 'HA1130', 'Overtime (OT) Master', 1, '/hra/attendance/ot-master', 'IconClock');
END
GO

SET IDENTITY_INSERT [dbo].[bos_pages] OFF;
GO

-- 4. Auto-grant Page Authorization in bos_user_page_auth for Active Users
INSERT INTO [dbo].[bos_user_page_auth] (
    [user_id], [page_id], [sub_mod_id], [mod_id], [enable], 
    [read_acs], [write], [delete_acs], [export], [approval], [manager], 
    [created_by], [created_date]
)
SELECT 
    u.[USER_ID], p.[page_id], p.[sub_mod_id], p.[mod_id], 1, 
    1, 1, 1, 1, 1, 1, 
    'SYSTEM', GETDATE()
FROM [dbo].[AD_USER_CREDENTIAL] u
CROSS JOIN (
    SELECT [page_id], [sub_mod_id], [mod_id] FROM [dbo].[bos_pages] WHERE [page_code] IN ('HA1347', 'HA1348', 'HA1130')
) p
WHERE NOT EXISTS (
    SELECT 1 FROM [dbo].[bos_user_page_auth] a 
    WHERE a.[user_id] = u.[USER_ID] AND a.[page_id] = p.[page_id]
);
GO
