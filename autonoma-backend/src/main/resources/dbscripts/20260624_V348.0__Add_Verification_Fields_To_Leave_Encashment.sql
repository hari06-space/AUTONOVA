-- ═══════════════════════════════════════════════════════════════════
-- V337.0  Add Verification / Rejection fields to Leave Encashment
-- Table  : HRA_LEAVE_ENCASHMENT_VERIFIED
-- Date   : 2026-06-24
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. VERIFIED_BY ────────────────────────────────────────────────
IF COL_LENGTH('HRA_LEAVE_ENCASHMENT_VERIFIED', 'VERIFIED_BY') IS NULL
BEGIN
    ALTER TABLE HRA_LEAVE_ENCASHMENT_VERIFIED ADD VERIFIED_BY NVARCHAR(100) NULL;
    PRINT 'Added column VERIFIED_BY.';
END
ELSE
    PRINT 'Column VERIFIED_BY already exists — skipped.';
GO

-- ── 2. VERIFIED_DATE ──────────────────────────────────────────────
IF COL_LENGTH('HRA_LEAVE_ENCASHMENT_VERIFIED', 'VERIFIED_DATE') IS NULL
BEGIN
    ALTER TABLE HRA_LEAVE_ENCASHMENT_VERIFIED ADD VERIFIED_DATE DATETIME NULL;
    PRINT 'Added column VERIFIED_DATE.';
END
ELSE
    PRINT 'Column VERIFIED_DATE already exists — skipped.';
GO

-- ── 3. REJECTED_BY ────────────────────────────────────────────────
IF COL_LENGTH('HRA_LEAVE_ENCASHMENT_VERIFIED', 'REJECTED_BY') IS NULL
BEGIN
    ALTER TABLE HRA_LEAVE_ENCASHMENT_VERIFIED ADD REJECTED_BY NVARCHAR(100) NULL;
    PRINT 'Added column REJECTED_BY.';
END
ELSE
    PRINT 'Column REJECTED_BY already exists — skipped.';
GO

-- ── 4. REJECTED_DATE ──────────────────────────────────────────────
IF COL_LENGTH('HRA_LEAVE_ENCASHMENT_VERIFIED', 'REJECTED_DATE') IS NULL
BEGIN
    ALTER TABLE HRA_LEAVE_ENCASHMENT_VERIFIED ADD REJECTED_DATE DATETIME NULL;
    PRINT 'Added column REJECTED_DATE.';
END
ELSE
    PRINT 'Column REJECTED_DATE already exists — skipped.';
GO

-- ── 5. REJECTION_COMMENT ──────────────────────────────────────────
IF COL_LENGTH('HRA_LEAVE_ENCASHMENT_VERIFIED', 'REJECTION_COMMENT') IS NULL
BEGIN
    ALTER TABLE HRA_LEAVE_ENCASHMENT_VERIFIED ADD REJECTION_COMMENT NVARCHAR(MAX) NULL;
    PRINT 'Added column REJECTION_COMMENT.';
END
ELSE
    PRINT 'Column REJECTION_COMMENT already exists — skipped.';
GO

PRINT 'V337.0 migration completed successfully.';
