-- Alter NPD_OEM status column to BIT and drop IS_ACTIVE column
SET NOCOUNT ON;

-- 1. Drop Default Constraints on IS_ACTIVE and STATUS if they exist
DECLARE @ConstraintName nvarchar(200);

-- Drop default for IS_ACTIVE
SELECT @ConstraintName = d.name
FROM sys.tables t
JOIN sys.default_constraints d ON d.parent_object_id = t.object_id
JOIN sys.columns c ON c.object_id = t.object_id AND c.column_id = d.parent_column_id
WHERE t.name = 'NPD_OEM' AND c.name = 'IS_ACTIVE';

IF @ConstraintName IS NOT NULL
BEGIN
    EXEC('ALTER TABLE [dbo].[NPD_OEM] DROP CONSTRAINT ' + @ConstraintName);
END

-- Drop default for STATUS
SELECT @ConstraintName = d.name
FROM sys.tables t
JOIN sys.default_constraints d ON d.parent_object_id = t.object_id
JOIN sys.columns c ON c.object_id = t.object_id AND c.column_id = d.parent_column_id
WHERE t.name = 'NPD_OEM' AND c.name = 'STATUS';

IF @ConstraintName IS NOT NULL
BEGIN
    EXEC('ALTER TABLE [dbo].[NPD_OEM] DROP CONSTRAINT ' + @ConstraintName);
END
GO

-- 2. Drop the IS_ACTIVE column
ALTER TABLE [dbo].[NPD_OEM] DROP COLUMN [IS_ACTIVE];
GO

-- 3. Add a temporary BIT column for STATUS conversion
ALTER TABLE [dbo].[NPD_OEM] ADD [STATUS_BIT] BIT NULL;
GO

-- 4. Convert VARCHAR status to BIT ('ACTIVE', 'Active', '1' -> 1, otherwise -> 0)
UPDATE [dbo].[NPD_OEM]
SET [STATUS_BIT] = CASE 
    WHEN UPPER(LTRIM(RTRIM([STATUS]))) = 'ACTIVE' THEN 1 
    WHEN [STATUS] = '1' THEN 1
    ELSE 0 
END;
GO

-- 5. Drop the old STATUS column
ALTER TABLE [dbo].[NPD_OEM] DROP COLUMN [STATUS];
GO

-- 6. Rename the temporary column to STATUS
EXEC sp_rename 'dbo.NPD_OEM.STATUS_BIT', 'STATUS', 'COLUMN';
GO

-- 7. Add default constraint to new STATUS column
ALTER TABLE [dbo].[NPD_OEM] ADD CONSTRAINT DF_NPD_OEM_STATUS DEFAULT 1 FOR [STATUS];
GO

-- 8. Make the STATUS column NOT NULL
ALTER TABLE [dbo].[NPD_OEM] ALTER COLUMN [STATUS] BIT NOT NULL;
GO
