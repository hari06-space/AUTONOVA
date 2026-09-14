# 📌 Database Migration Version Registry

Before creating a new database migration script, you **MUST** claim a version number from this file to prevent duplicates.

---

## 🚦 How to Claim a Version Number

1. Open this file (`NEXT_VERSION.md`) in your branch.
2. Read the **Last Claimed Version** below.
3. Choose the next sequential version number.
4. Add a new row to the **Claim Registry** table below with your name, date, and description.
5. Commit this file **FIRST** as a single commit and push it. This ensures if anyone else is working, they will see a merge conflict immediately if they tried to claim the same version.
6. Create your migration script in `dbscripts/` named `2026MMDD_V<YourVersion>.0__Description.sql`.


## 🔢 Current Status
 
* **Last Claimed Version:** `V1227.0`
* **Next Available Version:** `V1228.0`
 
---
 
## 📋 Claim Registry (Claimed Versions)
 
| Version | Developer | Date claimed | PR / Feature Description | Status |
| :--- | :--- | :--- | :--- | :--- |
| **V1226.0** | Nutech | 2026-09-03 | Add Single Active Session configuration, session tracking fields, and performance indexes | 🏗️ In Progress |
| **V1227.0** | Yuvanesh M | 2026-09-01 | Drop unused STATUS_ID column, drop FK constraint and rebuild composite index on STATUS in HRA_OFFER_LETTERS | 🏗️ In Progress |
| **V1226.0** | Yuvanesh M | 2026-09-01 | Normalize HRA_OFFER_LETTERS schema, add NOTICE_PERIOD, drop obsolete company and demographic columns (HA1360) | 🏗️ In Progress |
| **V1225.0** | Nutech | 2026-09-02 | Set DOC_SEARCH_DOCUMENT REF_ID to ITEM_NO for NPD product attachments | 🏗️ In Progress |
| **V1225.0** | Logaraj S | 2026-09-01 | Unify HRA_OFFER_LETTERS status into single STATUS BIGINT referencing AD_STATUS_MASTER (renumbered from V1216.0) | 🏗️ In Progress |
| **V1224.0** | Nutech | 2026-09-02 | Create DOC_SEARCH_DOCUMENT table and register Document Search page DM1010 | 🏗️ In Progress |
| **V1224.0** | Logaraj S | 2026-09-01 | Remove unused HRA_OFFER_LETTERS columns (REPORTING_MANAGER_ID, REPORTING_MANAGER, COMPANY_GSTIN, APPROVAL_COMMENTS) (renumbered from V1215.0) | 🏗️ In Progress |
| **V1223.0** | Nutech | 2026-09-01 | Align BOM Tables Structure and Schedule IDs | 🏗️ In Progress |
| **V1223.0** | Logaraj S | 2026-09-01 | Optimize HRA_OFFER_LETTERS schema, add typed snapshot columns, STATUS_ID FK, optimistic locking and backfill (renumbered from V1214.0) | 🏗️ In Progress |
| **V1222.0** | Logaraj S | 2026-09-01 | Add covering nonclustered index on HRA_OFFER_LETTERS (HA1360) (renumbered from V1213.0) | 🏗️ In Progress |
| **V1222.0** | Antigravity | 2026-09-01 | Add DIVISION, PRODUCT_ID, and DESCRIPTION columns to BOM tables for legacy data mapping | 🏗️ In Progress |
| **V1221.0** | Nutech | 2026-08-31 | Add Process Cost to BOM Process table | 🏗️ In Progress |
| **V1220.0** | Nutech | 2026-08-31 | Drop Norms and Quality columns from BOM Process table | 🏗️ In Progress |
| **V1219.0** | Nutech | 2026-08-31 | Add Auto GIR and QC columns to BOM Process table | 🏗️ In Progress |
| **V1218.0** | Nutech | 2026-08-31 | Alter BOM Process and Material tables for machine group, alternate materials and priority | 🏗️ In Progress |
| **V1217.0** | Antigravity | 2026-08-31 | Redesign Product BOM into process-centric Routing | 🏗️ In Progress |
| **V1216.0** | Antigravity | 2026-08-31 | Remove Product BOM and Product Process tables and pages | 🏗️ In Progress |
| **V1212.0** | Antigravity | 2026-08-30 | Add REF_INVOICE_NO, REF_INVOICE_DATE, REF_DC_NOS, DC_STATUS to SM_INVOICE_HEADER for DC-to-Invoice workflow | 🏗️ In Progress |
| **V1211.0** | Antigravity | 2026-08-30 | Add Delivery Receipt (DC) docType support, SM1190 page registration, and DC prefix configuration | 🏗️ In Progress |
| **V1210.0** | Antigravity | 2026-08-30 | Register Sales Invoice (SM1180) & Customer Order (SM1160) Pages & Seed Permissions | 🏗️ In Progress |
| **V1209.0** | Nutech | 2026-08-29 | Add FACE_TEMPLATE_VERSION column to AD_USER_CREDENTIAL for face auth hardening | 🏗️ In Progress |
| **V1208.0** | Antigravity | 2026-08-29 | Add QMS Audit Observation Performance Indexes | 🏗️ In Progress |
| **V1207.0** | Antigravity | 2026-08-29 | Add QMS Audit vs Actual Performance Indexes | 🏗️ In Progress |
| **V1206.0** | Antigravity | 2026-08-29 | Add Notification Performance Indexes | 🏗️ In Progress |
| **V1205.0** | Antigravity | 2026-08-28 | Fix HR_EMPLOYEE ATS Text Status to AD_STATUS_MASTER ID (NumberFormatException fix) | 🏗️ In Progress |
| **V1204.0** | Antigravity | 2026-08-28 | Register Audit Score Report Page (QM1270) & Seed Permissions | 🏗️ In Progress |
| **V1202.0** | Antigravity | 2026-08-27 | Standardize Planning & Purchase Procurement Statuses | 🏗️ In Progress |
| **V1174.0** | Antigravity | 2026-08-27 | Purge and remove mock/placeholder seed data (Zero Mock Data Policy) | 🏗️ In Progress |
| **V1173.0** | Antigravity | 2026-08-26 | Add 6-Digit Company Code Support and Indexing on AD_COMPANY_CREDENTIAL | 🏗️ In Progress |
| **V1171.0** | Antigravity | 2026-08-26 | Set default ribbon layout to Standard (classic) | 🏗️ In Progress |
| **V1170.0** | Antigravity | 2026-08-24 | Add High Concurrency & Multi-User Performance Indexes | 🏗️ In Progress |
| **V1169.0** | Antigravity | 2026-08-24 | Register Product 360 and Inventory Intelligence Dashboard (DB1500) | 🏗️ In Progress |
| **V1145.0** | Antigravity | 2026-08-20 | Migrate ATS business statuses to AD_STATUS_MASTER IDs | 🏗️ In Progress |
| **V1144.0** | Antigravity | 2026-08-19 | Add Extra Fields to AD_DIVISION | 🏗️ In Progress |
| **V1143.0** | Antigravity | 2026-08-19 | Add DIVISION to NPD_PROCESS | 🏗️ In Progress |
| **V1142.0** | Antigravity | 2026-08-19 | Add PROCESS_CD to NPD_PROCESS | 🏗️ In Progress |
| **V1141.0** | Antigravity | 2026-08-14 | Remove ATS email templates seeding from HR_EMAIL_CONTENT | 🏗️ In Progress |
| **V1140.0** | Antigravity | 2026-08-14 | Drop Incoming and Remaining Inspection Tables | 🏗️ In Progress |
| **V1139.0** | Antigravity | 2026-08-13 | Drop constraint and column IS_DELETED from QMS_AUDIT_SCHEDULE | 🏗️ In Progress |
| **V1123.0** | Antigravity | 2026-08-06 | Add non-clustered index on VERIFY_STATUS column in QMS_CHECKLIST_MASTER table | 🏗️ In Progress |
| **V1122.0** | Antigravity | 2026-08-06 | Add index on CREATED_DATE, CHECKLIST_DATE, and ASSIGNED_DATE to QMS_CHECKLIST_CLOSED table | 🏗️ In Progress |
| **V1097.0** | Antigravity | 2026-08-01 | Create SM_CUST_ADD_CHARGES table | 🏗️ In Progress |
| **V1089.0** | Antigravity | 2026-07-30 | Create HR_EMPLOYEE_SALARY_COMPONENT_LOG table | 🏗️ In Progress |
| **V1088.0** | Antigravity | 2026-07-30 | Create HR_EMPLOYEE_SALARY_COMPONENT table | 🏗️ In Progress |
| **V1087.0** | Antigravity | 2026-07-30 | Remove CTC Structure and clean Job Profile dynamic components | 🏗️ In Progress |
| **V1075.0** | Antigravity | 2026-07-27 | Alter description length for HR_VERIFICATION_CRITERIA to NVARCHAR(MAX) | 🏗️ In Progress |
| **V1074.0** | Antigravity | 2026-07-27 | Add indexes to Employee Master tables | 🏗️ In Progress |
| **V1073.0** | Antigravity | 2026-07-27 | Create QMS_AUDIT_SCHEDULER_LOG Table | 🏗️ In Progress |
| **V1072.0** | Antigravity | 2026-07-27 | Create QMS_AUDIT_SCHEDULER_CONFIG Table | 🏗️ In Progress |
| **V1061.0** | Antigravity | 2026-07-27 | Create performance indexes for HR_INTERVIEW, HR_INTERVIEW_DEPARTMENT_MAPPING, and HR_INTERVIEW_LEVEL_MAPPING | 🏗️ In Progress |
| **V1049.0** | Antigravity | 2026-07-23 | Performance indexes on QMS_CLOSE_MOM_AND_VERIFY and QMS_MOM_DETAILS | 🏗️ In Progress |
| **V1025.0** | Antigravity | 2026-07-17 | Register City Master Page | 🏗️ In Progress |
| **V1016.0** | Antigravity | 2026-07-16 | Checklist Scheduler Enterprise Compliance | 🏗️ In Progress |
| **V1015.0** | Antigravity | 2026-07-15 | Seed baseline departments into HR_DEPARTMENT | 🏗️ In Progress |
| **V1014.0** | Antigravity | 2026-07-15 | Seed baseline designations into HR_DESIGNATION | 🏗️ In Progress |
| **V1013.0** | Antigravity | 2026-07-15 | Alter YOURS_WINDFULLY in HR_EMAIL_CONTENT to be Nullable | 🏗️ In Progress |
| **V1012.0** | Antigravity | 2026-07-04 | Alter STATUS column in NPD_ITEM_GROUP to NVARCHAR(20) | 🏗️ In Progress |
| **V442.0** | Antigravity | 2026-07-15 | Clean up mock employees and replace Java DataSeeder with SQL seeding | 🏗️ In Progress |
| **V435.0** | Antigravity | 2026-07-13 | Restore Checklist Mutated Templates - Phase 2 | 🏗️ In Progress |
| **V434.0** | Antigravity | 2026-07-13 | Restore Checklist Mutated Templates | 🏗️ In Progress |
| **V433.0** | Developer | 2026-07-13 | Drop Audit Schedule Type Columns | ✅ Completed |
| **V432.0** | Antigravity | 2026-07-13 | Promote user DARSHAN to Admin (1) for widget access | 🏗️ In Progress |
| **V431.0** | Antigravity | 2026-07-13 | Deduplicate MOM and add unique SCHEDULE_ID constraint | 🏗️ In Progress |
| **V430.0** | Developer | 2026-07-11 | Drop Date Month From Leave Entry Correct | ✅ Completed |
| **V429.0** | Antigravity | 2026-07-13 | Restore Checklist Mutated Templates (Deprecated) | 🏗️ In Progress |
| **V428.0** | Developer | 2026-07-11 | Drop Checklist Manual Trigger Log | ✅ Completed |
| **V426.0** | Antigravity | 2026-07-11 | Seed Pending Status in Status Master | 🏗️ In Progress |
| **V425.0** | Antigravity | 2026-07-11 | Update Checklist assigned_by to Super Boss | 🏗️ In Progress |
| **V410.0** | Antigravity | 2026-07-06 | Drop QMS Checklist Master triggers if any | 🏗️ In Progress |
| **V1011.0** | Antigravity | 2026-07-03 | Restructure Asset Master constraints referencing new active tables | 🏗️ In Progress |
| **V1010.0** | Antigravity | 2026-07-02 | Cleanup seeded countries from MST_COUNTRY | 🏗️ In Progress |
| **V1009.0** | Antigravity | 2026-07-02 | Seed MST_COUNTRY table with standard countries and phone length rules | 🏗️ In Progress |
| **V1008.0** | Antigravity | 2026-07-02 | Alter MST_COUNTRY table structure and add code, min/max length, ISO columns | 🏗️ In Progress |
| **V384.0** | Antigravity | 2026-07-01 | Rename Asset page codes to M2500, M2510, M2520, M2530 | 🏗️ In Progress |
| **V376.0** | Antigravity | 2026-06-29 | Create HR_ATTENDANCE_DAILY_LOG table and register page HA1345 | 🏗️ In Progress |
| **V375.0** | Antigravity | 2026-06-27 | Add PENDING_ACTIVATION column to Checklist Assignment table | 🏗️ In Progress |
| **V374.0** | Antigravity | 2026-06-27 | Add DUAL_CHECK columns to Checklist Assignment and Closed tables | ✅ Completed |
| **V373.0** | Antigravity | 2026-06-27 | Make Loan Limits Nullable | ✅ Completed |
| **V368.0** | Antigravity | 2026-06-26 | Add missing restore_enable_days column to AD_COMPANY_CREDENTIAL | 🏗️ In Progress |
| **V367.0** | Antigravity | 2026-06-26 | Create Product Bundle Module | 🏗️ In Progress |
| **V366.0** | Antigravity | 2026-06-25 | Seed 'Inactive' status in AD_STATUS_MASTER for checklist assignment deactivation | 🏗️ In Progress |
| **V365.0** | Antigravity | 2026-06-25 | Fix page code for Master Checklist attachments from QM1110 to M1210 | 🏗️ In Progress |
| **V352.0** | Antigravity | 2026-06-24 | Enhance Machine Category Master with ID and new validations | 🏗️ In Progress |
| **V349.0** | Antigravity | 2026-06-24 | Register HA1294 and ESC1050 Leave Encashment Entry pages and grant access | 🏗️ In Progress |
| **V348.0** | Antigravity | 2026-06-24 | Add verification/rejection fields to Leave Encashment table | 🏗️ In Progress |
| **V347.0** | Antigravity | 2026-06-24 | Migrate Product Master Data from items to NPD_PRODUCT_MASTER | ✅ Completed |
| **V347.0** | Antigravity | 2026-06-23 | Create HRA_LEAVE_ENCASHMENT_VERIFIED table and register Page HA1295 | 🏗️ In Progress |
| **V346.0** | Antigravity | 2026-06-24 | QMS Checklist, Audit, Meeting search optimizations with FTS & pagination - Fix | ✅ Completed |
| **V345.0** | Antigravity | 2026-06-24 | QMS Checklist, Audit, Meeting search optimizations with FTS & pagination | ✅ Completed |
| **V344.0** | Antigravity | 2026-06-24 | Fix Npd Product Master Pk And Bom Tables | ✅ Completed |
| **V343.0** | Antigravity | 2026-06-23 | Fix mixed-case FK and Index on HR_LEAVE_TRANSACTION: FK_LeaveTransaction_Employee → FK_HR_LEAVE_TRANSACTION_EMPLOYEE_ID, IX_LeaveTransaction_Employee → IX_HR_LEAVE_TRANSACTION_EMPLOYEE_ID | ✅ Completed |
| **V342.0** | Antigravity | 2026-06-23 | Add Three Fmea Ppap Masters | ✅ Completed |
| **V341.0** | Antigravity | 2026-06-23 | Add Seven Npd Process Masters | ✅ Completed |
| **V340.0** | Antigravity | 2026-06-23 | Seed Satisfaction Mappings for All | ✅ Completed |
| **V339.0** | Antigravity | 2026-06-23 | Reset Employee Satisfaction Mapping for Testing | ✅ Completed |
| **V338.0** | Antigravity | 2026-06-23 | Map Admin User to Employee Record | ✅ Completed |
| **V337.0** | Antigravity | 2026-06-23 | Add Cohort Group to Employee Satisfaction Mapping | ✅ Completed |
| **V336.0** | Antigravity | 2026-06-23 | Add Is Active to QMS Audit Schedule | ✅ Completed |
| **V335.0** | Antigravity | 2026-06-23 | Leave Module Enterprise DB Naming Standards: Rename remaining lowercase foreign keys to uppercase | ✅ Completed |
| **V334.0** | Antigravity | 2026-06-23 | Leave Module Enterprise DB Naming Standards: Rename lowercase columns (lop, travel application columns) to uppercase | ✅ Completed |
| **V333.0** | Antigravity | 2026-06-23 | Leave Module Enterprise DB Naming Standards: Explicit @Column(name=ID), rename PKs/FKs/UQs/Indexes to SOP convention | ✅ Completed |
| **V332.0** | Antigravity | 2026-06-23 | Drop legacy columns DATE and MONTH from HR_LEAVE_ENTRY | ✅ Completed |
| **V331.0** | Antigravity | 2026-06-23 | Normalize HR_LEAVE_TRAVEL_APPLICATION attachments to use HR_ATTACHMENT_PATH instead of FILE_PATHS column | 🏗️ In Progress |
| **V330.0** | Antigravity | 2026-06-23 | Refactor Leave Entry attachments to use HR_ATTACHMENT_PATH instead of FILE_PATHS column / drop HR_LEAVE_ENTRY_FILE_MAPPING | 🏗️ In Progress |
| **V329.0** | Antigravity | 2026-06-23 | Simplify HR_LEAVE_MASTER (drop WFH balance tracking, PREV_* columns, IS_ACTIVE column) | ✅ Completed |
| **V327.0** | Antigravity | 2026-06-23 | Remove SO and COff from leave master | ✅ Completed |
| **V326.0** | Antigravity | 2026-06-22 | Relocate Leave Master page M2350 to Master -> HR -> Attendance | 🏗️ In Progress |
| **V325.0** | Antigravity | 2026-06-22 | Alter QMS_MEETING_MASTER STATUS to BIGINT to match JPA statusObj | 🏗️ In Progress |
| **V319.0** | Antigravity | 2026-06-22 | Register missing Leave and LTA pages in HRA module | ✅ Completed |
| **V318.0** | Antigravity | 2026-06-22 | Recreate missing QMS_CHECKLIST_MASTER_LEVEL_MAPPING table | ✅ Completed |
| **V313.0** | Antigravity | 2026-06-20 | Fix company credential createdBy constraint by backfilling default SYSTEM value | 🏗️ In Progress |
| **V302.0** | Antigravity | 2026-06-20 | Alter QMS_CHECKLIST_ASSIGNMENT and QMS_CHECKLIST_CLOSED REMARKS column length to NVARCHAR(255) | ✅ Completed |
| **V301.0** | Antigravity | 2026-06-20 | Add Checklist Assignee Hierarchy columns to Master Checklist | ✅ Completed |
| **V300.0** | Antigravity | 2026-06-20 | Add Checklist Scheduler Reassignment Columns | ✅ Completed |
| **V299.0** | Antigravity | 2026-06-20 | Mark induction completed and enable employee abilities | ✅ Completed |
| **V298.0** | Antigravity | 2026-06-20 | Mark all inductions completed in HR_EMPLOYEE | ✅ Completed |
| **V297.0** | Antigravity | 2026-06-20 | Add Audit Schedule prefix fields and database settings columns | ✅ Completed |
| **V296.0** | Antigravity | 2026-06-20 | Grant Admin full access to all pages | ✅ Completed |
| **V295.0** | Antigravity | 2026-06-20 | Drop unused QMS checklist assignment files and mapping tables | ✅ Completed |
| **V294.0** | Antigravity | 2026-06-20 | Recreate QMS_CHECKLIST_MASTER_LEVEL_MAPPING table | ✅ Completed |
| **V293.0** | Antigravity | 2026-06-20 | Simplify HR Induction status values and clean up legacy records | ✅ Completed |
| **V292.0** | Antigravity | 2026-06-20 | Drop duplicate HR_SATISFACTION_CRITERIA table and clean up redundant code | ✅ Completed |
| **V291.0** | Antigravity | 2026-06-19 | Remove duplicate STATUS column from induction flow tables | ✅ Completed |
| **V290.0** | Antigravity | 2026-06-19 | Fix mapping of HR_INDUCTION criteria to HR_INDUCTION_ROUND lookups | ✅ Completed |
| **V289.0** | Antigravity | 2026-06-19 | Alter Biometric Attendance columns to minutes (INT) and TIME datatypes, simplify ESSL datasource configuration, check leave status in LeaveEntryService | ✅ Completed |
| **V285.1** | Antigravity | 2026-06-19 | Exclude BOS metadata repos from maxResult AOP cap; fix auth matrix 100-row limit | ✅ Completed |
| **V285.0** | Antigravity | 2026-06-18 | Add biometric geofencing, check-in photo fields and Canteen log sync; Reseed pages, submodules, permissions, and group collapses | ✅ Completed |
| **V284.0** | Antigravity | 2026-06-18 | Add missing IS_ACTIVE column to HR_INDUCTION_ASSIGNMENT | ✅ Completed |
| **V283.0** | Antigravity | 2026-06-18 | Add missing training columns to HR_INDUCTION_ASSIGNMENT | ✅ Completed |
| **V282.0** | Antigravity | 2026-06-18 | Remove QMS_EB_METER default meterType fallback constraint and update existing 'default' values to 'EB' | ✅ Completed |
| **V277.0** | Antigravity | 2026-06-17 | Alter OM_VISITOR_GATE_PASS ROW_ID column to BIGINT to match JPA entity Long type | ✅ Completed |
| **V276.0** | Antigravity | 2026-06-17 | Fix Hibernate Alter column dependencies (QMS_EB_POWER_CONSUMPTION & QMS_AUDIT_OBSERVATION_DETAIL) | 🏗️ In Progress |
| **V272.0** | Antigravity | 2026-06-17 | Remove STATUS column from NPD_PRODUCT_IPP table and transition to IS_ACTIVE | ✅ Completed |
| **V271.0** | Antigravity | 2026-06-16 | Remove Unwanted Employee Fields SOP | ✅ Completed |
| **V270.0** | Antigravity | 2026-06-16 | SOP compliance standardization of attendance module tables | ✅ Completed |
| **V269.0** | Antigravity | 2026-06-16 | Complete QMS Audit module SOP Compliance and Database Normalization | ✅ Completed |
| **V268.0** | Antigravity | 2026-06-16 | Add missing ATTACHMENT_PATH column to QMS_AUDIT_OBSERVATION_DETAIL | ✅ Completed |
| **V267.0** | Antigravity | 2026-06-16 | Add missing IS_ACTIVE column to QMS_AUDIT_OBSERVATION | ✅ Completed |
| **V266.0** | Antigravity | 2026-06-16 | Add missing CRITERIA_DETAILS and IS_ACTIVE columns to QMS_AUDIT_SCHEDULE_CRITERIA | ✅ Completed |
| **V253** | Antigravity | 2026-06-16 | SOP compliance standardization of attendance module tables | 🏗️ In Progress |
| **V265.0** | Antigravity | 2026-06-15 | Create QMS_AUDIT_DEPARTMENT mapping table | ✅ Completed |
| **V264.1** | Antigravity | 2026-06-15 | Retry migrate Audit Criteria attachments | 🏗️ In Progress |
| **V264.0** | Antigravity | 2026-06-15 | Migrate Audit Criteria attachments from FILE_UPLOAD_TRANS to QMS_ATTACHMENT_PATH | ✅ Completed |
| **V259** | Antigravity | 2026-06-15 | Alter QMS_CHECKLIST_MASTER columns (REJ_REASON, UPLOADED_FILES, SCANNED_FILES, AMENDMENT_REASON) to NVARCHAR(MAX) | 🏗️ In Progress |
| **V258** | Antigravity | 2026-06-15 | Consolidate QMS Checklist to 5 Tables and conform to DB SOP | 🏗️ In Progress |
| **V257** | Antigravity | 2026-06-15 | Add REJECT_REASON column to HR_LOAN_APPLICATION and HR_LOAN_ISSUE | 🏗️ In Progress |
| **V256** | Antigravity | 2026-06-15 | Create separate HR_LOAN_APPLICATION table and endpoints | 🏗️ In Progress |
| **V255** | Antigravity | 2026-06-15 | SOP Standardization of HR_LOAN_ISSUE and HR_MONTH_MASTER | 🏗️ In Progress |
| **V256** | Antigravity | 2026-06-15 | Remove HOLIDAY_CODE and TO_DATE columns from HR_HOLIDAY_MASTER | 🏗️ In Progress |
| **V255** | Antigravity | 2026-06-15 | Alter HOLIDAY_YEAR column datatype in HR_HOLIDAY_MASTER to NVARCHAR(4) | 🏗️ In Progress |
| **V254** | Antigravity | 2026-06-15 | Remove redundant STATUS columns from Audit and Verification Criteria | 🏗️ In Progress |
| **V253** | Antigravity | 2026-06-15 | Normalize Audit Type Areas (Parent-Child Table migration) | 🏗️ In Progress |
| **V252** | Antigravity | 2026-06-14 | Drop redundant column EMP_NAME from HR_INDUCTION_ASSIGNMENT | 🏗️ In Progress |
| **V251** | Antigravity | 2026-06-14 | Drop legacy columns CRITERIA_ID and TRAINEE_RESPONSE from HR_INDUCTION_TRAINING | 🏗️ In Progress |
| **V250** | Antigravity | 2026-06-13 | Deduplicate process and point types, enforce unique constraints | 🏗️ In Progress |
| **V249** | Antigravity | 2026-06-13 | Deduplicate meeting user attendance and MOM attendance | 🏗️ In Progress |
| **V248** | Antigravity | 2026-06-13 | Add SUBJECT column to QMS_MEETING_SCHEDULE | 🏗️ In Progress |
| **V247** | Antigravity | 2026-06-13 | Remove columns MEETING_NAME, DESCRIPTION, AGENDA, SUBJECT from QMS_MEETING_SCHEDULE | 🏗️ In Progress |
| **V246** | Antigravity | 2026-06-13 | Alter QMS_MEETING_SCHEDULE audit column lengths to 50 and establish compliance FKs | 🏗️ In Progress |
| **V245** | Antigravity | 2026-06-13 | Remove STATUS columns from QMS_MEETING_MASTER and QMS_MEETING_SCHEDULE | 🏗️ In Progress |
| **V244** | Antigravity | 2026-06-13 | Fix QMS_MEETING_SCHEDULE STATUS type conversion by dropping dependent index | ✅ Merged |
| **V243** | Antigravity | 2026-06-13 | Fix QMS_MEETING_USER_ATTENDANCE STATUS column type to bigint FK / Migrate NCR Attachments & Cleanup Redundant Tables | ✅ Merged |
| **V242** | Antigravity | 2026-06-13 | Seed/Backfill QMS Audit Criteria Attachments | 🏗️ In Progress |
| **V241** | Antigravity | 2026-06-13 | QMS Audit Module Enhancements & Schema Standardization | ✅ Merged |
| **V240** | Antigravity | 2026-06-13 | Restore QMS_MOM_MASTER table name to resolve Invalid Object Name error | ✅ Merged |
| **V240.1** | Antigravity | 2026-06-13 | Drop duplicate IS_ACTIVE column from QMS_AUDIT_AREA | 🏗️ In Progress |
| **V240.0** | Antigravity | 2026-06-13 | Fix AD_USER_CREDENTIAL EMP_ID FK to reference HR_EMPLOYEE instead of HR_EMPLOYEE_MASTER | ✅ Merged |
| **V239.1** | Antigravity | 2026-06-13 | Fix QMS_CHECKLIST_ASSIGNMENT FK to reference QMS_CHECKLIST_MASTER (stale Hibernate FK caused assignment failures) | 🏗️ In Progress |
| **V239** | Antigravity | 2026-06-13 | Seed ABSENT status and fix Qms MOM Master table name / Change QMS_AUDIT_TYPE criteria_type column length to 10 | ✅ Merged |
| **V238** | Antigravity | 2026-06-13 | Standardize ATS and NPD database tables according to client SOP (dynamic resolution) | ✅ Merged |
| **V237** | Antigravity | 2026-06-13 | Add missing IS_ACTIVE column to QMS_MOM_DETAILS and QMS_MEETING_SCHEDULE | ✅ Merged |
| **V236** | Antigravity | 2026-06-13 | Align HR_EMPLOYEE_MASTER columns with JPA entity | 🏗️ In Progress |
| **V235** | Maheshwaran | 2026-06-13 | QMS Audit Database Column Standardization | 🏗️ In Progress |
| **V234** | Antigravity | 2026-06-13 | 1NF Hardening Employee FileInfo Columns | ✅ Merged |
| **V233** | Antigravity | 2026-06-13 | Seed HR_LEVEL with L1–L7 (empty table causing all induction saves to fail) | ✅ Merged |
| **V232** | Antigravity | 2026-06-13 | Fix QMS STATUS columns reverted to NVARCHAR by V007 (nvarchar→bigint production error) | ✅ Merged |
| **V231** | Antigravity | 2026-06-13 | Step 3: DDL Integrity Enforcement & Schema Hardening | ✅ Merged |
| **V230** | Antigravity | 2026-06-13 | Step 2: DML Data Transformation & Normalization | ✅ Merged |
| **V229** | Antigravity | 2026-06-13 | Step 1: DDL Structural Foundations & Mapping Tables | ✅ Merged |
| **V228** | Maheshwaran | 2026-06-13 | Normalize HR_INDUCTION_ASSIGNMENT and REASSIGNMENT_LOG and Training Attachments | 🏗️ In Progress |
| **V227** | Maheshwaran | 2026-06-13 | Normalize HR_INDUCTION round to foreign key | 🏗️ In Progress |
| **V226** | Maheshwaran | 2026-06-13 | Refactor HR Induction SOP | 🏗️ In Progress |
| **V225** | hari06-space | 2026-06-13 | Fix Induction Round and Assignment tables | 🏗️ In Progress |
| **V224** | Antigravity | 2026-06-12 | Add Interviewer Evaluation Fields | 🏗️ In Progress |
| **V223** | Antigravity | 2026-06-12 | Add ATS Document Upload and Verification Fields | 🏗️ In Progress |
| **V222** | Antigravity | 2026-06-12 | Fix Interview and InductionRound Page Registration | ✅ Merged |
| **V221** | Antigravity | 2026-06-13 | Create Onboard tables Offer Letter, Appointment Order, Confirmation Order, Relieving Order | 🏗️ In Progress |
| **V220** | Antigravity | 2026-06-13 | Fix Induction Round and Assignment tables | 🏗️ In Progress |
| **V220** | Antigravity | 2026-06-12 | Restore QMS Meeting Employee Columns | ✅ Merged |
| **V219** | Antigravity | 2026-06-12 | Standardize Employee Satisfaction tables to SOP | 🏗️ In Progress |
| **V218** | Antigravity | 2026-06-11 | Move Loan Pages from QMS to Master/HR | ✅ Merged |
| **V217** | Antigravity | 2026-06-11 | Reorder QMS Loan Pages and Page Codes | ✅ Merged |
| **V216** | Antigravity | 2026-06-11 | Recreate Loan Apply Page under QMS > Loan | ✅ Merged |
| **V215** | Antigravity | 2026-06-11 | Delete Loan Apply Page under QMS > Loan | ✅ Merged |
| **V214** | Antigravity | 2026-06-11 | Recreate Loan Apply Page under QMS > Loan | ✅ Merged |
| **V213** | Antigravity | 2026-06-11 | Delete Loan Apply Page under QMS > Loan | ✅ Merged |
| **V212** | Antigravity | 2026-06-11 | Register Loan Apply Page under QMS > Loan | ✅ Merged |
| **V211** | Antigravity | 2026-06-11 | Register Month Master Page | ✅ Merged |
| **V210** | Antigravity | 2026-06-11 | Create HR Month Master | ✅ Merged |
| **V209** | Antigravity | 2026-06-11 | Delete Month Master Page | ✅ Merged |
| **V208** | Antigravity | 2026-06-11 | Add Request Date and Requested Details to Loan Issues | ✅ Merged |
| **V77** | Antigravity | 2026-06-04 | Add WEEK_DAYS and Repeat fields to QMS_AUDIT_SCHEDULE | ✅ Merged |
| **V63** | System baseline | 2026-05-31 | Last legacy incremental script added | ✅ Merged |
| **V64** | Eashwara Prasadh | 2026-06-02 | Drop And Rename Tables (Baseline cleanup) | ✅ Merged |
| **V65** | Darshan | 2026-06-02 | Add Frequency to Audit Schedule | ✅ Merged |
| **V66** | Darshan | 2026-06-02 | Alter Audit Criteria Columns To NVARCHAR(MAX) | ✅ Merged |
| **V67** | Darshan | 2026-06-02 | Swap Audit Area And Type Page Codes | ✅ Merged |
| **V68** | Eashwara Prasadh | 2026-06-02 | Cleanup Created By audit columns | ✅ Merged |
| **V69** | Eashwara Prasadh | 2026-06-02 | Cleanup Updated By audit columns | ✅ Merged |
| **V70** | Eashwara Prasadh | 2026-06-02 | Rename IsBosAdmin To UserLevel | ✅ Merged |
| **V71** | Eashwara Prasadh | 2026-06-02 | Add Tenant Id To User Credential | ✅ Merged |
| **V72** | Eashwara Prasadh | 2026-06-02 | Seed Organization Chart Page | ✅ Merged |
| **V73** | Eashwara Prasadh | 2026-06-02 | Add Input Case Style To Company | ✅ Merged |
| **V74** | Naveena / TIS | 2026-06-02 | Add L6/L7 Designation Levels | ✅ Merged |
| **V75** | Naveena / TIS | 2026-06-02 | Add Requested Departments | ✅ Merged |
| **V76** | Antigravity | 2026-06-03 | Revert non-Admin users mistakenly promoted to level 5 | ✅ Merged |

*Junior developers: If you are unsure, ask the Main Branch In-Charge before claiming a version.*
