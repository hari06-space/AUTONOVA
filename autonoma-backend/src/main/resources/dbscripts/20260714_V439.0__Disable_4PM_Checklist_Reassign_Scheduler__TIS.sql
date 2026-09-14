-- =================================================================================
-- Migration: Disable CHECKLIST_REASSIGN_3 (4PM Reassignment Scheduler)
-- Target Date: 2026-07-14
-- Team: TIS (QMS / Checklist)
-- Reason: 4AM re-validation (Step 5) now covers leave changes that occur
--         between 2PM and EOD. The 10AM and 2PM checks remain active.
--         The 4PM slot is redundant and is being disabled to reduce DB load.
-- =================================================================================

-- Disable the 4PM reassignment scheduler
IF EXISTS (
    SELECT 1 FROM SCHEDULE_CONFIGURATION
    WHERE SCHEDULAR_NAME = 'CHECKLIST_REASSIGN_3'
)
BEGIN
    UPDATE SCHEDULE_CONFIGURATION
    SET STATUS = 0,
        UPDATED_BY = 'SYSTEM_MIGRATION',
        UPDATED_DATE = GETDATE()
    WHERE SCHEDULAR_NAME = 'CHECKLIST_REASSIGN_3';

    PRINT 'CHECKLIST_REASSIGN_3 (4PM reassignment) disabled successfully.';
END
ELSE
BEGIN
    PRINT 'CHECKLIST_REASSIGN_3 not found - skipping (idempotent).';
END
GO
