-- V1023.0: Refactor HR_LEAVE_MASTER columns
-- 1. Remove LOP column
-- 2. Add TOTAL_LEAVE_BALANCE column
-- 3. Change STATUS column from NVARCHAR to BIT (1 = Active, 0 = Inactive)

-- Drop default constraint on STATUS column if it exists
DECLARE @statusConstraint NVARCHAR(256);
SELECT @statusConstraint = dc.name
FROM sys.default_constraints dc
JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
JOIN sys.tables t ON c.object_id = t.object_id
WHERE t.name = 'HR_LEAVE_MASTER' AND c.name = 'STATUS';
IF @statusConstraint IS NOT NULL
    EXEC('ALTER TABLE HR_LEAVE_MASTER DROP CONSTRAINT ' + @statusConstraint);

-- Drop default constraint on LOP column if it exists
DECLARE @lopConstraint NVARCHAR(256);
SELECT @lopConstraint = dc.name
FROM sys.default_constraints dc
JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
JOIN sys.tables t ON c.object_id = t.object_id
WHERE t.name = 'HR_LEAVE_MASTER' AND c.name = 'LOP';
IF @lopConstraint IS NOT NULL
    EXEC('ALTER TABLE HR_LEAVE_MASTER DROP CONSTRAINT ' + @lopConstraint);

-- 1. Add TOTAL_LEAVE_BALANCE column
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'HR_LEAVE_MASTER' AND COLUMN_NAME = 'TOTAL_LEAVE_BALANCE'
)
BEGIN
    ALTER TABLE HR_LEAVE_MASTER ADD TOTAL_LEAVE_BALANCE DECIMAL(18,2) NOT NULL DEFAULT 0.00;
END

-- Update TOTAL_LEAVE_BALANCE with the sum of EL, CL, SL, AL, PL
EXEC('UPDATE HR_LEAVE_MASTER SET TOTAL_LEAVE_BALANCE = EL + CL + SL + AL + PL');

-- 2. Remove LOP column
IF EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'HR_LEAVE_MASTER' AND COLUMN_NAME = 'LOP'
)
BEGIN
    ALTER TABLE HR_LEAVE_MASTER DROP COLUMN [LOP];
END

-- 3. Change STATUS to BIT (1 = Active, 0 = Inactive)
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'HR_LEAVE_MASTER' AND COLUMN_NAME = 'STATUS_BIT'
)
BEGIN
    ALTER TABLE HR_LEAVE_MASTER ADD STATUS_BIT BIT NOT NULL DEFAULT 1;
END

-- Copy and convert status values
EXEC('UPDATE HR_LEAVE_MASTER SET STATUS_BIT = CASE WHEN STATUS = ''Active'' OR STATUS = ''1'' THEN 1 ELSE 0 END');

-- Drop old STATUS column
IF EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'HR_LEAVE_MASTER' AND COLUMN_NAME = 'STATUS'
)
BEGIN
    ALTER TABLE HR_LEAVE_MASTER DROP COLUMN [STATUS];
END

-- Rename STATUS_BIT to STATUS
EXEC sp_rename 'HR_LEAVE_MASTER.STATUS_BIT', 'STATUS', 'COLUMN';

-- Re-add default constraint for STATUS as BIT
ALTER TABLE HR_LEAVE_MASTER ADD CONSTRAINT DF_HR_LEAVE_MASTER_STATUS DEFAULT 1 FOR STATUS;
