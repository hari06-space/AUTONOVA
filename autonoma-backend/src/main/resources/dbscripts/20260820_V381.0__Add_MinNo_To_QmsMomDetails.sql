-- Migration: Add MIN_NO to QMS_MOM_DETAILS table and backfill existing data from legacy ERPDb_NUTECH.dbo.MEETING_MINUTE_TRANS
-- Created: 2026-08-20

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[QMS_MOM_DETAILS]') 
      AND name = N'MIN_NO'
)
BEGIN
    ALTER TABLE QMS_MOM_DETAILS ADD MIN_NO NVARCHAR(100) NULL;
END;
