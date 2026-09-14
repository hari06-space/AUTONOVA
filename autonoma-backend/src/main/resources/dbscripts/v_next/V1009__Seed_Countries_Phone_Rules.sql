-- Seed and update standard countries with their ISO codes, country codes, and phone validation rules
SET NOCOUNT ON;

-- Helper table for seeding countries
DECLARE @Countries TABLE (
    COUNTRY_NAME NVARCHAR(100),
    COUNTRY_CODE NVARCHAR(50),
    PHONE_MIN_LENGTH INT,
    PHONE_MAX_LENGTH INT,
    COUNTRY_ISO NVARCHAR(50)
);

INSERT INTO @Countries (COUNTRY_NAME, COUNTRY_CODE, PHONE_MIN_LENGTH, PHONE_MAX_LENGTH, COUNTRY_ISO)
VALUES 
('India', '+91', 10, 10, 'IND'),
('United States', '+1', 10, 10, 'USA'),
('United Kingdom', '+44', 10, 10, 'GBR'),
('United Arab Emirates', '+971', 9, 9, 'ARE'),
('Singapore', '+65', 8, 8, 'SGP'),
('Malaysia', '+60', 9, 10, 'MYS'),
('Australia', '+61', 9, 9, 'AUS'),
('Japan', '+81', 9, 10, 'JPN'),
('Germany', '+49', 10, 11, 'DEU'),
('France', '+33', 9, 9, 'FRA');

-- Merge into MST_COUNTRY
MERGE INTO [dbo].[MST_COUNTRY] AS target
USING @Countries AS source
ON target.[COUNTRY_NAME] = source.[COUNTRY_NAME]
WHEN MATCHED THEN
    UPDATE SET 
        target.[COUNTRY_CODE] = source.[COUNTRY_CODE],
        target.[PHONE_MIN_LENGTH] = source.[PHONE_MIN_LENGTH],
        target.[PHONE_MAX_LENGTH] = source.[PHONE_MAX_LENGTH],
        target.[COUNTRY_ISO] = source.[COUNTRY_ISO],
        target.[UPDATED_BY] = 'SYSTEM',
        target.[UPDATED_DATE] = GETDATE(),
        target.[IS_ACTIVE] = 1,
        target.[STATUS] = 'Active'
WHEN NOT MATCHED THEN
    INSERT ([COUNTRY_NAME], [COUNTRY_CODE], [PHONE_MIN_LENGTH], [PHONE_MAX_LENGTH], [COUNTRY_ISO], [STATUS], [CREATED_BY], [CREATED_DATE], [IS_ACTIVE])
    VALUES (source.[COUNTRY_NAME], source.[COUNTRY_CODE], source.[PHONE_MIN_LENGTH], source.[PHONE_MAX_LENGTH], source.[COUNTRY_ISO], 'Active', 'SYSTEM', GETDATE(), 1);

PRINT 'Standard countries and phone rules seeded successfully!';
GO
