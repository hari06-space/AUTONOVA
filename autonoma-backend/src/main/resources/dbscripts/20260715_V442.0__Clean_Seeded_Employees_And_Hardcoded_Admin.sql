-- V442.0: Clean up mock employees (EMP001-EMP005) and seed default company/division metadata
-- This replaces the programmatic seeding done by DataSeeder.java

-- 1. Clean up seeded mock employees
DECLARE @EmpIds TABLE (ID INT);
INSERT INTO @EmpIds (ID)
SELECT ID FROM [dbo].[HR_EMPLOYEE] WHERE [EMP_CODE] IN ('EMP001', 'EMP002', 'EMP003', 'EMP004', 'EMP005');

IF EXISTS (SELECT 1 FROM @EmpIds)
BEGIN
    DELETE FROM [dbo].[HR_EMPLOYEE_ABILITY] WHERE [EMPLOYEE_ID] IN (SELECT ID FROM @EmpIds);
    DELETE FROM [dbo].[HR_EMPLOYEE_SCHEDULING] WHERE [EMPLOYEE_ID] IN (SELECT ID FROM @EmpIds);
    DELETE FROM [dbo].[HR_EMPLOYEE_ORGANIZATION] WHERE [EMPLOYEE_ID] IN (SELECT ID FROM @EmpIds);
    DELETE FROM [dbo].[HR_EMPLOYEE_INDUCTION] WHERE [EMPLOYEE_ID] IN (SELECT ID FROM @EmpIds);
    DELETE FROM [dbo].[HR_EMPLOYEE_MANAGER_MAPPING] WHERE [EMP_ID] IN (SELECT ID FROM @EmpIds) OR [HOME_MANAGER_ID] IN (SELECT ID FROM @EmpIds) OR [BUSINESS_MANAGER_ID] IN (SELECT ID FROM @EmpIds) OR [VERTICAL_HEAD_ID] IN (SELECT ID FROM @EmpIds) OR [HR_ID] IN (SELECT ID FROM @EmpIds);

    -- Delete referencing leave and statutory tables
    IF OBJECT_ID('[dbo].[HR_LEAVE_MASTER]', 'U') IS NOT NULL
    BEGIN
        DELETE FROM [dbo].[HR_LEAVE_MASTER] WHERE [EMPLOYEE_ID] IN (SELECT ID FROM @EmpIds);
    END
    IF OBJECT_ID('[dbo].[HR_LEAVE_TRANSACTION]', 'U') IS NOT NULL
    BEGIN
        DELETE FROM [dbo].[HR_LEAVE_TRANSACTION] WHERE [EMPLOYEE_ID] IN (SELECT ID FROM @EmpIds);
    END
    IF OBJECT_ID('[dbo].[HR_LEAVE_DETAILS]', 'U') IS NOT NULL
    BEGIN
        DELETE FROM [dbo].[HR_LEAVE_DETAILS] WHERE [EMPLOYEE_ID] IN (SELECT ID FROM @EmpIds);
    END
    IF OBJECT_ID('[dbo].[HR_LEAVE_TRAVEL_DETAILS]', 'U') IS NOT NULL
    BEGIN
        DELETE FROM [dbo].[HR_LEAVE_TRAVEL_DETAILS] WHERE [employee_id] IN (SELECT ID FROM @EmpIds);
    END
    IF OBJECT_ID('[dbo].[HR_PERMISSION_DETAILS]', 'U') IS NOT NULL
    BEGIN
        DELETE FROM [dbo].[HR_PERMISSION_DETAILS] WHERE [EMPLOYEE_ID] IN (SELECT ID FROM @EmpIds);
    END
    IF OBJECT_ID('[dbo].[HR_OD_DETAILS]', 'U') IS NOT NULL
    BEGIN
        DELETE FROM [dbo].[HR_OD_DETAILS] WHERE [EMPLOYEE_ID] IN (SELECT ID FROM @EmpIds);
    END
    IF OBJECT_ID('[dbo].[HR_EMPLOYEE_SALARY_COMPONENT]', 'U') IS NOT NULL
    BEGIN
        DELETE FROM [dbo].[HR_EMPLOYEE_SALARY_COMPONENT] WHERE [EMPLOYEE_ID] IN (SELECT ID FROM @EmpIds);
    END
    IF OBJECT_ID('[dbo].[HR_EMPLOYEE_SALARY_COMPONENT_LOG]', 'U') IS NOT NULL
    BEGIN
        DELETE FROM [dbo].[HR_EMPLOYEE_SALARY_COMPONENT_LOG] WHERE [EMPLOYEE_ID] IN (SELECT ID FROM @EmpIds);
    END
    IF OBJECT_ID('[dbo].[HR_EMPLOYEE_PERSONAL_DETAIL]', 'U') IS NOT NULL
    BEGIN
        DELETE FROM [dbo].[HR_EMPLOYEE_PERSONAL_DETAIL] WHERE [EMPLOYEE_ID] IN (SELECT ID FROM @EmpIds);
    END
    IF OBJECT_ID('[dbo].[HR_EMPLOYEE_JOB_PROFILE]', 'U') IS NOT NULL
    BEGIN
        DELETE FROM [dbo].[HR_EMPLOYEE_JOB_PROFILE] WHERE [EMPLOYEE_ID] IN (SELECT ID FROM @EmpIds);
    END
    
    -- Check if HR_EMPLOYEE_SATISFACTION_MAPPING table exists
    IF OBJECT_ID('[dbo].[HR_EMPLOYEE_SATISFACTION_MAPPING]', 'U') IS NOT NULL
    BEGIN
        DELETE FROM [dbo].[HR_EMPLOYEE_SATISFACTION_MAPPING] WHERE [EMPLOYEE_ID] IN (SELECT ID FROM @EmpIds);
    END

    -- Delete user page authorizations
    DELETE FROM [dbo].[BOS_USER_PAGE_AUTH] WHERE [USER_ID] IN ('ramesh', 'suresh', 'priya', 'anita', 'vijay');

    -- Delete user theme settings
    DELETE FROM [dbo].[AD_USER_THEME_SETTING] WHERE [USER_ID] IN ('ramesh', 'suresh', 'priya', 'anita', 'vijay');

    -- Delete user company/division mappings
    DELETE FROM [dbo].[AD_USER_COMPANY_MAPPING] WHERE [USER_ID] IN ('ramesh', 'suresh', 'priya', 'anita', 'vijay');
    DELETE FROM [dbo].[AD_USER_DIVISION_MAPPING] WHERE [USER_ID] IN ('ramesh', 'suresh', 'priya', 'anita', 'vijay');

    -- Delete user credentials
    DELETE FROM [dbo].[AD_USER_CREDENTIAL] WHERE [USER_ID] IN ('ramesh', 'suresh', 'priya', 'anita', 'vijay');


    -- Delete main employee records
    DELETE FROM [dbo].[HR_EMPLOYEE] WHERE [EMP_CODE] IN ('EMP001', 'EMP002', 'EMP003', 'EMP004', 'EMP005');

    PRINT 'Successfully deleted mock employees (EMP001 - EMP005) and their related records.';
END
ELSE
BEGIN
    PRINT 'No mock employees (EMP001 - EMP005) found to delete.';
END
GO

-- 2. Seed Default Company (ID = 1) if not exists
IF NOT EXISTS (SELECT 1 FROM [dbo].[AD_COMPANY_CREDENTIAL] WHERE [id] = 1)
BEGIN
    SET IDENTITY_INSERT [dbo].[AD_COMPANY_CREDENTIAL] ON;
    INSERT INTO [dbo].[AD_COMPANY_CREDENTIAL] (
        [id], [COMPANY_NAME], [SHORT_NAME], [ADDRESS], [CITY], [STATE], [COUNTRY], [PINCODE], [GST_IN], [DB_SOURCE_NAME], [LIC_EXPIRY_DATE], [LIC_EXP_REMAINDER_DAYS], [IS_ACTIVE]
    ) VALUES (
        1, 'Autonoma Systems', 'Autonoma', '123 Main Street', 'Chennai', 'Tamil Nadu', 'India', '600001', '33AABCT1234A1Z1', 'AUTONOMA', DATEADD(year, 1, GETDATE()), 30, 1
    );
    SET IDENTITY_INSERT [dbo].[AD_COMPANY_CREDENTIAL] OFF;
    PRINT 'Default company with ID = 1 seeded.';
END
GO

-- 3. Seed Default Division (ID = 1) if not exists
IF NOT EXISTS (SELECT 1 FROM [dbo].[AD_DIVISION] WHERE [id] = 1)
BEGIN
    SET IDENTITY_INSERT [dbo].[AD_DIVISION] ON;
    INSERT INTO [dbo].[AD_DIVISION] (
        [id], [COMPANY_ID], [DIVISION_NAME], [STATUS], [CREATED_BY], [CREATED_DATE], [IS_ACTIVE]
    ) VALUES (
        1, 1, 'Corporate Division', 1, 'SUPER BOSS', GETDATE(), 1
    );
    SET IDENTITY_INSERT [dbo].[AD_DIVISION] OFF;
    PRINT 'Default division with ID = 1 seeded.';
END
GO

-- 4. Seed User Company Mapping for SUPER BOSS
IF NOT EXISTS (SELECT 1 FROM [dbo].[AD_USER_COMPANY_MAPPING] WHERE [USER_ID] = 'SUPER BOSS' AND [COMPANY_ID] = 1)
BEGIN
    INSERT INTO [dbo].[AD_USER_COMPANY_MAPPING] (
        [USER_ID], [COMPANY_ID]
    ) VALUES (
        'SUPER BOSS', 1
    );
    PRINT 'Company mapping for SUPER BOSS seeded.';
END
GO

-- 5. Seed User Division Mapping for SUPER BOSS
IF NOT EXISTS (SELECT 1 FROM [dbo].[AD_USER_DIVISION_MAPPING] WHERE [USER_ID] = 'SUPER BOSS' AND [DIVISION_ID] = 1)
BEGIN
    INSERT INTO [dbo].[AD_USER_DIVISION_MAPPING] (
        [USER_ID], [DIVISION_ID], [CREATED_BY], [CREATED_DATE]
    ) VALUES (
        'SUPER BOSS', 1, 'SUPER BOSS', GETDATE()
    );
    PRINT 'Division mapping for SUPER BOSS seeded.';
END
GO
