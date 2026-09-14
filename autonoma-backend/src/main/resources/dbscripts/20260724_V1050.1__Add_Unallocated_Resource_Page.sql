IF NOT EXISTS (SELECT 1 FROM BOS_PAGES WHERE page_code = 'QMS2001')
BEGIN
    INSERT INTO BOS_PAGES (mod_id, sub_mod_id, page_code, page_name, enabled)
    SELECT 
        mod_id, 
        sub_mod_id, 
        'QMS2001', 
        'Unallocated Resources', 
        1
    FROM BOS_PAGES 
    WHERE page_code = 'QM1310';
END;
