-- Clean up seeded/mock customers and their references in all tables
IF OBJECT_ID('[dbo].[SLS_CUSTOMER]', 'U') IS NOT NULL
BEGIN
    -- 1. Customer Satisfaction Mappings
    IF OBJECT_ID('[dbo].[CUSTOMER_SATISFACTION_MAPPING]', 'U') IS NOT NULL
    BEGIN
        DELETE FROM [dbo].[CUSTOMER_SATISFACTION_MAPPING]
        WHERE [CUSTOMER_ID] IN (
            SELECT [ID] FROM [dbo].[SLS_CUSTOMER] 
            WHERE [CUSTOMER_CODE] IN ('CUST001', 'CUST002', 'CUST003', 'CUST-001')
        );
    END

    -- 2. Customer Address
    IF OBJECT_ID('[dbo].[SLS_CUSTOMER_ADDRESS]', 'U') IS NOT NULL
    BEGIN
        DELETE FROM [dbo].[SLS_CUSTOMER_ADDRESS]
        WHERE [CUSTOMER_ID] IN (
            SELECT [ID] FROM [dbo].[SLS_CUSTOMER] 
            WHERE [CUSTOMER_CODE] IN ('CUST001', 'CUST002', 'CUST003', 'CUST-001')
        );
    END

    -- 3. Customer Potential
    IF OBJECT_ID('[dbo].[SLS_CUSTOMER_POTENTIAL]', 'U') IS NOT NULL
    BEGIN
        DELETE FROM [dbo].[SLS_CUSTOMER_POTENTIAL]
        WHERE [CUSTOMER_ID] IN (
            SELECT [ID] FROM [dbo].[SLS_CUSTOMER] 
            WHERE [CUSTOMER_CODE] IN ('CUST001', 'CUST002', 'CUST003', 'CUST-001')
        );
    END

    -- 4. SLS Enquiry
    IF OBJECT_ID('[dbo].[SLS_ENQUIRY]', 'U') IS NOT NULL
    BEGIN
        DELETE FROM [dbo].[SLS_ENQUIRY]
        WHERE [CUSTOMER_ID] IN (
            SELECT [ID] FROM [dbo].[SLS_CUSTOMER] 
            WHERE [CUSTOMER_CODE] IN ('CUST001', 'CUST002', 'CUST003', 'CUST-001')
        );
    END

    -- 5. SLS Price Master
    IF OBJECT_ID('[dbo].[SLS_PRICE_MASTER]', 'U') IS NOT NULL
    BEGIN
        DELETE FROM [dbo].[SLS_PRICE_MASTER]
        WHERE [CUSTOMER_ID] IN (
            SELECT [ID] FROM [dbo].[SLS_CUSTOMER] 
            WHERE [CUSTOMER_CODE] IN ('CUST001', 'CUST002', 'CUST003', 'CUST-001')
        );
    END

    -- 6. SLS Quotation
    IF OBJECT_ID('[dbo].[SLS_QUOTATION]', 'U') IS NOT NULL
    BEGIN
        DELETE FROM [dbo].[SLS_QUOTATION]
        WHERE [CUSTOMER_ID] IN (
            SELECT [ID] FROM [dbo].[SLS_CUSTOMER] 
            WHERE [CUSTOMER_CODE] IN ('CUST001', 'CUST002', 'CUST003', 'CUST-001')
        );
    END

    -- 7. Delete the customers from SLS_CUSTOMER
    DELETE FROM [dbo].[SLS_CUSTOMER]
    WHERE [CUSTOMER_CODE] IN ('CUST001', 'CUST002', 'CUST003', 'CUST-001');

    PRINT 'Cleaned up seeded/mock customers from SLS_CUSTOMER';
END
GO
