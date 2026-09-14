-- SQL Migration: Reseed NPD_SAMPLE_FREQUENCY to fix sequential sequence jumps
-- Scope: NPD_SAMPLE_FREQUENCY cleanup
-- Author: Antigravity

IF OBJECT_ID('dbo.NPD_SAMPLE_FREQUENCY', 'U') IS NOT NULL
BEGIN
    -- Only reseed if there are records to clean up
    IF EXISTS (SELECT 1 FROM dbo.NPD_SAMPLE_FREQUENCY)
    BEGIN
        -- Create temp table to preserve existing data
        SELECT FREQUENCY, STATUS, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE
        INTO #temp_sample_freq
        FROM dbo.NPD_SAMPLE_FREQUENCY;

        -- Clear existing records
        DELETE FROM dbo.NPD_SAMPLE_FREQUENCY;

        -- Reseed IDENTITY sequence back to 0
        DBCC CHECKIDENT ('dbo.NPD_SAMPLE_FREQUENCY', RESEED, 0);

        -- Re-insert records in order of creation so they get clean sequential IDs (1, 2, 3, 4, ...)
        INSERT INTO dbo.NPD_SAMPLE_FREQUENCY (FREQUENCY, STATUS, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE)
        SELECT FREQUENCY, STATUS, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE
        FROM #temp_sample_freq
        ORDER BY CREATED_DATE ASC;

        -- Drop temp table
        DROP TABLE #temp_sample_freq;
    END
END
GO
