IF COL_LENGTH('QMC_QUALITY_INSPECTION', 'STATUS') IS NOT NULL
BEGIN
    DECLARE @ConstraintName nvarchar(200)
    SELECT @ConstraintName = Name FROM sys.default_constraints
    WHERE parent_object_id = OBJECT_ID('QMC_QUALITY_INSPECTION')
    AND parent_column_id = (SELECT column_id FROM sys.columns
                            WHERE object_id = OBJECT_ID('QMC_QUALITY_INSPECTION')
                            AND name = 'STATUS')
    IF @ConstraintName IS NOT NULL
        EXEC('ALTER TABLE QMC_QUALITY_INSPECTION DROP CONSTRAINT ' + @ConstraintName)

    ALTER TABLE QMC_QUALITY_INSPECTION ALTER COLUMN STATUS BIGINT NULL;
END
