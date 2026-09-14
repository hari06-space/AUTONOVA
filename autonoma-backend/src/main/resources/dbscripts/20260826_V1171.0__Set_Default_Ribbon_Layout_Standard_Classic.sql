-- ============================================================================
-- Migration: V1171.0 - Set Default Ribbon Layout to Standard (Classic)
-- Target DB: AT_NUTECH
-- Author: Antigravity
-- Date: 2026-08-26
-- Description: Standardize default ribbon layout to 'classic' (Standard) across all users.
-- ============================================================================

IF EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('AD_USER_THEME_SETTING') 
    AND name = 'RIBBON_LAYOUT'
)
BEGIN
    UPDATE AD_USER_THEME_SETTING 
    SET RIBBON_LAYOUT = 'classic' 
    WHERE RIBBON_LAYOUT IS NULL OR RIBBON_LAYOUT = 'Premium' OR RIBBON_LAYOUT = 'default';
END
GO
