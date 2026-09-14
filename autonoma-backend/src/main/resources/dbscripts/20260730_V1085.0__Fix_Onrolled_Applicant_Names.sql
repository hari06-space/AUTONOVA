-- Fix names of onboarded ATS applicants by copying LAST_NAME (Father's name in ATS) to FATHER_HUSBAND_NAME, clearing LAST_NAME, and setting EMPLOYEE_NAME to FIRST_NAME (Applicant's name).
-- Restricted to candidates with OLD_EMP_CODE starting with 'ATS-%' or matching early test cases to prevent affecting regular production employees.
UPDATE HR_EMPLOYEE
SET FATHER_HUSBAND_NAME = LAST_NAME,
    LAST_NAME = '',
    EMPLOYEE_NAME = FIRST_NAME
WHERE (OLD_EMP_CODE LIKE 'ATS-%' OR EMP_CODE IN ('EMP-001', 'EMP-002'))
  AND EMP_CODE LIKE 'EMP-%' 
  AND (FATHER_HUSBAND_NAME IS NULL OR FATHER_HUSBAND_NAME = '') 
  AND LAST_NAME IS NOT NULL 
  AND LAST_NAME <> '';
