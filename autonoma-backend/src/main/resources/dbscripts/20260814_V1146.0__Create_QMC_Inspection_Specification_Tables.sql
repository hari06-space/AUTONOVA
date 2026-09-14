

-- =============================================================================
-- Migration: V1146.0 - Create QMC Inspection Specification Tables
-- Date: 20260814
-- Description: Creates QMC_INSPECTION_SPECIFICATION (header) and
--              QMC_INSPECTION_SPECIFICATION_DETAIL (parameters) tables
--              for the Inspection Specification Master module.
--              Reuses: NPD_PRODUCT_MASTER, MST_UOM, NPD_PROCESS, 
--                      NPD_REACTION_PLAN, QMC_AQL_MASTER
-- =============================================================================

-- ============================================================
-- 1. QMC_INSPECTION_SPECIFICATION (Header)
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'QMC_INSPECTION_SPECIFICATION')
BEGIN
    CREATE TABLE QMC_INSPECTION_SPECIFICATION (
        ID                      BIGINT IDENTITY(1,1) NOT NULL,
        SPECIFICATION_CODE      NVARCHAR(50)    NOT NULL,
        SPECIFICATION_NAME      NVARCHAR(200)   NOT NULL UNIQUE,

        ITEM_ID                 BIGINT          NOT NULL UNIQUE,       -- FK -> NPD_PRODUCT_MASTER.ID

        VERSION_NO              INT             NOT NULL DEFAULT 1,
        EFFECTIVE_FROM          DATE            NULL,
        EFFECTIVE_TO            DATE            NULL,

        REMARKS                 NVARCHAR(MAX)   NULL,
        STATUS                  BIGINT          NOT NULL,       -- FK -> AD_STATUS_MASTER.ID

        CREATED_BY              NVARCHAR(50)    NOT NULL,
        CREATED_DATE            DATETIME        NULL,
        UPDATED_BY              NVARCHAR(50)    NULL,
        UPDATED_DATE            DATETIME        NULL,

        CONSTRAINT PK_QMC_INSPECTION_SPECIFICATION PRIMARY KEY (ID),
        CONSTRAINT UQ_QMC_INSP_SPEC_CODE UNIQUE (SPECIFICATION_CODE),
        CONSTRAINT FK_QMC_INSP_SPEC_ITEM FOREIGN KEY (ITEM_ID)
            REFERENCES NPD_PRODUCT_MASTER(ID),
        CONSTRAINT FK_QMC_INSP_SPEC_STATUS FOREIGN KEY (STATUS)
            REFERENCES AD_STATUS_MASTER(ID)
    );

    CREATE INDEX IX_QMC_INSP_SPEC_ITEM_ID       ON QMC_INSPECTION_SPECIFICATION(ITEM_ID);
    CREATE INDEX IX_QMC_INSP_SPEC_STATUS        ON QMC_INSPECTION_SPECIFICATION(STATUS);
    CREATE INDEX IX_QMC_INSP_SPEC_EFF_FROM      ON QMC_INSPECTION_SPECIFICATION(EFFECTIVE_FROM);
    CREATE INDEX IX_QMC_INSP_SPEC_EFF_TO        ON QMC_INSPECTION_SPECIFICATION(EFFECTIVE_TO);
    CREATE INDEX IX_QMC_INSP_SPEC_ITEM_STATUS   ON QMC_INSPECTION_SPECIFICATION(ITEM_ID, STATUS);
END
GO

-- ============================================================
-- 2. QMC_INSPECTION_SPECIFICATION_DETAIL (Parameters)
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'QMC_INSPECTION_SPECIFICATION_DETAIL')
BEGIN
    CREATE TABLE QMC_INSPECTION_SPECIFICATION_DETAIL (
        ID                      BIGINT IDENTITY(1,1) NOT NULL,
        SPECIFICATION_ID        BIGINT          NOT NULL,       -- FK -> QMC_INSPECTION_SPECIFICATION.ID
        SEQUENCE_NO             INT             NOT NULL DEFAULT 1,

        -- Grouping
        GROUP_HEADING           NVARCHAR(200)   NULL,

        -- Parameter (Free-text, no dedicated master)
        PARAMETER_NAME          NVARCHAR(200)   NOT NULL,
        PARAMETER_ALIAS         NVARCHAR(100)   NULL,

        -- References to existing masters
        PROCESS_ID              BIGINT          NULL,           -- FK -> NPD_PROCESS.ID
        INSTRUMENT_NAME         NVARCHAR(200)   NULL,          -- Free-text (no master exists)

        -- AQL Reference
        AQL_MASTER_ID           BIGINT          NULL,           -- FK -> QMC_AQL_MASTER.ID

        -- Condition Fields
        PARAMETER_TYPE          NVARCHAR(50)    NULL,          -- e.g. DIMENSIONAL, VISUAL, CHEMICAL
        PARAMETER_CONDITION     NVARCHAR(50)    NULL,          -- e.g. MIN_MAX, MIN, MAX, VISUAL, ANGLE

        -- UOM (MST_UOM uses UOM_CODE string as PK)
        UOM_CODE                NVARCHAR(50)    NULL,           -- FK -> MST_UOM.UOM_CODE

        -- Measurement Fields
        NOMINAL_VALUE           DECIMAL(18, 4)  NULL,
        LOWER_TOLERANCE         DECIMAL(18, 4)  NULL,
        UPPER_TOLERANCE         DECIMAL(18, 4)  NULL,
        MINIMUM_VALUE           DECIMAL(18, 4)  NULL,
        MAXIMUM_VALUE           DECIMAL(18, 4)  NULL,

        -- Control & Reaction
        REACTION_PLAN_ID        BIGINT          NULL,           -- FK -> NPD_REACTION_PLAN.ID
        CONTROL_PLAN_NAME       NVARCHAR(200)   NULL,          -- Free-text

        -- Inspection Stages - stored as JSON array e.g. ["INCOMING","FINAL"]
        INSPECTION_STAGES       NVARCHAR(500)   NULL,

        -- Remarks
        REMARKS_1               NVARCHAR(500)   NULL,
        REMARKS_2               NVARCHAR(500)   NULL,
        REMARKS_3               NVARCHAR(500)   NULL,

        STATUS                  BIGINT          NOT NULL,       -- FK -> AD_STATUS_MASTER.ID

        CREATED_BY              NVARCHAR(50)    NOT NULL,
        CREATED_DATE            DATETIME        NULL,
        UPDATED_BY              NVARCHAR(50)    NULL,
        UPDATED_DATE            DATETIME        NULL,

        CONSTRAINT PK_QMC_INSP_SPEC_DETAIL PRIMARY KEY (ID),
        CONSTRAINT FK_QMC_INSP_SPEC_DTL_SPEC FOREIGN KEY (SPECIFICATION_ID)
            REFERENCES QMC_INSPECTION_SPECIFICATION(ID),
        CONSTRAINT FK_QMC_INSP_SPEC_DTL_PROCESS FOREIGN KEY (PROCESS_ID)
            REFERENCES NPD_PROCESS(ID),

        CONSTRAINT FK_QMC_INSP_SPEC_DTL_AQL FOREIGN KEY (AQL_MASTER_ID)
            REFERENCES QMC_AQL_MASTER(ID),
        CONSTRAINT FK_QMC_INSP_SPEC_DTL_UOM FOREIGN KEY (UOM_CODE)
            REFERENCES MST_UOM(UOM_CODE),
        CONSTRAINT FK_QMC_INSP_SPEC_DTL_STATUS FOREIGN KEY (STATUS)
            REFERENCES AD_STATUS_MASTER(ID)
    );

    CREATE INDEX IX_QMC_INSP_SPEC_DTL_SPEC_ID   ON QMC_INSPECTION_SPECIFICATION_DETAIL(SPECIFICATION_ID);
    CREATE INDEX IX_QMC_INSP_SPEC_DTL_AQL       ON QMC_INSPECTION_SPECIFICATION_DETAIL(AQL_MASTER_ID);
    CREATE INDEX IX_QMC_INSP_SPEC_DTL_STATUS     ON QMC_INSPECTION_SPECIFICATION_DETAIL(STATUS);
    CREATE INDEX IX_QMC_INSP_SPEC_DTL_SEQ        ON QMC_INSPECTION_SPECIFICATION_DETAIL(SPECIFICATION_ID, SEQUENCE_NO);
END
GO

-- ============================================================
-- 3. Seed Active Status & Register Specification Code Sequence
-- ============================================================
-- Ensure ACTIVE status exists in AD_STATUS_MASTER
DECLARE @ActiveStatusId BIGINT;
SELECT @ActiveStatusId = ID FROM AD_STATUS_MASTER WHERE UPPER(TRIM(NAME)) = 'ACTIVE';

IF @ActiveStatusId IS NULL
BEGIN
    INSERT INTO AD_STATUS_MASTER (NAME) VALUES ('ACTIVE');
    SET @ActiveStatusId = SCOPE_IDENTITY();
END
GO

-- ============================================================
-- 4. Register BOS Page entries for permission management
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM BOS_PAGES WHERE PAGE_CODE = 'M10200')
BEGIN
    INSERT INTO BOS_PAGES (PAGE_CODE, PAGE_NAME, PAGE_URL, MOD_ID, ENABLED)
    VALUES ('M10200', 'Inspection Specification', '/master/quality-control/inspection-specification', '1', 1);
END
GO