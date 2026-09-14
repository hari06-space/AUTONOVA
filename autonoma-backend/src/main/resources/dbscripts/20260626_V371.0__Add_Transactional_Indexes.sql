-- SQL Migration Script: Add Indexes to Transactional & Heavy Master Tables for Performance Optimization
-- This script adds non-clustered indexes to frequently queried columns and foreign keys.

-- 1. SLS_CUSTOMER
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_sls_customer_status' AND object_id = OBJECT_ID('SLS_CUSTOMER'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_sls_customer_status ON SLS_CUSTOMER(STATUS) INCLUDE (CUSTOMER_CODE, CUSTOMER_NAME);
END
GO

-- 2. VND_VENDOR (Supplier)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_vnd_vendor_status' AND object_id = OBJECT_ID('VND_VENDOR'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_vnd_vendor_status ON VND_VENDOR(STATUS) INCLUDE (SUPPLIER_CODE, SUPPLIER_NAME);
END
GO

-- 3. SLS_ENQUIRY
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_sls_enquiry_status' AND object_id = OBJECT_ID('SLS_ENQUIRY'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_sls_enquiry_status ON SLS_ENQUIRY(STATUS) INCLUDE (ENQUIRY_NO, CUSTOMER_ID);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_sls_enquiry_customer_id' AND object_id = OBJECT_ID('SLS_ENQUIRY'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_sls_enquiry_customer_id ON SLS_ENQUIRY(CUSTOMER_ID);
END
GO

-- 4. SLS_PRICE_MASTER
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_sls_price_master_status' AND object_id = OBJECT_ID('SLS_PRICE_MASTER'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_sls_price_master_status ON SLS_PRICE_MASTER(STATUS) INCLUDE (MASTER_NO, CUSTOMER_ID);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_sls_price_master_customer_id' AND object_id = OBJECT_ID('SLS_PRICE_MASTER'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_sls_price_master_customer_id ON SLS_PRICE_MASTER(CUSTOMER_ID);
END
GO

-- 5. SLS_QUOTATION
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_sls_quotation_status' AND object_id = OBJECT_ID('SLS_QUOTATION'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_sls_quotation_status ON SLS_QUOTATION(STATUS) INCLUDE (QUOTATION_NO, CUSTOMER_ID);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_sls_quotation_customer_id' AND object_id = OBJECT_ID('SLS_QUOTATION'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_sls_quotation_customer_id ON SLS_QUOTATION(CUSTOMER_ID);
END
GO
