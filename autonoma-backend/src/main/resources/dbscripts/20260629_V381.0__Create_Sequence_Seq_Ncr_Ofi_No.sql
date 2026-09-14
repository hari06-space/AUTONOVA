-- ==========================================================
-- Migration: V381.0 - Create Sequence SEQ_NCR_OFI_NO
-- Description: Creates the sequence SEQ_NCR_OFI_NO for generating NC/OFI document numbers
-- ==========================================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SEQ_NCR_OFI_NO]') AND type = 'SO')
BEGIN
    CREATE SEQUENCE [dbo].[SEQ_NCR_OFI_NO]
        START WITH 1
        INCREMENT BY 1;
END
GO
