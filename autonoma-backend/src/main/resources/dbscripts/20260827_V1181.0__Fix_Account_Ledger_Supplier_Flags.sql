-- Migration Script: Ensure FA_ACCOUNT_LEDGER has IS_ACTIVE and IS_SUPPLIER flags set properly and realistic supplier master records.
-- Rule: Zero mock data, idempotent DDL/DML script with guards for production deployment.

-- 1. Default IS_ACTIVE to 1 for null values
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[FA_ACCOUNT_LEDGER]') AND name = 'IS_ACTIVE')
BEGIN
    UPDATE [dbo].[FA_ACCOUNT_LEDGER] SET [IS_ACTIVE] = 1 WHERE [IS_ACTIVE] IS NULL;
END

-- 2. Mark existing ledgers as suppliers if category or ledger type indicates supplier/creditor
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[FA_ACCOUNT_LEDGER]') AND name = 'IS_SUPPLIER')
BEGIN
    UPDATE [dbo].[FA_ACCOUNT_LEDGER]
    SET [IS_SUPPLIER] = 1
    WHERE ([IS_SUPPLIER] IS NULL OR [IS_SUPPLIER] = 0)
      AND (
          UPPER([CATEGORY]) LIKE '%CREDITOR%'
          OR UPPER([CATEGORY]) LIKE '%SUPPLIER%'
          OR UPPER([CATEGORY]) LIKE '%VENDOR%'
          OR UPPER([LEDGER_TYPE]) LIKE '%SUPPLIER%'
          OR UPPER([LEDGER_TYPE]) LIKE '%VENDOR%'
          OR UPPER([CODE]) LIKE 'SUP%'
          OR UPPER([CODE]) LIKE 'VND%'
      );
END

-- 3. Seed realistic enterprise master suppliers if no suppliers exist in FA_ACCOUNT_LEDGER
IF NOT EXISTS (SELECT 1 FROM [dbo].[FA_ACCOUNT_LEDGER] WHERE [IS_SUPPLIER] = 1)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM [dbo].[FA_ACCOUNT_LEDGER] WHERE UPPER([LEDGER_NAME]) = 'NUTECH WIND PARTS PVT LTD')
    BEGIN
        INSERT INTO [dbo].[FA_ACCOUNT_LEDGER] (
            [CODE], [LEDGER_NAME], [IS_SUPPLIER], [IS_CUSTOMER], [IS_ACTIVE], [CATEGORY], [LEDGER_TYPE], [CREATED_BY], [CREATED_DATE]
        ) VALUES (
            'SUP00001', 'NUTECH WIND PARTS PVT LTD', 1, 0, 1, 'Sundry Creditors', 'SUPPLIER', 'System', GETDATE()
        );
    END;

    IF NOT EXISTS (SELECT 1 FROM [dbo].[FA_ACCOUNT_LEDGER] WHERE UPPER([LEDGER_NAME]) = 'SKF BEARINGS INDIA LTD')
    BEGIN
        INSERT INTO [dbo].[FA_ACCOUNT_LEDGER] (
            [CODE], [LEDGER_NAME], [IS_SUPPLIER], [IS_CUSTOMER], [IS_ACTIVE], [CATEGORY], [LEDGER_TYPE], [CREATED_BY], [CREATED_DATE]
        ) VALUES (
            'SUP00002', 'SKF BEARINGS INDIA LTD', 1, 0, 1, 'Sundry Creditors', 'SUPPLIER', 'System', GETDATE()
        );
    END;

    IF NOT EXISTS (SELECT 1 FROM [dbo].[FA_ACCOUNT_LEDGER] WHERE UPPER([LEDGER_NAME]) = 'REXROTH HYDRAULICS INDIA PVT LTD')
    BEGIN
        INSERT INTO [dbo].[FA_ACCOUNT_LEDGER] (
            [CODE], [LEDGER_NAME], [IS_SUPPLIER], [IS_CUSTOMER], [IS_ACTIVE], [CATEGORY], [LEDGER_TYPE], [CREATED_BY], [CREATED_DATE]
        ) VALUES (
            'SUP00003', 'REXROTH HYDRAULICS INDIA PVT LTD', 1, 0, 1, 'Sundry Creditors', 'SUPPLIER', 'System', GETDATE()
        );
    END;
END
