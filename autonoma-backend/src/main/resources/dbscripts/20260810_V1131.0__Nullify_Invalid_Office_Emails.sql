-- Migration: Nullify invalid office email strings that do not follow valid email format (missing '@' or domain)
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'HR_EMPLOYEE_JOB_PROFILE') AND name = N'OFFICE_EMAIL')
BEGIN
    UPDATE HR_EMPLOYEE_JOB_PROFILE 
    SET office_email = NULL 
    WHERE office_email IS NOT NULL 
      AND TRIM(office_email) <> '' 
      AND (office_email NOT LIKE '%@%.%' OR TRIM(office_email) LIKE '% %');
END;

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'HR_EMPLOYEE_ORGANIZATION') AND name = N'OFFICE_MAIL')
BEGIN
    UPDATE HR_EMPLOYEE_ORGANIZATION 
    SET office_mail = NULL 
    WHERE office_mail IS NOT NULL 
      AND TRIM(office_mail) <> '' 
      AND (office_mail NOT LIKE '%@%.%' OR TRIM(office_mail) LIKE '% %');
END;
