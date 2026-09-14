-- SQL Migration: V1115.5__Consolidated_Cleanups.sql
BEGIN TRANSACTION;
BEGIN TRY
    -- 1. Output distinct FROMWHERE values and counts before migration
    PRINT 'Pre-migration distinct FROMWHERE values and counts:';
    DECLARE @Val NVARCHAR(100), @Cnt INT;
    DECLARE val_cursor CURSOR FOR 
    SELECT COALESCE(FROMWHERE, 'NULL'), COUNT(*) 
    FROM dbo.HR_EMPLOYEE 
    GROUP BY FROMWHERE;
    
    OPEN val_cursor;
    FETCH NEXT FROM val_cursor INTO @Val, @Cnt;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        PRINT '  Value: ' + @Val + ' | Count: ' + CAST(@Cnt AS VARCHAR(10));
        FETCH NEXT FROM val_cursor INTO @Val, @Cnt;
    END;
    CLOSE val_cursor;
    DEALLOCATE val_cursor;

    -- 2. Detect any unrecognized FROMWHERE values and abort if found
    DECLARE @UnrecognizedList NVARCHAR(MAX) = '';
    SELECT @UnrecognizedList = COALESCE(@UnrecognizedList + ', ', '') + FROMWHERE
    FROM (
        SELECT DISTINCT FROMWHERE 
        FROM dbo.HR_EMPLOYEE 
        WHERE FROMWHERE IS NOT NULL 
          AND UPPER(TRIM(FROMWHERE)) NOT IN ('ATS', 'EMPLOYEE', 'EMPLOYEE_MASTER', 'EMPLOYEE-MASTER', 'EMPLOYEEMASTER', '')
    ) AS Unrecognized;

    IF LEN(@UnrecognizedList) > 0
    BEGIN
        DECLARE @ErrMsg NVARCHAR(4000) = 'Validation Failed: Unrecognized FROMWHERE values found in HR_EMPLOYEE: ' + @UnrecognizedList;
        THROW 50102, @ErrMsg, 1;
    END

    -- 3. Conservative normalization of known variants to 'EMPLOYEE'
    UPDATE dbo.HR_EMPLOYEE
    SET FROMWHERE = 'EMPLOYEE'
    WHERE FROMWHERE IS NULL 
       OR LTRIM(RTRIM(FROMWHERE)) = ''
       OR UPPER(TRIM(FROMWHERE)) IN ('EMPLOYEE_MASTER', 'EMPLOYEE-MASTER', 'EMPLOYEEMASTER');

    -- Normalize standard names to uppercase clean values
    UPDATE dbo.HR_EMPLOYEE
    SET FROMWHERE = 'EMPLOYEE'
    WHERE UPPER(TRIM(FROMWHERE)) = 'EMPLOYEE';

    UPDATE dbo.HR_EMPLOYEE
    SET FROMWHERE = 'ATS'
    WHERE UPPER(TRIM(FROMWHERE)) = 'ATS';

    -- Verify only 'ATS' and 'EMPLOYEE' remain
    IF EXISTS (
        SELECT 1 
        FROM dbo.HR_EMPLOYEE 
        WHERE FROMWHERE IS NULL 
           OR FROMWHERE NOT IN ('ATS', 'EMPLOYEE')
    )
    BEGIN
        THROW 50103, 'Verification Failed: Unnormalized FROMWHERE values still exist in HR_EMPLOYEE.', 1;
    END

    -- 4. Drop obsolete tables if they exist
    IF OBJECT_ID('dbo.HR_EMPLOYEE_ATS', 'U') IS NOT NULL
    BEGIN
        DROP TABLE dbo.HR_EMPLOYEE_ATS;
    END

    IF OBJECT_ID('dbo.HR_EMPLOYEE_ATS_BACKUP', 'U') IS NOT NULL
    BEGIN
        DROP TABLE dbo.HR_EMPLOYEE_ATS_BACKUP;
    END

    -- 5. Verification checks
    IF OBJECT_ID('dbo.HR_EMPLOYEE_ATS', 'U') IS NOT NULL
    BEGIN
        THROW 50100, 'Verification Failed: HR_EMPLOYEE_ATS was not dropped successfully!', 1;
    END
    ELSE
    BEGIN
        PRINT 'Verification passed: HR_EMPLOYEE_ATS is absent.';
    END
    
    IF OBJECT_ID('dbo.HR_EMPLOYEE_ATS_BACKUP', 'U') IS NOT NULL
    BEGIN
        THROW 50101, 'Verification Failed: HR_EMPLOYEE_ATS_BACKUP was not dropped successfully!', 1;
    END
    ELSE
    BEGIN
        PRINT 'Verification passed: HR_EMPLOYEE_ATS_BACKUP is absent.';
    END

    COMMIT TRANSACTION;
    PRINT 'Migration V1115.5 completed successfully.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;
GO
