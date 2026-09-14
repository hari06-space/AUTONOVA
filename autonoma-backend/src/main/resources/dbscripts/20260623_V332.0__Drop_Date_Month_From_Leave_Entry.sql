-- V332.0: Drop legacy DATE and MONTH columns from HR_LEAVE_ENTRY
-- These columns are redundant since FROM_DATE, TO_DATE, and YEAR fully represent the leave period.

-- Drop DEFAULT constraints for DATE column if they exist
DECLARE @dateConstraint NVARCHAR(256);
SELECT @dateConstraint = dc.name
FROM sys.default_constraints dc
JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
JOIN sys.tables t ON c.object_id = t.object_id
WHERE t.name = 'HR_LEAVE_ENTRY' AND c.name = 'DATE';
IF @dateConstraint IS NOT NULL
    EXEC('ALTER TABLE HR_LEAVE_ENTRY DROP CONSTRAINT ' + @dateConstraint);

-- Drop DEFAULT constraints for MONTH column if they exist
DECLARE @monthConstraint NVARCHAR(256);
SELECT @monthConstraint = dc.name
FROM sys.default_constraints dc
JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
JOIN sys.tables t ON c.object_id = t.object_id
WHERE t.name = 'HR_LEAVE_ENTRY' AND c.name = 'MONTH';
IF @monthConstraint IS NOT NULL
    EXEC('ALTER TABLE HR_LEAVE_ENTRY DROP CONSTRAINT ' + @monthConstraint);

-- Drop old index that depends on DATE column if it exists
IF EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_HR_LEAVE_ENTRY_FROM_DATE' 
      AND object_id = OBJECT_ID('HR_LEAVE_ENTRY')
)
BEGIN
    DROP INDEX IX_HR_LEAVE_ENTRY_FROM_DATE ON HR_LEAVE_ENTRY;
END

-- Drop the DATE column
IF EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'HR_LEAVE_ENTRY' AND COLUMN_NAME = 'DATE'
)
    ALTER TABLE HR_LEAVE_ENTRY DROP COLUMN [DATE];

-- Drop the MONTH column
IF EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'HR_LEAVE_ENTRY' AND COLUMN_NAME = 'MONTH'
)
    ALTER TABLE HR_LEAVE_ENTRY DROP COLUMN [MONTH];

-- Re-create index on FROM_DATE column
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_HR_LEAVE_ENTRY_FROM_DATE' 
      AND object_id = OBJECT_ID('HR_LEAVE_ENTRY')
)
BEGIN
    CREATE INDEX IX_HR_LEAVE_ENTRY_FROM_DATE ON HR_LEAVE_ENTRY (FROM_DATE);
END
