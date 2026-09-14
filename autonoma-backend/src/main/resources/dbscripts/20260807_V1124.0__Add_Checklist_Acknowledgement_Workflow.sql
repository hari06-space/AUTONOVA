-- =========================================================================================
-- Script Name: 20260807_V1124.0__Add_Checklist_Acknowledgement_Workflow.sql
-- Description: Idempotent migration script for QMS Checklist Reassignment & Acknowledgement Workflow
-- Author: Autonoma ERP AI Agent
-- =========================================================================================

IF OBJECT_ID('QMS_CHECKLIST_ACKNOWLEDGEMENT', 'U') IS NULL
BEGIN
    CREATE TABLE QMS_CHECKLIST_ACKNOWLEDGEMENT (
        ID BIGINT IDENTITY(1,1) PRIMARY KEY,
        CHECKLIST_ID BIGINT NOT NULL,
        ASSIGNMENT_LOG_ID BIGINT NULL,
        OLD_ASSIGNEE_ID BIGINT NULL,
        NEW_ASSIGNEE_ID BIGINT NOT NULL,
        MEMBER_TYPE NVARCHAR(50) NOT NULL, -- PRIMARY, SECONDARY, TERTIARY
        REASSIGNED_BY NVARCHAR(50) NOT NULL,
        REASSIGNED_DATE DATETIME NOT NULL DEFAULT GETDATE(),
        REASSIGNMENT_REASON NVARCHAR(MAX) NULL,
        ACK_STATUS NVARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, ACCEPTED, REJECTED, INACTIVE
        REJECTION_REASON NVARCHAR(MAX) NULL,
        ACKNOWLEDGED_DATE DATETIME NULL,
        CREATED_BY NVARCHAR(50) NOT NULL,
        CREATED_DATE DATETIME NOT NULL DEFAULT GETDATE(),
        UPDATED_BY NVARCHAR(50) NULL,
        UPDATED_DATE DATETIME NULL
    );

    CREATE INDEX idx_qca_checklist_id ON QMS_CHECKLIST_ACKNOWLEDGEMENT(CHECKLIST_ID);
    CREATE INDEX idx_qca_new_assignee ON QMS_CHECKLIST_ACKNOWLEDGEMENT(NEW_ASSIGNEE_ID);
    CREATE INDEX idx_qca_ack_status ON QMS_CHECKLIST_ACKNOWLEDGEMENT(ACK_STATUS);
END;

-- Ensure QM1150 (Checklist Acknowledgement) is registered in BOS_PAGES and seeded in BOS_USER_PAGE_AUTH
IF NOT EXISTS (SELECT 1 FROM BOS_PAGES WHERE PAGE_CODE = 'QM1150')
BEGIN
    DECLARE @QmsModId INT;
    DECLARE @ChecklistSubModId INT;
    DECLARE @NewPageId INT;

    SELECT TOP 1 @QmsModId = MODULE_ID FROM BOS_MODULES WHERE UPPER(TRIM(MOD_NAME)) LIKE '%QMS%' OR MOD_CODE = 'M110';
    SELECT TOP 1 @ChecklistSubModId = SUB_MOD_ID FROM BOS_SUB_MODULES WHERE UPPER(TRIM(SUB_MOD_NAME)) LIKE '%CHECKLIST%' OR SUB_MOD_CODE = 'SM111';

    IF @QmsModId IS NOT NULL
    BEGIN
        INSERT INTO BOS_PAGES (mod_id, sub_mod_id, page_code, page_name, enabled)
        VALUES (@QmsModId, @ChecklistSubModId, 'QM1150', 'Checklist Acknowledgement', 1);

        SET @NewPageId = SCOPE_IDENTITY();

        IF @NewPageId IS NOT NULL
        BEGIN
            INSERT INTO BOS_USER_PAGE_AUTH (USER_ID, PAGE_ID, ENABLE, [READ_ACS], [WRITE], [DELETE_ACS], [EXPORT], [APPROVAL])
            SELECT DISTINCT user_id, @NewPageId, 1, 1, 1, 1, 1, 1
            FROM AD_USER_CREDENTIAL
            WHERE user_id IS NOT NULL AND NOT EXISTS (
                SELECT 1 FROM BOS_USER_PAGE_AUTH WHERE PAGE_ID = @NewPageId AND USER_ID = AD_USER_CREDENTIAL.USER_ID
            );
        END
    END
END;
