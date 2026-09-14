-- ==============================================================================
-- Migration Script: V1011.0 Restructure Asset Master constraints referencing new active tables
-- Description: Drop foreign key constraints on AST_MASTER pointing to empty AST_ tables
--              and recreate constraints pointing to active ASSET_ tables.
--              Finally, clean up obsolete tables (AST_GROUP, AST_TYPE, AST_SUBTYPE).
-- ==============================================================================

-- 1. Drop foreign key constraints dynamically if they exist on AST_MASTER referencing AST_GROUP, AST_TYPE, or AST_SUBTYPE
DECLARE @sql NVARCHAR(MAX) = '';

SELECT @sql += 'ALTER TABLE [dbo].[AST_MASTER] DROP CONSTRAINT [' + name + '];' + CHAR(13) + CHAR(10)
FROM sys.foreign_keys 
WHERE parent_object_id = OBJECT_ID('AST_MASTER')
  AND referenced_object_id IN (
      OBJECT_ID('AST_GROUP'), 
      OBJECT_ID('AST_TYPE'), 
      OBJECT_ID('AST_SUBTYPE')
  );

IF @sql <> ''
BEGIN
    EXEC sp_executesql @sql;
END
GO

-- 2. Ensure foreign keys on AST_MASTER pointing to active ASSET_GROUP, ASSET_TYPE, and ASSET_SUB_TYPE tables are added
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_AST_MASTER_ASSET_GROUP' AND parent_object_id = OBJECT_ID('dbo.AST_MASTER'))
BEGIN
    ALTER TABLE [dbo].[AST_MASTER] WITH CHECK ADD CONSTRAINT [FK_AST_MASTER_ASSET_GROUP] 
    FOREIGN KEY ([ASSET_GROUP]) REFERENCES [dbo].[ASSET_GROUP] ([GROUP_NAME]);
    
    ALTER TABLE [dbo].[AST_MASTER] CHECK CONSTRAINT [FK_AST_MASTER_ASSET_GROUP];
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_AST_MASTER_ASSET_TYPE' AND parent_object_id = OBJECT_ID('dbo.AST_MASTER'))
BEGIN
    ALTER TABLE [dbo].[AST_MASTER] WITH CHECK ADD CONSTRAINT [FK_AST_MASTER_ASSET_TYPE] 
    FOREIGN KEY ([ASSET_TYPE]) REFERENCES [dbo].[ASSET_TYPE] ([TYPE]);
    
    ALTER TABLE [dbo].[AST_MASTER] CHECK CONSTRAINT [FK_AST_MASTER_ASSET_TYPE];
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_AST_MASTER_ASSET_SUBTYPE' AND parent_object_id = OBJECT_ID('dbo.AST_MASTER'))
BEGIN
    ALTER TABLE [dbo].[AST_MASTER] WITH CHECK ADD CONSTRAINT [FK_AST_MASTER_ASSET_SUBTYPE] 
    FOREIGN KEY ([ASSET_SUBTYPE]) REFERENCES [dbo].[ASSET_SUB_TYPE] ([SUB_TYPE_NAME]);
    
    ALTER TABLE [dbo].[AST_MASTER] CHECK CONSTRAINT [FK_AST_MASTER_ASSET_SUBTYPE];
END
GO

-- 3. Safely drop obsolete empty tables to clean up database schema
IF OBJECT_ID('dbo.AST_SUBTYPE', 'U') IS NOT NULL DROP TABLE dbo.AST_SUBTYPE;
IF OBJECT_ID('dbo.AST_TYPE', 'U') IS NOT NULL DROP TABLE dbo.AST_TYPE;
IF OBJECT_ID('dbo.AST_GROUP', 'U') IS NOT NULL DROP TABLE dbo.AST_GROUP;
GO

PRINT 'V1011.0 Complete: Asset Master constraints restructured and obsolete tables cleaned up.';
GO
