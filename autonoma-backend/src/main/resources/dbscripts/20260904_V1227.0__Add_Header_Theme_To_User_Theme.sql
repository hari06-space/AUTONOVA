-- Migration: Add header_theme column to AD_USER_THEME_SETTING
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('AD_USER_THEME_SETTING') AND name = 'header_theme'
)
BEGIN
    ALTER TABLE AD_USER_THEME_SETTING ADD header_theme NVARCHAR(50) NULL;
END
