-- SQL Migration: Create MON_NOTIFICATION_HISTORY Table
-- Created: 2026-07-04

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[MON_NOTIFICATION_HISTORY]') AND type in (N'U'))
BEGIN
    CREATE TABLE MON_NOTIFICATION_HISTORY (
        row_id INT IDENTITY(1,1) PRIMARY KEY,
        cust_code NVARCHAR(50) NOT NULL,
        alert_type NVARCHAR(100),
        severity NVARCHAR(50), -- INFO, WARNING, CRITICAL
        message NVARCHAR(MAX),
        is_read BIT DEFAULT 0,
        notified_channels NVARCHAR(100), -- EMAIL, SMS, WHATSAPP, IN_APP
        created_date DATETIME DEFAULT GETDATE()
    );
END;
