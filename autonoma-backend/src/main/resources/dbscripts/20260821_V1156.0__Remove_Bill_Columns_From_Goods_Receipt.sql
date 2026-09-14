-- 20260821_V1156.0__Remove_Bill_Columns_From_Goods_Receipt.sql
-- Remove Bill No and Bill Date columns from PP_GOODS_RECEIPT_HEAD

IF EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('PP_GOODS_RECEIPT_HEAD') 
      AND name = 'BILL_NO'
)
BEGIN
    ALTER TABLE PP_GOODS_RECEIPT_HEAD DROP COLUMN BILL_NO;
END

IF EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('PP_GOODS_RECEIPT_HEAD') 
      AND name = 'BILL_DATE'
)
BEGIN
    ALTER TABLE PP_GOODS_RECEIPT_HEAD DROP COLUMN BILL_DATE;
END
