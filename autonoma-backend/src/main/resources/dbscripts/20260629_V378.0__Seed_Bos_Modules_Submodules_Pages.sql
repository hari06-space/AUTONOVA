-- SQL Migration: Seed BOS Modules, Submodules, Pages, and Permissions
-- Created: 2026-06-29

-- Update dynamic/auto-generated page IDs in FILE_TRACEABILITY_MANAGEMENT to static equivalents before deletion if table exists
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[FILE_TRACEABILITY_MANAGEMENT]') AND type in (N'U'))
BEGIN
    UPDATE FILE_TRACEABILITY_MANAGEMENT SET page_id = 37 WHERE page_id IN (SELECT page_id FROM bos_pages WHERE page_code = 'M2110');
    UPDATE FILE_TRACEABILITY_MANAGEMENT SET page_id = 59 WHERE page_id IN (SELECT page_id FROM bos_pages WHERE page_code = 'M3110');
    UPDATE FILE_TRACEABILITY_MANAGEMENT SET page_id = 61 WHERE page_id IN (SELECT page_id FROM bos_pages WHERE page_code = 'M3130');
    UPDATE FILE_TRACEABILITY_MANAGEMENT SET page_id = 62 WHERE page_id IN (SELECT page_id FROM bos_pages WHERE page_code = 'M3140');
    UPDATE FILE_TRACEABILITY_MANAGEMENT SET page_id = 63 WHERE page_id IN (SELECT page_id FROM bos_pages WHERE page_code = 'M3150');
END;

-- Delete existing authorization, pages, sub-modules, modules (Commented out to prevent FK constraint failures)
-- DELETE FROM bos_user_page_auth;
-- DELETE FROM bos_pages;
-- DELETE FROM bos_sub_modules;
-- DELETE FROM bos_modules;

BEGIN TRANSACTION;

SET IDENTITY_INSERT bos_modules ON;

BEGIN TRY INSERT INTO bos_modules (module_id, mod_code, mod_name) VALUES (1, 'M0000', 'Masters'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_modules (module_id, mod_code, mod_name) VALUES (2, 'HA0000', 'HR & Admin'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_modules (module_id, mod_code, mod_name) VALUES (3, 'DD0000', 'Design & Development'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_modules (module_id, mod_code, mod_name) VALUES (4, 'SM0000', 'Sales & Marketing'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_modules (module_id, mod_code, mod_name) VALUES (5, 'PP0000', 'Planning & Purchase'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_modules (module_id, mod_code, mod_name) VALUES (6, 'P0000', 'Production'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_modules (module_id, mod_code, mod_name) VALUES (7, 'Q0000', 'Quality'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_modules (module_id, mod_code, mod_name) VALUES (8, 'SL0000', 'Stores & Logistics'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_modules (module_id, mod_code, mod_name) VALUES (9, 'FA0000', 'Finance & Accounts'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_modules (module_id, mod_code, mod_name) VALUES (10, 'MS0000', 'Maintenance & Services'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_modules (module_id, mod_code, mod_name) VALUES (11, 'QM0000', 'Quality Management Systems'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_modules (module_id, mod_code, mod_name) VALUES (12, 'R0000', 'Reports'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_modules (module_id, mod_code, mod_name) VALUES (13, 'S0000', 'Support'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_modules (module_id, mod_code, mod_name) VALUES (14, 'AD0000', 'Admin'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_modules (module_id, mod_code, mod_name) VALUES (15, 'DB0000', 'Dashboard'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_modules (module_id, mod_code, mod_name) VALUES (16, 'SC0000', 'Employee Self-Care'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_modules (module_id, mod_code, mod_name) VALUES (17, 'ORDER', 'Order'); END TRY BEGIN CATCH END CATCH;

SET IDENTITY_INSERT bos_modules OFF;

SET IDENTITY_INSERT bos_sub_modules ON;

-- Masters Submodules (mod_id = 1)
BEGIN TRY INSERT INTO bos_sub_modules (sub_mod_id, mod_id, parent_sub_mod_id, sub_mod_code, sub_mod_name) VALUES (10, 1, NULL, 'M1000', 'QMS'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_sub_modules (sub_mod_id, mod_id, parent_sub_mod_id, sub_mod_code, sub_mod_name) VALUES (11, 1, 10, 'M1100', 'Audit'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_sub_modules (sub_mod_id, mod_id, parent_sub_mod_id, sub_mod_code, sub_mod_name) VALUES (12, 1, 10, 'M1200', 'Checklist'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_sub_modules (sub_mod_id, mod_id, parent_sub_mod_id, sub_mod_code, sub_mod_name) VALUES (13, 1, 10, 'M1300', 'Meeting'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_sub_modules (sub_mod_id, mod_id, parent_sub_mod_id, sub_mod_code, sub_mod_name) VALUES (18, 1, NULL, 'M1400', 'Maintenance'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_sub_modules (sub_mod_id, mod_id, parent_sub_mod_id, sub_mod_code, sub_mod_name) VALUES (20, 1, NULL, 'M2000', 'HR'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_sub_modules (sub_mod_id, mod_id, parent_sub_mod_id, sub_mod_code, sub_mod_name) VALUES (21, 1, 20, 'M2100', 'ATS'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_sub_modules (sub_mod_id, mod_id, parent_sub_mod_id, sub_mod_code, sub_mod_name) VALUES (22, 1, 20, 'M2200', 'Employee'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_sub_modules (sub_mod_id, mod_id, parent_sub_mod_id, sub_mod_code, sub_mod_name) VALUES (23, 1, 20, 'M2300', 'Common'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_sub_modules (sub_mod_id, mod_id, parent_sub_mod_id, sub_mod_code, sub_mod_name) VALUES (24, 1, 20, 'M2400', 'Attendance'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_sub_modules (sub_mod_id, mod_id, parent_sub_mod_id, sub_mod_code, sub_mod_name) VALUES (114, 1, 20, '20', 'M2500'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_sub_modules (sub_mod_id, mod_id, parent_sub_mod_id, sub_mod_code, sub_mod_name) VALUES (30, 1, NULL, 'M3000', 'NPD'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_sub_modules (sub_mod_id, mod_id, parent_sub_mod_id, sub_mod_code, sub_mod_name) VALUES (31, 1, 30, 'M3100', 'Product'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_sub_modules (sub_mod_id, mod_id, parent_sub_mod_id, sub_mod_code, sub_mod_name) VALUES (32, 1, 30, 'M3200', 'Wind Farm'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_sub_modules (sub_mod_id, mod_id, parent_sub_mod_id, sub_mod_code, sub_mod_name) VALUES (40, 1, NULL, 'M4000', 'Vendor Master'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_sub_modules (sub_mod_id, mod_id, parent_sub_mod_id, sub_mod_code, sub_mod_name) VALUES (41, 1, 40, 'M4100', 'Supplier'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_sub_modules (sub_mod_id, mod_id, parent_sub_mod_id, sub_mod_code, sub_mod_name) VALUES (42, 1, 40, 'M4200', 'Sub Contractor'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_sub_modules (sub_mod_id, mod_id, parent_sub_mod_id, sub_mod_code, sub_mod_name) VALUES (50, 1, NULL, 'M5000', 'Sales'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_sub_modules (sub_mod_id, mod_id, parent_sub_mod_id, sub_mod_code, sub_mod_name) VALUES (51, 1, 50, 'M5100', 'CRM'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_sub_modules (sub_mod_id, mod_id, parent_sub_mod_id, sub_mod_code, sub_mod_name) VALUES (52, 1, 50, 'M5200', 'Terms & Logistics'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_sub_modules (sub_mod_id, mod_id, parent_sub_mod_id, sub_mod_code, sub_mod_name) VALUES (60, 1, NULL, 'M6000', 'QMT'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_sub_modules (sub_mod_id, mod_id, parent_sub_mod_id, sub_mod_code, sub_mod_name) VALUES (70, 1, NULL, 'M7000', 'Asset'); END TRY BEGIN CATCH END CATCH;

-- HR & Admin Submodules (mod_id = 2)
BEGIN TRY INSERT INTO bos_sub_modules (sub_mod_id, mod_id, parent_sub_mod_id, sub_mod_code, sub_mod_name) VALUES (201, 2, NULL, 'HA1100', 'ATS'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_sub_modules (sub_mod_id, mod_id, parent_sub_mod_id, sub_mod_code, sub_mod_name) VALUES (202, 2, NULL, 'HA1200', 'Employee'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_sub_modules (sub_mod_id, mod_id, parent_sub_mod_id, sub_mod_code, sub_mod_name) VALUES (203, 2, NULL, 'HA1300', 'Attendance'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_sub_modules (sub_mod_id, mod_id, parent_sub_mod_id, sub_mod_code, sub_mod_name) VALUES (210, 2, NULL, 'HA1400', 'Induction'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_sub_modules (sub_mod_id, mod_id, parent_sub_mod_id, sub_mod_code, sub_mod_name) VALUES (211, 2, NULL, 'HA1500', 'Payroll'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_sub_modules (sub_mod_id, mod_id, parent_sub_mod_id, sub_mod_code, sub_mod_name) VALUES (212, 2, NULL, 'HA1600', 'Onboarding'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_sub_modules (sub_mod_id, mod_id, parent_sub_mod_id, sub_mod_code, sub_mod_name) VALUES (213, 2, NULL, 'HA1700', 'Holiday'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_sub_modules (sub_mod_id, mod_id, parent_sub_mod_id, sub_mod_code, sub_mod_name) VALUES (214, 2, NULL, 'HA1800', 'Satisfaction'); END TRY BEGIN CATCH END CATCH;

-- Other Submodules
BEGIN TRY INSERT INTO bos_sub_modules (sub_mod_id, mod_id, parent_sub_mod_id, sub_mod_code, sub_mod_name) VALUES (411, 4, NULL, 'SM1100', 'OCR'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_sub_modules (sub_mod_id, mod_id, parent_sub_mod_id, sub_mod_code, sub_mod_name) VALUES (111, 11, NULL, 'QM1100', 'Checklist'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_sub_modules (sub_mod_id, mod_id, parent_sub_mod_id, sub_mod_code, sub_mod_name) VALUES (112, 11, NULL, 'QM1200', 'Audit'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_sub_modules (sub_mod_id, mod_id, parent_sub_mod_id, sub_mod_code, sub_mod_name) VALUES (113, 11, NULL, 'QM1300', 'Meeting'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_sub_modules (sub_mod_id, mod_id, parent_sub_mod_id, sub_mod_code, sub_mod_name) VALUES (131, 13, NULL, 'S1100', 'Support Ticket'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_sub_modules (sub_mod_id, mod_id, parent_sub_mod_id, sub_mod_code, sub_mod_name) VALUES (141, 14, NULL, 'AD1100', 'Admin Hub'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_sub_modules (sub_mod_id, mod_id, parent_sub_mod_id, sub_mod_code, sub_mod_name) VALUES (142, 14, NULL, 'AD1200', 'BOS(S) Admin'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_sub_modules (sub_mod_id, mod_id, parent_sub_mod_id, sub_mod_code, sub_mod_name) VALUES (151, 15, NULL, 'DB1100', 'Dashboard'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_sub_modules (sub_mod_id, mod_id, parent_sub_mod_id, sub_mod_code, sub_mod_name) VALUES (161, 16, NULL, 'SC1100', 'Employee Self-Care'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_sub_modules (sub_mod_id, mod_id, parent_sub_mod_id, sub_mod_code, sub_mod_name) VALUES (171, 17, NULL, 'MATERIAL', 'Material'); END TRY BEGIN CATCH END CATCH;

SET IDENTITY_INSERT bos_sub_modules OFF;

SET IDENTITY_INSERT bos_pages ON;

-- Admin Pages (mod_id = 14)
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (4, 14, 141, 'AD1110', 'Company Profile', 1, '/admin/company-profile', 'IconBuildingSkyscraper'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (5, 14, 141, 'AD1120', 'Division Master (Units)', 1, '/admin/division', 'IconLayoutColumns'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (6, 14, 141, 'AD1130', 'User Credentials', 1, '/admin/user-credentials', 'IconUsers'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (7, 14, 141, 'AD1140', 'User Access', 1, '/admin/user-access', 'IconFingerprint'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (8, 14, 141, 'AD1150', 'Audit Trail', 1, '/admin/audit-trail', 'IconHistory'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (9, 14, 141, 'AD1160', 'User Session Analytics', 1, '/admin/session-analytics', 'IconTimeline'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (10, 14, 141, 'AD1170', 'File Traceability Hub', 1, '/admin/file-traceability-hub', 'IconFileAnalytics'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (11, 14, 142, 'AD1210', 'Business Authorization', 1, '/admin/business-authorization', 'IconShieldLock'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (12, 14, 142, 'AD1220', 'App Preference', 1, '/admin/preference-master', 'IconSettings'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (13, 14, 142, 'AD1230', 'Prefix/Suffix Credentials', 1, '/admin/prefix-credentials', 'IconSettings'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (14, 14, 142, 'AD1240', 'Session Monitoring', 1, '/admin/session-monitoring', 'IconActivity'); END TRY BEGIN CATCH END CATCH;

-- Dashboard Pages (mod_id = 15)
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (15, 15, 151, 'DB1110', 'Default', 1, '/dashboard/default', 'IconDashboard'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (16, 15, 151, 'DB1120', 'Analytics', 1, '/dashboard/analytics', 'IconTimeline'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (17, 15, 151, 'DB1130', 'Invoice', 1, '/dashboard/invoice', 'IconFileText'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (18, 15, 151, 'DB1140', 'CRM', 1, '/dashboard/crm', 'IconUsers'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (19, 15, 151, 'DB1150', 'Blog', 1, '/dashboard/blog', 'IconNotes'); END TRY BEGIN CATCH END CATCH;

-- HR & Admin Pages (mod_id = 2)
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (23, 2, 201, 'HA1110', 'Application Tracking System', 1, '/hra/ats/application', 'IconSearch'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (228, 2, 201, 'HA1120', 'Interview Process', 1, '/hra/ats/interview-process', 'IconUsers'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (229, 2, 201, 'HA1130', 'Interview Final Process', 1, '/hra/ats/interview-final-process', 'IconUserCheck'); END TRY BEGIN CATCH END CATCH;

-- Masters > QMS Pages (mod_id = 1)
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (31, 1, 11, 'M1110', 'Audit Type', 1, '/master/qms/audit/type', 'IconNotes'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (32, 1, 11, 'M1120', 'Audit Area / Zone', 1, '/master/qms/audit/area', 'IconMapPin'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (33, 1, 11, 'M1130', 'Audit Criteria', 1, '/master/qms/audit/criteria', 'IconShieldCheck'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (34, 1, 12, 'M1210', 'Check List Master', 1, '/master/qms/checklist/master', 'IconClipboardCheck'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (35, 1, 13, 'M1310', 'Meeting Master', 1, '/master/qms/meeting/master', 'IconCalendarEvent'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (36, 1, 13, 'M1320', 'Unnamed Page', 1, '/master/qms/meeting/unnamed', 'IconHelp'); END TRY BEGIN CATCH END CATCH;

-- Masters > HR Pages (mod_id = 1)
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (37, 1, 21, 'M2110', 'Interview Criteria Master', 1, '/master/hr/ats/interview-criteria', 'IconClipboardCheck'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (38, 1, 21, 'M2120', 'Email Content Master', 1, '/master/hr/ats/email-content', 'IconMessage2'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (39, 1, 21, 'M2130', 'Applicant Verification Criteria', 1, '/master/hr/ats/verification', 'IconShieldCheck'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (40, 1, 21, 'M2140', 'Induction Criteria', 1, '/master/hr/ats/induction-criteria', 'IconUserPlus'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (43001, 1, 21, 'M2180', 'Induction Round Master', 1, '/master/hr/ats/induction-round', 'IconSettings'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (44, 1, 22, 'M2210', 'Employee Master', 1, '/hra/employee/master', 'IconUserPlus'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (45, 1, 22, 'M2220', 'Employee Type', 1, '/master/hr/employee-type', 'IconTags'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (46, 1, 22, 'M2230', 'Department', 1, '/master/hr/department', 'IconBuilding'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (47, 1, 22, 'M2240', 'Designation', 1, '/master/hr/designation', 'IconBriefcase'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (48, 1, 22, 'M2250', 'Level', 1, '/master/hr/desg-level', 'IconHierarchy'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (49, 1, 22, 'M2260', 'Grade', 1, '/master/hr/grade', 'IconAward'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (50, 1, 22, 'M2270', 'Employee Satisfaction Criteria', 1, '/master/hr/satisfaction', 'IconAward'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (51, 1, 23, 'M2310', 'Holiday', 1, '/master/hr/payroll/holiday', 'IconCalendarEvent'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (52, 1, 23, 'M2320', 'Bank Details', 1, '/master/hr/payroll/bank', 'IconBuildingBank'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (53, 1, 23, 'M2330', 'Shift', 1, '/master/hr/payroll/shift', 'IconClock'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (54, 1, 23, 'M2340', 'Loan Master', 1, '/master/hr/payroll/loan', 'IconCoins'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (55, 1, 24, 'M2350', 'Leave Master', 1, '/master/hr/attendance/leave', 'IconCalendar'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (56, 1, 23, 'M2360', 'Permission Master', 1, '/master/hr/payroll/permission', 'IconLock'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (57, 1, 23, 'M2370', 'Petrol Allowance', 1, '/master/hr/payroll/petrol', 'IconGasStation'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (58, 1, 23, 'M2380', 'Policy Master', 1, '/master/hr/payroll/policy', 'IconFileText'); END TRY BEGIN CATCH END CATCH;

-- Masters > NPD Pages (mod_id = 1)
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (59, 1, 31, 'M3110', 'Product Item Group', 1, '/master/npd/product-group', 'IconCategory'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (60, 1, 31, 'M3120', 'Product Item Type', 1, '/master/npd/product-type', 'IconListCheck'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (61, 1, 31, 'M3130', 'Product Item Sub Type', 1, '/master/npd/product-subtype', 'IconNotes'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (62, 1, 31, 'M3140', 'Product OEM Master', 1, '/master/npd/product-oem', 'IconBuilding'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (63, 1, 31, 'M3150', 'Product OEM Mapping', 1, '/master/npd/product-oem-mapping', 'IconHierarchy'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (64, 1, 31, 'M3160', 'Product Model Master', 1, '/master/npd/product-model', 'IconSettings'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (65, 1, 31, 'M3170', 'Product Capacity Master', 1, '/master/npd/product-capacity', 'IconAward'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (66, 1, 31, 'M3180', 'Process Master', 1, '/master/npd/product-process', 'IconSettings'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (67, 1, 32, 'M3210', 'Wind Farm Master', 1, '/master/npd/wind-farm', 'IconRocket'); END TRY BEGIN CATCH END CATCH;

-- Masters > Vendor Pages (mod_id = 1)
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (68, 1, 41, 'M4110', 'Supplier Master', 1, '/sm/suppliers', 'IconTruckDelivery'); END TRY BEGIN CATCH END CATCH;

-- Masters > Sales Pages (mod_id = 1)
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (71, 1, 51, 'M5120', 'Contact Master', 1, '/sm/contacts', 'IconUsers'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (72, 1, 51, 'M5130', 'Customer Master', 1, '/sm/customers', 'IconBuilding'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (73, 1, 51, 'M5140', 'Customer Potential', 1, '/master/sales/crm/potential', 'IconChartBar'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (74, 1, 52, 'M5210', 'Payment Terms', 1, '/master/common/payment-terms', 'IconCreditCard'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (75, 1, 52, 'M5220', 'Delivery Terms', 1, '/master/common/delivery-terms', 'IconTruckDelivery'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (76, 1, 52, 'M5230', 'Currency', 1, '/master/accounts/currency', 'IconCoins'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (77, 1, 52, 'M5240', 'Unit of Measurement', 1, '/master/sales/logistics/uom', 'IconRuler2'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (78, 1, 52, 'M5250', 'Country Master', 1, '/master/common/country', 'IconWorld'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (79, 1, 52, 'M5260', 'State Master', 1, '/master/common/state', 'IconMapPin'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (80, 1, 52, 'M5270', 'Segment', 1, '/sm/ocr/segment-master', 'IconChartPie'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (81, 1, 52, 'M5280', 'Sub Segment', 1, '/sm/ocr/sub-segment-master', 'IconChartDonut'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (82, 1, 52, 'M5290', 'Mode of Despatch', 1, '/master/sales/logistics/despatch-mode', 'IconPlaneTilt'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (83, 1, 52, 'M5300', 'Freight', 1, '/master/sales/logistics/freight', 'IconTractor'); END TRY BEGIN CATCH END CATCH;

-- QMS Transactions Pages (mod_id = 11)
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (87, 11, 111, 'QM1110', 'Checklist Verify', 1, '/qms/checklist/verify', 'IconChecks'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (88, 11, 111, 'QM1120', 'Close Checklist / Renewal', 1, '/qms/checklist/close-renewal', 'IconFileCheck'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (89, 11, 111, 'QM1130', 'Checklist / Renewal Verify', 1, '/qms/checklist/renewal-verify', 'IconShieldCheck'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (90, 11, 111, 'QM1140', 'Checklist / Renewal Report', 1, '/qms/checklist/renewal-report', 'IconReport'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (91, 11, 112, 'QM1210', 'Audit Schedule', 1, '/qms/audit/schedule', 'IconCalendarEvent'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (92, 11, 112, 'QM1220', 'Audit User Attendance', 1, '/qms/audit/attendance', 'IconUserCheck'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (93, 11, 112, 'QM1230', 'Audit Observation', 1, '/qms/audit/observation', 'IconReportAnalytics'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (94, 11, 112, 'QM1240', 'Close NCR / OFI', 1, '/qms/audit/ncr/close', 'IconFileCheck'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (95, 11, 112, 'QM1250', 'Audit NCR / OFI Approval', 1, '/qms/audit/ncr/approval', 'IconShieldCheck'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (96, 11, 112, 'QM1260', 'Audit Report', 1, '/qms/audit/report', 'IconReport'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (97, 11, 113, 'QM1310', 'Meeting Schedule', 1, '/qms/meeting-schedule', 'IconCalendarEvent'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (98, 11, 113, 'QM1320', 'Meeting User Attendance', 1, '/qms/meeting-attendance', 'IconUserCheck'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (99, 11, 113, 'QM1330', 'Minutes of Meeting', 1, '/qms/minutesofmeeting', 'IconNotes'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (100, 11, 113, 'QM1340', 'Close MOM', 1, '/qms/close-mom', 'IconFileCheck'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (101, 11, 113, 'QM1350', 'MOM Approval', 1, '/qms/mom-approval', 'IconShieldCheck'); END TRY BEGIN CATCH END CATCH;

-- Support Pages (mod_id = 13)
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (102, 13, 131, 'S1110', 'Support Ticket', 1, '/support/ticket', 'IconHelp'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (103, 13, 131, 'S1120', 'Raised For Me', 1, '/support/raised-for-me', 'IconInbox'); END TRY BEGIN CATCH END CATCH;

-- Sales & Marketing Pages (mod_id = 4)
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (104, 4, 411, 'SM1110', 'Enquiry Dashboard', 1, '/sm/enquiry/dashboard', 'IconDashboard'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (105, 4, 411, 'SM1120', 'Enquiry', 1, '/sm/enquiries', 'IconListCheck'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (106, 4, 411, 'SM1130', 'Price Master', 1, '/sm/price-master', 'IconReport'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (107, 4, 411, 'SM1140', 'Quotation', 1, '/sm/quotations', 'IconReport'); END TRY BEGIN CATCH END CATCH;

-- QMS Satisfaction Feedback Pages
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (111, 11, 111, 'QM1510', 'Satisfaction Feedback Entry', 1, '/qms/satisfaction/feedback', 'IconMoodSmile'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (112, 11, 111, 'QM1520', 'Employee Satisfaction Dashboard', 1, '/qms/satisfaction/dashboard', 'IconTimeline'); END TRY BEGIN CATCH END CATCH;

-- Dashboard Unified Page
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (113, 15, 151, 'DB1170', 'Unified Work Dashboard', 1, '/dashboard/user-task-queue', 'IconClipboardList'); END TRY BEGIN CATCH END CATCH;

-- ==================== NEW STANDARD PAGES ====================

-- Employee Self Care Pages (mod_id = 16)
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (114, 16, 161, 'SC1410', 'Permission Request', 1, '/sc/permission-request', 'IconClock'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (115, 16, 161, 'ESC1010', 'Leave Application Form', 1, '/employee-self-care/leave-application', 'IconCalendarEvent'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (116, 16, 161, 'ESC1020', 'Leave Travel Application', 1, '/employee-self-care/leave-travel', 'IconPlaneDeparture'); END TRY BEGIN CATCH END CATCH;

-- Missing Admin Tools (mod_id = 14)
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (117, 14, 142, 'AD1180', 'Old Data Migration', 1, '/admin/data-migration', 'IconDatabaseExport'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (118, 14, 141, 'AD1190', 'Organization Chart', 1, '/admin/organization-chart', 'IconUsers'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (119, 14, 142, 'AD1250', 'Payroll Config & Engine', 1, '/admin/payroll-workspace', 'IconFileAnalytics'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (120, 14, 142, 'AD1270', 'Automation Designer', 1, '/admin/automation-designer', 'IconSettings'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (121, 14, 141, 'AD1260', 'PDF Template Designer', 1, '/admin/pdf-designer', 'IconLayoutColumns'); END TRY BEGIN CATCH END CATCH;

-- Missing HRA Pages (mod_id = 2)
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (122, 2, 213, 'HA1210', 'My Holiday Requests', 1, '/hra/holiday/my-requests', 'IconCalendarEvent'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (123, 2, 213, 'HA1220', 'Manager Holiday Approvals', 1, '/hra/holiday/manager-approvals', 'IconCalendarCheck'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (124, 2, 213, 'HA1230', 'HR Holiday Approvals', 1, '/hra/holiday/hr-approvals', 'IconCalendarCheck'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (125, 2, 213, 'HA1250', 'Holiday Yearly Summary', 1, '/hra/holiday/yearly-summary', 'IconReport'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (126, 2, 213, 'HA1240', 'Holiday Calendar Report', 1, '/hra/holiday/calendar-report', 'IconCalendar'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (127, 2, 213, 'HA1320', 'Holiday Master', 1, '/hra/holiday/holiday-master', 'IconCalendarStats'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (128, 2, 202, 'HA1280', 'Employee Transfer', 1, '/hra/employee/transfer', 'IconRotate2'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (129, 2, 202, 'HA1285', 'Employee Memo List', 1, '/hra/employee/memo-list', 'IconNotebook'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (130, 2, 211, 'HA1290', 'Penalty', 1, '/hra/payroll/penalty', 'IconAlertTriangle'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (131, 2, 203, 'HA1310', 'Permission Entry', 1, '/hra/attendance/permission-entry', 'IconClock'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (132, 2, 203, 'HA1330', 'OD Entry', 1, '/hra/attendance/od-entry', 'IconClock'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (133, 2, 203, 'HA1340', 'Biometric Attendance', 1, '/hra/attendance-salary/biometric-attendance', 'IconClock'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (134, 2, 203, 'HA1341', 'Shift Master', 1, '/hra/attendance-salary/shift-master', 'IconClock'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (135, 2, 214, 'HA1350', 'Employee Satisfaction Dashboard', 1, '/hra/satisfaction/dashboard', 'IconDashboard'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (136, 2, 214, 'HA1365', 'Vendor Satisfaction Dashboard', 1, '/hra/satisfaction/vendor-dashboard', 'IconDashboard'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (137, 2, 214, 'HA1375', 'Customer Satisfaction Dashboard', 1, '/hra/satisfaction/customer-dashboard', 'IconDashboard'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (138, 2, 214, 'HA1385', 'Internal Customer Satisfaction Dashboard', 1, '/hra/satisfaction/internal-customer-dashboard', 'IconDashboard'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (139, 2, 212, 'HA1360', 'Offer Letter', 1, '/hra/onboarding/offer-letter', 'IconFileText'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (140, 2, 212, 'HA1370', 'Appointment Order', 1, '/hra/onboarding/appointment-order', 'IconFileCertificate'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (141, 2, 212, 'HA1380', 'Confirmation Order', 1, '/hra/onboarding/confirmation-order', 'IconFileCheck'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (142, 2, 212, 'HA1390', 'Relieving Order', 1, '/hra/onboarding/relieving-order', 'IconFileExport'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (143, 2, 210, 'HA1410', 'Induction Pending', 1, '/hra/ats/induction-assignment', 'IconCalendarEvent'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (144, 2, 210, 'HA1420', 'Induction Training', 1, '/hra/ats/induction-training', 'IconClipboardCheck'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (145, 2, 210, 'HA1430', 'Induction Trainee', 1, '/hra/ats/induction-trainee', 'IconUserCheck'); END TRY BEGIN CATCH END CATCH;

-- Masters Maintenance (mod_id = 1)
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (158, 1, 18, 'M1410', 'EB Slab', 1, '/master/maintenance/eb-slab', 'IconTool'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (159, 1, 18, 'M1420', 'EB Meter', 1, '/master/maintenance/eb-meter', 'IconTool'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (160, 1, 18, 'M1430', 'EB Power Consumption', 1, '/master/maintenance/eb-power-consumption', 'IconTool'); END TRY BEGIN CATCH END CATCH;

-- Masters Product (mod_id = 1)
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (161, 1, 31, 'M3115', 'Product Master', 1, '/master/npd/product-master', 'IconSettings'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (162, 1, 31, 'M3190', 'Product IPP Master', 1, '/master/npd/product-ipp', 'IconCopy'); END TRY BEGIN CATCH END CATCH;

-- Order Module (mod_id = 17)
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (163, 17, 171, 'OM1000', 'Visitor Pass', 1, '/order/material/visitor-pass', 'IconFileCheck'); END TRY BEGIN CATCH END CATCH;

-- Group Collapse Page Codes
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (146, 1, 11, 'M1100', 'Audit Collapse', 1, NULL, NULL); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (147, 1, 12, 'M1200', 'Checklist Collapse', 1, NULL, NULL); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (148, 1, 13, 'M1300', 'Meeting Collapse', 1, NULL, NULL); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (149, 1, 18, 'M1400', 'Maintenance Collapse', 1, NULL, NULL); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (150, 1, 21, 'M2100', 'ATS Collapse', 1, NULL, NULL); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (151, 1, 22, 'M2200', 'Employee Collapse', 1, NULL, NULL); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (152, 1, 23, 'M2300', 'Common Collapse', 1, NULL, NULL); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (153, 1, 24, 'M2400', 'Attendance Collapse', 1, NULL, NULL); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (154, 11, 111, 'QM1100', 'Checklist Trans Collapse', 1, NULL, NULL); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (155, 11, 112, 'QM1200', 'Audit Trans Collapse', 1, NULL, NULL); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (156, 11, 113, 'QM1300', 'Meeting Trans Collapse', 1, NULL, NULL); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (157, 1, 114, 'QM1400', 'Loan Trans Collapse', 1, NULL, NULL); END TRY BEGIN CATCH END CATCH;

-- ==================== NEW MIGRATION PAGES ====================
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (170, 1, 31, 'M3220', 'HSN Master', 1, '/master/npd/hsn-master', 'IconSettings'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (171, 1, 31, 'M3310', 'Material Type', 1, '/master/npd/material-type', 'IconSettings'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (172, 1, 31, 'M3320', 'Material Grade', 1, '/master/npd/material-grade', 'IconSettings'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (173, 1, 31, 'M3330', 'Shape Master', 1, '/master/npd/shape-master', 'IconSettings'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (174, 1, 31, 'M3230', 'Inventory Type', 1, '/master/npd/inventory-type', 'IconSettings'); END TRY BEGIN CATCH END CATCH;

BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (175, 11, 113, 'QM1360', 'MOM Summary Report', 1, '/qms/mom-summary-report', 'IconReport'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (176, 11, 113, 'QM1370', 'MOM Attendance Report', 1, '/qms/mom-attendance-report', 'IconReport'); END TRY BEGIN CATCH END CATCH;

BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (177, 1, 32, 'AD1410', 'Release Notes Manager', 1, '/master/admin/release-notes', 'IconClipboardText'); END TRY BEGIN CATCH END CATCH;

BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (178, 2, 203, 'HA1315', 'Permission Verification', 1, '/hra/attendance/permission-verification', 'IconClipboardCheck'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (179, 2, 203, 'HA1342', 'On Duty Verification', 1, '/hra/attendance/od-verification', 'IconClipboardCheck'); END TRY BEGIN CATCH END CATCH;

BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (180, 2, 203, 'M2390', 'Leave Entry', 1, '/hra/attendance/leave-entry', 'IconCalendarEvent'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (181, 2, 203, 'M2392', 'Leave Verification', 1, '/hra/attendance/leave-verification', 'IconClipboardCheck'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (182, 2, 203, 'M2393', 'Leave Configuration', 1, '/hra/attendance/leave-config', 'IconSettings'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (183, 2, 203, 'M2394', 'LTA Verification', 1, '/hra/attendance/lta-verification', 'IconClipboardCheck'); END TRY BEGIN CATCH END CATCH;

-- Asset Pages (mod_id = 1, sub_mod_id = 70)
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (184, 1, 70, 'HR_AST', 'Asset Collapse', 1, NULL, NULL); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (185, 1, 70, 'HR_AST_01', 'Asset Group', 1, '/master/hr/asset/group', 'IconReportAnalytics'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (186, 1, 70, 'HR_AST_02', 'Asset Type', 1, '/master/hr/asset/type', 'IconReportAnalytics'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (187, 1, 70, 'HR_AST_03', 'Asset Sub Type', 1, '/master/hr/asset/subtype', 'IconReportAnalytics'); END TRY BEGIN CATCH END CATCH;

-- QMT Pages (mod_id = 1, sub_mod_id = 60)
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (188, 1, 60, 'M3500', 'QMT Collapse', 1, NULL, NULL); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (189, 1, 60, 'M3510', 'Machine Category Master', 1, '/master/qmt/machine-category', 'IconCategory'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (190, 1, 60, 'M3520', 'Machine Master', 1, '/master/qmt/machine', 'IconCpu'); END TRY BEGIN CATCH END CATCH;

-- Loan Pages (Standardized)
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (191, 1, 114, 'QM1410', 'Loan Apply', 1, '/employee-self-care/loan-apply', 'IconFileInvoice'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (192, 2, 211, 'QM1420', 'Loan Verification', 1, '/hra/payroll/loan-verification', 'IconShieldCheck'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (193, 2, 211, 'QM1430', 'HRA Loan Issues', 1, '/hra/payroll/loan-issue', 'IconCoin'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (194, 2, 211, 'QM1440', 'Loan Short Close', 1, '/hra/payroll/loan-short-close', 'IconCircleX'); END TRY BEGIN CATCH END CATCH;

-- Leave Encashment Pages
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (195, 2, 211, 'HA1294', 'Leave Encashment Entry', 1, '/hra/payroll/leave-encashment-entry', 'IconCash'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (196, 16, 161, 'ESC1050', 'Leave Encashment Apply', 1, '/employee-self-care/leave-encashment-entry', 'IconCash'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (197, 2, 211, 'HA1295', 'Leave Encashment Verified', 1, '/hra/payroll/leave-encashment-verified', 'IconCoins'); END TRY BEGIN CATCH END CATCH;

-- Attendance Entry (HA1345)
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (198, 2, 203, 'HA1345', 'Attendance Entry', 1, '/hra/attendance/attendance-entry', 'IconClipboardCheck'); END TRY BEGIN CATCH END CATCH;

-- Inventory Reports Pages
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (199, 1, 31, 'INV1001', 'Current Stock Report', 1, '/reports/inventory/current-stock', 'IconCategory'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (200, 1, 31, 'INV1002', 'Stock Ledger Report', 1, '/reports/inventory/stock-ledger', 'IconFileText'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (201, 1, 31, 'INV1003', 'Rejection Stock Report', 1, '/reports/inventory/rejection-stock', 'IconCircleX'); END TRY BEGIN CATCH END CATCH;
BEGIN TRY INSERT INTO bos_pages (page_id, mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (202, 1, 31, 'INV1004', 'Stock Movement Report', 1, '/reports/inventory/stock-movement', 'IconTimeline'); END TRY BEGIN CATCH END CATCH;

SET IDENTITY_INSERT bos_pages OFF;

-- Grant default full access to all existing users for all pages (with TRY-CATCH to avoid duplicate permissions issue)
BEGIN TRY
    INSERT INTO bos_user_page_auth (user_id, page_id, sub_mod_id, mod_id, enable, read_acs, [write], delete_acs, export, approval, manager, additional1, additional2, add_task_enable)
    SELECT 
        u.user_id, 
        p.page_id, 
        p.sub_mod_id, 
        p.mod_id, 
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1
    FROM bos_pages p
    CROSS JOIN ad_user_credential u
    WHERE NOT EXISTS (
        SELECT 1 FROM bos_user_page_auth a 
        WHERE a.user_id = u.user_id AND a.page_id = p.page_id
    );
END TRY
BEGIN CATCH
END CATCH;

COMMIT TRANSACTION;


