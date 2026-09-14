-- ===================================================================================
-- Migration: 20260801_V1100.0__Remove_Obsolete_Leave_Policy_Columns.sql
-- Module: HR / Policy Settings
-- Purpose: Remove obsolete Leave Policy columns and preferences (LEAVE_ALLOW_BACKDATED,
--          LEAVE_MAX_BACKDATED_DAYS, LEAVE_ADVANCE_NOTICE_DAYS, LEAVE_ALLOW_NEGATIVE_BALANCE_GLOBAL)
--          as standard 3-day manager backdated rule & strict positive balance rules apply.
-- ===================================================================================

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('HR_SETTING_MASTER') AND name = 'LEAVE_ALLOW_BACKDATED')
BEGIN
    ALTER TABLE HR_SETTING_MASTER DROP COLUMN LEAVE_ALLOW_BACKDATED;
END
GO

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('HR_SETTING_MASTER') AND name = 'LEAVE_MAX_BACKDATED_DAYS')
BEGIN
    ALTER TABLE HR_SETTING_MASTER DROP COLUMN LEAVE_MAX_BACKDATED_DAYS;
END
GO

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('HR_SETTING_MASTER') AND name = 'LEAVE_ADVANCE_NOTICE_DAYS')
BEGIN
    ALTER TABLE HR_SETTING_MASTER DROP COLUMN LEAVE_ADVANCE_NOTICE_DAYS;
END
GO

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('HR_SETTING_MASTER') AND name = 'LEAVE_ALLOW_NEGATIVE_BALANCE_GLOBAL')
BEGIN
    ALTER TABLE HR_SETTING_MASTER DROP COLUMN LEAVE_ALLOW_NEGATIVE_BALANCE_GLOBAL;
END
GO

-- Clean up preferences from AD_APP_PREFERENCE table if present
DELETE FROM AD_APP_PREFERENCE WHERE PREF_NAME IN (
    'LEAVE_ALLOW_BACKDATED',
    'LEAVE_MAX_BACKDATED_DAYS',
    'LEAVE_ADVANCE_NOTICE_DAYS',
    'LEAVE_ALLOW_NEGATIVE_BALANCE_GLOBAL'
);
GO
