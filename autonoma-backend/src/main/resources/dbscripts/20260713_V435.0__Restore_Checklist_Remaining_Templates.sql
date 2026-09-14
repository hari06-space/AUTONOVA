-- Author: Antigravity
-- Date: 2026-07-13
-- Description: Restore mutated checklist templates (Phase 2) for checklists that have inactive template configurations

PRINT 'Starting migration V435.0: Restore Checklist Remaining Templates (Phase 2)...';

BEGIN TRANSACTION;

BEGIN TRY
    -- Step 1: Update existing inactive template configurations to active for active checklists that have no active templates
    UPDATE QMS_CHECKLIST_ASSIGNMENT
    SET ACTIVE = 1, PENDING_ACTIVATION = 0
    WHERE CHECKLIST_DATE IS NULL
    AND ACTIVE = 0
    AND CHECKLIST_ID IN (
        SELECT ID FROM QMS_CHECKLIST_MASTER WHERE STATUS = 1
    )
    AND CHECKLIST_ID NOT IN (
        SELECT CHECKLIST_ID FROM QMS_CHECKLIST_ASSIGNMENT WHERE CHECKLIST_DATE IS NULL AND ACTIVE = 1
    );

    PRINT 'Activated existing inactive templates.';

    -- Step 2: Insert new NULL-date template rows for any assignment types that are still missing active templates
    INSERT INTO QMS_CHECKLIST_ASSIGNMENT (
        CHECKLIST_ID,
        ASSIGNED_TO,
        ASSIGN_TYPE,
        CHECKLIST_DATE,
        ACTIVE,
        PENDING_ACTIVATION,
        STATUS_ID,
        CREATED_BY,
        CREATED_DATE,
        UPDATED_BY,
        UPDATED_DATE
    )
    SELECT 
        sub.CHECKLIST_ID,
        sub.ASSIGNED_TO,
        sub.ASSIGN_TYPE,
        NULL as CHECKLIST_DATE,
        1 as ACTIVE,
        0 as PENDING_ACTIVATION,
        NULL as STATUS_ID,
        'SYSTEM_REPAIR_2' as CREATED_BY,
        GETDATE() as CREATED_DATE,
        'SYSTEM_REPAIR_2' as UPDATED_BY,
        GETDATE() as UPDATED_DATE
    FROM (
        SELECT 
            CHECKLIST_ID,
            ASSIGNED_TO,
            ASSIGN_TYPE,
            ROW_NUMBER() OVER (PARTITION BY CHECKLIST_ID, ASSIGN_TYPE ORDER BY ID DESC) as rn
        FROM QMS_CHECKLIST_ASSIGNMENT
        WHERE CHECKLIST_ID IN (
            SELECT ID FROM QMS_CHECKLIST_MASTER WHERE STATUS = 1
        )
        -- Only for checklists that still lack an active template for this specific assignment type
        AND CAST(CHECKLIST_ID AS VARCHAR(50)) + '_' + ASSIGN_TYPE NOT IN (
            SELECT CAST(CHECKLIST_ID AS VARCHAR(50)) + '_' + ASSIGN_TYPE 
            FROM QMS_CHECKLIST_ASSIGNMENT 
            WHERE CHECKLIST_DATE IS NULL AND ACTIVE = 1
        )
        AND ASSIGNED_TO IS NOT NULL
    ) sub
    WHERE sub.rn = 1;

    PRINT 'Restored mutated checklist templates (Phase 2) successfully.';
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    PRINT 'Error occurred during migration. Rolling back transaction.';
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
