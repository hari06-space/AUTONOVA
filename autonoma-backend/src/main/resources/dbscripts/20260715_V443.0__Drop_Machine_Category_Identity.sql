-- SQL Migration script V443.0: Drop IDENTITY from QMT_MACHINE_CATEGORY ID

IF EXISTS (
    SELECT 1 
    FROM sys.identity_columns 
    WHERE object_id = OBJECT_ID('QMT_MACHINE_CATEGORY') 
      AND name = 'ID'
)
BEGIN
    PRINT 'Dropping IDENTITY constraint from QMT_MACHINE_CATEGORY ID by recreating tables...';
    
    -- Drop dependent tables first if they exist
    IF OBJECT_ID('QMT_MACHINE_CRITERIAL_SPARES', 'U') IS NOT NULL
        DROP TABLE QMT_MACHINE_CRITERIAL_SPARES;
        
    IF OBJECT_ID('QMT_MACHINE', 'U') IS NOT NULL
        DROP TABLE QMT_MACHINE;
        
    IF OBJECT_ID('QMT_MACHINE_CATEGORY', 'U') IS NOT NULL
        DROP TABLE QMT_MACHINE_CATEGORY;
        
    -- 1. Recreate QMT_MACHINE_CATEGORY without IDENTITY on ID
    CREATE TABLE QMT_MACHINE_CATEGORY (
        ID              BIGINT                  NOT NULL,
        CATEGORY_NAME   NVARCHAR(100)           NOT NULL,
        OEE_REQUIRED    BIT                     NOT NULL DEFAULT 0,
        SEQ_NO          INT                     NOT NULL DEFAULT 0,
        CATEGORY_PREFIX NVARCHAR(50)            NOT NULL,
        STATUS          BIT                     NOT NULL DEFAULT 1,
        CREATED_BY      NVARCHAR(50)            NOT NULL,
        CREATED_DATE    DATETIME                NOT NULL,
        UPDATED_BY      NVARCHAR(50)            NULL,
        UPDATED_DATE    DATETIME                NULL,
        CONSTRAINT PK_QMT_MACHINE_CATEGORY        PRIMARY KEY (ID),
        CONSTRAINT UQ_QMT_MACHINE_CATEGORY_NAME   UNIQUE (CATEGORY_NAME),
        CONSTRAINT UQ_QMT_MACHINE_CATEGORY_PREFIX UNIQUE (CATEGORY_PREFIX),
        CONSTRAINT FK_QMT_MACHINE_CATEGORY_CREATED_BY 
            FOREIGN KEY (CREATED_BY) REFERENCES AD_USER_CREDENTIAL(USER_ID),
        CONSTRAINT FK_QMT_MACHINE_CATEGORY_UPDATED_BY 
            FOREIGN KEY (UPDATED_BY) REFERENCES AD_USER_CREDENTIAL(USER_ID)
    );

    -- 2. Recreate QMT_MACHINE
    CREATE TABLE QMT_MACHINE (
        ID                      BIGINT IDENTITY(1,1)    NOT NULL,
        MACHINE_ID              NVARCHAR(20)            NOT NULL,
        MACHINE_NAME            NVARCHAR(100)           NOT NULL,
        DIVISION                INT                     NULL,
        SEQ_NO                  INT                     NULL,
        CATEGORY_ID             BIGINT                  NOT NULL,
        STATUS                  BIT                     NOT NULL DEFAULT 1,
        OEE                     BIT                     NOT NULL DEFAULT 0,
        PRINT_NAME              NVARCHAR(150)           NULL,
        LOCATION                NVARCHAR(100)           NULL,
        IP_ADDRESS              NVARCHAR(50)            NULL,
        PORT_NO                 BIGINT                  NULL,
        MACHINE_IMAGE           NVARCHAR(MAX)           NULL,
        MAINTENANCE_MANUAL      BIT                     NOT NULL DEFAULT 0,
        MAINTENANCE_MANUAL_PATH NVARCHAR(MAX)           NULL,
        OPERATING_MANUAL        BIT                     NOT NULL DEFAULT 0,
        OPERATING_MANUAL_PATH   NVARCHAR(MAX)           NULL,
        BOM                     BIT                     NOT NULL DEFAULT 0,
        BOM_PATH                NVARCHAR(MAX)           NULL,
        SUPPLIED_NAME           NVARCHAR(100)           NULL,
        SUPPLY_DATE             DATETIME                NULL,
        PURCHASE_YEAR           INT                     NULL,
        PURCHASE_VALUE          BIGINT                  NULL,
        DEPRECIATION_PERCENTAGE NUMERIC(5,2)            NULL,
        DEPRECIATION_VALUE      BIGINT                  NULL,
        DEPRECIATION_METHOD     NVARCHAR(100)           NULL,
        MACHINE_SHORT_NAME      NVARCHAR(100)           NULL,
        MODEL_NO                NVARCHAR(100)           NULL,
        SERIAL_NO               NVARCHAR(100)           NULL,
        MAKE                    NVARCHAR(100)           NULL,
        WARRANTY                BIT                     NOT NULL DEFAULT 0,
        WARRANTY_DURATION       INT                     NULL,
        EXPIRY_DATE             DATETIME                NULL,
        HSN_SAC_CODE            NVARCHAR(50)            NULL,
        MACHINE_LIFE            NVARCHAR(50)            NULL,
        CREATED_BY              NVARCHAR(50)            NOT NULL,
        CREATED_DATE            DATETIME                NOT NULL,
        UPDATED_BY              NVARCHAR(50)            NULL,
        UPDATED_DATE            DATETIME                NULL,
        CONSTRAINT PK_QMT_MACHINE              PRIMARY KEY (ID),
        CONSTRAINT UQ_QMT_MACHINE_MACHINE_ID   UNIQUE (MACHINE_ID),
        CONSTRAINT UQ_QMT_MACHINE_MACHINE_NAME UNIQUE (MACHINE_NAME),
        CONSTRAINT FK_QMT_MACHINE_CATEGORY_ID  
            FOREIGN KEY (CATEGORY_ID) REFERENCES QMT_MACHINE_CATEGORY(ID),
        CONSTRAINT FK_QMT_MACHINE_CREATED_BY   
            FOREIGN KEY (CREATED_BY) REFERENCES AD_USER_CREDENTIAL(USER_ID),
        CONSTRAINT FK_QMT_MACHINE_UPDATED_BY   
            FOREIGN KEY (UPDATED_BY) REFERENCES AD_USER_CREDENTIAL(USER_ID)
    );
    CREATE INDEX IX_QMT_MACHINE_CATEGORY ON QMT_MACHINE(CATEGORY_ID);

    -- 3. Recreate QMT_MACHINE_CRITERIAL_SPARES
    CREATE TABLE QMT_MACHINE_CRITERIAL_SPARES (
        ID              BIGINT IDENTITY(1,1)    NOT NULL,
        MACHINE_ID      BIGINT                  NOT NULL,
        ITEM_CODE       NVARCHAR(50)            NOT NULL,
        ITEM_NAME       NVARCHAR(100)           NOT NULL,
        SUPPLIER        NVARCHAR(100)           NULL,
        RATE            DECIMAL(18,2)           NULL,
        QTY             INT                     NULL,
        UOM             NVARCHAR(30)            NULL,
        CREATED_BY      NVARCHAR(50)            NOT NULL,
        CREATED_DATE    DATETIME                NOT NULL,
        UPDATED_BY      NVARCHAR(50)            NULL,
        UPDATED_DATE    DATETIME                NULL,
        CONSTRAINT PK_QMT_MACHINE_CRITERIAL_SPARES PRIMARY KEY (ID),
        CONSTRAINT FK_QMT_MACHINE_CRITERIAL_SPARES_MACHINE_ID 
            FOREIGN KEY (MACHINE_ID) REFERENCES QMT_MACHINE(ID) ON DELETE CASCADE,
        CONSTRAINT FK_QMT_MACHINE_CRITERIAL_SPARES_CREATED_BY 
            FOREIGN KEY (CREATED_BY) REFERENCES AD_USER_CREDENTIAL(USER_ID),
        CONSTRAINT FK_QMT_MACHINE_CRITERIAL_SPARES_UPDATED_BY 
            FOREIGN KEY (UPDATED_BY) REFERENCES AD_USER_CREDENTIAL(USER_ID)
    );
    CREATE INDEX IX_QMT_MACHINE_CRITERIAL_SPARES_MACHINE_ID 
        ON QMT_MACHINE_CRITERIAL_SPARES(MACHINE_ID);

    PRINT 'IDENTITY constraint dropped and tables recreated successfully.';
END
ELSE
BEGIN
    PRINT 'QMT_MACHINE_CATEGORY ID column does not have IDENTITY constraint - skipping migration.';
END
GO
