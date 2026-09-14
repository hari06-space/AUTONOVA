-- Seed 5 employees with full access (user accounts, permissions, and top grade A+)

-- Employee 1: Ramesh Kumar
DECLARE @EmpId1 INT;
IF NOT EXISTS (SELECT 1 FROM [dbo].[HR_EMPLOYEE] WHERE [EMP_CODE] = 'EMP001')
BEGIN
    INSERT INTO [dbo].[HR_EMPLOYEE] (
        [EMP_CODE], [EMPLOYEE_NAME], [FIRST_NAME], [LAST_NAME], [STATUS], [IS_ACTIVE], [CREATED_BY], [CREATED_DATE]
    ) VALUES (
        'EMP001', 'Ramesh Kumar', 'Ramesh', 'Kumar', 'Active', 1, 'SYSTEM', GETDATE()
    );
    SET @EmpId1 = SCOPE_IDENTITY();

    -- Child organization
    INSERT INTO [dbo].[HR_EMPLOYEE_ORGANIZATION] (
        [EMPLOYEE_ID], [CATEGORY_ID], [GRADE_CODE], [OFFICE_MAIL], [CREATED_BY], [CREATED_DATE]
    ) VALUES (
        @EmpId1, 1, 'A+', 'ramesh.kumar@nutech.com', 'SYSTEM', GETDATE()
    );

    -- Child scheduling
    INSERT INTO [dbo].[HR_EMPLOYEE_SCHEDULING] (
        [EMPLOYEE_ID], [DATE_OF_JOINING], [CREATED_BY], [CREATED_DATE]
    ) VALUES (
        @EmpId1, '2026-01-01', 'SYSTEM', GETDATE()
    );

    -- Child ability
    INSERT INTO [dbo].[HR_EMPLOYEE_ABILITY] (
        [EMPLOYEE_ID], [IS_AUDITOR], [IS_AUDITEE], [IS_NCR_APPROVER], [CREATED_BY], [CREATED_DATE]
    ) VALUES (
        @EmpId1, 1, 1, 1, 'SYSTEM', GETDATE()
    );

    -- Child induction
    INSERT INTO [dbo].[HR_EMPLOYEE_INDUCTION] (
        [EMPLOYEE_ID], [INDUCTION_STATUS], [IS_INDUCTION_ELIGIBLE], [CREATED_BY], [CREATED_DATE]
    ) VALUES (
        @EmpId1, 'COMPLETED', 'NO', 'SYSTEM', GETDATE()
    );

    -- User credentials (USER_LEVEL = 5, Password = admin123)
    IF NOT EXISTS (SELECT 1 FROM [dbo].[AD_USER_CREDENTIAL] WHERE [USER_ID] = 'ramesh')
    BEGIN
        INSERT INTO [dbo].[AD_USER_CREDENTIAL] (
            [USER_ID], [EMP_ID], [PASSWORD], [CREATED_BY], [CREATED_DATE], [STATUS], [USER_LEVEL], [AUTH_METHOD], [IS_ACTIVE]
        ) VALUES (
            'ramesh', @EmpId1, 'PqN+VbHvF4NpV9r1y//5Zw==', 'SYSTEM', GETDATE(), 1, 5, 'PASSWORD', 1
        );
    END

    -- User Company Mapping
    IF NOT EXISTS (SELECT 1 FROM [dbo].[AD_USER_COMPANY_MAPPING] WHERE [USER_ID] = 'ramesh' AND [COMPANY_ID] = 1)
    BEGIN
        INSERT INTO [dbo].[AD_USER_COMPANY_MAPPING] (
            [USER_ID], [COMPANY_ID]
        ) VALUES (
            'ramesh', 1
        );
    END

    -- User Division Mapping
    IF NOT EXISTS (SELECT 1 FROM [dbo].[AD_USER_DIVISION_MAPPING] WHERE [USER_ID] = 'ramesh' AND [DIVISION_ID] = 1)
    BEGIN
        INSERT INTO [dbo].[AD_USER_DIVISION_MAPPING] (
            [USER_ID], [DIVISION_ID], [CREATED_BY], [CREATED_DATE]
        ) VALUES (
            'ramesh', 1, 'SYSTEM', GETDATE()
        );
    END
END


-- Employee 2: Suresh Raina
DECLARE @EmpId2 INT;
IF NOT EXISTS (SELECT 1 FROM [dbo].[HR_EMPLOYEE] WHERE [EMP_CODE] = 'EMP002')
BEGIN
    INSERT INTO [dbo].[HR_EMPLOYEE] (
        [EMP_CODE], [EMPLOYEE_NAME], [FIRST_NAME], [LAST_NAME], [STATUS], [IS_ACTIVE], [CREATED_BY], [CREATED_DATE]
    ) VALUES (
        'EMP002', 'Suresh Raina', 'Suresh', 'Raina', 'Active', 1, 'SYSTEM', GETDATE()
    );
    SET @EmpId2 = SCOPE_IDENTITY();

    -- Child organization
    INSERT INTO [dbo].[HR_EMPLOYEE_ORGANIZATION] (
        [EMPLOYEE_ID], [CATEGORY_ID], [GRADE_CODE], [OFFICE_MAIL], [CREATED_BY], [CREATED_DATE]
    ) VALUES (
        @EmpId2, 1, 'A+', 'suresh.raina@nutech.com', 'SYSTEM', GETDATE()
    );

    -- Child scheduling
    INSERT INTO [dbo].[HR_EMPLOYEE_SCHEDULING] (
        [EMPLOYEE_ID], [DATE_OF_JOINING], [CREATED_BY], [CREATED_DATE]
    ) VALUES (
        @EmpId2, '2026-01-01', 'SYSTEM', GETDATE()
    );

    -- Child ability
    INSERT INTO [dbo].[HR_EMPLOYEE_ABILITY] (
        [EMPLOYEE_ID], [IS_AUDITOR], [IS_AUDITEE], [IS_NCR_APPROVER], [CREATED_BY], [CREATED_DATE]
    ) VALUES (
        @EmpId2, 1, 1, 1, 'SYSTEM', GETDATE()
    );

    -- Child induction
    INSERT INTO [dbo].[HR_EMPLOYEE_INDUCTION] (
        [EMPLOYEE_ID], [INDUCTION_STATUS], [IS_INDUCTION_ELIGIBLE], [CREATED_BY], [CREATED_DATE]
    ) VALUES (
        @EmpId2, 'COMPLETED', 'NO', 'SYSTEM', GETDATE()
    );

    -- User credentials (USER_LEVEL = 5, Password = admin123)
    IF NOT EXISTS (SELECT 1 FROM [dbo].[AD_USER_CREDENTIAL] WHERE [USER_ID] = 'suresh')
    BEGIN
        INSERT INTO [dbo].[AD_USER_CREDENTIAL] (
            [USER_ID], [EMP_ID], [PASSWORD], [CREATED_BY], [CREATED_DATE], [STATUS], [USER_LEVEL], [AUTH_METHOD], [IS_ACTIVE]
        ) VALUES (
            'suresh', @EmpId2, 'PqN+VbHvF4NpV9r1y//5Zw==', 'SYSTEM', GETDATE(), 1, 5, 'PASSWORD', 1
        );
    END

    -- User Company Mapping
    IF NOT EXISTS (SELECT 1 FROM [dbo].[AD_USER_COMPANY_MAPPING] WHERE [USER_ID] = 'suresh' AND [COMPANY_ID] = 1)
    BEGIN
        INSERT INTO [dbo].[AD_USER_COMPANY_MAPPING] (
            [USER_ID], [COMPANY_ID]
        ) VALUES (
            'suresh', 1
        );
    END

    -- User Division Mapping
    IF NOT EXISTS (SELECT 1 FROM [dbo].[AD_USER_DIVISION_MAPPING] WHERE [USER_ID] = 'suresh' AND [DIVISION_ID] = 1)
    BEGIN
        INSERT INTO [dbo].[AD_USER_DIVISION_MAPPING] (
            [USER_ID], [DIVISION_ID], [CREATED_BY], [CREATED_DATE]
        ) VALUES (
            'suresh', 1, 'SYSTEM', GETDATE()
        );
    END
END


-- Employee 3: Priya Sharma
DECLARE @EmpId3 INT;
IF NOT EXISTS (SELECT 1 FROM [dbo].[HR_EMPLOYEE] WHERE [EMP_CODE] = 'EMP003')
BEGIN
    INSERT INTO [dbo].[HR_EMPLOYEE] (
        [EMP_CODE], [EMPLOYEE_NAME], [FIRST_NAME], [LAST_NAME], [STATUS], [IS_ACTIVE], [CREATED_BY], [CREATED_DATE]
    ) VALUES (
        'EMP003', 'Priya Sharma', 'Priya', 'Sharma', 'Active', 1, 'SYSTEM', GETDATE()
    );
    SET @EmpId3 = SCOPE_IDENTITY();

    -- Child organization
    INSERT INTO [dbo].[HR_EMPLOYEE_ORGANIZATION] (
        [EMPLOYEE_ID], [CATEGORY_ID], [GRADE_CODE], [OFFICE_MAIL], [CREATED_BY], [CREATED_DATE]
    ) VALUES (
        @EmpId3, 1, 'A+', 'priya.sharma@nutech.com', 'SYSTEM', GETDATE()
    );

    -- Child scheduling
    INSERT INTO [dbo].[HR_EMPLOYEE_SCHEDULING] (
        [EMPLOYEE_ID], [DATE_OF_JOINING], [CREATED_BY], [CREATED_DATE]
    ) VALUES (
        @EmpId3, '2026-01-01', 'SYSTEM', GETDATE()
    );

    -- Child ability
    INSERT INTO [dbo].[HR_EMPLOYEE_ABILITY] (
        [EMPLOYEE_ID], [IS_AUDITOR], [IS_AUDITEE], [IS_NCR_APPROVER], [CREATED_BY], [CREATED_DATE]
    ) VALUES (
        @EmpId3, 1, 1, 1, 'SYSTEM', GETDATE()
    );

    -- Child induction
    INSERT INTO [dbo].[HR_EMPLOYEE_INDUCTION] (
        [EMPLOYEE_ID], [INDUCTION_STATUS], [IS_INDUCTION_ELIGIBLE], [CREATED_BY], [CREATED_DATE]
    ) VALUES (
        @EmpId3, 'COMPLETED', 'NO', 'SYSTEM', GETDATE()
    );

    -- User credentials (USER_LEVEL = 5, Password = admin123)
    IF NOT EXISTS (SELECT 1 FROM [dbo].[AD_USER_CREDENTIAL] WHERE [USER_ID] = 'priya')
    BEGIN
        INSERT INTO [dbo].[AD_USER_CREDENTIAL] (
            [USER_ID], [EMP_ID], [PASSWORD], [CREATED_BY], [CREATED_DATE], [STATUS], [USER_LEVEL], [AUTH_METHOD], [IS_ACTIVE]
        ) VALUES (
            'priya', @EmpId3, 'PqN+VbHvF4NpV9r1y//5Zw==', 'SYSTEM', GETDATE(), 1, 5, 'PASSWORD', 1
        );
    END

    -- User Company Mapping
    IF NOT EXISTS (SELECT 1 FROM [dbo].[AD_USER_COMPANY_MAPPING] WHERE [USER_ID] = 'priya' AND [COMPANY_ID] = 1)
    BEGIN
        INSERT INTO [dbo].[AD_USER_COMPANY_MAPPING] (
            [USER_ID], [COMPANY_ID]
        ) VALUES (
            'priya', 1
        );
    END

    -- User Division Mapping
    IF NOT EXISTS (SELECT 1 FROM [dbo].[AD_USER_DIVISION_MAPPING] WHERE [USER_ID] = 'priya' AND [DIVISION_ID] = 1)
    BEGIN
        INSERT INTO [dbo].[AD_USER_DIVISION_MAPPING] (
            [USER_ID], [DIVISION_ID], [CREATED_BY], [CREATED_DATE]
        ) VALUES (
            'priya', 1, 'SYSTEM', GETDATE()
        );
    END
END


-- Employee 4: Anita Patel
DECLARE @EmpId4 INT;
IF NOT EXISTS (SELECT 1 FROM [dbo].[HR_EMPLOYEE] WHERE [EMP_CODE] = 'EMP004')
BEGIN
    INSERT INTO [dbo].[HR_EMPLOYEE] (
        [EMP_CODE], [EMPLOYEE_NAME], [FIRST_NAME], [LAST_NAME], [STATUS], [IS_ACTIVE], [CREATED_BY], [CREATED_DATE]
    ) VALUES (
        'EMP004', 'Anita Patel', 'Anita', 'Patel', 'Active', 1, 'SYSTEM', GETDATE()
    );
    SET @EmpId4 = SCOPE_IDENTITY();

    -- Child organization
    INSERT INTO [dbo].[HR_EMPLOYEE_ORGANIZATION] (
        [EMPLOYEE_ID], [CATEGORY_ID], [GRADE_CODE], [OFFICE_MAIL], [CREATED_BY], [CREATED_DATE]
    ) VALUES (
        @EmpId4, 1, 'A+', 'anita.patel@nutech.com', 'SYSTEM', GETDATE()
    );

    -- Child scheduling
    INSERT INTO [dbo].[HR_EMPLOYEE_SCHEDULING] (
        [EMPLOYEE_ID], [DATE_OF_JOINING], [CREATED_BY], [CREATED_DATE]
    ) VALUES (
        @EmpId4, '2026-01-01', 'SYSTEM', GETDATE()
    );

    -- Child ability
    INSERT INTO [dbo].[HR_EMPLOYEE_ABILITY] (
        [EMPLOYEE_ID], [IS_AUDITOR], [IS_AUDITEE], [IS_NCR_APPROVER], [CREATED_BY], [CREATED_DATE]
    ) VALUES (
        @EmpId4, 1, 1, 1, 'SYSTEM', GETDATE()
    );

    -- Child induction
    INSERT INTO [dbo].[HR_EMPLOYEE_INDUCTION] (
        [EMPLOYEE_ID], [INDUCTION_STATUS], [IS_INDUCTION_ELIGIBLE], [CREATED_BY], [CREATED_DATE]
    ) VALUES (
        @EmpId4, 'COMPLETED', 'NO', 'SYSTEM', GETDATE()
    );

    -- User credentials (USER_LEVEL = 5, Password = admin123)
    IF NOT EXISTS (SELECT 1 FROM [dbo].[AD_USER_CREDENTIAL] WHERE [USER_ID] = 'anita')
    BEGIN
        INSERT INTO [dbo].[AD_USER_CREDENTIAL] (
            [USER_ID], [EMP_ID], [PASSWORD], [CREATED_BY], [CREATED_DATE], [STATUS], [USER_LEVEL], [AUTH_METHOD], [IS_ACTIVE]
        ) VALUES (
            'anita', @EmpId4, 'PqN+VbHvF4NpV9r1y//5Zw==', 'SYSTEM', GETDATE(), 1, 5, 'PASSWORD', 1
        );
    END

    -- User Company Mapping
    IF NOT EXISTS (SELECT 1 FROM [dbo].[AD_USER_COMPANY_MAPPING] WHERE [USER_ID] = 'anita' AND [COMPANY_ID] = 1)
    BEGIN
        INSERT INTO [dbo].[AD_USER_COMPANY_MAPPING] (
            [USER_ID], [COMPANY_ID]
        ) VALUES (
            'anita', 1
        );
    END

    -- User Division Mapping
    IF NOT EXISTS (SELECT 1 FROM [dbo].[AD_USER_DIVISION_MAPPING] WHERE [USER_ID] = 'anita' AND [DIVISION_ID] = 1)
    BEGIN
        INSERT INTO [dbo].[AD_USER_DIVISION_MAPPING] (
            [USER_ID], [DIVISION_ID], [CREATED_BY], [CREATED_DATE]
        ) VALUES (
            'anita', 1, 'SYSTEM', GETDATE()
        );
    END
END


-- Employee 5: Vijay Singh
DECLARE @EmpId5 INT;
IF NOT EXISTS (SELECT 1 FROM [dbo].[HR_EMPLOYEE] WHERE [EMP_CODE] = 'EMP005')
BEGIN
    INSERT INTO [dbo].[HR_EMPLOYEE] (
        [EMP_CODE], [EMPLOYEE_NAME], [FIRST_NAME], [LAST_NAME], [STATUS], [IS_ACTIVE], [CREATED_BY], [CREATED_DATE]
    ) VALUES (
        'EMP005', 'Vijay Singh', 'Vijay', 'Singh', 'Active', 1, 'SYSTEM', GETDATE()
    );
    SET @EmpId5 = SCOPE_IDENTITY();

    -- Child organization
    INSERT INTO [dbo].[HR_EMPLOYEE_ORGANIZATION] (
        [EMPLOYEE_ID], [CATEGORY_ID], [GRADE_CODE], [OFFICE_MAIL], [CREATED_BY], [CREATED_DATE]
    ) VALUES (
        @EmpId5, 1, 'A+', 'vijay.singh@nutech.com', 'SYSTEM', GETDATE()
    );

    -- Child scheduling
    INSERT INTO [dbo].[HR_EMPLOYEE_SCHEDULING] (
        [EMPLOYEE_ID], [DATE_OF_JOINING], [CREATED_BY], [CREATED_DATE]
    ) VALUES (
        @EmpId5, '2026-01-01', 'SYSTEM', GETDATE()
    );

    -- Child ability
    INSERT INTO [dbo].[HR_EMPLOYEE_ABILITY] (
        [EMPLOYEE_ID], [IS_AUDITOR], [IS_AUDITEE], [IS_NCR_APPROVER], [CREATED_BY], [CREATED_DATE]
    ) VALUES (
        @EmpId5, 1, 1, 1, 'SYSTEM', GETDATE()
    );

    -- Child induction
    INSERT INTO [dbo].[HR_EMPLOYEE_INDUCTION] (
        [EMPLOYEE_ID], [INDUCTION_STATUS], [IS_INDUCTION_ELIGIBLE], [CREATED_BY], [CREATED_DATE]
    ) VALUES (
        @EmpId5, 'COMPLETED', 'NO', 'SYSTEM', GETDATE()
    );

    -- User credentials (USER_LEVEL = 5, Password = admin123)
    IF NOT EXISTS (SELECT 1 FROM [dbo].[AD_USER_CREDENTIAL] WHERE [USER_ID] = 'vijay')
    BEGIN
        INSERT INTO [dbo].[AD_USER_CREDENTIAL] (
            [USER_ID], [EMP_ID], [PASSWORD], [CREATED_BY], [CREATED_DATE], [STATUS], [USER_LEVEL], [AUTH_METHOD], [IS_ACTIVE]
        ) VALUES (
            'vijay', @EmpId5, 'PqN+VbHvF4NpV9r1y//5Zw==', 'SYSTEM', GETDATE(), 1, 5, 'PASSWORD', 1
        );
    END

    -- User Company Mapping
    IF NOT EXISTS (SELECT 1 FROM [dbo].[AD_USER_COMPANY_MAPPING] WHERE [USER_ID] = 'vijay' AND [COMPANY_ID] = 1)
    BEGIN
        INSERT INTO [dbo].[AD_USER_COMPANY_MAPPING] (
            [USER_ID], [COMPANY_ID]
        ) VALUES (
            'vijay', 1
        );
    END

    -- User Division Mapping
    IF NOT EXISTS (SELECT 1 FROM [dbo].[AD_USER_DIVISION_MAPPING] WHERE [USER_ID] = 'vijay' AND [DIVISION_ID] = 1)
    BEGIN
        INSERT INTO [dbo].[AD_USER_DIVISION_MAPPING] (
            [USER_ID], [DIVISION_ID], [CREATED_BY], [CREATED_DATE]
        ) VALUES (
            'vijay', 1, 'SYSTEM', GETDATE()
        );
    END
END
