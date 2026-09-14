-- ====================================================================================
-- Migration: V1174.0 - Purge and remove mock/placeholder seed data (Zero Mock Data Policy)
-- Description: Removes dummy records (ACME, Globex, Initech, CLI001, CLI002, CLI003)
-- ====================================================================================

-- 1. Remove mock notifications
IF OBJECT_ID(N'CM_CLIENT_NOTIFICATION', N'U') IS NOT NULL
BEGIN
    DELETE FROM CM_CLIENT_NOTIFICATION 
    WHERE CLIENT_CODE IN ('CLI001', 'CLI002', 'CLI003');
END
GO

-- 2. Remove mock configurations
IF OBJECT_ID(N'CM_CLIENT_CONFIGURATION', N'U') IS NOT NULL
BEGIN
    DELETE FROM CM_CLIENT_CONFIGURATION 
    WHERE CLIENT_CODE IN ('CLI001', 'CLI002', 'CLI003')
       OR CONFIG_VALUE LIKE '%acme%' 
       OR CONFIG_VALUE LIKE '%globex%' 
       OR CONFIG_VALUE LIKE '%initech%';
END
GO

-- 3. Remove mock licenses
IF OBJECT_ID(N'CM_CLIENT_LICENSE', N'U') IS NOT NULL
BEGIN
    DELETE FROM CM_CLIENT_LICENSE 
    WHERE CLIENT_CODE IN ('CLI001', 'CLI002', 'CLI003')
       OR LICENSE_KEY IN ('LIC-ACME-999', 'LIC-GLOB-777', 'LIC-INIT-333');
END
GO

-- 4. Remove mock client master records
IF OBJECT_ID(N'CM_CLIENT_MASTER', N'U') IS NOT NULL
BEGIN
    DELETE FROM CM_CLIENT_MASTER 
    WHERE CLIENT_CODE IN ('CLI001', 'CLI002', 'CLI003')
       OR COMPANY_NAME LIKE '%ACME%' 
       OR COMPANY_NAME LIKE '%Globex%' 
       OR COMPANY_NAME LIKE '%Initech%';
END
GO
