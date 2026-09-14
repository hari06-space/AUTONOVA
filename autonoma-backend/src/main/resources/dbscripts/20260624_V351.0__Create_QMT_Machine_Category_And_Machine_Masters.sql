-- ==============================================================================
-- Migration Script: V351.0 Create QMT Machine Category and Machine Masters
-- Description: Creates QMT_MACHINE_CATEGORY and QMT_MACHINE tables and registers pages.
-- ==============================================================================

-- 1. Register QMT Submodule under Masters (mod_id = 1) if not exists
SET IDENTITY_INSERT bos_sub_modules ON;
IF NOT EXISTS (SELECT 1 FROM bos_sub_modules WHERE sub_mod_id = 60)
BEGIN
    INSERT INTO bos_sub_modules (sub_mod_id, mod_id, parent_sub_mod_id, sub_mod_code, sub_mod_name)
    VALUES (60, 1, NULL, 'M6000', 'QMT');
END
SET IDENTITY_INSERT bos_sub_modules OFF;
GO

-- 2. Register Pages in bos_pages
IF NOT EXISTS (SELECT 1 FROM bos_pages WHERE page_code = 'M3510')
BEGIN
    INSERT INTO bos_pages (mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon)
    VALUES (1, 60, 'M3510', 'Machine Category Master', 1, '/master/qmt/machine-category', 'IconCategory');
END
GO

IF NOT EXISTS (SELECT 1 FROM bos_pages WHERE page_code = 'M3520')
BEGIN
    INSERT INTO bos_pages (mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon)
    VALUES (1, 60, 'M3520', 'Machine Master', 1, '/master/qmt/machine', 'IconCpu');
END
GO

-- 3. Register Group Collapse Page Code for QMT so RBAC doesn't fail on collapse menu
IF NOT EXISTS (SELECT 1 FROM bos_pages WHERE page_code = 'M3500')
BEGIN
    INSERT INTO bos_pages (mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon)
    VALUES (1, 60, 'M3500', 'QMT Collapse', 1, NULL, NULL);
END
GO

-- 4. Grant default access permissions to all existing users
INSERT INTO bos_user_page_auth (user_id, page_id, sub_mod_id, mod_id, enable, read_acs, [write], delete_acs, export, approval, manager, additional1, additional2, add_task_enable)
SELECT 
    u.user_id, 
    p.page_id, 
    p.sub_mod_id, 
    p.mod_id, 
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1
FROM bos_pages p
CROSS JOIN ad_user_credential u
WHERE p.page_code IN ('M3500', 'M3510', 'M3520')
  AND NOT EXISTS (
      SELECT 1 FROM bos_user_page_auth a 
      WHERE a.user_id = u.user_id AND a.page_id = p.page_id
  );
GO

-- 5. Create QMT_MACHINE_CATEGORY table
IF OBJECT_ID('QMT_MACHINE_CATEGORY', 'U') IS NULL
BEGIN
    CREATE TABLE QMT_MACHINE_CATEGORY (
        CODE NVARCHAR(30) NOT NULL,
        CATEGORY_NAME NVARCHAR(100) NOT NULL,
        DESCRIPTION NVARCHAR(255) NULL,
        STATUS INT NOT NULL DEFAULT 1,
        
        -- Audit fields
        CREATED_BY NVARCHAR(50) NOT NULL,
        CREATED_DATE DATETIME NOT NULL,
        UPDATED_BY NVARCHAR(50) NULL,
        UPDATED_DATE DATETIME NULL,
        
        CONSTRAINT PK_QMT_MACHINE_CATEGORY PRIMARY KEY (CODE),
        CONSTRAINT FK_QMT_MACHINE_CATEGORY_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES AD_USER_CREDENTIAL(USER_ID),
        CONSTRAINT FK_QMT_MACHINE_CATEGORY_UPDATED_BY FOREIGN KEY (UPDATED_BY) REFERENCES AD_USER_CREDENTIAL(USER_ID)
    );
END
GO

-- 6. Create QMT_MACHINE table
IF OBJECT_ID('QMT_MACHINE', 'U') IS NULL
BEGIN
    CREATE TABLE QMT_MACHINE (
        MACHINE_CODE NVARCHAR(50) NOT NULL,
        MACHINE_NAME NVARCHAR(100) NOT NULL,
        CATEGORY_CODE NVARCHAR(30) NOT NULL,
        SPECIFICATIONS NVARCHAR(2000) NULL,
        SERIAL_NUMBER NVARCHAR(100) NULL,
        MAKE NVARCHAR(100) NULL,
        YEAR_OF_MANUFACTURE INT NULL,
        STATUS INT NOT NULL DEFAULT 1,
        
        -- Audit fields
        CREATED_BY NVARCHAR(50) NOT NULL,
        CREATED_DATE DATETIME NOT NULL,
        UPDATED_BY NVARCHAR(50) NULL,
        UPDATED_DATE DATETIME NULL,
        
        CONSTRAINT PK_QMT_MACHINE PRIMARY KEY (MACHINE_CODE),
        CONSTRAINT FK_QMT_MACHINE_CATEGORY_CODE FOREIGN KEY (CATEGORY_CODE) REFERENCES QMT_MACHINE_CATEGORY(CODE),
        CONSTRAINT FK_QMT_MACHINE_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES AD_USER_CREDENTIAL(USER_ID),
        CONSTRAINT FK_QMT_MACHINE_UPDATED_BY FOREIGN KEY (UPDATED_BY) REFERENCES AD_USER_CREDENTIAL(USER_ID)
    );
    CREATE INDEX IX_QMT_MACHINE_CATEGORY ON QMT_MACHINE(CATEGORY_CODE);
END
GO
