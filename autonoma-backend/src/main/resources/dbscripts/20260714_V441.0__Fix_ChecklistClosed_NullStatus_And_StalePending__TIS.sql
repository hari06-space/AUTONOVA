-- ============================================================
-- V441.0 : Fix QMS_CHECKLIST_CLOSED stale data
--          - 183 rows with NULL STATUS_ID
--          - 3,061 rows with STATUS=Pending but PAST dates
-- Author  : System / TIS
-- Date    : 2026-07-14
-- ============================================================

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

-- Step 1: Fix 183 NULL STATUS_ID rows in CLOSED table
-- These are in the archive/history table, so default to Unresolved (11)
UPDATE QMS_CHECKLIST_CLOSED
SET
    STATUS_ID    = 11,   -- 11 = Unresolved
    UPDATED_BY   = 'SYSTEM_MIGRATION_V441',
    UPDATED_DATE = GETDATE()
WHERE STATUS_ID IS NULL;

PRINT 'V441: Fixed ' + CAST(@@ROWCOUNT AS VARCHAR) + ' NULL STATUS_ID rows in QMS_CHECKLIST_CLOSED -> Unresolved';

-- Step 2: Fix Pending rows in CLOSED table that have PAST dates
-- Join with QMS_CHECKLIST_MASTER to check CARRY_FORWARD.
-- CarryForward = No / NULL -> Unresolved
UPDATE c
SET
    c.STATUS_ID    = 11,   -- 11 = Unresolved
    c.UPDATED_BY   = 'SYSTEM_MIGRATION_V441_EOD',
    c.UPDATED_DATE = GETDATE()
FROM QMS_CHECKLIST_CLOSED c
LEFT JOIN QMS_CHECKLIST_MASTER m ON c.CHECKLIST_ID = m.ID
WHERE c.STATUS_ID = 27    -- 27 = Pending
  AND c.CHECKLIST_DATE IS NOT NULL
  AND CONVERT(DATE, c.CHECKLIST_DATE) < CONVERT(DATE, GETDATE())
  AND UPPER(ISNULL(m.CARRY_FORWARD, 'NO')) = 'NO';

PRINT 'V441: Marked ' + CAST(@@ROWCOUNT AS VARCHAR) + ' old Pending(No CarryForward) rows as Unresolved in QMS_CHECKLIST_CLOSED';

-- Step 3: CarryForward = YES -> keep Pending but increment count
UPDATE c
SET
    c.CARRY_FORWARD_COUNT = ISNULL(c.CARRY_FORWARD_COUNT, 0) + 1,
    c.UPDATED_BY          = 'SYSTEM_MIGRATION_V441_EOD',
    c.UPDATED_DATE        = GETDATE()
FROM QMS_CHECKLIST_CLOSED c
LEFT JOIN QMS_CHECKLIST_MASTER m ON c.CHECKLIST_ID = m.ID
WHERE c.STATUS_ID = 27
  AND c.CHECKLIST_DATE IS NOT NULL
  AND CONVERT(DATE, c.CHECKLIST_DATE) < CONVERT(DATE, GETDATE())
  AND UPPER(ISNULL(m.CARRY_FORWARD, 'NO')) = 'YES';

PRINT 'V441: Incremented carry-forward count for ' + CAST(@@ROWCOUNT AS VARCHAR) + ' rows (CarryForward=YES) in QMS_CHECKLIST_CLOSED';

-- Final summary
SELECT 
    s.NAME as STATUS,
    COUNT(*) as COUNT
FROM QMS_CHECKLIST_CLOSED c
LEFT JOIN AD_STATUS_MASTER s ON c.STATUS_ID = s.ID
GROUP BY s.NAME
ORDER BY COUNT DESC;

PRINT 'V441: Migration complete.';
