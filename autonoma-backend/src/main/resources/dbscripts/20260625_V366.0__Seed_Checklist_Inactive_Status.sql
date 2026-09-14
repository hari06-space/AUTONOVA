-- Seed 'Inactive' status in AD_STATUS_MASTER if it does not already exist
IF NOT EXISTS (SELECT 1 FROM AD_STATUS_MASTER WHERE NAME = 'Inactive')
BEGIN
    INSERT INTO AD_STATUS_MASTER (NAME) VALUES ('Inactive');
END
