-- Migration script to add 'LEDGER' to the intent column in processing_request table for SQL Server
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'processing_request' AND COLUMN_NAME = 'intent')
BEGIN
    DECLARE @ConstraintName NVARCHAR(256);
    SELECT @ConstraintName = df.name
    FROM sys.default_constraints df
    INNER JOIN sys.columns c ON df.parent_object_id = c.object_id AND df.parent_column_id = c.column_id
    WHERE df.parent_object_id = OBJECT_ID('processing_request') AND c.name = 'intent';

    IF @ConstraintName IS NOT NULL
    BEGIN
        EXEC('ALTER TABLE processing_request DROP CONSTRAINT ' + @ConstraintName);
    END

    ALTER TABLE processing_request ALTER COLUMN intent NVARCHAR(100);

    ALTER TABLE processing_request ADD CONSTRAINT DF_processing_request_intent DEFAULT 'UNCLASSIFIED' FOR intent;
END
GO
