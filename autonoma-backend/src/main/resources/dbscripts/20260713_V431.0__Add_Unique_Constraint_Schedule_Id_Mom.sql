-- V431.0: Clean up duplicates and enforce unique constraint on SCHEDULE_ID in QMS_MOM_MASTER
-- This prevents concurrent multiple saves from creating duplicate MOM records.

-- 1. Delete duplicate attendance records associated with duplicate MOM master records
DELETE FROM [dbo].[QMS_MOM_ATTENDANCE]
WHERE [MOM_ID] IN (
    SELECT m.[ID] FROM [dbo].[QMS_MOM_MASTER] m
    WHERE m.[ID] > (
        SELECT MIN(m2.[ID]) FROM [dbo].[QMS_MOM_MASTER] m2
        WHERE m2.[SCHEDULE_ID] = m.[SCHEDULE_ID]
    )
);

-- 2. Delete duplicate details records associated with duplicate MOM master records
DELETE FROM [dbo].[QMS_MOM_DETAILS]
WHERE [MOM_ID] IN (
    SELECT m.[ID] FROM [dbo].[QMS_MOM_MASTER] m
    WHERE m.[ID] > (
        SELECT MIN(m2.[ID]) FROM [dbo].[QMS_MOM_MASTER] m2
        WHERE m2.[SCHEDULE_ID] = m.[SCHEDULE_ID]
    )
);

-- 3. Delete duplicate MOM master records, keeping only the earliest ID for each schedule
DELETE FROM [dbo].[QMS_MOM_MASTER]
WHERE [ID] IN (
    SELECT m.[ID] FROM [dbo].[QMS_MOM_MASTER] m
    WHERE m.[ID] > (
        SELECT MIN(m2.[ID]) FROM [dbo].[QMS_MOM_MASTER] m2
        WHERE m2.[SCHEDULE_ID] = m.[SCHEDULE_ID]
    )
);

-- 4. Add Unique Constraint on SCHEDULE_ID to enforce idempotency and concurrency protection at DB level
IF NOT EXISTS (
    SELECT 1 FROM sys.objects 
    WHERE parent_object_id = OBJECT_ID('[dbo].[QMS_MOM_MASTER]') 
      AND type = 'UQ' 
      AND name = 'UQ_QMS_MOM_MASTER_SCHEDULE_ID'
)
BEGIN
    ALTER TABLE [dbo].[QMS_MOM_MASTER] 
    ADD CONSTRAINT [UQ_QMS_MOM_MASTER_SCHEDULE_ID] UNIQUE ([SCHEDULE_ID]);
END
GO
