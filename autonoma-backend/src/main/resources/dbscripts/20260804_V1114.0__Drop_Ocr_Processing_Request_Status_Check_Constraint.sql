-- SQL Migration to drop system-generated CHECK constraint on status column of AD_OCR_PROCESSING_REQUEST
-- This prevents database update conflicts when Java sets newly introduced statuses like ABANDONED

DECLARE @ConstraintName NVARCHAR(256)
SELECT @ConstraintName = OBJECT_NAME(object_id)
FROM sys.check_constraints
WHERE parent_object_id = OBJECT_ID('dbo.AD_OCR_PROCESSING_REQUEST')
  AND definition LIKE '%status%'

IF @ConstraintName IS NOT NULL
BEGIN
    DECLARE @SQL NVARCHAR(MAX) = 'ALTER TABLE dbo.AD_OCR_PROCESSING_REQUEST DROP CONSTRAINT ' + QUOTENAME(@ConstraintName);
    EXEC sp_executesql @SQL;
    PRINT 'Successfully dropped check constraint: ' + @ConstraintName;
END
ELSE
BEGIN
    PRINT 'No status check constraint found on AD_OCR_PROCESSING_REQUEST.';
END
