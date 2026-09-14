-- SQL Migration: Add Index for Petrol Allowance Master Vehicle Type and Rate Overlap Checking
-- Created: 2026-08-12

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[HR_PETROL_ALLOWANCE_MASTER]') AND type in (N'U'))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_HR_PETROL_ALLOWANCE_VEHICLE_RATES' AND object_id = OBJECT_ID(N'[dbo].[HR_PETROL_ALLOWANCE_MASTER]'))
    BEGIN
        CREATE INDEX [IX_HR_PETROL_ALLOWANCE_VEHICLE_RATES]
        ON [dbo].[HR_PETROL_ALLOWANCE_MASTER] ([VEHICLE_TYPE], [FROM_RATE], [TO_RATE]);
    END
END;
GO
