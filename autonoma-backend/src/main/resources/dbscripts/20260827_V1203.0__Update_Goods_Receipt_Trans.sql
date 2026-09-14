-- ==============================================================================
-- Script: V1_114__Update_Goods_Receipt_Trans.sql
-- Description:
-- 1. Drop redundant columns from PP_GOODS_RECEIPT_TRANS (PO_QTY, PREVIOUS_RECEIVED_QTY, ACCEPTED_QTY, REJECTED_QTY, INSPECTION_TRANS_ID)
-- 2. Add PRICE column to PP_GOODS_RECEIPT_TRANS
-- ==============================================================================

-- 1. Drop Dependencies
ALTER TABLE PP_GOODS_RECEIPT_TRANS DROP CONSTRAINT IF EXISTS FKr4laylxkycm4ko4cane4ixxbm;
DROP INDEX IF EXISTS IX_PP_GRN_TRANS_INSPECTION ON PP_GOODS_RECEIPT_TRANS;

-- 2. Drop Default Constraints if any (for safety)
DECLARE @ConstraintName nvarchar(200);

SELECT @ConstraintName = Name FROM sys.default_constraints WHERE parent_object_id = object_id('PP_GOODS_RECEIPT_TRANS') AND parent_column_id = (SELECT column_id FROM sys.columns WHERE name = 'PO_QTY' AND object_id = object_id('PP_GOODS_RECEIPT_TRANS'));
IF @ConstraintName IS NOT NULL EXEC('ALTER TABLE PP_GOODS_RECEIPT_TRANS DROP CONSTRAINT ' + @ConstraintName);

SELECT @ConstraintName = Name FROM sys.default_constraints WHERE parent_object_id = object_id('PP_GOODS_RECEIPT_TRANS') AND parent_column_id = (SELECT column_id FROM sys.columns WHERE name = 'PREVIOUS_RECEIVED_QTY' AND object_id = object_id('PP_GOODS_RECEIPT_TRANS'));
IF @ConstraintName IS NOT NULL EXEC('ALTER TABLE PP_GOODS_RECEIPT_TRANS DROP CONSTRAINT ' + @ConstraintName);

SELECT @ConstraintName = Name FROM sys.default_constraints WHERE parent_object_id = object_id('PP_GOODS_RECEIPT_TRANS') AND parent_column_id = (SELECT column_id FROM sys.columns WHERE name = 'ACCEPTED_QTY' AND object_id = object_id('PP_GOODS_RECEIPT_TRANS'));
IF @ConstraintName IS NOT NULL EXEC('ALTER TABLE PP_GOODS_RECEIPT_TRANS DROP CONSTRAINT ' + @ConstraintName);

SELECT @ConstraintName = Name FROM sys.default_constraints WHERE parent_object_id = object_id('PP_GOODS_RECEIPT_TRANS') AND parent_column_id = (SELECT column_id FROM sys.columns WHERE name = 'REJECTED_QTY' AND object_id = object_id('PP_GOODS_RECEIPT_TRANS'));
IF @ConstraintName IS NOT NULL EXEC('ALTER TABLE PP_GOODS_RECEIPT_TRANS DROP CONSTRAINT ' + @ConstraintName);

SELECT @ConstraintName = Name FROM sys.default_constraints WHERE parent_object_id = object_id('PP_GOODS_RECEIPT_TRANS') AND parent_column_id = (SELECT column_id FROM sys.columns WHERE name = 'INSPECTION_TRANS_ID' AND object_id = object_id('PP_GOODS_RECEIPT_TRANS'));
IF @ConstraintName IS NOT NULL EXEC('ALTER TABLE PP_GOODS_RECEIPT_TRANS DROP CONSTRAINT ' + @ConstraintName);

-- 3. Drop columns
ALTER TABLE PP_GOODS_RECEIPT_TRANS DROP COLUMN IF EXISTS PO_QTY, PREVIOUS_RECEIVED_QTY, ACCEPTED_QTY, REJECTED_QTY, INSPECTION_TRANS_ID;
GO

-- 4. Add PRICE column
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'PRICE' AND Object_ID = Object_ID(N'PP_GOODS_RECEIPT_TRANS'))
BEGIN
    ALTER TABLE PP_GOODS_RECEIPT_TRANS ADD PRICE NUMERIC(12,2) NOT NULL DEFAULT 0;
END
GO
