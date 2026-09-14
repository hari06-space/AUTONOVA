-- 1. Sync STATUS column with IS_ACTIVE values where it was inactivated
UPDATE HR_LEAVE_MASTER SET status = 'Inactive' WHERE is_active = 0;

-- 2. Dynamically drop DEFAULT constraints on the target columns in SQL Server
DECLARE @sql NVARCHAR(MAX) = N'';
SELECT @sql += N'ALTER TABLE HR_LEAVE_MASTER DROP CONSTRAINT ' + dc.name + N';'
FROM sys.default_constraints dc
JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
WHERE dc.parent_object_id = OBJECT_ID('HR_LEAVE_MASTER')
AND c.name IN ('wfh', 'prev_yrs_el', 'prev_yrs_cl', 'prev_yrs_sl', 'prev_month_el', 'prev_month_cl', 'prev_month_sl', 'prev_month_al', 'prev_month_pl', 'prev_month_wfh', 'is_active');

IF @sql <> N''
BEGIN
    EXEC sp_executesql @sql;
END;

-- 3. Drop WFH and carry-forward columns from HR_LEAVE_MASTER
ALTER TABLE HR_LEAVE_MASTER DROP COLUMN wfh;
ALTER TABLE HR_LEAVE_MASTER DROP COLUMN prev_yrs_el;
ALTER TABLE HR_LEAVE_MASTER DROP COLUMN prev_yrs_cl;
ALTER TABLE HR_LEAVE_MASTER DROP COLUMN prev_yrs_sl;
ALTER TABLE HR_LEAVE_MASTER DROP COLUMN prev_month_el;
ALTER TABLE HR_LEAVE_MASTER DROP COLUMN prev_month_cl;
ALTER TABLE HR_LEAVE_MASTER DROP COLUMN prev_month_sl;
ALTER TABLE HR_LEAVE_MASTER DROP COLUMN prev_month_al;
ALTER TABLE HR_LEAVE_MASTER DROP COLUMN prev_month_pl;
ALTER TABLE HR_LEAVE_MASTER DROP COLUMN prev_month_wfh;

-- 4. Drop IS_ACTIVE column
ALTER TABLE HR_LEAVE_MASTER DROP COLUMN is_active;
