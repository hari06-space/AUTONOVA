-- ---------------------------------------------------------
-- Description: Add DIVISION to NPD_PROCESS
-- Author: Antigravity
-- Date: 2026-08-19
-- ---------------------------------------------------------

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[NPD_PROCESS]') 
    AND name = 'DIVISION'
)
BEGIN
    ALTER TABLE [dbo].[NPD_PROCESS]
    ADD [DIVISION] INT NULL;
END
GO
