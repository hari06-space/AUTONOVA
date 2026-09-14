-- Organization: Nutech Wind Parts Pvt Ltd
-- Owner: Nutech
-- Created At: 2026-09-05
-- Description: Add or alter NORMS_PER_HRS column to numeric(12,4) in NPD_BOM_PROCESS table

IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'NPD_BOM_PROCESS')
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE name = 'NORMS_PER_HRS' AND object_id = OBJECT_ID('NPD_BOM_PROCESS'))
    BEGIN
        ALTER TABLE dbo.NPD_BOM_PROCESS ADD NORMS_PER_HRS NUMERIC(12,4) NULL;
        PRINT 'Added NORMS_PER_HRS column as NUMERIC(12,4) to NPD_BOM_PROCESS.';
    END
    ELSE
    BEGIN
        ALTER TABLE dbo.NPD_BOM_PROCESS ALTER COLUMN NORMS_PER_HRS NUMERIC(12,4) NULL;
        PRINT 'Altered NORMS_PER_HRS column to NUMERIC(12,4) in NPD_BOM_PROCESS.';
    END
END;
GO
