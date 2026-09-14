-- Register missing Purchase Planning pages in BOS_PAGES

DECLARE @ModuleId BIGINT;
SELECT @ModuleId = MODULE_ID FROM BOS_MODULES WHERE MOD_CODE = 'PP0000';

IF @ModuleId IS NOT NULL
BEGIN
    -- Request For Quotation (PP0105)
    IF NOT EXISTS (SELECT 1 FROM BOS_PAGES WHERE PAGE_CODE = 'PP0105')
    BEGIN
        INSERT INTO BOS_PAGES (MOD_ID, PAGE_CODE, PAGE_NAME, PAGE_URL, ICON, ENABLED)
        VALUES (@ModuleId, 'PP0105', 'Request For Quotation', '/purchase/rfq/list', 'IconMailForward', 1);
        PRINT 'PP0105 - Request For Quotation page registered.';
    END

    -- Supplier Quotation (PP0106)
    IF NOT EXISTS (SELECT 1 FROM BOS_PAGES WHERE PAGE_CODE = 'PP0106')
    BEGIN
        INSERT INTO BOS_PAGES (MOD_ID, PAGE_CODE, PAGE_NAME, PAGE_URL, ICON, ENABLED)
        VALUES (@ModuleId, 'PP0106', 'Supplier Quotation', '/purchase/quotation/list', 'IconFileInvoice', 1);
        PRINT 'PP0106 - Supplier Quotation page registered.';
    END

    -- Quote Negotiation (PP0107)
    IF NOT EXISTS (SELECT 1 FROM BOS_PAGES WHERE PAGE_CODE = 'PP0107')
    BEGIN
        INSERT INTO BOS_PAGES (MOD_ID, PAGE_CODE, PAGE_NAME, PAGE_URL, ICON, ENABLED)
        VALUES (@ModuleId, 'PP0107', 'Quote Negotiation', '/purchase/negotiation/list', 'IconMessage2', 1);
        PRINT 'PP0107 - Quote Negotiation page registered.';
    END

    -- Quotation Comparison (PP0108)
    IF NOT EXISTS (SELECT 1 FROM BOS_PAGES WHERE PAGE_CODE = 'PP0108')
    BEGIN
        INSERT INTO BOS_PAGES (MOD_ID, PAGE_CODE, PAGE_NAME, PAGE_URL, ICON, ENABLED)
        VALUES (@ModuleId, 'PP0108', 'Quotation Comparison', '/purchase/comparison', 'IconChartBar', 1);
        PRINT 'PP0108 - Quotation Comparison page registered.';
    END

    -- Purchase Order (PP0100) (Just in case it was missed)
    IF NOT EXISTS (SELECT 1 FROM BOS_PAGES WHERE PAGE_CODE = 'PP0100')
    BEGIN
        INSERT INTO BOS_PAGES (MOD_ID, PAGE_CODE, PAGE_NAME, PAGE_URL, ICON, ENABLED)
        VALUES (@ModuleId, 'PP0100', 'Purchase Order', '/purchase/po', 'IconShoppingCart', 1);
        PRINT 'PP0100 - Purchase Order page registered.';
    END

    -- Goods Receipt Note (PP0110)
    IF NOT EXISTS (SELECT 1 FROM BOS_PAGES WHERE PAGE_CODE = 'PP0110')
    BEGIN
        INSERT INTO BOS_PAGES (MOD_ID, PAGE_CODE, PAGE_NAME, PAGE_URL, ICON, ENABLED)
        VALUES (@ModuleId, 'PP0110', 'Goods Receipt Note', '/purchase/goods-receipt/list', 'IconPackage', 1);
        PRINT 'PP0110 - Goods Receipt Note page registered.';
    END

    -- Quality Inspection (PP0111)
    IF NOT EXISTS (SELECT 1 FROM BOS_PAGES WHERE PAGE_CODE = 'PP0111')
    BEGIN
        INSERT INTO BOS_PAGES (MOD_ID, PAGE_CODE, PAGE_NAME, PAGE_URL, ICON, ENABLED)
        VALUES (@ModuleId, 'PP0111', 'Quality Inspection', '/purchase/quality-inspection', 'IconChecks', 1);
        PRINT 'PP0111 - Quality Inspection page registered.';
    END

    -- Supplier Return (PP0112)
    IF NOT EXISTS (SELECT 1 FROM BOS_PAGES WHERE PAGE_CODE = 'PP0112')
    BEGIN
        INSERT INTO BOS_PAGES (MOD_ID, PAGE_CODE, PAGE_NAME, PAGE_URL, ICON, ENABLED)
        VALUES (@ModuleId, 'PP0112', 'Supplier Return', '/purchase/supplier-return', 'IconRotate2', 1);
        PRINT 'PP0112 - Supplier Return page registered.';
    END
END
ELSE
BEGIN
    PRINT 'Module PP0000 not found in BOS_MODULES.';
END
GO

-- Register Gate Entry page in BOS_PAGES

DECLARE @ModuleId BIGINT;
SELECT @ModuleId = MODULE_ID FROM BOS_MODULES WHERE MOD_CODE = 'SL0000';

IF @ModuleId IS NOT NULL
BEGIN
    -- Gate Entry (PP0102)
    IF NOT EXISTS (SELECT 1 FROM BOS_PAGES WHERE PAGE_CODE = 'PP0102')
    BEGIN
        INSERT INTO BOS_PAGES (MOD_ID, PAGE_CODE, PAGE_NAME, PAGE_URL, ICON, ENABLED)
        VALUES (@ModuleId, 'PP0102', 'Gate Entry', '/purchase/gate-entry/list', 'IconClipboardCheck', 1);
        PRINT 'PP0102 - Gate Entry page registered under SL0000.';
    END
END
ELSE
BEGIN
    PRINT 'Module SL0000 not found in BOS_MODULES.';
END
GO

