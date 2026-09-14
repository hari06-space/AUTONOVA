-- 1. Add Primary Key to NPD_ITEM_TYPE
IF NOT EXISTS (
    SELECT 1 
    FROM sys.key_constraints 
    WHERE parent_object_id = OBJECT_ID('dbo.NPD_ITEM_TYPE') 
      AND type = 'PK'
)
BEGIN
    ALTER TABLE [dbo].[NPD_ITEM_TYPE] ADD CONSTRAINT [PK_NPD_ITEM_TYPE] PRIMARY KEY CLUSTERED ([ITEM_TYPE]);
END
GO

-- 2. Add Primary Key to NPD_ITEM_SUBTYPE
IF NOT EXISTS (
    SELECT 1 
    FROM sys.key_constraints 
    WHERE parent_object_id = OBJECT_ID('dbo.NPD_ITEM_SUBTYPE') 
      AND type = 'PK'
)
BEGIN
    ALTER TABLE [dbo].[NPD_ITEM_SUBTYPE] ADD CONSTRAINT [PK_NPD_ITEM_SUBTYPE] PRIMARY KEY CLUSTERED ([SUB_TYPE]);
END
GO
