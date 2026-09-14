-- Organization: Nutech Wind Parts Pvt Ltd
-- Owner: Nutech
-- Created At: 2026-09-05
-- Description: Alter DESCRIPTION column length to NVARCHAR(MAX) in NPD_BOM_PROCESS table

IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'NPD_BOM_PROCESS')
BEGIN
    IF EXISTS (SELECT 1 FROM sys.columns WHERE name = 'DESCRIPTION' AND object_id = OBJECT_ID('NPD_BOM_PROCESS'))
    BEGIN
        ALTER TABLE dbo.NPD_BOM_PROCESS ALTER COLUMN DESCRIPTION NVARCHAR(MAX) NULL;
        PRINT 'Altered DESCRIPTION column to NVARCHAR(MAX) in NPD_BOM_PROCESS.';
    END
END;
GO
