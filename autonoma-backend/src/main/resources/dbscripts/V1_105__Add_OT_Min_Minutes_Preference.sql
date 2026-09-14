-- Migration V1_105: Add OT_MIN_MINUTES preference to AD_APP_PREFERENCE if not exists
IF NOT EXISTS (SELECT 1 FROM AD_APP_PREFERENCE WHERE pref_name = 'OT_MIN_MINUTES')
BEGIN
    INSERT INTO AD_APP_PREFERENCE (pref_name, pref_value, comments, pref_type, CREATED_BY, CREATED_DATE)
    VALUES ('OT_MIN_MINUTES', '30', 'Minimum overtime calculation interval in minutes', 'NUMBER', 'SYSTEM', GETDATE());
END
