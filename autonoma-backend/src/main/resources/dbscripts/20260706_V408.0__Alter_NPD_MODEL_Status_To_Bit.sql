IF EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('NPD_MODEL') 
    AND name = 'IS_ACTIVE'
)
BEGIN
    ALTER TABLE NPD_MODEL DROP COLUMN IS_ACTIVE;
END
GO

IF EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('NPD_MODEL') 
    AND name = 'STATUS'
)
BEGIN
    -- Update existing string values to boolean representation (1/0)
    UPDATE NPD_MODEL SET STATUS = '1' WHERE STATUS = 'ACTIVE';
    UPDATE NPD_MODEL SET STATUS = '0' WHERE STATUS = 'INACTIVE' OR STATUS != '1';

    -- Alter column type to BIT
    ALTER TABLE NPD_MODEL ALTER COLUMN STATUS BIT NOT NULL;
END
GO
