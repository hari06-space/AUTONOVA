-- Drop default constraint and column 'so'
DECLARE @ConstraintName_so NVARCHAR(200)
SELECT @ConstraintName_so = name FROM sys.default_constraints
WHERE parent_object_id = object_id('HR_LEAVE_MASTER') 
  AND parent_column_id = Columnproperty(object_id('HR_LEAVE_MASTER'), 'so', 'ColumnId')
IF @ConstraintName_so IS NOT NULL
    EXEC('ALTER TABLE HR_LEAVE_MASTER DROP CONSTRAINT ' + @ConstraintName_so)

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = object_id('HR_LEAVE_MASTER') AND name = 'so')
BEGIN
    ALTER TABLE HR_LEAVE_MASTER DROP COLUMN so;
END
GO

-- Drop default constraint and column 'c_off'
DECLARE @ConstraintName_coff NVARCHAR(200)
SELECT @ConstraintName_coff = name FROM sys.default_constraints
WHERE parent_object_id = object_id('HR_LEAVE_MASTER') 
  AND parent_column_id = Columnproperty(object_id('HR_LEAVE_MASTER'), 'c_off', 'ColumnId')
IF @ConstraintName_coff IS NOT NULL
    EXEC('ALTER TABLE HR_LEAVE_MASTER DROP CONSTRAINT ' + @ConstraintName_coff)

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = object_id('HR_LEAVE_MASTER') AND name = 'c_off')
BEGIN
    ALTER TABLE HR_LEAVE_MASTER DROP COLUMN c_off;
END
GO

-- Drop default constraint and column 'prev_month_so'
DECLARE @ConstraintName_pmso NVARCHAR(200)
SELECT @ConstraintName_pmso = name FROM sys.default_constraints
WHERE parent_object_id = object_id('HR_LEAVE_MASTER') 
  AND parent_column_id = Columnproperty(object_id('HR_LEAVE_MASTER'), 'prev_month_so', 'ColumnId')
IF @ConstraintName_pmso IS NOT NULL
    EXEC('ALTER TABLE HR_LEAVE_MASTER DROP CONSTRAINT ' + @ConstraintName_pmso)

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = object_id('HR_LEAVE_MASTER') AND name = 'prev_month_so')
BEGIN
    ALTER TABLE HR_LEAVE_MASTER DROP COLUMN prev_month_so;
END
GO

-- Drop default constraint and column 'prev_month_c_off'
DECLARE @ConstraintName_pmcoff NVARCHAR(200)
SELECT @ConstraintName_pmcoff = name FROM sys.default_constraints
WHERE parent_object_id = object_id('HR_LEAVE_MASTER') 
  AND parent_column_id = Columnproperty(object_id('HR_LEAVE_MASTER'), 'prev_month_c_off', 'ColumnId')
IF @ConstraintName_pmcoff IS NOT NULL
    EXEC('ALTER TABLE HR_LEAVE_MASTER DROP CONSTRAINT ' + @ConstraintName_pmcoff)

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = object_id('HR_LEAVE_MASTER') AND name = 'prev_month_c_off')
BEGIN
    ALTER TABLE HR_LEAVE_MASTER DROP COLUMN prev_month_c_off;
END
GO
