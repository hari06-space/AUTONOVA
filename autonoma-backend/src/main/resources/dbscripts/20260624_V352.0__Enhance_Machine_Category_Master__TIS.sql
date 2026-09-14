-- ==============================================================================
-- Migration Script: V352.0 Enhance Machine Category Master
-- Description: SKIPPED. This script originally contained broken schema recreation logic 
--              for QMT_MACHINE and QMT_MACHINE_CATEGORY without properly handling all FKs.
--              It has been superseded by V370.0 (Fix_QMT_Machine_Category_ID_Column.sql), 
--              which drops all FK dependencies correctly and adds the IDENTITY(1,1) attribute.
-- ==============================================================================

PRINT 'Skipping V352.0 - Superceded by V370.0 schema fixes.';
