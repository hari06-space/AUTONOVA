-- Alter STATUS column in NPD_ITEM_GROUP to NVARCHAR(20) to match entity mapping

IF EXISTS (
    SELECT 1 
    FROM sys.columns c
    JOIN sys.tables t ON c.object_id = t.object_id
    JOIN sys.types ty ON c.user_type_id = ty.user_type_id
    WHERE t.name = 'NPD_ITEM_GROUP' 
      AND c.name = 'STATUS' 
      AND ty.name = 'bit'
)
BEGIN
    -- 1. Drop dependent index
    IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_npd_item_group_status' AND object_id = OBJECT_ID('NPD_ITEM_GROUP'))
    BEGIN
        DROP INDEX IX_npd_item_group_status ON NPD_ITEM_GROUP;
        PRINT 'Dropped index IX_npd_item_group_status';
    END

    -- 2. Alter column
    ALTER TABLE NPD_ITEM_GROUP ALTER COLUMN STATUS NVARCHAR(20) NOT NULL;
    PRINT 'Altered STATUS column in NPD_ITEM_GROUP from bit to NVARCHAR(20)';

    -- 3. Recreate index
    CREATE INDEX IX_npd_item_group_status ON NPD_ITEM_GROUP (STATUS);
    PRINT 'Recreated index IX_npd_item_group_status';
END
ELSE
BEGIN
    PRINT 'STATUS column in NPD_ITEM_GROUP is already altered or not bit.';
END
GO
