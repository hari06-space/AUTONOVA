-- Author: Antigravity
-- Date: 2026-07-13
-- Description: Restore mutated checklist templates that were overwritten by scheduler tasks

PRINT 'Starting migration V434.0: Restore Checklist Mutated Templates...';

BEGIN TRANSACTION;

BEGIN TRY
    -- Insert clean NULL-date template configuration assignments for checklists that currently have no template mapping
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
        'SYSTEM_REPAIR' as CREATED_BY,
        GETDATE() as CREATED_DATE,
        'SYSTEM_REPAIR' as UPDATED_BY,
        GETDATE() as UPDATED_DATE
    FROM (
        SELECT 
            CHECKLIST_ID,
            ASSIGNED_TO,
            ASSIGN_TYPE,
            ROW_NUMBER() OVER (PARTITION BY CHECKLIST_ID, ASSIGN_TYPE ORDER BY ID DESC) as rn
        FROM QMS_CHECKLIST_ASSIGNMENT
        WHERE CHECKLIST_ID NOT IN (
            SELECT CHECKLIST_ID 
            FROM QMS_CHECKLIST_ASSIGNMENT 
            WHERE CHECKLIST_DATE IS NULL
        )
        AND ASSIGNED_TO IS NOT NULL
    ) sub
    WHERE sub.rn = 1;

    PRINT 'Restored mutated checklist templates successfully.';
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    PRINT 'Error occurred during migration. Rolling back transaction.';
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
