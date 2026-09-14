-- ==============================================================================
-- Script: V1_113__Update_Goods_Receipt_and_Item_Transaction.sql
-- Description:
-- 1. Replace ACTIVE_STATUS with BATCH_STATUS (BIGINT) in PP_GOODS_RECEIPT_TRANS
-- 2. Drop TOTAL_VALUE column from ITEM_TRANSACTION
-- ==============================================================================

-- 1. Replace ACTIVE_STATUS with BATCH_STATUS (BIGINT) in PP_GOODS_RECEIPT_TRANS
IF EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'ACTIVE_STATUS' AND Object_ID = Object_ID(N'PP_GOODS_RECEIPT_TRANS'))
BEGIN
    DECLARE @ConstraintName nvarchar(200);
    SELECT @ConstraintName = Name 
    FROM sys.default_constraints 
    WHERE parent_object_id = object_id('PP_GOODS_RECEIPT_TRANS') 
      AND parent_column_id = (SELECT column_id FROM sys.columns WHERE name = 'ACTIVE_STATUS' AND object_id = object_id('PP_GOODS_RECEIPT_TRANS'));
    
    IF @ConstraintName IS NOT NULL
    BEGIN
        EXEC('ALTER TABLE PP_GOODS_RECEIPT_TRANS DROP CONSTRAINT ' + @ConstraintName);
    END
    
    ALTER TABLE PP_GOODS_RECEIPT_TRANS DROP COLUMN ACTIVE_STATUS;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'BATCH_STATUS' AND Object_ID = Object_ID(N'PP_GOODS_RECEIPT_TRANS'))
BEGIN
    ALTER TABLE PP_GOODS_RECEIPT_TRANS ADD BATCH_STATUS BIGINT NOT NULL DEFAULT 1;
END
GO

-- 2. Drop TOTAL_VALUE from ITEM_TRANSACTION
IF EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'TOTAL_VALUE' AND Object_ID = Object_ID(N'ITEM_TRANSACTION'))
BEGIN
    DECLARE @TotalValueConstraintName nvarchar(200);
    SELECT @TotalValueConstraintName = Name 
    FROM sys.default_constraints 
    WHERE parent_object_id = object_id('ITEM_TRANSACTION') 
      AND parent_column_id = (SELECT column_id FROM sys.columns WHERE name = 'TOTAL_VALUE' AND object_id = object_id('ITEM_TRANSACTION'));
    
    IF @TotalValueConstraintName IS NOT NULL
    BEGIN
        EXEC('ALTER TABLE ITEM_TRANSACTION DROP CONSTRAINT ' + @TotalValueConstraintName);
    END
    
    ALTER TABLE ITEM_TRANSACTION DROP COLUMN TOTAL_VALUE;
END
GO
ALTER TABLE PP_GOODS_RECEIPT_TRANS ADD CONSTRAINT FK_GRN_TRANS_BATCH_STATUS FOREIGN KEY (BATCH_STATUS) REFERENCES AD_STATUS_MASTER(ID);
GO
