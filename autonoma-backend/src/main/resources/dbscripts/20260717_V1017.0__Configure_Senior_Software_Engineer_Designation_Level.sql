-- Migration: Standardize Category Level for Senior Software Engineer, backfill employee level mappings, and clone department interview mappings for Information Technology.
-- Version: V1017.0

-- Standardize Category Level for Senior Software Engineer designation
IF EXISTS (SELECT 1 FROM HR_DESIGNATION WHERE DESIGNATION_NAME = 'Senior Software Engineer')
BEGIN
    UPDATE HR_DESIGNATION
    SET SUB_CATEGORY_LEVEL = 'L1',
        UPDATED_BY = 'SYSTEM',
        UPDATED_DATE = GETDATE()
    WHERE DESIGNATION_NAME = 'Senior Software Engineer' AND (SUB_CATEGORY_LEVEL IS NULL OR SUB_CATEGORY_LEVEL = '');
END

-- Universally backfill candidate EMP_LEVEL_ID based on their designation's level configuration
UPDATE org
SET org.EMP_LEVEL_ID = lvl.ROW_ID
FROM HR_EMPLOYEE_ORGANIZATION org
INNER JOIN HR_EMPLOYEE emp ON org.EMPLOYEE_ID = emp.ID
INNER JOIN HR_DESIGNATION des ON org.DESIGNATION_ID = des.ID
INNER JOIN HR_DESIGNATION_LEVEL lvl ON des.SUB_CATEGORY_LEVEL = lvl.LEVEL
WHERE org.EMP_LEVEL_ID IS NULL AND des.SUB_CATEGORY_LEVEL IS NOT NULL;

-- Relational backfill: Map department 'Information Technology' to any interview criteria mapped to 'ADMIN', 'PRODUCTION', or 'PRODUCT DEVELOPMENT'
DECLARE @TargetDeptId BIGINT;
SELECT @TargetDeptId = ID FROM HR_DEPARTMENT 
WHERE DEPARTMENT_NO = 'DEP002' 
   OR UPPER(DEPARTMENT_NAME) = 'INFORMATION TECHNOLOGY';

IF @TargetDeptId IS NOT NULL
BEGIN
    INSERT INTO HR_INTERVIEW_DEPARTMENT_MAPPING (INTERVIEW_ID, DEPARTMENT_ID, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE)
    SELECT DISTINCT m.INTERVIEW_ID, @TargetDeptId, 'SYSTEM', GETDATE(), 'SYSTEM', GETDATE()
    FROM HR_INTERVIEW_DEPARTMENT_MAPPING m
    WHERE m.DEPARTMENT_ID IN (
        SELECT ID FROM HR_DEPARTMENT 
        WHERE UPPER(DEPARTMENT_NAME) IN ('ADMIN', 'PRODUCTION', 'PRODUCT DEVELOPMENT')
    )
      AND NOT EXISTS (
          SELECT 1 
          FROM HR_INTERVIEW_DEPARTMENT_MAPPING sub 
          WHERE sub.INTERVIEW_ID = m.INTERVIEW_ID AND sub.DEPARTMENT_ID = @TargetDeptId
      );
END


