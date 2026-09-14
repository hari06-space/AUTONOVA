-- Migration Script to drop MST_VENDOR_MASTER and SLS_CUSTOMER and create unified ACCOUNT_LEDGER

IF OBJECT_ID('dbo.MST_VENDOR_MASTER', 'U') IS NOT NULL 
    DROP TABLE dbo.MST_VENDOR_MASTER;

IF OBJECT_ID('dbo.SLS_CUSTOMER', 'U') IS NOT NULL 
    DROP TABLE dbo.SLS_CUSTOMER;

-- 2. Create the unified ACCOUNT_LEDGER table
CREATE TABLE ACCOUNT_LEDGER (
    ID bigint IDENTITY(1,1) PRIMARY KEY NOT NULL,
    REFERENCE_CODE nvarchar(50),
    LEDGER_NAME nvarchar(100) UNIQUE,
    SHORT_NAME nvarchar(25),
    PRINT_NAME nvarchar(150),
    ADDRESS nvarchar(300),
    CITY nvarchar(50),
    STATE nvarchar(50),
    COUNTRY nvarchar(50),
    PIN_CODE nvarchar(20),
    STATE_CODE int,
    LOCATION nvarchar(300),
    DISTANCE int,
    IS_CUSTOMER bit,
    IS_SUPPLIER bit,
    IS_SUBCON bit,
    IS_OTHERS bit,
    GROUP_ID bigint,
    SALES_LEDGER_ID bigint,
    PURCHASE_LEDGER_ID bigint,
    GSTIN nvarchar(15),
    PAN_NO nvarchar(15),
    SEGMENT nvarchar(50),
    SUB_SEGMENT nvarchar(50),
    DOMAIN_NAME nvarchar(100),
    REGISTER_NO nvarchar(50),
    CIN_NO nvarchar(50),
    ISO_NUMBER nvarchar(50),
    WEBSITE nvarchar(30),
    DAILY_DISPATCH_MAIL nvarchar(30),
    CURRENCY_CODE nvarchar(10),
    DISPATCH_MODE nvarchar(50),
    PAYMENT_TERMS nvarchar(50),
    DELIVERY_TERMS nvarchar(50),
    ISO_EXPIRY_DATE date,
    NDA_REQUIRED bit,
    NEGOTIATE_REQUIRED bit,
    DAILY_MAIL_REQUIRED bit,
    LD_APPLICABLE bit,
    PRIME_VENDOR bit,
    FRIEGHT_APPLICABLE bit,
    CURRENCY_TYPE nvarchar(20),
    IS_SERVICE_LEDGER bit,
    SERVICE_LEDGER_ID bigint,
    TCS_APPLICABLE bit,
    TCS_ID bigint,
    TDS_APPLICABLE bit,
    TDS_ID bigint,
    ITC_ELIGIBLE bit,
    TAX_TYPE nvarchar(20),
    TAX_PERCENTAGE numeric(12,2),
    IS_ACTIVE bit DEFAULT 1,
    CREATED_BY nvarchar(50) NOT NULL,
    CREATED_DATE datetime,
    UPDATED_BY nvarchar(50),
    UPDATED_DATE datetime
);

-- Note: The CREATED_BY and UPDATED_BY have relationships with AD_USER_CREDENTIAL.USER_ID but constraints are omitted here to prevent circular dependencies in initial migrations.
