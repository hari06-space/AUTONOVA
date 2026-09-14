-- ==========================================================
-- Add IS_ACTIVE column to HR_INDUCTION_ASSIGNMENT
-- ==========================================================
IF COL_LENGTH('HR_INDUCTION_ASSIGNMENT', 'IS_ACTIVE') IS NULL
BEGIN
    ALTER TABLE HR_INDUCTION_ASSIGNMENT ADD IS_ACTIVE BIT NOT NULL DEFAULT 1;
END
GO
