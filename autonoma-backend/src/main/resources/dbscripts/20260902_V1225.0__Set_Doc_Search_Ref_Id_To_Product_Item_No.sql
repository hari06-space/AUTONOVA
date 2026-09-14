-- Organization: Nutech
-- Owner: Nutech
-- Created At: 2026-09-02
-- Description: Update DOC_SEARCH_DOCUMENT REF_ID to ITEM_NO for NPD product attachments

-- Backfill / Synchronize REF_ID with Product ITEM_NO for all Product Master attachments
IF OBJECT_ID(N'dbo.DOC_SEARCH_DOCUMENT', N'U') IS NOT NULL 
   AND OBJECT_ID(N'dbo.NPD_ATTACHMENT_PATH', N'U') IS NOT NULL 
   AND OBJECT_ID(N'dbo.NPD_PRODUCT_MASTER', N'U') IS NOT NULL
BEGIN
    UPDATE d
    SET d.REF_ID = p.ITEM_NO
    FROM dbo.DOC_SEARCH_DOCUMENT d
    JOIN dbo.NPD_ATTACHMENT_PATH a ON d.SOURCE_PK_VALUE = CAST(a.id AS nvarchar)
    JOIN dbo.NPD_PRODUCT_MASTER p ON COALESCE(a.REF_ID, TRY_CAST(a.REF_ID_STR AS bigint)) = p.id
    WHERE d.SOURCE_TABLE = 'NPD_ATTACHMENT_PATH'
      AND (d.REF_ID IS NULL OR d.REF_ID <> p.ITEM_NO);
END;
GO
