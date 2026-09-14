-- =================================================================================
-- Migration: Remove duplicates from QMS_CHECKLIST_ASSIGNMENT and add unique index
-- Target Date: 2026-07-14
-- Team: TIS (QMS / Checklist)
-- =================================================================================

-- Required SET options for creating filtered unique indexes in SQL Server
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- 1. Remove duplicate template configurations (where CHECKLIST_DATE IS NULL)
-- We keep only the row with the highest ID (latest) for each combination of (CHECKLIST_ID, ASSIGNED_TO, ASSIGN_TYPE)
WITH CTE AS (
  SELECT *,
         ROW_NUMBER() OVER (
           PARTITION BY CHECKLIST_ID, ASSIGNED_TO, ASSIGN_TYPE
           ORDER BY ACTIVE DESC, ID DESC
         ) as row_num
  FROM QMS_CHECKLIST_ASSIGNMENT
  WHERE CHECKLIST_DATE IS NULL
)
DELETE FROM CTE WHERE row_num > 1;
GO

-- 2. Create a filtered unique index to prevent future duplicate active template assignments
IF NOT EXISTS (
  SELECT * FROM sys.indexes 
  WHERE name = 'UIX_QMS_CHECKLIST_ASSIGNMENT_UNIQUE_ACTIVE_TEMPLATE' 
    AND object_id = OBJECT_ID('QMS_CHECKLIST_ASSIGNMENT')
)
BEGIN
  CREATE UNIQUE INDEX UIX_QMS_CHECKLIST_ASSIGNMENT_UNIQUE_ACTIVE_TEMPLATE
  ON QMS_CHECKLIST_ASSIGNMENT(CHECKLIST_ID, ASSIGNED_TO, ASSIGN_TYPE)
  WHERE CHECKLIST_DATE IS NULL AND ACTIVE = 1;
END
GO
