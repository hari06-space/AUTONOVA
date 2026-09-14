-- ---------------------------------------------------------
-- Description: Add PROCESS_CD to NPD_PROCESS
-- Author: Antigravity
-- Date: 2026-08-19
-- ---------------------------------------------------------

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[NPD_PROCESS]') 
    AND name = 'PROCESS_CD'
)
BEGIN
    ALTER TABLE [dbo].[NPD_PROCESS]
    ADD [PROCESS_CD] NVARCHAR(25) NULL;
END
GO
