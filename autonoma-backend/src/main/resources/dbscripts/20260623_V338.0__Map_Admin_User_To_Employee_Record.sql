-- 20260621_V314.0__Map_Admin_User_To_Employee_Record.sql
-- Seed Administrator employee record and link the Admin user to it

-- 0. Ensure SUPER BOSS exists in AD_USER_CREDENTIAL to prevent foreign key conflicts in subsequent tables
IF NOT EXISTS (SELECT 1 FROM [dbo].[AD_USER_CREDENTIAL] WHERE [USER_ID] = 'SUPER BOSS')
BEGIN
    INSERT INTO [dbo].[AD_USER_CREDENTIAL] (
        [USER_ID], [PASSWORD], [STATUS], [USER_LEVEL], [CREATED_BY], [CREATED_DATE], [IS_ACTIVE]
    ) VALUES (
        'SUPER BOSS', 'PqN+VbHvF4NpV9r1y//5Zw==', 1, 5, 'SYSTEM', GETDATE(), 1
    );
END
GO

-- 1. Ensure Administrator exists in HR_EMPLOYEE (if not already present)
DECLARE @AdminEmpId INT;
SELECT @AdminEmpId = [ID] FROM [dbo].[HR_EMPLOYEE] WHERE [EMP_CODE] = 'ADMIN_EMP';

IF @AdminEmpId IS NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM [dbo].[HR_EMPLOYEE] WHERE [ID] = 1)
    BEGIN
        SET IDENTITY_INSERT [dbo].[HR_EMPLOYEE] ON;
        INSERT INTO [dbo].[HR_EMPLOYEE] (
            [ID], [EMP_CODE], [EMPLOYEE_NAME], [STATUS], [IS_ACTIVE], [CREATED_BY], [CREATED_DATE]
        ) VALUES (
            1, 'ADMIN_EMP', 'Administrator', 'Active', 1, 'SUPER BOSS', GETDATE()
        );
        SET IDENTITY_INSERT [dbo].[HR_EMPLOYEE] OFF;
        SET @AdminEmpId = 1;
        PRINT 'Created Administrator employee with ID = 1';
    END
    ELSE
    BEGIN
        INSERT INTO [dbo].[HR_EMPLOYEE] (
            [EMP_CODE], [EMPLOYEE_NAME], [STATUS], [IS_ACTIVE], [CREATED_BY], [CREATED_DATE]
        ) VALUES (
            'ADMIN_EMP', 'Administrator', 'Active', 1, 'SUPER BOSS', GETDATE()
        );
        SET @AdminEmpId = SCOPE_IDENTITY();
        PRINT 'Created Administrator employee with auto-increment ID';
    END
END

-- 2. Seed default child records for Administrator employee if missing
IF NOT EXISTS (SELECT 1 FROM [dbo].[HR_EMPLOYEE_ORGANIZATION] WHERE [EMPLOYEE_ID] = @AdminEmpId)
BEGIN
    INSERT INTO [dbo].[HR_EMPLOYEE_ORGANIZATION] (
        [EMPLOYEE_ID], [OFFICE_MAIL], [CREATED_BY], [CREATED_DATE]
    ) VALUES (
        @AdminEmpId, 'admin.emp@example.com', 'SUPER BOSS', GETDATE()
    );
    PRINT 'Created child record in HR_EMPLOYEE_ORGANIZATION';
END

IF NOT EXISTS (SELECT 1 FROM [dbo].[HR_EMPLOYEE_SCHEDULING] WHERE [EMPLOYEE_ID] = @AdminEmpId)
BEGIN
    INSERT INTO [dbo].[HR_EMPLOYEE_SCHEDULING] (
        [EMPLOYEE_ID], [DATE_OF_JOINING], [CREATED_BY], [CREATED_DATE]
    ) VALUES (
        @AdminEmpId, '2025-12-11', 'SUPER BOSS', GETDATE()
    );
    PRINT 'Created child record in HR_EMPLOYEE_SCHEDULING';
END

IF NOT EXISTS (SELECT 1 FROM [dbo].[HR_EMPLOYEE_ABILITY] WHERE [EMPLOYEE_ID] = @AdminEmpId)
BEGIN
    INSERT INTO [dbo].[HR_EMPLOYEE_ABILITY] (
        [EMPLOYEE_ID], [IS_AUDITOR], [IS_AUDITEE], [IS_NCR_APPROVER], [CREATED_BY], [CREATED_DATE]
    ) VALUES (
        @AdminEmpId, 1, 1, 1, 'SUPER BOSS', GETDATE()
    );
    PRINT 'Created child record in HR_EMPLOYEE_ABILITY';
END

IF NOT EXISTS (SELECT 1 FROM [dbo].[HR_EMPLOYEE_INDUCTION] WHERE [EMPLOYEE_ID] = @AdminEmpId)
BEGIN
    INSERT INTO [dbo].[HR_EMPLOYEE_INDUCTION] (
        [EMPLOYEE_ID], [INDUCTION_STATUS], [IS_INDUCTION_ELIGIBLE], [CREATED_BY], [CREATED_DATE]
    ) VALUES (
        @AdminEmpId, 'COMPLETED', 'NO', 'SUPER BOSS', GETDATE()
    );
    PRINT 'Created child record in HR_EMPLOYEE_INDUCTION';
END

-- 3. Map Admin user credential to Administrator employee ID
UPDATE [dbo].[AD_USER_CREDENTIAL]
SET [EMP_ID] = @AdminEmpId
WHERE [USER_ID] = 'SUPER BOSS';
PRINT 'Mapped SUPER BOSS user to Employee';

-- 4. Seed pending survey mapping for Admin if missing
IF NOT EXISTS (SELECT 1 FROM [dbo].[HR_EMPLOYEE_SATISFACTION_MAPPING] WHERE [EMPLOYEE_ID] = @AdminEmpId AND [FEEDBACK_CYCLE] = 'June 2026')
BEGIN
    INSERT INTO [dbo].[HR_EMPLOYEE_SATISFACTION_MAPPING] (
        [EMPLOYEE_ID], [FEEDBACK_CYCLE], [ELIGIBILITY_DATE], [FEEDBACK_START_DATE], [FEEDBACK_END_DATE], [IS_CLOSED], [STATUS], [REMINDER_COUNT], [CREATED_BY], [CREATED_DATE]
    ) VALUES (
        @AdminEmpId, 'June 2026', CAST(GETDATE() AS DATE), CAST(GETDATE() AS DATE), CAST(DATEADD(day, 14, GETDATE()) AS DATE), 'N', 'Pending', '0', 'SUPER BOSS', GETDATE()
    );
    PRINT 'Inserted pending survey mapping for Admin';
END
