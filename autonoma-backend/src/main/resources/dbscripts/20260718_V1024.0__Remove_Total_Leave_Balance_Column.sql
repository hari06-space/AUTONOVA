-- V1024.0: Remove TOTAL_LEAVE_BALANCE column from HR_LEAVE_MASTER

-- Drop default constraint on TOTAL_LEAVE_BALANCE column if it exists
DECLARE @totConstraint NVARCHAR(256);
SELECT @totConstraint = dc.name
FROM sys.default_constraints dc
JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
JOIN sys.tables t ON c.object_id = t.object_id
WHERE t.name = 'HR_LEAVE_MASTER' AND c.name = 'TOTAL_LEAVE_BALANCE';
IF @totConstraint IS NOT NULL
    EXEC('ALTER TABLE HR_LEAVE_MASTER DROP CONSTRAINT ' + @totConstraint);

-- Drop the column
IF EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'HR_LEAVE_MASTER' AND COLUMN_NAME = 'TOTAL_LEAVE_BALANCE'
)
BEGIN
    ALTER TABLE HR_LEAVE_MASTER DROP COLUMN [TOTAL_LEAVE_BALANCE];
END
