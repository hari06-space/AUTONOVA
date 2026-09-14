-- Organization: Nutech Wind Parts Pvt Ltd
-- Owner: Nutech
-- Created At: 2026-08-31
-- Description: Drop Product BOM and Product Process tables, constraints, and page registrations

-- 1. Drop Product Process sub-tables
IF OBJECT_ID('dbo.DD_PRODUCT_PROCESS_MACHINE', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.DD_PRODUCT_PROCESS_MACHINE;
END;

IF OBJECT_ID('dbo.DD_PRODUCT_PROCESS_TOOL', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.DD_PRODUCT_PROCESS_TOOL;
END;

-- 2. Drop Product Process main table
IF OBJECT_ID('dbo.DD_PRODUCT_PROCESS', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.DD_PRODUCT_PROCESS;
END;

-- 3. Drop Product BOM sub-tables
IF OBJECT_ID('dbo.NPD_BOM_DETAILS', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.NPD_BOM_DETAILS;
END;

-- 4. Drop Product BOM main table
IF OBJECT_ID('dbo.NPD_BOM_MASTER', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.NPD_BOM_MASTER;
END;

-- 5. Delete user authorizations for these pages
DELETE FROM dbo.BOS_USER_PAGE_AUTH
WHERE PAGE_ID IN (SELECT PAGE_ID FROM dbo.BOS_PAGES WHERE PAGE_CODE IN ('DD1110', 'DD1111'));

-- 6. Delete page registrations from BOS_PAGES
DELETE FROM dbo.BOS_PAGES
WHERE PAGE_CODE IN ('DD1110', 'DD1111');
