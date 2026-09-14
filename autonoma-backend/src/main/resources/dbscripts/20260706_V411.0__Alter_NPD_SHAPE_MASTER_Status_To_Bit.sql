IF EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('NPD_SHAPE_MASTER') 
    AND name = 'STATUS'
)
BEGIN
    DECLARE @ConstraintName nvarchar(200);
    SELECT @ConstraintName = df.name 
    FROM sys.default_constraints df 
    INNER JOIN sys.columns c ON df.parent_object_id = c.object_id AND df.parent_column_id = c.column_id 
    WHERE df.parent_object_id = OBJECT_ID('NPD_SHAPE_MASTER') AND c.name = 'STATUS';

    IF @ConstraintName IS NOT NULL 
    BEGIN
        EXEC('ALTER TABLE NPD_SHAPE_MASTER DROP CONSTRAINT ' + @ConstraintName);
    END

    ALTER TABLE NPD_SHAPE_MASTER ALTER COLUMN STATUS BIT;
END
GO
