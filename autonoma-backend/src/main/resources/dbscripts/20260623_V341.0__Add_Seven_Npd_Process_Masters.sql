-- 1. Create NPD_CHARACTER_SPECIFICATION Table
IF OBJECT_ID('NPD_CHARACTER_SPECIFICATION', 'U') IS NULL
BEGIN
    CREATE TABLE NPD_CHARACTER_SPECIFICATION (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        character_specification NVARCHAR(100) NOT NULL UNIQUE,
        status BIT NOT NULL DEFAULT 1,
        created_by NVARCHAR(50) NOT NULL,
        created_date DATETIME NOT NULL DEFAULT GETDATE(),
        updated_by NVARCHAR(50) NULL,
        updated_date DATETIME NULL
    );
END
GO

-- 2. Create NPD_SAMPLE_SIZE Table
IF OBJECT_ID('NPD_SAMPLE_SIZE', 'U') IS NULL
BEGIN
    CREATE TABLE NPD_SAMPLE_SIZE (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        size NVARCHAR(100) NOT NULL UNIQUE,
        status BIT NOT NULL DEFAULT 1,
        created_by NVARCHAR(50) NOT NULL,
        created_date DATETIME NOT NULL DEFAULT GETDATE(),
        updated_by NVARCHAR(50) NULL,
        updated_date DATETIME NULL
    );
END
GO

-- 3. Create NPD_SAMPLE_FREQUENCY Table
IF OBJECT_ID('NPD_SAMPLE_FREQUENCY', 'U') IS NULL
BEGIN
    CREATE TABLE NPD_SAMPLE_FREQUENCY (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        frequency NVARCHAR(100) NOT NULL UNIQUE,
        status BIT NOT NULL DEFAULT 1,
        created_by NVARCHAR(50) NOT NULL,
        created_date DATETIME NOT NULL DEFAULT GETDATE(),
        updated_by NVARCHAR(50) NULL,
        updated_date DATETIME NULL
    );
END
GO

-- 4. Create NPD_CONTROL_METHOD Table
IF OBJECT_ID('NPD_CONTROL_METHOD', 'U') IS NULL
BEGIN
    CREATE TABLE NPD_CONTROL_METHOD (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        control_method NVARCHAR(100) NOT NULL UNIQUE,
        status BIT NOT NULL DEFAULT 1,
        created_by NVARCHAR(50) NOT NULL,
        created_date DATETIME NOT NULL DEFAULT GETDATE(),
        updated_by NVARCHAR(50) NULL,
        updated_date DATETIME NULL
    );
END
GO

-- 5. Create NPD_FEASIBILITY_CATEGORY Table
IF OBJECT_ID('NPD_FEASIBILITY_CATEGORY', 'U') IS NULL
BEGIN
    CREATE TABLE NPD_FEASIBILITY_CATEGORY (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        type NVARCHAR(20) NOT NULL CHECK (type IN ('FEASIBILITY', 'PRODUCT REVIEW')),
        category NVARCHAR(100) NOT NULL UNIQUE,
        seq_no INT NULL,
        description NVARCHAR(200) NULL,
        status BIT NOT NULL DEFAULT 1,
        created_by NVARCHAR(50) NOT NULL,
        created_date DATETIME NOT NULL DEFAULT GETDATE(),
        updated_by NVARCHAR(50) NULL,
        updated_date DATETIME NULL
    );
END
GO

-- 6. Create NPD_CORRECTIVE_ACTION Table
IF OBJECT_ID('NPD_CORRECTIVE_ACTION', 'U') IS NULL
BEGIN
    CREATE TABLE NPD_CORRECTIVE_ACTION (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        short_name NVARCHAR(20) NOT NULL UNIQUE,
        corrective_plan NVARCHAR(200) NOT NULL UNIQUE,
        status BIT NOT NULL DEFAULT 1,
        created_by NVARCHAR(50) NOT NULL,
        created_date DATETIME NOT NULL DEFAULT GETDATE(),
        updated_by NVARCHAR(50) NULL,
        updated_date DATETIME NULL
    );
END
GO

-- 7. Create NPD_REACTION_PLAN Table
IF OBJECT_ID('NPD_REACTION_PLAN', 'U') IS NULL
BEGIN
    CREATE TABLE NPD_REACTION_PLAN (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        short_name NVARCHAR(20) NOT NULL UNIQUE,
        reaction_plan NVARCHAR(200) NOT NULL UNIQUE,
        status BIT NOT NULL DEFAULT 1,
        created_by NVARCHAR(50) NOT NULL,
        created_date DATETIME NOT NULL DEFAULT GETDATE(),
        updated_by NVARCHAR(50) NULL,
        updated_date DATETIME NULL
    );
END
GO

-- 8. Register Pages in bos_pages
IF NOT EXISTS (SELECT 1 FROM bos_pages WHERE page_code = 'M3360')
BEGIN
    INSERT INTO bos_pages (mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon)
    VALUES (1, 31, 'M3360', 'Character Specification', 1, '/master/npd/process/character-specification', 'IconList');
END
GO

IF NOT EXISTS (SELECT 1 FROM bos_pages WHERE page_code = 'M3370')
BEGIN
    INSERT INTO bos_pages (mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon)
    VALUES (1, 31, 'M3370', 'Sample Size', 1, '/master/npd/process/sample-size', 'IconRuler2');
END
GO

IF NOT EXISTS (SELECT 1 FROM bos_pages WHERE page_code = 'M3380')
BEGIN
    INSERT INTO bos_pages (mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon)
    VALUES (1, 31, 'M3380', 'Sample Frequency', 1, '/master/npd/process/sample-frequency', 'IconClock');
END
GO

IF NOT EXISTS (SELECT 1 FROM bos_pages WHERE page_code = 'M3390')
BEGIN
    INSERT INTO bos_pages (mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon)
    VALUES (1, 31, 'M3390', 'Control Method', 1, '/master/npd/process/control-method', 'IconShield');
END
GO

IF NOT EXISTS (SELECT 1 FROM bos_pages WHERE page_code = 'M3400')
BEGIN
    INSERT INTO bos_pages (mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon)
    VALUES (1, 31, 'M3400', 'Feasibility Category', 1, '/master/npd/process/feasibility-category', 'IconCategory');
END
GO

IF NOT EXISTS (SELECT 1 FROM bos_pages WHERE page_code = 'M3410')
BEGIN
    INSERT INTO bos_pages (mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon)
    VALUES (1, 31, 'M3410', 'Corrective Action', 1, '/master/npd/process/corrective-action', 'IconAlertTriangle');
END
GO

IF NOT EXISTS (SELECT 1 FROM bos_pages WHERE page_code = 'M3420')
BEGIN
    INSERT INTO bos_pages (mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon)
    VALUES (1, 31, 'M3420', 'Reaction Plan', 1, '/master/npd/process/reaction-plan', 'IconFlame');
END
GO

-- 9. Grant permissions to all existing users for these pages
INSERT INTO bos_user_page_auth (user_id, page_id, sub_mod_id, mod_id, enable, read_acs, [write], delete_acs, export, approval, manager, additional1, additional2)
SELECT 
    u.user_id, 
    p.page_id, 
    p.sub_mod_id, 
    p.mod_id, 
    1, 1, 1, 1, 1, 1, 1, 1, 1
FROM bos_pages p
CROSS JOIN ad_user_credential u
WHERE p.page_code IN ('M3360', 'M3370', 'M3380', 'M3390', 'M3400', 'M3410', 'M3420')
  AND NOT EXISTS (
      SELECT 1 FROM bos_user_page_auth a 
      WHERE a.user_id = u.user_id AND a.page_id = p.page_id
  );
GO
