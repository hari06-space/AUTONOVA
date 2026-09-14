SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================
-- V327.0 | Create HRA_LEAVE_ENCASHMENT_VERIFIED Table
-- Module : HRA > Payroll > Leave Encashment Verified (HA1295)
-- Author : Antigravity
-- Date   : 2026-06-23
-- ============================================================

-- ── 1. Create the main table ──────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'HRA_LEAVE_ENCASHMENT_VERIFIED')
BEGIN
    CREATE TABLE dbo.HRA_LEAVE_ENCASHMENT_VERIFIED (
        ID                  BIGINT IDENTITY(1,1)    NOT NULL,

        -- Reference & Year
        REF_NO              NVARCHAR(50)            NULL,
        ENCASHMENT_YEAR     INT                     NOT NULL,

        -- Employee (FK + denormalised snapshot)
        EMPLOYEE_ID         BIGINT                  NULL,
        EMP_ID              NVARCHAR(50)            NULL,
        EMP_NAME            NVARCHAR(200)           NULL,

        -- Current year leave balances
        CURRENT_EL          DECIMAL(10,2)           NOT NULL CONSTRAINT DF_LEVF_CURRENT_EL  DEFAULT 0,
        CURRENT_CL          DECIMAL(10,2)           NOT NULL CONSTRAINT DF_LEVF_CURRENT_CL  DEFAULT 0,

        -- Previous years carry-forward
        PREV_YRS_EL         DECIMAL(10,2)           NOT NULL CONSTRAINT DF_LEVF_PREV_EL     DEFAULT 0,
        PREV_YRS_CL         DECIMAL(10,2)           NOT NULL CONSTRAINT DF_LEVF_PREV_CL     DEFAULT 0,

        -- Calculated totals (persisted computed columns — requires QUOTED_IDENTIFIER ON)
        TOT_EL              AS (CURRENT_EL + PREV_YRS_EL) PERSISTED,
        TOT_CL              AS (CURRENT_CL + PREV_YRS_CL) PERSISTED,

        -- Encashment days
        EL_ENCASHMENT       DECIMAL(10,2)           NOT NULL CONSTRAINT DF_LEVF_EL_ENC      DEFAULT 0,
        CL_ENCASHMENT       DECIMAL(10,2)           NOT NULL CONSTRAINT DF_LEVF_CL_ENC      DEFAULT 0,
        TOT_ENCASHMENT      AS (EL_ENCASHMENT + CL_ENCASHMENT) PERSISTED,

        -- Financial details
        BASIC_SALARY        DECIMAL(18,2)           NOT NULL CONSTRAINT DF_LEVF_BASIC       DEFAULT 0,
        PER_DAY_SALARY      DECIMAL(18,2)           NOT NULL CONSTRAINT DF_LEVF_PER_DAY     DEFAULT 0,
        ENCASHMENT_AMOUNT   DECIMAL(18,2)           NOT NULL CONSTRAINT DF_LEVF_ENC_AMOUNT  DEFAULT 0,

        -- Workflow
        STATUS              NVARCHAR(50)            NOT NULL CONSTRAINT DF_LEVF_STATUS       DEFAULT 'PENDING',
        REMARKS             NVARCHAR(MAX)           NULL,

        -- BOS SOP Audit columns (matches BaseAuditEntity)
        CREATED_BY          NVARCHAR(50)            NULL,
        CREATED_DATE        DATETIME2               NOT NULL CONSTRAINT DF_LEVF_CREATED_DATE DEFAULT SYSDATETIME(),
        UPDATED_BY          NVARCHAR(50)            NULL,
        UPDATED_DATE        DATETIME2               NULL,
        IS_ACTIVE           BIT                     NOT NULL CONSTRAINT DF_LEVF_IS_ACTIVE    DEFAULT 1,

        CONSTRAINT PK_HRA_LEAVE_ENCASHMENT_VERIFIED PRIMARY KEY CLUSTERED (ID),
        CONSTRAINT FK_LEVF_EMPLOYEE
            FOREIGN KEY (EMPLOYEE_ID) REFERENCES dbo.HR_EMPLOYEE(ID)
    );

    PRINT 'Table HRA_LEAVE_ENCASHMENT_VERIFIED created successfully.';
END
ELSE
BEGIN
    PRINT 'Table HRA_LEAVE_ENCASHMENT_VERIFIED already exists — skipped.';
END
GO

-- ── 2. Register Page HA1295 in BOS_PAGES ─────────────────────
-- BOS Navigation table: BOS_PAGES (cols: PAGE_ID, MOD_ID, SUB_MOD_ID, PAGE_CODE, PAGE_NAME, ENABLED, PAGE_URL, ICON)
-- HRA module: MOD_ID = 2   |   Payroll sub-module: SUB_MOD_ID = 211
IF NOT EXISTS (SELECT 1 FROM BOS_PAGES WHERE PAGE_CODE = 'HA1295')
BEGIN
    INSERT INTO BOS_PAGES (MOD_ID, SUB_MOD_ID, PAGE_CODE, PAGE_NAME, ENABLED, PAGE_URL, ICON)
    VALUES (2, 211, 'HA1295', 'Leave Encashment Verified', 1, '/hra/payroll/leave-encashment-verified', 'IconCoins');
    PRINT 'Page HA1295 (Leave Encashment Verified) registered in BOS_PAGES.';
END
ELSE
BEGIN
    PRINT 'Page HA1295 already exists in BOS_PAGES — skipped.';
END
GO

-- ── 3. Grant all current Penalty-page users full access ───────
-- Copy access grants from HA1290 (Penalty, PAGE_ID = 130) to new page
DECLARE @newPageId INT;
SELECT @newPageId = PAGE_ID FROM BOS_PAGES WHERE PAGE_CODE = 'HA1295';

IF @newPageId IS NOT NULL
BEGIN
    INSERT INTO BOS_USER_PAGE_AUTH
        (USER_ID, PAGE_ID, SUB_MOD_ID, MOD_ID, ENABLE, READ_ACS, WRITE, DELETE_ACS,
         EXPORT, APPROVAL, MANAGER, ADDITIONAL1, ADDITIONAL2, ADD_TASK_ENABLE, CREATED_BY, CREATED_DATE)
    SELECT
        USER_ID, @newPageId, SUB_MOD_ID, MOD_ID,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 'SYSTEM', SYSDATETIME()
    FROM BOS_USER_PAGE_AUTH
    WHERE PAGE_ID = 130
      AND USER_ID NOT IN (
          SELECT USER_ID FROM BOS_USER_PAGE_AUTH WHERE PAGE_ID = @newPageId
      );
    PRINT 'Access grants for HA1295 seeded.';
END
GO

PRINT 'V327.0 migration completed successfully.';
GO
