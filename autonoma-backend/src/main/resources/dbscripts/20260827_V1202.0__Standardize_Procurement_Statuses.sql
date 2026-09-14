-- =======================================================================================
-- MIGRATION SCRIPT: Standardize Procurement Statuses
-- TARGET DB: Microsoft SQL Server (AT_NUTECH)
-- MIGRATION RUNNER: SqlMigrationRunner (dbscripts/)
-- VERSION: 1202.0
-- STRICT RULE: Existing Status Master Records Only - Zero Inserts into AD_STATUS_MASTER
-- =======================================================================================

BEGIN TRANSACTION;
BEGIN TRY

    -- 1. Validate Existing Status Master Records (Zero Inserts)
    DECLARE @PendingCount INT, @VerifiedCount INT, @ClosedCount INT, @FailedCount INT;
    DECLARE @PendingId BIGINT, @VerifiedId BIGINT, @ClosedId BIGINT, @FailedId BIGINT;

    SELECT @PendingCount = COUNT(DISTINCT ID) FROM AD_STATUS_MASTER WHERE UPPER(LTRIM(RTRIM(NAME))) = 'PENDING';
    SELECT @VerifiedCount = COUNT(DISTINCT ID) FROM AD_STATUS_MASTER WHERE UPPER(LTRIM(RTRIM(NAME))) = 'VERIFIED';
    SELECT @ClosedCount = COUNT(DISTINCT ID) FROM AD_STATUS_MASTER WHERE UPPER(LTRIM(RTRIM(NAME))) = 'CLOSED';
    SELECT @FailedCount = COUNT(DISTINCT ID) FROM AD_STATUS_MASTER WHERE UPPER(LTRIM(RTRIM(NAME))) = 'FAILED';

    IF @PendingCount <> 1 OR @VerifiedCount <> 1 OR @ClosedCount <> 1 OR @FailedCount <> 1
    BEGIN
        RAISERROR('FATAL: One or more required status master records are missing or duplicated in AD_STATUS_MASTER.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END;

    SELECT @PendingId = ID FROM AD_STATUS_MASTER WHERE UPPER(LTRIM(RTRIM(NAME))) = 'PENDING';
    SELECT @VerifiedId = ID FROM AD_STATUS_MASTER WHERE UPPER(LTRIM(RTRIM(NAME))) = 'VERIFIED';
    SELECT @ClosedId = ID FROM AD_STATUS_MASTER WHERE UPPER(LTRIM(RTRIM(NAME))) = 'CLOSED';
    SELECT @FailedId = ID FROM AD_STATUS_MASTER WHERE UPPER(LTRIM(RTRIM(NAME))) = 'FAILED';

    -- 2. Migrate PR Line Statuses: 'Pending Approval' -> 'Pending'
    UPDATE t
    SET t.STATUS_ID = @PendingId
    FROM PP_PURCHASE_REQUEST_TRANS t
    JOIN AD_STATUS_MASTER sm ON t.STATUS_ID = sm.ID
    WHERE UPPER(LTRIM(RTRIM(sm.NAME))) = 'PENDING APPROVAL';

    -- 3. Migrate PR Line Statuses: 'Approved' -> 'Verified'
    UPDATE t
    SET t.STATUS_ID = @VerifiedId
    FROM PP_PURCHASE_REQUEST_TRANS t
    JOIN AD_STATUS_MASTER sm ON t.STATUS_ID = sm.ID
    WHERE UPPER(LTRIM(RTRIM(sm.NAME))) = 'APPROVED';

    -- 4. Migrate RFQ Head Statuses: 'Sent' -> 'Closed'
    UPDATE r
    SET r.STATUS_ID = @ClosedId
    FROM PP_RFQ_HEAD r
    JOIN AD_STATUS_MASTER sm ON r.STATUS_ID = sm.ID
    WHERE UPPER(LTRIM(RTRIM(sm.NAME))) = 'SENT';

    -- 5. Migrate RFQ Email History: 'FAIL' -> 'FAILED'
    UPDATE h
    SET h.STATUS_ID = @FailedId
    FROM PP_RFQ_EMAIL_HISTORY h
    JOIN AD_STATUS_MASTER sm ON h.STATUS_ID = sm.ID
    WHERE UPPER(LTRIM(RTRIM(sm.NAME))) = 'FAIL';

    -- (PP_PURCHASE_ORDER_HEAD and PP_QUOTATION_HEAD APPROVED records are strictly preserved as 'Approved').

    COMMIT TRANSACTION;
    PRINT 'Procurement status standardization migration completed successfully.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
    RAISERROR('Migration failed: %s', 16, 1, @ErrMsg);
END CATCH;
GO
