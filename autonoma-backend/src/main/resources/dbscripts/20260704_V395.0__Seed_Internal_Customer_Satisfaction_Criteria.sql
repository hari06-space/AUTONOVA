IF NOT EXISTS (SELECT 1 FROM QMS_SATISFACTION_CRITERIA WHERE SATISFACTION_TYPE = 'Internal Customer')
BEGIN
    INSERT INTO QMS_SATISFACTION_CRITERIA (SATISFACTION_TYPE, SATISFACTION_CRITERIA, STATUS, CREATED_BY, CREATED_DATE)
    VALUES 
    ('Internal Customer', 'Inter-department support', 1, 'SYSTEM', GETDATE()),
    ('Internal Customer', 'Service speed', 1, 'SYSTEM', GETDATE()),
    ('Internal Customer', 'Work accuracy', 1, 'SYSTEM', GETDATE()),
    ('Internal Customer', 'Communication clarity', 1, 'SYSTEM', GETDATE()),
    ('Internal Customer', 'Goal alignment', 1, 'SYSTEM', GETDATE()),
    ('Internal Customer', 'Issue resolution efficiency', 1, 'SYSTEM', GETDATE()),
    ('Internal Customer', 'Professional behavior', 1, 'SYSTEM', GETDATE()),
    ('Internal Customer', 'Data accessibility', 1, 'SYSTEM', GETDATE()),
    ('Internal Customer', 'Adaptability to change', 1, 'SYSTEM', GETDATE());
END

IF NOT EXISTS (SELECT 1 FROM QMS_SATISFACTION_CRITERIA WHERE SATISFACTION_TYPE = 'Employee')
BEGIN
    INSERT INTO QMS_SATISFACTION_CRITERIA (SATISFACTION_TYPE, SATISFACTION_CRITERIA, STATUS, CREATED_BY, CREATED_DATE)
    VALUES 
    ('Employee', 'Overall experience working at company', 1, 'SYSTEM', GETDATE()),
    ('Employee', 'Work environment & facilities', 1, 'SYSTEM', GETDATE()),
    ('Employee', 'Team collaboration', 1, 'SYSTEM', GETDATE()),
    ('Employee', 'Manager support', 1, 'SYSTEM', GETDATE()),
    ('Employee', 'Leadership communication', 1, 'SYSTEM', GETDATE()),
    ('Employee', 'Job satisfaction', 1, 'SYSTEM', GETDATE()),
    ('Employee', 'Career growth opportunities', 1, 'SYSTEM', GETDATE()),
    ('Employee', 'Recognition & appreciation', 1, 'SYSTEM', GETDATE()),
    ('Employee', 'Feedback process effectiveness', 1, 'SYSTEM', GETDATE()),
    ('Employee', 'Compensation & benefits satisfaction', 1, 'SYSTEM', GETDATE());
END

IF NOT EXISTS (SELECT 1 FROM QMS_SATISFACTION_CRITERIA WHERE SATISFACTION_TYPE = 'Vendor')
BEGIN
    INSERT INTO QMS_SATISFACTION_CRITERIA (SATISFACTION_TYPE, SATISFACTION_CRITERIA, STATUS, CREATED_BY, CREATED_DATE)
    VALUES 
    ('Vendor', 'Clarity of purchase orders and requirements', 1, 'SYSTEM', GETDATE()),
    ('Vendor', 'Timeliness of payment process', 1, 'SYSTEM', GETDATE()),
    ('Vendor', 'Communication with procurement team', 1, 'SYSTEM', GETDATE()),
    ('Vendor', 'Delivery schedule alignment', 1, 'SYSTEM', GETDATE()),
    ('Vendor', 'Vendor evaluation fairness', 1, 'SYSTEM', GETDATE()),
    ('Vendor', 'Technical specification accuracy', 1, 'SYSTEM', GETDATE()),
    ('Vendor', 'Logistics & receiving process satisfaction', 1, 'SYSTEM', GETDATE()),
    ('Vendor', 'Dispute resolution efficiency', 1, 'SYSTEM', GETDATE()),
    ('Vendor', 'Long-term partnership satisfaction', 1, 'SYSTEM', GETDATE());
END

IF NOT EXISTS (SELECT 1 FROM QMS_SATISFACTION_CRITERIA WHERE SATISFACTION_TYPE = 'Customer')
BEGIN
    INSERT INTO QMS_SATISFACTION_CRITERIA (SATISFACTION_TYPE, SATISFACTION_CRITERIA, STATUS, CREATED_BY, CREATED_DATE)
    VALUES 
    ('Customer', 'Quality of products/services', 1, 'SYSTEM', GETDATE()),
    ('Customer', 'Timeliness of delivery', 1, 'SYSTEM', GETDATE()),
    ('Customer', 'Support responsiveness', 1, 'SYSTEM', GETDATE()),
    ('Customer', 'Pricing transparency', 1, 'SYSTEM', GETDATE()),
    ('Customer', 'Business understanding', 1, 'SYSTEM', GETDATE()),
    ('Customer', 'Professionalism', 1, 'SYSTEM', GETDATE()),
    ('Customer', 'Ease of system usage', 1, 'SYSTEM', GETDATE()),
    ('Customer', 'Recommendation likelihood', 1, 'SYSTEM', GETDATE()),
    ('Customer', 'Problem resolution effectiveness', 1, 'SYSTEM', GETDATE());
END
