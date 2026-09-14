-- ============================================================================
-- DB Script: 20260905_V1229.0__Drop_Old_FK_CLI_LICENSE_CLIENT.sql
-- Module: Platform / Identity / Client Management
-- Description:
--   Drops legacy FK_CLI_LICENSE_CLIENT referencing CLI_CLIENT_MASTER
--   and ensures FK_CLI_LICENSE_COMPANY references AD_COMPANY_CREDENTIAL(id).
-- ============================================================================

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'CLI_CLIENT_LICENSE')
BEGIN
    -- Drop old foreign key constraint FK_CLI_LICENSE_CLIENT referencing CLI_CLIENT_MASTER if exists
    IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_CLI_LICENSE_CLIENT' AND parent_object_id = OBJECT_ID('CLI_CLIENT_LICENSE'))
    BEGIN
        ALTER TABLE CLI_CLIENT_LICENSE DROP CONSTRAINT FK_CLI_LICENSE_CLIENT;
    END

    IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_CLI_LICENSE_CLIENT_ID' AND parent_object_id = OBJECT_ID('CLI_CLIENT_LICENSE'))
    BEGIN
        ALTER TABLE CLI_CLIENT_LICENSE DROP CONSTRAINT FK_CLI_LICENSE_CLIENT_ID;
    END

    -- Add new foreign key referencing AD_COMPANY_CREDENTIAL(id) if not present
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_CLI_LICENSE_COMPANY' AND parent_object_id = OBJECT_ID('CLI_CLIENT_LICENSE'))
    BEGIN
        ALTER TABLE CLI_CLIENT_LICENSE 
        ADD CONSTRAINT FK_CLI_LICENSE_COMPANY FOREIGN KEY (CLIENT_ID) REFERENCES AD_COMPANY_CREDENTIAL(id);
    END
END
GO
