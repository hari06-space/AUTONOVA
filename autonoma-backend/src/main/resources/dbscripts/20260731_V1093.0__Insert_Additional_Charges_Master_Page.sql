BEGIN TRY
    IF NOT EXISTS (SELECT 1 FROM bos_pages WHERE page_code = 'M5310')
    BEGIN
        INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon)
        VALUES (
            (SELECT ISNULL(MAX(page_id), 0) + 1 FROM bos_pages),
            1, 
            52, 
            'M5310', 
            'Additional Charges Master', 
            1, 
            '/master/sales/logistics/additional-charges', 
            'IconReceiptTax'
        );
    END
END TRY
BEGIN CATCH
    PRINT ERROR_MESSAGE();
END CATCH;
GO
