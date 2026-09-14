-- SQL Migration: Add primary key constraint to NPD_OEM table
-- Date: 2026-08-04
-- Author: Autonoma ERP AI

BEGIN TRANSACTION;
BEGIN TRY

    -- 1. Check if the table NPD_OEM exists and does not already have a primary key defined
    IF OBJECT_ID('dbo.NPD_OEM', 'U') IS NOT NULL
       AND NOT EXISTS (
           SELECT 1 FROM sys.key_constraints 
           WHERE parent_object_id = OBJECT_ID('dbo.NPD_OEM') AND type = 'PK'
       )
    BEGIN
        -- Add primary key constraint on OEM_SHORT_NAME
        ALTER TABLE [dbo].[NPD_OEM] ADD CONSTRAINT [PK_NPD_OEM] PRIMARY KEY CLUSTERED ([OEM_SHORT_NAME]);
        PRINT 'Primary key constraint PK_NPD_OEM successfully added to NPD_OEM.';
    END

    COMMIT TRANSACTION;

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
    BEGIN
        ROLLBACK TRANSACTION;
    END
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;
GO
