-- ============================================================
-- V440.0 : Fix NULL STATUS_ID in QMS_CHECKLIST_ASSIGNMENT
--          and repair old stale rows
-- Author  : System / TIS
-- Date    : 2026-07-14
-- Reason  : 219 rows had STATUS_ID = NULL, causing EOD job to
--           silently skip them (JOIN on AD_STATUS_MASTER failed).
--           These rows appeared as "Pending" in the UI but were
--           invisible to all scheduler logic.
-- ============================================================

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

-- Step 1: Fix NULL STATUS_ID rows → set to Pending (ID=27)
-- These are rows where the scheduler created an assignment but
-- never stamped a status (race condition / older code version).
UPDATE QMS_CHECKLIST_ASSIGNMENT
SET 
    STATUS_ID  = 27,          -- 27 = Pending
    UPDATED_BY = 'SYSTEM_MIGRATION_V440',
    UPDATED_DATE = GETDATE()
WHERE STATUS_ID IS NULL;

PRINT 'V440: Fixed ' + CAST(@@ROWCOUNT AS VARCHAR) + ' rows with NULL STATUS_ID → set to Pending (27)';

-- Step 2: Now run EOD on all those old rows that were previously
--         invisible — mark CarryForward=No ones as Unresolved.
UPDATE QMS_CHECKLIST_ASSIGNMENT
SET 
    STATUS_ID    = 11,        -- 11 = Unresolved
    UPDATED_BY   = 'SYSTEM_MIGRATION_V440_EOD',
    UPDATED_DATE = GETDATE()
WHERE STATUS_ID = 27          -- Only Pending ones
  AND CHECKLIST_DATE IS NOT NULL
  AND CONVERT(DATE, CHECKLIST_DATE) < CONVERT(DATE, GETDATE())
  AND UPPER(ISNULL(CARRY_FORWARD, 'NO')) = 'NO';

PRINT 'V440: EOD cleanup — marked ' + CAST(@@ROWCOUNT AS VARCHAR) + ' old CarryForward=No rows as Unresolved';

-- Step 3: CarryForward=YES rows — keep Pending but increment counter
UPDATE QMS_CHECKLIST_ASSIGNMENT
SET 
    STATUS_ID           = 27,   -- Keep as Pending
    CARRY_FORWARD_COUNT = ISNULL(CARRY_FORWARD_COUNT, 0) + 1,
    UPDATED_BY          = 'SYSTEM_MIGRATION_V440_EOD',
    UPDATED_DATE        = GETDATE()
WHERE STATUS_ID = 27
  AND CHECKLIST_DATE IS NOT NULL
  AND CONVERT(DATE, CHECKLIST_DATE) < CONVERT(DATE, GETDATE())
  AND UPPER(ISNULL(CARRY_FORWARD, 'NO')) = 'YES';

PRINT 'V440: EOD cleanup — carried forward ' + CAST(@@ROWCOUNT AS VARCHAR) + ' rows (CarryForward=YES kept Pending)';

PRINT 'V440: Migration complete.';
