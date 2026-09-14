-- Migration to add primary key constraint to NPD_PROCESS table if missing
-- Date: 2026-06-27

IF NOT EXISTS (
    SELECT 1 FROM sys.key_constraints 
    WHERE type = 'PK' 
      AND parent_object_id = OBJECT_ID('NPD_PROCESS')
)
BEGIN
    ALTER TABLE NPD_PROCESS ADD CONSTRAINT PK_NPD_PROCESS PRIMARY KEY (ID);
    PRINT 'Added primary key constraint PK_NPD_PROCESS to NPD_PROCESS(ID)';
END
GO
