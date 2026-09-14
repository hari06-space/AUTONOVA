-- SQL Migration: Disable IDENTITY_CACHE globally and reseed NPD_SAMPLE_SIZE to fix sequential sequence jumps
-- Scope: AUTONOMA Scoped Configuration & NPD_SAMPLE_SIZE cleanup
-- Author: Antigravity

-- 1. Disable database IDENTITY_CACHE scoped configuration to prevent sequence jumps on server/container restarts
ALTER DATABASE SCOPED CONFIGURATION SET IDENTITY_CACHE = OFF;
GO

-- 2. Reseed NPD_SAMPLE_SIZE table to sequential values if it exists
IF OBJECT_ID('dbo.NPD_SAMPLE_SIZE', 'U') IS NOT NULL
BEGIN
    -- Only reseed if there are records to clean up
    IF EXISTS (SELECT 1 FROM dbo.NPD_SAMPLE_SIZE)
    BEGIN
        -- Create temp table to preserve existing data
        SELECT SIZE, STATUS, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE
        INTO #temp_sample_size
        FROM dbo.NPD_SAMPLE_SIZE;

        -- Clear existing records
        DELETE FROM dbo.NPD_SAMPLE_SIZE;

        -- Reseed IDENTITY sequence back to 0
        DBCC CHECKIDENT ('dbo.NPD_SAMPLE_SIZE', RESEED, 0);

        -- Re-insert records in order of creation so they get clean sequential IDs (1, 2, 3, 4, ...)
        INSERT INTO dbo.NPD_SAMPLE_SIZE (SIZE, STATUS, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE)
        SELECT SIZE, STATUS, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE
        FROM #temp_sample_size
        ORDER BY CREATED_DATE ASC;

        -- Drop temp table
        DROP TABLE #temp_sample_size;
    END
END
GO
