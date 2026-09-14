IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[QMC_AQL_MASTER]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[QMC_AQL_MASTER] (
        [ID] [bigint] IDENTITY(1,1) NOT NULL,
        [AQL_CODE] [nvarchar](50) NOT NULL,
        [AQL_NAME] [nvarchar](100) NOT NULL,
        [INSPECTION_LEVEL] [nvarchar](50) NOT NULL,
        [INSPECTION_TYPE] [nvarchar](50) NOT NULL,
        [AQL_VALUE] [decimal](10, 3) NOT NULL,
        [REMARKS] [nvarchar](500) NULL,
        [STATUS] [bigint] NULL,
        [CREATED_BY] [nvarchar](50) NOT NULL,
        [CREATED_DATE] [datetime] NULL,
        [UPDATED_BY] [nvarchar](50) NULL,
        [UPDATED_DATE] [datetime] NULL,
        CONSTRAINT [PK_QMC_AQL_MASTER] PRIMARY KEY CLUSTERED 
        (
            [ID] ASC
        )
    );
    
    ALTER TABLE [dbo].[QMC_AQL_MASTER] ADD CONSTRAINT [UC_QMC_AQL_MASTER_CODE] UNIQUE ([AQL_CODE]);
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[QMC_AQL_SAMPLING_RULES]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[QMC_AQL_SAMPLING_RULES] (
        [ID] [bigint] IDENTITY(1,1) NOT NULL,
        [AQL_MASTER_ID] [bigint] NOT NULL,
        [LOT_SIZE_FROM] [int] NOT NULL,
        [LOT_SIZE_TO] [int] NOT NULL,
        [SAMPLE_SIZE] [int] NOT NULL,
        [ACCEPTANCE_QTY] [int] NOT NULL,
        [REJECTION_QTY] [int] NOT NULL,
        [CREATED_BY] [nvarchar](50) NOT NULL,
        [CREATED_DATE] [datetime] NULL,
        [UPDATED_BY] [nvarchar](50) NULL,
        [UPDATED_DATE] [datetime] NULL,
        CONSTRAINT [PK_QMC_AQL_SAMPLING_RULES] PRIMARY KEY CLUSTERED 
        (
            [ID] ASC
        )
    );

    ALTER TABLE [dbo].[QMC_AQL_SAMPLING_RULES]  WITH CHECK ADD  CONSTRAINT [FK_QMC_AQL_SAMPLING_RULES_MASTER] FOREIGN KEY([AQL_MASTER_ID])
    REFERENCES [dbo].[QMC_AQL_MASTER] ([ID]);
END
GO
