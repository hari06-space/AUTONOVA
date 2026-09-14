IF NOT EXISTS (SELECT 1 FROM bos_pages WHERE page_code = 'SM1170')
BEGIN
    DECLARE @max_page_id INT;
    SELECT @max_page_id = ISNULL(MAX(page_id), 0) + 1 FROM bos_pages;

    INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon)
    VALUES (@max_page_id, 4, 411, 'SM1170', 'Quotation Follow Up', 1, '/sm/quotation-follow-up', 'IconChartLine');
END
GO
