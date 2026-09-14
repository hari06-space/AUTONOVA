-- ===============================================================================
-- SQL Migration Script: Auto Provision User Credentials & Default Page Permissions
-- Target Engine: Microsoft SQL Server
-- Description: Automatically provisions AD_USER_CREDENTIAL and BOS_USER_PAGE_AUTH
--              for all active HR_EMPLOYEE records to prevent missing credential errors.
-- ===============================================================================

-- 1. Create missing user credentials in AD_USER_CREDENTIAL for employees who don't have one
MERGE INTO AD_USER_CREDENTIAL AS target
USING (
    SELECT 
        UPPER(TRIM(e.FIRST_NAME)) AS USER_ID,
        e.ID AS EMP_ID,
        '$2a$12$Tn2DKudFgWsGldq7ZohqOuovwoA.WA10RZcLrzLijpiwuh7RFiNc.' AS PASSWORD,
        'SYSTEM' AS CREATED_BY,
        GETDATE() AS CREATED_DATE,
        1 AS STATUS,
        1 AS IS_ACTIVE
    FROM HR_EMPLOYEE e
    WHERE e.FIRST_NAME IS NOT NULL 
      AND TRIM(e.FIRST_NAME) <> ''
) AS source
ON (target.EMP_ID = source.EMP_ID OR UPPER(target.USER_ID) = source.USER_ID)
WHEN NOT MATCHED THEN
    INSERT (USER_ID, EMP_ID, PASSWORD, CREATED_BY, CREATED_DATE, STATUS, IS_ACTIVE)
    VALUES (source.USER_ID, source.EMP_ID, source.PASSWORD, source.CREATED_BY, source.CREATED_DATE, source.STATUS, source.IS_ACTIVE);

-- 2. Grant full default page permissions in BOS_USER_PAGE_AUTH for all users across all active pages
INSERT INTO BOS_USER_PAGE_AUTH (USER_ID, PAGE_ID, SUB_MOD_ID, MOD_ID, ENABLE, READ_ACS, [WRITE], DELETE_ACS, EXPORT, APPROVAL, MANAGER, ADDITIONAL1, CREATED_BY, CREATED_DATE)
SELECT 
    u.USER_ID,
    p.PAGE_ID,
    p.SUB_MOD_ID,
    p.MOD_ID,
    1, 1, 1, 1, 1, 1, 1, 1,
    'SYSTEM',
    GETDATE()
FROM AD_USER_CREDENTIAL u
CROSS JOIN BOS_PAGES p
WHERE u.USER_ID IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 
      FROM BOS_USER_PAGE_AUTH a 
      WHERE a.USER_ID = u.USER_ID 
        AND a.PAGE_ID = p.PAGE_ID
  );
