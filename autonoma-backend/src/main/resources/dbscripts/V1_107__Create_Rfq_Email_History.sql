IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[PP_RFQ_EMAIL_HISTORY]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[PP_RFQ_EMAIL_HISTORY](
        [ID] [bigint] IDENTITY(1,1) NOT NULL,
        [RFQ_ID] [bigint] NOT NULL,
        [EMAIL_SUBJECT] [varchar](500) NOT NULL,
        [EMAIL_CONTENT] [nvarchar](max) NOT NULL,
        [SENT_BY] [varchar](100) NULL,
        [SENT_DATE] [datetime2](7) NULL,
        [STATUS] [varchar](50) NULL,
        [CREATED_BY] [varchar](50) NOT NULL,
        [CREATED_DATE] [datetime2](7) NULL,
        [UPDATED_BY] [varchar](50) NULL,
        [UPDATED_DATE] [datetime2](7) NULL,
     CONSTRAINT [PK_PP_RFQ_EMAIL_HISTORY] PRIMARY KEY CLUSTERED 
    (
        [ID] ASC
    )
    )

    ALTER TABLE [dbo].[PP_RFQ_EMAIL_HISTORY]  WITH CHECK ADD  CONSTRAINT [FK_RFQ_EMAIL_HISTORY_RFQ_HEAD] FOREIGN KEY([RFQ_ID])
    REFERENCES [dbo].[PP_RFQ_HEAD] ([ID])
END
GO
