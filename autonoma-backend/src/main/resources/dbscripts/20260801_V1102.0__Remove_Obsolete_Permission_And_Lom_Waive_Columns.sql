-- ===================================================================================
-- Migration: 20260801_V1102.0__Remove_Obsolete_Permission_And_Lom_Waive_Columns.sql
-- Module: HR / Permission & LOM Policy Settings
-- Purpose: Remove obsolete Permission & LOM Policy columns and preferences (PERMISSION_ALLOW_PAST_DATES,
--          PERMISSION_MAX_BACKDATED_DAYS, PERMISSION_ALLOW_SAME_DAY, LOM_PERMISSION_WAIVE_ENABLED)
--          as standard 3-day / ADD1 backdated rule & present/future date rules apply.
-- ===================================================================================

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('HR_SETTING_MASTER') AND name = 'PERMISSION_ALLOW_PAST_DATES')
BEGIN
    ALTER TABLE HR_SETTING_MASTER DROP COLUMN PERMISSION_ALLOW_PAST_DATES;
END
GO

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('HR_SETTING_MASTER') AND name = 'PERMISSION_MAX_BACKDATED_DAYS')
BEGIN
    ALTER TABLE HR_SETTING_MASTER DROP COLUMN PERMISSION_MAX_BACKDATED_DAYS;
END
GO

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('HR_SETTING_MASTER') AND name = 'PERMISSION_ALLOW_SAME_DAY')
BEGIN
    ALTER TABLE HR_SETTING_MASTER DROP COLUMN PERMISSION_ALLOW_SAME_DAY;
END
GO

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('HR_SETTING_MASTER') AND name = 'LOM_PERMISSION_WAIVE_ENABLED')
BEGIN
    ALTER TABLE HR_SETTING_MASTER DROP COLUMN LOM_PERMISSION_WAIVE_ENABLED;
END
GO

-- Clean up preferences from AD_APP_PREFERENCE table if present
DELETE FROM AD_APP_PREFERENCE WHERE PREF_NAME IN (
    'PERMISSION_ALLOW_PAST_DATES',
    'PERMISSION_MAX_BACKDATED_DAYS',
    'PERMISSION_ALLOW_SAME_DAY',
    'LOM_PERMISSION_WAIVE'
);
GO
