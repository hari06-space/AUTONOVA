-- 1. Create SEVERITY_FMEA Table
IF OBJECT_ID('SEVERITY_FMEA', 'U') IS NULL
BEGIN
    CREATE TABLE SEVERITY_FMEA (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        severity_effect NVARCHAR(100) NOT NULL UNIQUE,
        customer_effect NVARCHAR(200) NOT NULL,
        manufacturing_effect NVARCHAR(200) NOT NULL,
        rank INT NOT NULL,
        status BIT NOT NULL DEFAULT 1,
        created_by NVARCHAR(50) NOT NULL,
        created_date DATETIME NOT NULL DEFAULT GETDATE(),
        updated_by NVARCHAR(50) NULL,
        updated_date DATETIME NULL
    );
END
GO

-- 2. Create DETECTION_FMEA Table
IF OBJECT_ID('DETECTION_FMEA', 'U') IS NULL
BEGIN
    CREATE TABLE DETECTION_FMEA (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        detection NVARCHAR(100) NOT NULL UNIQUE,
        criteria NVARCHAR(200) NOT NULL,
        detection_method NVARCHAR(200) NOT NULL,
        a_avail BIT NOT NULL DEFAULT 0,
        b_avail BIT NOT NULL DEFAULT 0,
        c_avail BIT NOT NULL DEFAULT 0,
        rank INT NOT NULL,
        status BIT NOT NULL DEFAULT 1,
        created_by NVARCHAR(50) NOT NULL,
        created_date DATETIME NOT NULL DEFAULT GETDATE(),
        updated_by NVARCHAR(50) NULL,
        updated_date DATETIME NULL
    );
END
GO

-- 3. Create OCCURANCE_FMEA Table
IF OBJECT_ID('OCCURANCE_FMEA', 'U') IS NULL
BEGIN
    CREATE TABLE OCCURANCE_FMEA (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        probablity_of_failure NVARCHAR(100) NOT NULL UNIQUE,
        likely_failure_rates NVARCHAR(200) NOT NULL,
        rank INT NOT NULL,
        status BIT NOT NULL DEFAULT 1,
        created_by NVARCHAR(50) NOT NULL,
        created_date DATETIME NOT NULL DEFAULT GETDATE(),
        updated_by NVARCHAR(50) NULL,
        updated_date DATETIME NULL
    );
END
GO

-- 4. Register Pages in bos_pages (mod_id = 1 [Master], sub_mod_id = 31 [NPD])
IF NOT EXISTS (SELECT 1 FROM bos_pages WHERE page_code = 'M3430')
BEGIN
    INSERT INTO bos_pages (mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon)
    VALUES (1, 31, 'M3430', 'Severity FMEA', 1, '/master/npd/ppap/severity-fmea', 'IconList');
END
GO

IF NOT EXISTS (SELECT 1 FROM bos_pages WHERE page_code = 'M3440')
BEGIN
    INSERT INTO bos_pages (mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon)
    VALUES (1, 31, 'M3440', 'Detection FMEA', 1, '/master/npd/ppap/detection-fmea', 'IconList');
END
GO

IF NOT EXISTS (SELECT 1 FROM bos_pages WHERE page_code = 'M3450')
BEGIN
    INSERT INTO bos_pages (mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon)
    VALUES (1, 31, 'M3450', 'Occurance FMEA', 1, '/master/npd/ppap/occurance-fmea', 'IconList');
END
GO

-- 5. Seed access permissions for all existing users for these pages
INSERT INTO bos_user_page_auth (user_id, page_id, sub_mod_id, mod_id, enable, read_acs, [write], delete_acs, export, approval, manager, additional1, additional2)
SELECT 
    u.user_id, 
    p.page_id, 
    p.sub_mod_id, 
    p.mod_id, 
    1, 1, 1, 1, 1, 1, 1, 1, 1
FROM bos_pages p
CROSS JOIN ad_user_credential u
WHERE p.page_code IN ('M3430', 'M3440', 'M3450')
  AND NOT EXISTS (
      SELECT 1 FROM bos_user_page_auth a 
      WHERE a.user_id = u.user_id AND a.page_id = p.page_id
  );
GO
