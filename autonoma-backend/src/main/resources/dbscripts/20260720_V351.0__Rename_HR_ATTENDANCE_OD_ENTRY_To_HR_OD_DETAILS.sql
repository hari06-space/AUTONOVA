-- =================================================================================
-- Migration Script: Rename HR_ATTENDANCE_OD_ENTRY to HR_OD_DETAILS
-- Date: 2026-07-20
-- Description: Idempotent rename of table HR_ATTENDANCE_OD_ENTRY to HR_OD_DETAILS
-- =================================================================================

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'HR_ATTENDANCE_OD_ENTRY')
   AND NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'HR_OD_DETAILS')
BEGIN
    EXEC sp_rename 'HR_ATTENDANCE_OD_ENTRY', 'HR_OD_DETAILS';
    PRINT 'Renamed HR_ATTENDANCE_OD_ENTRY to HR_OD_DETAILS';
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'HR_OD_DETAILS')
BEGIN
    CREATE TABLE [dbo].[HR_OD_DETAILS] (
        [ID]                  BIGINT IDENTITY(1,1) NOT NULL,
        [OD_NUMBER]           VARCHAR(100) NOT NULL UNIQUE,
        [EMPLOYEE_ID]          BIGINT NOT NULL,
        [OD_FROM_DATE_TIME]   DATETIME2 NULL,
        [OD_TO_DATE_TIME]     DATETIME2 NULL,
        [VISIT_TYPE]          VARCHAR(50) NULL,
        [VEHICLE_TYPE]        VARCHAR(50) NULL,
        [PURPOSE_OF_OD]       VARCHAR(500) NULL,
        [FROM_LOCATION]       VARCHAR(255) NULL,
        [TO_LOCATION]         VARCHAR(255) NULL,
        [DISTANCE]            DECIMAL(10,2) NULL,
        [STATUS]              VARCHAR(50) NULL,
        [REJECTION_REASON]    VARCHAR(500) NULL,
        [REMARKS]             VARCHAR(500) NULL,
        [IS_ACTIVE]           BIT DEFAULT 1,
        [CREATED_BY]          VARCHAR(50) NOT NULL,
        [CREATED_DATE]        DATETIME2 NULL,
        [UPDATED_BY]          VARCHAR(50) NULL,
        [UPDATED_DATE]        DATETIME2 NULL,
        CONSTRAINT [PK_HR_OD_DETAILS] PRIMARY KEY CLUSTERED ([ID] ASC)
    );
    PRINT 'Created HR_OD_DETAILS table';
END
GO
