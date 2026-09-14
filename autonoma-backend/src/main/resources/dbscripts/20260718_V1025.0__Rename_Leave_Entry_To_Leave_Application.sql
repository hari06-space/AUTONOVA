-- V1025.0: Rename HR_LEAVE_ENTRY to HR_LEAVE_APPLICATION and refactor status column to BIT

-- 1. Rename table from HR_LEAVE_ENTRY to HR_LEAVE_APPLICATION
IF OBJECT_ID('HR_LEAVE_ENTRY', 'U') IS NOT NULL AND OBJECT_ID('HR_LEAVE_APPLICATION', 'U') IS NULL
BEGIN
    EXEC sp_rename 'HR_LEAVE_ENTRY', 'HR_LEAVE_APPLICATION';
    PRINT 'Renamed table HR_LEAVE_ENTRY to HR_LEAVE_APPLICATION';
END

-- 2. Drop dependent indexes if they exist on the renamed table
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_LeaveEntry_Date' AND object_id = OBJECT_ID('HR_LEAVE_APPLICATION'))
BEGIN
    DROP INDEX IX_LeaveEntry_Date ON HR_LEAVE_APPLICATION;
END
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_LeaveEntry_Employee' AND object_id = OBJECT_ID('HR_LEAVE_APPLICATION'))
BEGIN
    DROP INDEX IX_LeaveEntry_Employee ON HR_LEAVE_APPLICATION;
END
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_HR_LEAVE_ENTRY_IS_ACTIVE' AND object_id = OBJECT_ID('HR_LEAVE_APPLICATION'))
BEGIN
    DROP INDEX IX_HR_LEAVE_ENTRY_IS_ACTIVE ON HR_LEAVE_APPLICATION;
    PRINT 'Dropped dependent index IX_HR_LEAVE_ENTRY_IS_ACTIVE';
END

-- 3. Drop default constraints on IS_ACTIVE and YEAR if they exist
DECLARE @activeConstraint NVARCHAR(256);
SELECT @activeConstraint = dc.name
FROM sys.default_constraints dc
JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
JOIN sys.tables t ON c.object_id = t.object_id
WHERE t.name = 'HR_LEAVE_APPLICATION' AND c.name = 'IS_ACTIVE';
IF @activeConstraint IS NOT NULL
    EXEC('ALTER TABLE HR_LEAVE_APPLICATION DROP CONSTRAINT ' + @activeConstraint);

DECLARE @yearConstraint NVARCHAR(256);
SELECT @yearConstraint = dc.name
FROM sys.default_constraints dc
JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
JOIN sys.tables t ON c.object_id = t.object_id
WHERE t.name = 'HR_LEAVE_APPLICATION' AND c.name = 'YEAR';
IF @yearConstraint IS NOT NULL
    EXEC('ALTER TABLE HR_LEAVE_APPLICATION DROP CONSTRAINT ' + @yearConstraint);

-- 4. Drop columns IS_ACTIVE and YEAR
IF EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'HR_LEAVE_APPLICATION' AND COLUMN_NAME = 'IS_ACTIVE'
)
BEGIN
    ALTER TABLE HR_LEAVE_APPLICATION DROP COLUMN [IS_ACTIVE];
    PRINT 'Dropped IS_ACTIVE column';
END

IF EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'HR_LEAVE_APPLICATION' AND COLUMN_NAME = 'YEAR'
)
BEGIN
    ALTER TABLE HR_LEAVE_APPLICATION DROP COLUMN [YEAR];
    PRINT 'Dropped YEAR column';
END

-- 5. Convert STATUS to BIT and store transactional status in LEAVE_STATUS
-- Add LEAVE_STATUS to store the old NVARCHAR status string
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'HR_LEAVE_APPLICATION' AND COLUMN_NAME = 'LEAVE_STATUS'
)
BEGIN
    ALTER TABLE HR_LEAVE_APPLICATION ADD LEAVE_STATUS NVARCHAR(50) NULL;
END

-- Copy string status to LEAVE_STATUS if STATUS is still NVARCHAR
IF EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'HR_LEAVE_APPLICATION' AND COLUMN_NAME = 'STATUS' AND DATA_TYPE = 'nvarchar'
)
BEGIN
    EXEC('UPDATE HR_LEAVE_APPLICATION SET LEAVE_STATUS = STATUS');
END

-- Set default string status for new/null values
EXEC('UPDATE HR_LEAVE_APPLICATION SET LEAVE_STATUS = ''Pending for verify'' WHERE LEAVE_STATUS IS NULL');

-- Drop status constraints
DECLARE @statusConstraint NVARCHAR(256);
SELECT @statusConstraint = dc.name
FROM sys.default_constraints dc
JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
JOIN sys.tables t ON c.object_id = t.object_id
WHERE t.name = 'HR_LEAVE_APPLICATION' AND c.name = 'STATUS';
IF @statusConstraint IS NOT NULL
    EXEC('ALTER TABLE HR_LEAVE_APPLICATION DROP CONSTRAINT ' + @statusConstraint);

-- Create temporary column for status bit
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'HR_LEAVE_APPLICATION' AND COLUMN_NAME = 'STATUS_BIT'
)
BEGIN
    ALTER TABLE HR_LEAVE_APPLICATION ADD STATUS_BIT BIT NOT NULL DEFAULT 1;
END

-- Copy/convert status string to BIT (1 for Active, 0 for Inactive)
EXEC('UPDATE HR_LEAVE_APPLICATION SET STATUS_BIT = 1');

-- Drop the old STATUS column
IF EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'HR_LEAVE_APPLICATION' AND COLUMN_NAME = 'STATUS'
)
BEGIN
    ALTER TABLE HR_LEAVE_APPLICATION DROP COLUMN [STATUS];
END

-- Rename STATUS_BIT to STATUS
EXEC sp_rename 'HR_LEAVE_APPLICATION.STATUS_BIT', 'STATUS', 'COLUMN';

-- Add default constraint for STATUS
ALTER TABLE HR_LEAVE_APPLICATION ADD CONSTRAINT DF_HR_LEAVE_APPLICATION_STATUS DEFAULT 1 FOR STATUS;

-- Recreate index on EMPLOYEE_ID
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_LeaveApplication_Employee' AND object_id = OBJECT_ID('HR_LEAVE_APPLICATION'))
BEGIN
    CREATE INDEX IX_LeaveApplication_Employee ON HR_LEAVE_APPLICATION (EMPLOYEE_ID);
END
