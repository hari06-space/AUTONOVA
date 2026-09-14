-- ==============================================================================
-- Migration Script: V373.0 Make Loan Limits Nullable
-- Description: Alters MIN_LIMIT and MAX_LIMIT in HR_LOAN_MASTER to be nullable
-- ==============================================================================

ALTER TABLE HR_LOAN_MASTER ALTER COLUMN MIN_LIMIT DECIMAL(18,2) NULL;
ALTER TABLE HR_LOAN_MASTER ALTER COLUMN MAX_LIMIT DECIMAL(18,2) NULL;
GO
