-- ============================================================
-- Migration: 20260720_V1025.0__Update_Assignment_Pending_To_Active.sql
-- Purpose  : Back-fill existing ChecklistAssignment records that
--            have STATUS = 'PENDING' and are currently active
--            (ACTIVE = 1, PENDING_ACTIVATION = 0) to STATUS = 'ACTIVE'.
--            These represent tasks that were assigned for the current
--            date but had not yet been worked on. Future-dated tasks
--            (ACTIVE = 0, PENDING_ACTIVATION = 1) are left as PENDING.
-- Idempotent: YES — only updates rows that still point to PENDING.
-- ============================================================

-- Step 1: Ensure ACTIVE status row exists in AD_STATUS_MASTER
IF NOT EXISTS (SELECT 1 FROM AD_STATUS_MASTER WHERE UPPER(TRIM(NAME)) = 'ACTIVE')
    INSERT INTO AD_STATUS_MASTER (NAME) VALUES ('ACTIVE');

-- Step 2: Back-fill QMS_CHECKLIST_ASSIGNMENT
-- Update current-date active assignments from PENDING → ACTIVE
UPDATE QMS_CHECKLIST_ASSIGNMENT
SET STATUS_ID = (
    SELECT ID FROM AD_STATUS_MASTER WHERE UPPER(TRIM(NAME)) = 'ACTIVE'
)
WHERE
    STATUS_ID = (
        SELECT ID FROM AD_STATUS_MASTER WHERE UPPER(TRIM(NAME)) = 'PENDING'
    )
    AND ACTIVE = 1
    AND (PENDING_ACTIVATION = 0 OR PENDING_ACTIVATION IS NULL);

-- Step 3: Back-fill QMS_CHECKLIST_CLOSED (same logic if any carry-forward records exist)
UPDATE QMS_CHECKLIST_CLOSED
SET STATUS_ID = (
    SELECT ID FROM AD_STATUS_MASTER WHERE UPPER(TRIM(NAME)) = 'ACTIVE'
)
WHERE
    STATUS_ID = (
        SELECT ID FROM AD_STATUS_MASTER WHERE UPPER(TRIM(NAME)) = 'PENDING'
    )
    AND ACTIVE = 1
    AND (PENDING_ACTIVATION = 0 OR PENDING_ACTIVATION IS NULL);
