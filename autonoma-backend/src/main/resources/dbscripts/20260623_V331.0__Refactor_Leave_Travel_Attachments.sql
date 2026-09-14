-- Claimed Version: V331.0
-- Description: Refactor HR_LEAVE_TRAVEL_APPLICATION attachments to use HR_ATTACHMENT_PATH instead of FILE_PATHS column

-- Drop the legacy FILE_PATHS column from HR_LEAVE_TRAVEL_APPLICATION
IF OBJECT_ID('HR_LEAVE_TRAVEL_APPLICATION', 'U') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('HR_LEAVE_TRAVEL_APPLICATION') AND name = 'FILE_PATHS')
    BEGIN
        -- Check and drop any default constraints on FILE_PATHS column
        DECLARE @ConstraintName NVARCHAR(128);
        SELECT @ConstraintName = d.name
        FROM sys.default_constraints d
        INNER JOIN sys.columns c ON d.parent_column_id = c.column_id AND d.parent_object_id = c.object_id
        WHERE d.parent_object_id = OBJECT_ID('HR_LEAVE_TRAVEL_APPLICATION') AND c.name = 'FILE_PATHS';

        IF @ConstraintName IS NOT NULL
        BEGIN
            EXEC('ALTER TABLE HR_LEAVE_TRAVEL_APPLICATION DROP CONSTRAINT ' + @ConstraintName);
            PRINT 'Dropped default constraint ' + @ConstraintName + ' from HR_LEAVE_TRAVEL_APPLICATION.FILE_PATHS';
        END

        ALTER TABLE HR_LEAVE_TRAVEL_APPLICATION DROP COLUMN FILE_PATHS;
        PRINT 'Dropped legacy FILE_PATHS column from HR_LEAVE_TRAVEL_APPLICATION.';
    END
END
GO
