-- ===================================================================================
-- Migration: 20260801_V1103.0__Remove_Obsolete_Lom_Threshold_And_Working_Days_Columns.sql
-- Module: HR / Attendance & LOM Policy Settings
-- Purpose: Remove obsolete LOM penalty threshold and working days calculation preferences
--          (LATE_ARRIVAL_THRESHOLD_MINUTES / LOM_DEDUCTION_THRESHOLD, HR_WORKING_DAYS_CALCULATION,
--          and HR_WEEKLY_OFF_HANDLING) from HR_SETTING_MASTER & AD_APP_PREFERENCE tables.
-- ===================================================================================

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('HR_SETTING_MASTER') AND name = 'LATE_ARRIVAL_THRESHOLD_MINUTES')
BEGIN
    ALTER TABLE HR_SETTING_MASTER DROP COLUMN LATE_ARRIVAL_THRESHOLD_MINUTES;
END
GO

-- Clean up obsolete preference entries from AD_APP_PREFERENCE table if present
DELETE FROM AD_APP_PREFERENCE WHERE PREF_NAME IN (
    'LOM_DEDUCTION_THRESHOLD',
    'LATE_ARRIVAL_THRESHOLD_MINUTES',
    'HR_WORKING_DAYS_CALCULATION',
    'HR_WEEKLY_OFF_HANDLING'
);
GO
