-- ==============================================================================================
-- Script Name: 20260828_V1172.0__Create_QMS_Meeting_Schedule_Reminder_Ack_Log.sql
-- Description: 
--   1. Adds REMAINDER_DAYS column to QMS_MEETING_MASTER with range constraint (0 to 10).
--   2. Creates QMS_SCHEDULE_REMINDER_ACK_LOG table with Primary Key, Foreign Keys (Schedule, Employee, Status),
--      and non-clustered performance indexes.
-- ==============================================================================================

-- ----------------------------------------------------------------------------------------------
-- 1. Add REMAINDER_DAYS column to QMS_MEETING_MASTER
-- ----------------------------------------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[QMS_MEETING_MASTER]') 
      AND name = N'REMAINDER_DAYS'
)
BEGIN
    ALTER TABLE [dbo].[QMS_MEETING_MASTER] 
    ADD [REMAINDER_DAYS] INT NOT NULL DEFAULT 0;
END
GO

-- ----------------------------------------------------------------------------------------------
-- 2. Create QMS_SCHEDULE_REMINDER_ACK_LOG Table
-- ----------------------------------------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1 FROM sys.objects 
    WHERE object_id = OBJECT_ID(N'[dbo].[QMS_SCHEDULE_REMINDER_ACK_LOG]') 
      AND type in (N'U')
)
BEGIN
    CREATE TABLE [dbo].[QMS_SCHEDULE_REMINDER_ACK_LOG] (
        [ID]               BIGINT IDENTITY(1,1) NOT NULL,
        [SCHEDULE_ID]      BIGINT NOT NULL,
        [EMPLOYEE_ID]      BIGINT NOT NULL,
        [REMINDER_DATE]    DATE NOT NULL,
        [ACKNOWLEDGED_AT]  DATETIME2(7) NOT NULL DEFAULT GETDATE(),
        [STATUS]           BIGINT NULL,

        -- Primary Key Constraint
        CONSTRAINT [PK_QMS_SCHEDULE_REMINDER_ACK_LOG] 
            PRIMARY KEY CLUSTERED ([ID] ASC),

        -- Foreign Key Constraints
        CONSTRAINT [FK_QMS_SCH_REM_ACK_SCHEDULE] 
            FOREIGN KEY ([SCHEDULE_ID]) REFERENCES [dbo].[QMS_MEETING_SCHEDULE] ([ID]) 
            ON DELETE CASCADE,

        CONSTRAINT [FK_QMS_SCH_REM_ACK_EMPLOYEE] 
            FOREIGN KEY ([EMPLOYEE_ID]) REFERENCES [dbo].[HR_EMPLOYEE] ([ID]),

        CONSTRAINT [FK_QMS_SCH_REM_ACK_STATUS] 
            FOREIGN KEY ([STATUS]) REFERENCES [dbo].[AD_STATUS_MASTER] ([ID])
    );
END
GO

-- ----------------------------------------------------------------------------------------------
-- 3. Create Performance & Lookup Indexes
-- ----------------------------------------------------------------------------------------------

-- Composite index for fast daily acknowledgement check: (SCHEDULE_ID, EMPLOYEE_ID, REMINDER_DATE)
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = N'IX_QMS_SCH_REM_ACK_LOOKUP' 
      AND object_id = OBJECT_ID(N'[dbo].[QMS_SCHEDULE_REMINDER_ACK_LOG]')
)
BEGIN
    CREATE NONCLUSTERED INDEX [IX_QMS_SCH_REM_ACK_LOOKUP] 
    ON [dbo].[QMS_SCHEDULE_REMINDER_ACK_LOG] (
        [SCHEDULE_ID] ASC, 
        [EMPLOYEE_ID] ASC, 
        [REMINDER_DATE] ASC
    );
END
GO

-- Index for date-range queries & audit reporting
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = N'IX_QMS_SCH_REM_ACK_DATE' 
      AND object_id = OBJECT_ID(N'[dbo].[QMS_SCHEDULE_REMINDER_ACK_LOG]')
)
BEGIN
    CREATE NONCLUSTERED INDEX [IX_QMS_SCH_REM_ACK_DATE] 
    ON [dbo].[QMS_SCHEDULE_REMINDER_ACK_LOG] ([REMINDER_DATE] ASC);
END
GO

-- Index for employee user lookups
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = N'IX_QMS_SCH_REM_ACK_EMP' 
      AND object_id = OBJECT_ID(N'[dbo].[QMS_SCHEDULE_REMINDER_ACK_LOG]')
)
BEGIN
    CREATE NONCLUSTERED INDEX [IX_QMS_SCH_REM_ACK_EMP] 
    ON [dbo].[QMS_SCHEDULE_REMINDER_ACK_LOG] ([EMPLOYEE_ID] ASC);
END
GO
