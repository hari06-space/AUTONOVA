IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[QMT_MACHINE_INTEGRATION]') AND type in (N'U'))
BEGIN
    CREATE TABLE QMT_MACHINE_INTEGRATION (
        ID                      BIGINT IDENTITY(1,1)    NOT NULL,
        MACHINE_ID_REF          BIGINT                  NOT NULL,
        DB_TYPE                 NVARCHAR(50)            NOT NULL,
        DB_HOST                 NVARCHAR(200)           NOT NULL,
        DB_PORT                 INT                     NOT NULL,
        DATABASE_NAME           NVARCHAR(100)           NOT NULL,
        DB_USERNAME             NVARCHAR(100)           NOT NULL,
        DB_PASSWORD             NVARCHAR(500)           NOT NULL,
        PRODUCTION_TABLE_NAME   NVARCHAR(100)           NOT NULL,
        ACTIVE                  BIT                     NOT NULL DEFAULT 1,
        
        -- Audit Columns
        CREATED_BY              NVARCHAR(50)            NOT NULL,
        CREATED_DATE            DATETIME                NOT NULL DEFAULT GETDATE(),
        UPDATED_BY              NVARCHAR(50)            NULL,
        UPDATED_DATE            DATETIME                NULL,

        PRIMARY KEY (ID),
        CONSTRAINT FK_MACHINE_INTEG_MACHINE FOREIGN KEY (MACHINE_ID_REF) REFERENCES QMT_MACHINE(ID),
        CONSTRAINT FK_MACHINE_INTEG_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES AD_USER_CREDENTIAL(USER_ID),
        CONSTRAINT FK_MACHINE_INTEG_UPDATED_BY FOREIGN KEY (UPDATED_BY) REFERENCES AD_USER_CREDENTIAL(USER_ID)
    );
END
GO
