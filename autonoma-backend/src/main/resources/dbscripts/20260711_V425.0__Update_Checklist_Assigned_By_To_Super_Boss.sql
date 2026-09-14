-- Update ASSIGNED_BY from 'System Scheduler' to 'Super Boss' for checklist assignments and history
UPDATE QMS_CHECKLIST_ASSIGNMENT
SET ASSIGNED_BY = 'Super Boss'
WHERE ASSIGNED_BY = 'System Scheduler';
GO

UPDATE QMS_CHECKLIST_CLOSED
SET ASSIGNED_BY = 'Super Boss'
WHERE ASSIGNED_BY = 'System Scheduler';
GO
