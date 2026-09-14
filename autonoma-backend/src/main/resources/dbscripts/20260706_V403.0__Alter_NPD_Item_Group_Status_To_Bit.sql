-- ============================================================================
-- V1012 Alter NPD_ITEM_GROUP and NPD_INVENTORY_TYPE Status to BIT
-- ============================================================================

-- 1. NPD_ITEM_GROUP: Convert status to bit and drop IS_ACTIVE

-- Drop index on STATUS if exists
IF EXISTS (SELECT name FROM sys.indexes WHERE name = N'IX_npd_item_group_status')
    DROP INDEX IX_npd_item_group_status ON NPD_ITEM_GROUP;

-- Convert existing string status to bit (1 or 0)
UPDATE NPD_ITEM_GROUP 
SET STATUS = CASE WHEN STATUS = 'ACTIVE' THEN '1' ELSE '0' END 
WHERE STATUS IN ('ACTIVE', 'INACTIVE');

-- Alter the STATUS column type to BIT
ALTER TABLE NPD_ITEM_GROUP ALTER COLUMN STATUS BIT;

-- Recreate index on STATUS
CREATE NONCLUSTERED INDEX IX_npd_item_group_status ON NPD_ITEM_GROUP(STATUS);

-- Drop default constraint on IS_ACTIVE if it exists
DECLARE @ConstraintName nvarchar(200)
SELECT @ConstraintName = Name 
FROM sys.default_constraints 
WHERE parent_object_id = object_id('NPD_ITEM_GROUP') 
  AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = object_id('NPD_ITEM_GROUP') AND name = 'IS_ACTIVE')

IF @ConstraintName IS NOT NULL
    EXEC('ALTER TABLE NPD_ITEM_GROUP DROP CONSTRAINT ' + @ConstraintName)

-- Drop IS_ACTIVE column
IF EXISTS (SELECT * FROM sys.columns WHERE Name = N'IS_ACTIVE' AND Object_ID = Object_ID(N'NPD_ITEM_GROUP'))
BEGIN
    ALTER TABLE NPD_ITEM_GROUP DROP COLUMN IS_ACTIVE;
END
GO

-- 2. NPD_INVENTORY_TYPE: Convert status to bit

-- Drop index on STATUS if exists
IF EXISTS (SELECT name FROM sys.indexes WHERE name = N'IX_npd_inventory_type_status')
    DROP INDEX IX_npd_inventory_type_status ON NPD_INVENTORY_TYPE;

-- Alter the STATUS column type to BIT
ALTER TABLE NPD_INVENTORY_TYPE ALTER COLUMN STATUS BIT;

-- Recreate index on STATUS
CREATE NONCLUSTERED INDEX IX_npd_inventory_type_status ON NPD_INVENTORY_TYPE(STATUS);
GO
