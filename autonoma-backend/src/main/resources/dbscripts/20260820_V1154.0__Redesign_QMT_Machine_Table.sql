-- SQL Migration script V1154.0: Redesign QMT_MACHINE based on Asset structure

-- Dynamically drop all foreign keys referencing QMT_MACHINE
DECLARE @drop_fks NVARCHAR(MAX) = N'';
SELECT @drop_fks += N'ALTER TABLE ' + QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id)) + '.' + QUOTENAME(OBJECT_NAME(parent_object_id)) + 
                    N' DROP CONSTRAINT ' + QUOTENAME(name) + N';' + CHAR(13) + CHAR(10)
FROM sys.foreign_keys
WHERE referenced_object_id = OBJECT_ID('QMT_MACHINE');

IF @drop_fks <> N''
    EXEC sp_executesql @drop_fks;

-- 2. Drop existing QMT_MACHINE table (WARNING: This clears data)
IF OBJECT_ID('QMT_MACHINE', 'U') IS NOT NULL
    DROP TABLE QMT_MACHINE;

-- 3. Create the redesigned QMT_MACHINE table
CREATE TABLE QMT_MACHINE (
    ID                          BIGINT IDENTITY(1,1)    NOT NULL,
    ASSET_GROUP_ID              BIGINT                  NULL,
    ASSET_TYPE_ID               BIGINT                  NULL,
    ASSET_ID                    NVARCHAR(50)            NOT NULL,
    ASSET_NAME                  NVARCHAR(100)           NOT NULL,
    DESCRIPTION                 NVARCHAR(500)           NULL,
    PRINT_NAME                  NVARCHAR(150)           NULL,
    DIVISION                    INT                     NULL,
    UOM                         NVARCHAR(20)            NULL,
    SEQ_NO                      INT                     NULL,
    PURCHASE_RATE               DECIMAL(18,2)           NULL,
    PRICE                       DECIMAL(18,2)           NULL,
    SUPPLIER_ID                 BIGINT                  NULL,
    SUPPLY_DATE                 DATE                    NULL,
    PURCHASE_YEAR               INT                     NULL,
    WARRANTY_AVAIL              BIT                     NOT NULL DEFAULT 0,
    WARRANTY_EXPIRY_DATE        DATE                    NULL,
    OWNER_TYPE                  NVARCHAR(50)            NULL,
    OWNER_ID                    BIGINT                  NULL,
    ASSET_SPEC                  NVARCHAR(500)           NULL,
    MODEL_NO                    NVARCHAR(100)           NULL,
    SERIAL_NO                   NVARCHAR(100)           NULL,
    CAPACITY                    NVARCHAR(100)           NULL,
    DIMENSION                   NVARCHAR(100)           NULL,
    POWER                       NVARCHAR(100)           NULL,
    HSN_CODE                    NVARCHAR(50)            NULL,
    SAC_CODE                    NVARCHAR(50)            NULL,
    IP_ADDRESS                  NVARCHAR(50)            NULL,
    PORT_NO                     INT                     NULL,
    CALIBR_FREQUENCY            NVARCHAR(50)            NULL,
    LAST_CALIBR_DATE            DATE                    NULL,
    NEXT_CALIBR_DATE            DATE                    NULL,
    AMC_FREQUENCY               NVARCHAR(50)            NULL,
    LAST_AMC_DATE               DATE                    NULL,
    NEXT_AMC_DATE               DATE                    NULL,
    DEPRECIATION_PERCENTAGE     DECIMAL(5,2)            NULL,
    DEPRECIATION_METHOD         NVARCHAR(50)            NULL,
    ASSET_LIFE                  NVARCHAR(50)            NULL,
    OEE_REQ                     BIT                     NOT NULL DEFAULT 0,
    MAKE                        NVARCHAR(100)           NULL,
    REMARKS                     NVARCHAR(500)           NULL,
    STATUS                      BIT                     NOT NULL DEFAULT 1,
    CREATED_BY                  NVARCHAR(50)            NOT NULL,
    CREATED_DATE                DATETIME                NULL,
    UPDATED_BY                  NVARCHAR(50)            NULL,
    UPDATED_DATE                DATETIME                NULL,
    
    CONSTRAINT PK_QMT_MACHINE PRIMARY KEY (ID),
    CONSTRAINT UQ_QMT_MACHINE_ASSET_ID UNIQUE (ASSET_ID),
    CONSTRAINT UQ_QMT_MACHINE_ASSET_NAME UNIQUE (ASSET_NAME),
    CONSTRAINT FK_QMT_MACHINE_ASSET_GROUP FOREIGN KEY (ASSET_GROUP_ID) REFERENCES ASSET_GROUP(ID),
    CONSTRAINT FK_QMT_MACHINE_ASSET_TYPE FOREIGN KEY (ASSET_TYPE_ID) REFERENCES ASSET_TYPE(ID),
    CONSTRAINT FK_QMT_MACHINE_SUPPLIER FOREIGN KEY (SUPPLIER_ID) REFERENCES FA_ACCOUNT_LEDGER(ID),
    CONSTRAINT FK_QMT_MACHINE_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES AD_USER_CREDENTIAL(USER_ID),
    CONSTRAINT FK_QMT_MACHINE_UPDATED_BY FOREIGN KEY (UPDATED_BY) REFERENCES AD_USER_CREDENTIAL(USER_ID)
);

-- 4. Re-add constraints to child tables
 

IF OBJECT_ID('QMT_MACHINE_CRITERIAL_SPARES', 'U') IS NOT NULL
BEGIN
    ALTER TABLE QMT_MACHINE_CRITERIAL_SPARES ADD CONSTRAINT FK_QMT_MACHINE_CRITERIAL_SPARES_MACHINE_ID 
        FOREIGN KEY (MACHINE_ID) REFERENCES QMT_MACHINE(ID) ON DELETE CASCADE;
END

IF OBJECT_ID('QMT_MACHINE_INTEGRATION', 'U') IS NOT NULL
BEGIN
    ALTER TABLE QMT_MACHINE_INTEGRATION ADD CONSTRAINT FK_MACHINE_INTEG_MACHINE 
        FOREIGN KEY (MACHINE_ID_REF) REFERENCES QMT_MACHINE(ID);
END

PRINT 'QMT_MACHINE successfully redesigned for Asset masters.';


