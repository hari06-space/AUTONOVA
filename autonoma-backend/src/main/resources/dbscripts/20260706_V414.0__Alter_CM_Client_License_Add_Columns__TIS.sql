-- SQL Migration: Alter CM_CLIENT_LICENSE to Add Custom Restrictions Columns
-- Created: 2026-07-06

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CM_CLIENT_LICENSE]') AND type in (N'U'))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CM_CLIENT_LICENSE]') AND name = 'MAX_USERS')
    BEGIN
        ALTER TABLE CM_CLIENT_LICENSE ADD MAX_USERS INT DEFAULT 100;
    END;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CM_CLIENT_LICENSE]') AND name = 'MAX_COMPANIES')
    BEGIN
        ALTER TABLE CM_CLIENT_LICENSE ADD MAX_COMPANIES INT DEFAULT 5;
    END;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CM_CLIENT_LICENSE]') AND name = 'ENABLED_MODULES')
    BEGIN
        ALTER TABLE CM_CLIENT_LICENSE ADD ENABLED_MODULES NVARCHAR(MAX) DEFAULT '["dashboard", "masters", "hrms", "sales", "purchase", "production", "storelogistics", "finance", "designdev", "maintenance", "qms", "qmt", "orderMenu", "reports", "employeeselfcare", "admin", "support", "client-monitoring"]';
    END;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CM_CLIENT_LICENSE]') AND name = 'SUPPORT_EXPIRY')
    BEGIN
        ALTER TABLE CM_CLIENT_LICENSE ADD SUPPORT_EXPIRY DATETIME;
    END;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CM_CLIENT_LICENSE]') AND name = 'VERSION_COMPATIBILITY')
    BEGIN
        ALTER TABLE CM_CLIENT_LICENSE ADD VERSION_COMPATIBILITY NVARCHAR(100) DEFAULT 'v1.4.x';
    END;
END;
