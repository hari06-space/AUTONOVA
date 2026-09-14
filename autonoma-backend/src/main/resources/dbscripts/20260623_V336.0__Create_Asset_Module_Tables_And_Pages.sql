-- 20260623_V336.0__Create_Asset_Module_Tables_And_Pages.sql
-- Purpose: Create Asset Group, Type, Subtype, and Master tables.
--          Register sub-module and pages in BOS_SUB_MODULES and BOS_PAGES.
--          Grant permissions to all active users.
GO

-- 1. Create AST_GROUP
CREATE TABLE AST_GROUP (
    GROUP_NAME NVARCHAR(100) NOT NULL PRIMARY KEY,
    DESCRIPTION NVARCHAR(MAX),
    STATUS NVARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    CREATED_BY NVARCHAR(100),
    CREATED_DATE DATETIME,
    UPDATED_BY NVARCHAR(100),
    UPDATED_DATE DATETIME
);

-- 2. Create AST_TYPE
CREATE TABLE AST_TYPE (
    ITEM_TYPE NVARCHAR(100) NOT NULL PRIMARY KEY,
    GROUP_NAME NVARCHAR(100) NOT NULL FOREIGN KEY REFERENCES AST_GROUP(GROUP_NAME),
    STATUS NVARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    CREATED_BY NVARCHAR(100),
    CREATED_DATE DATETIME,
    UPDATED_BY NVARCHAR(100),
    UPDATED_DATE DATETIME
);

-- 3. Create AST_SUBTYPE
CREATE TABLE AST_SUBTYPE (
    SUB_TYPE NVARCHAR(100) NOT NULL PRIMARY KEY,
    ITEM_TYPE NVARCHAR(100) NOT NULL FOREIGN KEY REFERENCES AST_TYPE(ITEM_TYPE),
    STATUS NVARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    CREATED_BY NVARCHAR(100),
    CREATED_DATE DATETIME,
    UPDATED_BY NVARCHAR(100),
    UPDATED_DATE DATETIME
);

-- 4. Create AST_MASTER
CREATE TABLE AST_MASTER (
    ID BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    ASSET_NO NVARCHAR(100) NOT NULL UNIQUE,
    ASSET_NAME NVARCHAR(255) NOT NULL UNIQUE,
    DESCRIPTION NVARCHAR(MAX),
    STATUS NVARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    IS_ACTIVE BIT NOT NULL DEFAULT 1,
    ASSET_GROUP NVARCHAR(100) NOT NULL FOREIGN KEY REFERENCES AST_GROUP(GROUP_NAME),
    ASSET_TYPE NVARCHAR(100) NOT NULL FOREIGN KEY REFERENCES AST_TYPE(ITEM_TYPE),
    ASSET_SUBTYPE NVARCHAR(100) NOT NULL FOREIGN KEY REFERENCES AST_SUBTYPE(SUB_TYPE),
    CREATED_BY NVARCHAR(100),
    CREATED_DATE DATETIME,
    UPDATED_BY NVARCHAR(100),
    UPDATED_DATE DATETIME
);

-- 5. Register Sub-module under Masters (mod_id = 1)
DECLARE @SubModId INT;

IF NOT EXISTS (SELECT 1 FROM bos_sub_modules WHERE sub_mod_code = 'M3500')
BEGIN
    INSERT INTO bos_sub_modules (mod_id, parent_sub_mod_id, sub_mod_code, sub_mod_name, icon)
    VALUES (1, NULL, 'M3500', 'ASSET', 'IconArchive');
END;

SELECT @SubModId = sub_mod_id FROM bos_sub_modules WHERE sub_mod_code = 'M3500';

-- 6. Register Pages
IF NOT EXISTS (SELECT 1 FROM bos_pages WHERE page_code = 'M3510')
    INSERT INTO bos_pages (mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon)
    VALUES (1, @SubModId, 'M3510', 'Asset Group', 1, '/master/asset/group', 'IconCategory');

IF NOT EXISTS (SELECT 1 FROM bos_pages WHERE page_code = 'M3520')
    INSERT INTO bos_pages (mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon)
    VALUES (1, @SubModId, 'M3520', 'Asset Type', 1, '/master/asset/type', 'IconListCheck');

IF NOT EXISTS (SELECT 1 FROM bos_pages WHERE page_code = 'M3530')
    INSERT INTO bos_pages (mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon)
    VALUES (1, @SubModId, 'M3530', 'Asset Sub Type', 1, '/master/asset/subtype', 'IconNotes');

IF NOT EXISTS (SELECT 1 FROM bos_pages WHERE page_code = 'M3540')
    INSERT INTO bos_pages (mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon)
    VALUES (1, @SubModId, 'M3540', 'Asset Master', 1, '/master/asset/master', 'IconSettings');

-- 7. Grant access to all users
INSERT INTO bos_user_page_auth (
    user_id, page_id, sub_mod_id, mod_id,
    enable, read_acs, [write], delete_acs, export, approval, manager,
    additional1, additional2, add_task_enable
)
SELECT 
    u.user_id, 
    p.page_id, 
    p.sub_mod_id, 
    p.mod_id, 
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1
FROM bos_pages p
CROSS JOIN ad_user_credential u
WHERE p.page_code IN ('M3510', 'M3520', 'M3530', 'M3540')
  AND NOT EXISTS (
      SELECT 1 FROM bos_user_page_auth upa 
      WHERE upa.user_id = u.user_id AND upa.page_id = p.page_id
  );

PRINT 'V336.0 complete: Asset module tables created and pages registered.';
GO
