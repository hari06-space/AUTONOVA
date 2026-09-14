-- Rename Asset page codes to be consistent with the other page codes (starting with 'M')
-- Target: HR_AST -> M2500, HR_AST_01 -> M2510, HR_AST_02 -> M2520, HR_AST_03 -> M2530

-- 1. Update bos_pages table
UPDATE bos_pages
SET page_code = 'M2500'
WHERE page_code = 'HR_AST';

UPDATE bos_pages
SET page_code = 'M2510'
WHERE page_code = 'HR_AST_01';

UPDATE bos_pages
SET page_code = 'M2520'
WHERE page_code = 'HR_AST_02';

UPDATE bos_pages
SET page_code = 'M2530'
WHERE page_code = 'HR_AST_03';

-- 2. Update bos_sub_modules table
UPDATE bos_sub_modules
SET sub_mod_code = 'M2500'
WHERE sub_mod_code = 'M7000';
