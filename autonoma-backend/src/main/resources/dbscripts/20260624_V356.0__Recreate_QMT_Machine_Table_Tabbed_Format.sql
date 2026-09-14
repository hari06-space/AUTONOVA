-- ==============================================================================
-- Migration Script: V356.0 Recreate QMT Machine Table for Tabbed Format
-- Description: SKIPPED. This script contained destructive DROP TABLE logic for 
--              QMT_MACHINE which fails due to new foreign keys (from V371). 
--              Schema fixes are handled properly in V370.0.
-- ==============================================================================

PRINT 'Skipping V356.0 - Superceded by V370.0 schema fixes.';
