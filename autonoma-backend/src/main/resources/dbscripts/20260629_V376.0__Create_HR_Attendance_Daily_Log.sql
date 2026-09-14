-- ============================================================================
-- Migration V376: Create HR_ATTENDANCE_DAILY_LOG table
-- Description: Stores daily attendance records computed from multi-source
--              streams (ESSL, Manual, OD). All time intervals are stored as
--              clean integer minutes for downstream payroll consumption.
-- ============================================================================

-- 1. Create table if it does not exist
IF OBJECT_ID('HR_ATTENDANCE_DAILY_LOG', 'U') IS NULL
BEGIN
    CREATE TABLE HR_ATTENDANCE_DAILY_LOG (
        ID                BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        EMP_ID            BIGINT NOT NULL,
        SHIFT_ID          BIGINT NOT NULL,
        ATTENDANCE_DATE   DATE NOT NULL,
        IN_TIME           TIME NULL,
        OUT_TIME          TIME NULL,
        EARLY_IN          INT NOT NULL DEFAULT 0,
        EARLY_OUT         INT NOT NULL DEFAULT 0,
        DURATION          INT NOT NULL DEFAULT 0,
        LOM               INT NOT NULL DEFAULT 0,
        OT                INT NOT NULL DEFAULT 0,
        ATT_TYPE          NVARCHAR(30) NOT NULL,
        REMARKS           NVARCHAR(30) NULL,
        FROM_WHERE        NVARCHAR(30) NOT NULL,
        IS_ACTIVE         BIT NOT NULL DEFAULT 1,
        CREATED_BY        NVARCHAR(50) NULL,
        CREATED_DATE      DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
        UPDATED_BY        NVARCHAR(50) NULL,
        UPDATED_DATE      DATETIME NULL,

        -- Unique constraint: one record per employee per date
        CONSTRAINT UQ_HR_ATT_DAILY_LOG_EMP_DATE UNIQUE (EMP_ID, ATTENDANCE_DATE),

        -- Foreign keys
        CONSTRAINT FK_HR_ATT_DAILY_LOG_EMPLOYEE FOREIGN KEY (EMP_ID)
            REFERENCES HR_EMPLOYEE(ID),
        CONSTRAINT FK_HR_ATT_DAILY_LOG_SHIFT FOREIGN KEY (SHIFT_ID)
            REFERENCES HR_SHIFT_MASTER(ID)
    );

    PRINT 'Created table HR_ATTENDANCE_DAILY_LOG';
END
GO

-- 2. Create indexes for search performance
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_HR_ATT_DAILY_LOG_EMP_ID' AND object_id = OBJECT_ID('HR_ATTENDANCE_DAILY_LOG'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_HR_ATT_DAILY_LOG_EMP_ID
        ON HR_ATTENDANCE_DAILY_LOG (EMP_ID);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_HR_ATT_DAILY_LOG_ATT_DATE' AND object_id = OBJECT_ID('HR_ATTENDANCE_DAILY_LOG'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_HR_ATT_DAILY_LOG_ATT_DATE
        ON HR_ATTENDANCE_DAILY_LOG (ATTENDANCE_DATE);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_HR_ATT_DAILY_LOG_ATT_TYPE' AND object_id = OBJECT_ID('HR_ATTENDANCE_DAILY_LOG'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_HR_ATT_DAILY_LOG_ATT_TYPE
        ON HR_ATTENDANCE_DAILY_LOG (ATT_TYPE);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_HR_ATT_DAILY_LOG_SHIFT_ID' AND object_id = OBJECT_ID('HR_ATTENDANCE_DAILY_LOG'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_HR_ATT_DAILY_LOG_SHIFT_ID
        ON HR_ATTENDANCE_DAILY_LOG (SHIFT_ID);
END
GO

-- 3. Register page HA1345 in BOS_PAGES
DECLARE @subModId BIGINT;
SELECT @subModId = ID FROM BOS_SUB_MODULE WHERE SUB_MOD_CODE = 'HA1300';

-- Fallback: try to find any Attendance sub-module
IF @subModId IS NULL
BEGIN
    SELECT TOP 1 @subModId = ID FROM BOS_SUB_MODULE
    WHERE SUB_MOD_NAME LIKE '%Attendance%' ORDER BY ID;
END

-- Fallback: use HRA module
IF @subModId IS NULL
BEGIN
    SELECT TOP 1 @subModId = sm.ID FROM BOS_SUB_MODULE sm
    INNER JOIN BOS_MODULE m ON sm.MOD_ID = m.ID
    WHERE m.MOD_CODE = 'HA0000' ORDER BY sm.ID;
END

IF NOT EXISTS (SELECT 1 FROM BOS_PAGES WHERE PAGE_CODE = 'HA1345')
BEGIN
    INSERT INTO BOS_PAGES (SUB_MOD_ID, PAGE_CODE, PAGE_NAME, ENABLED, PAGE_URL, ICON)
    VALUES (
        @subModId,
        'HA1345',
        'Attendance Entry',
        1,
        '/hra/attendance/attendance-entry',
        'IconClipboardCheck'
    );
    PRINT 'Registered page HA1345 (Attendance Entry)';
END
GO

-- 4. Grant permissions to all users who have access to Biometric Attendance (HA1340)
DECLARE @newPageId BIGINT;
SELECT @newPageId = ID FROM BOS_PAGES WHERE PAGE_CODE = 'HA1345';

DECLARE @refPageId BIGINT;
SELECT @refPageId = ID FROM BOS_PAGES WHERE PAGE_CODE = 'HA1340';

IF @newPageId IS NOT NULL AND @refPageId IS NOT NULL
BEGIN
    INSERT INTO BOS_USER_PAGE_AUTH (USER_ID, PAGE_ID, CAN_READ, CAN_WRITE, CAN_DELETE, CAN_EXPORT, CAN_APPROVE, CAN_MANAGE)
    SELECT
        upa.USER_ID,
        @newPageId,
        upa.CAN_READ,
        upa.CAN_WRITE,
        upa.CAN_DELETE,
        upa.CAN_EXPORT,
        upa.CAN_APPROVE,
        upa.CAN_MANAGE
    FROM BOS_USER_PAGE_AUTH upa
    WHERE upa.PAGE_ID = @refPageId
      AND NOT EXISTS (
          SELECT 1 FROM BOS_USER_PAGE_AUTH x
          WHERE x.USER_ID = upa.USER_ID AND x.PAGE_ID = @newPageId
      );
    PRINT 'Granted HA1345 permissions from HA1340 reference';
END
GO
