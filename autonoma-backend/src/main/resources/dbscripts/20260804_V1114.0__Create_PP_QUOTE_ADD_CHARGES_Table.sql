IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[PP_QUOTE_ADD_CHARGES]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[PP_QUOTE_ADD_CHARGES] (
        [ID] [bigint] IDENTITY(1,1) NOT NULL,
        [QUOTE_ID] [bigint] NULL,
        [CHARGES_ID] [bigint] NULL,
        [AMOUNT] [numeric](12, 2) NULL,
        [TAX_APPLICABLE] [bit] NULL,
        [CGST_PER] [numeric](12, 2) NULL,
        [CGST_VALUE] [numeric](12, 2) NULL,
        [SGST_PER] [numeric](12, 2) NULL,
        [SGST_VALUE] [numeric](12, 2) NULL,
        [IGST_PER] [numeric](12, 2) NULL,
        [IGST_VALUE] [numeric](12, 2) NULL,
        [TOTAL_VALUE] [numeric](12, 2) NULL,
        [STATUS] [bit] NULL CONSTRAINT [DF_PP_QUOTE_ADD_CHARGES_STATUS] DEFAULT ((1)),
        [CREATED_BY] [nvarchar](50) NOT NULL,
        [CREATED_DATE] [datetime] NULL,
        [UPDATED_BY] [nvarchar](50) NULL,
        [UPDATED_DATE] [datetime] NULL,
        CONSTRAINT [PK_PP_QUOTE_ADD_CHARGES] PRIMARY KEY CLUSTERED ([ID] ASC)
    );

    ALTER TABLE [dbo].[PP_QUOTE_ADD_CHARGES] WITH CHECK ADD CONSTRAINT [FK_PP_QUOTE_ADD_CHARGES_QUOTE] FOREIGN KEY([QUOTE_ID])
    REFERENCES [dbo].[PUR_QUOTATION_HEAD] ([ID]);
    ALTER TABLE [dbo].[PP_QUOTE_ADD_CHARGES] CHECK CONSTRAINT [FK_PP_QUOTE_ADD_CHARGES_QUOTE];
END
GO