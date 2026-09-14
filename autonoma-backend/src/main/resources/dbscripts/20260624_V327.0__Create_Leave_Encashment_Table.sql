-- 20260624_V327.0__Create_Leave_Encashment_Table.sql
-- SQL DDL schema for creating HR_LEAVE_ENCASHMENT_ENTRY database table

IF OBJECT_ID('HR_LEAVE_ENCASHMENT_ENTRY', 'U') IS NULL
BEGIN
    CREATE TABLE HR_LEAVE_ENCASHMENT_ENTRY (
        ID BIGINT IDENTITY(1,1) PRIMARY KEY,
        EMPLOYEE_ID BIGINT NOT NULL,
        FROM_DATE DATE NULL,
        TO_DATE DATE NULL,
        
        -- Current Year Leaves
        EL FLOAT NULL DEFAULT 0.0,
        CL FLOAT NULL DEFAULT 0.0,
        
        -- Previous Years Leaves
        PREV_YRS_EL FLOAT NULL DEFAULT 0.0,
        PREV_YRS_CL FLOAT NULL DEFAULT 0.0,
        
        -- Total Available
        TOTAL_EL FLOAT NULL DEFAULT 0.0,
        TOTAL_CL FLOAT NULL DEFAULT 0.0,
        
        -- Encashment Requested
        ENCASH_EL FLOAT NULL DEFAULT 0.0,
        ENCASH_CL FLOAT NULL DEFAULT 0.0,
        
        -- Calculated Totals
        TOTAL_LEAVE_ENCASH FLOAT NULL DEFAULT 0.0,
        TOTAL_AMT FLOAT NULL DEFAULT 0.0,
        
        -- Status & Audit
        STATUS NVARCHAR(50) NULL DEFAULT 'Pending',
        IS_ACTIVE BIT NOT NULL DEFAULT 1,
        CREATED_BY NVARCHAR(50) NOT NULL,
        CREATED_DATE DATETIME NOT NULL DEFAULT GETDATE(),
        UPDATED_BY NVARCHAR(50) NULL,
        UPDATED_DATE DATETIME NULL
    );

    PRINT 'Created HR_LEAVE_ENCASHMENT_ENTRY table.';
END
GO
