-- ============================================================================
-- V1013 Alter NPD_ITEM_TYPE Status to BIT
-- ============================================================================

-- Drop index on STATUS if exists
IF EXISTS (SELECT name FROM sys.indexes WHERE name = N'IX_npd_item_type_status')
    DROP INDEX IX_npd_item_type_status ON NPD_ITEM_TYPE;

-- Drop default constraint on STATUS if it exists
DECLARE @ConstraintName nvarchar(200)
SELECT @ConstraintName = Name 
FROM sys.default_constraints 
WHERE parent_object_id = object_id('NPD_ITEM_TYPE') 
  AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = object_id('NPD_ITEM_TYPE') AND name = 'STATUS')

IF @ConstraintName IS NOT NULL
    EXEC('ALTER TABLE NPD_ITEM_TYPE DROP CONSTRAINT ' + @ConstraintName)

-- Convert existing string status to '1' or '0' strings first
UPDATE NPD_ITEM_TYPE SET STATUS = '1' WHERE STATUS = 'ACTIVE';
UPDATE NPD_ITEM_TYPE SET STATUS = '0' WHERE STATUS = 'INACTIVE';
UPDATE NPD_ITEM_TYPE SET STATUS = '1' WHERE STATUS NOT IN ('0', '1');
GO

-- Alter the STATUS column type to BIT
ALTER TABLE NPD_ITEM_TYPE ALTER COLUMN STATUS BIT;

-- Recreate index on STATUS
CREATE NONCLUSTERED INDEX IX_npd_item_type_status ON NPD_ITEM_TYPE(STATUS);
GO
