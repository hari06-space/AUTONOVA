# Database Migration Tracker

This document serves as the official registry and tracking board for standardizing the ERP database schema module by module. 

---

## 1. Migration Roadmap

```mermaid
graph TD
    A[Phase 1: Global Common Masters] --> B[Phase 2: User & Auth Module]
    B --> C[Phase 3: Department & Designation]
    C --> D[Phase 4: Employee Master (Core HR)]
    D --> E[Phase 5: Induction & Interview]
    E --> F[Phase 6: Customer, Supplier & CRM]
    F --> G[Phase 7: QMS & Audit Module]
    G --> H[Phase 8: Production & Inventory Module]
    H --> I[Phase 9: Sales & Marketing Transactions Module]
```

---

## 2. Table-by-Table Registry & Progress

| Table Group / Table Name | Legacy Name | Standardized Name | Target Script | Progress |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1: Global Common Masters** | | | | |
| Country Master | `MASTER_COUNTRY` | `MST_COUNTRY` | `V001__Master_Module.sql` | ✅ Migrated |
| State Master | `MASTER_STATE` | `MST_STATE` | `V001__Master_Module.sql` | ✅ Migrated |
| Product Master | `product_master` | `MST_PRODUCT` | `V001__Master_Module.sql` | ✅ Migrated |
| Freight Master | `FREIGHT_MASTER` | `MST_FREIGHT` | `V001__Master_Module.sql` | ✅ Migrated |
| Despatch Mode Master | `MODE_OF_DESPATCH` | `MST_DESPATCH_MODE` | `V001__Master_Module.sql` | ✅ Migrated |
| **Phase 2: User & Auth Module** | | | | |
| User Credentials | `ad_user_credential` | `AD_USER_CREDENTIAL` | `V002__User_Module.sql` | ✅ Migrated |
| Company Credentials | `ad_company_credential` | `AD_COMPANY_CREDENTIAL` | `V002__User_Module.sql` | ✅ Migrated |
| Division Master | `ad_division_master` | `AD_DIVISION` | `V002__User_Module.sql` | ✅ Migrated |
| User Mappings | `AD_USER_..._MAPPING` | `AD_USER_..._MAPPING` | `V002__User_Module.sql` | ✅ Migrated |
| **Phase 3: Department & Designation** | | | | |
| Department Master | `HR_DEPARTMENT_MASTER` | `HR_DEPARTMENT` | `V003__HR_Master_Module.sql` | ✅ Migrated |
| Designation Master | `HR_DESIGNATION_MASTER` | `HR_DESIGNATION` | `V003__HR_Master_Module.sql` | ✅ Migrated |
| Designation Level | `HR_DESIGNATION_LEVEL` | `HR_DESIGNATION_LEVEL` | `V003__HR_Master_Module.sql` | ✅ Migrated |
| Level Master | `HR_LEVEL_MASTER` | `HR_LEVEL` | `V003__HR_Master_Module.sql` | ✅ Migrated |
| Employee Type Master | `HR_EMPLOYEE_TYPE_MASTER` | `HR_EMPLOYEE_TYPE` | `V003__HR_Master_Module.sql` | ✅ Migrated |
| **Phase 4: Employee Master (Core HR)** | | | | |
| Employee Master | `hrm_employee_master` | `HR_EMPLOYEE` | `V004__Employee_Module.sql` | ✅ Migrated |
| Employee Contacts | `hrm_employee_contact` | `HR_EMPLOYEE_CONTACT` | `V004__Employee_Module.sql` | ✅ Migrated |
| Employee Personal Details | `hrm_employee_personal_detail` | `HR_EMPLOYEE_PERSONAL` | `V004__Employee_Module.sql` | ✅ Migrated |
| Employee KYC | `hrm_employee_kyc` | `HR_EMPLOYEE_KYC` | `V004__Employee_Module.sql` | ✅ Migrated |
| **Phase 5: Induction & Interview** | | | | |
| Induction Master | `IND_INDUCTION_MASTER` | `HR_INDUCTION` | `V005__Induction_Module.sql` | ✅ Migrated |
| Induction Assignment | `IND_INDUCTION_ASSIGNMENT` | `HR_INDUCTION_ASSIGNMENT` | `V005__Induction_Module.sql` | ✅ Migrated |
| Induction Training Detail | `IND_INDUCTION_TRAINING_DETAIL`| `HR_INDUCTION_TRAINING` | `V005__Induction_Module.sql` | ✅ Migrated |
| Interview Master | `IND_INTERVIEW_MASTER` | `HR_INTERVIEW` | `V005__Induction_Module.sql` | ✅ Migrated |
| **Phase 6: Customer, Supplier & CRM** | | | | |
| Customer Master | `sm_customer_master` | `SLS_CUSTOMER` | `V006__Sales_Vendor_Module.sql`| ✅ Migrated |
| Customer Address | `sm_customer_address` | `SLS_CUSTOMER_ADDRESS` | `V006__Sales_Vendor_Module.sql`| ✅ Migrated |
| Supplier/Vendor Master | `sm_supplier_master` | `VND_VENDOR` | `V006__Sales_Vendor_Module.sql`| ✅ Migrated |
| Vendor Customer Mapping | `sm_vendor_customer_master` | `VND_CUSTOMER_MAPPING` | `V006__Sales_Vendor_Module.sql`| ✅ Migrated |
| **Phase 7: QMS & Audit Module** | | | | |
| Checklist Master | `qms_checklist_master` | `QMS_CHECKLIST` | `V007__QMS_Module.sql` | ✅ Migrated |
| Checklist Assignment | `qms_checklist_assignment` | `QMS_CHECKLIST_ASSIGNMENT` | `V007__QMS_Module.sql` | ✅ Migrated |
| Meeting Master | `qms_meeting_master` | `QMS_MEETING` | `V007__QMS_Module.sql` | ✅ Migrated |
| Mom Master | `qms_mom_master` | `QMS_MOM` | `V007__QMS_Module.sql` | ✅ Migrated |
| **Phase 8: Production & Inventory Module** | | | | |
| Item Group Master | `npd_item_group` | `NPD_ITEM_GROUP` | `V008__Production_Inventory_Module.sql` | ✅ Migrated |
| Item Type Master | `npd_item_type` | `NPD_ITEM_TYPE` | `V008__Production_Inventory_Module.sql` | ✅ Migrated |
| Item Subtype Master | `npd_item_subtype` | `NPD_ITEM_SUBTYPE` | `V008__Production_Inventory_Module.sql` | ✅ Migrated |
| OEM Master | `npd_oem` | `NPD_OEM` | `V008__Production_Inventory_Module.sql` | ✅ Migrated |
| Model Master | `npd_model` | `NPD_MODEL` | `V008__Production_Inventory_Module.sql` | ✅ Migrated |
| Capacity Master | `npd_capacity` | `NPD_CAPACITY` | `V008__Production_Inventory_Module.sql` | ✅ Migrated |
| OEM Part Mapping | `npd_oem_mapping` | `NPD_OEM_MAPPING` | `V008__Production_Inventory_Module.sql` | ✅ Migrated |
| Process Master | `npd_process` | `NPD_PROCESS` | `V008__Production_Inventory_Module.sql` | ✅ Migrated |
| Wind Farm Master | `npd_wind_farm` | `NPD_WIND_FARM` | `V008__Production_Inventory_Module.sql` | ✅ Migrated |
| **Phase 9: Sales & Marketing Transactions** | | | | |
| Enquiry Master | `SM_ENQUIRY` | `SLS_ENQUIRY` | `V009__Sales_Transactions_Module.sql` | ✅ Migrated |
| Price Master | `SM_PRICE_MASTER` | `SLS_PRICE_MASTER` | `V009__Sales_Transactions_Module.sql` | ✅ Migrated |
| Quotation Master | `SM_QUOTATION` | `SLS_QUOTATION` | `V009__Sales_Transactions_Module.sql` | ✅ Migrated |

*Status key: ❌ Pending | 🔄 In Progress | ✅ Migrated*

---

## 3. Detailed Database Standardization & Design Rules

To resolve performance, size constraints, and migration script failures, all standardization baselines written to the `v_next/` migration path must follow these rules:

### A. Data Types & Storage Optimization
1. **Switch to NVARCHAR:** Migrate all character data fields (`VARCHAR`, `CHAR`, `TEXT`) to `NVARCHAR` for dynamic storage allocation and Unicode support.
2. **Optimize Length Limits:** Do not assign arbitrary `NVARCHAR(255)` or `NVARCHAR(MAX)` limits. Strictly size columns down to match realistic expected value lengths (e.g. 20 to 30 characters for simple codes, names, or reference tags).
3. **Avoid TEXT Data Type:** Never use the legacy `TEXT` data type. Use `NVARCHAR(MAX)` only for large text bodies, or smaller custom limits (like `NVARCHAR(1000)`) for standard paragraphs.
4. **URL & Attachment Paths:** Columns storing file attachments, profile photos, or KYC files (such as `HR_EMPLOYEE_KYC` or induction attachments) must store **relative, URL-specific paths** (e.g. `/uploads/kyc/doc_name.png`) instead of local absolute filesystem paths, and be configured as `NVARCHAR(1000)` instead of `NVARCHAR(MAX)`.

### B. Foreign Key & Dependency Conflict Reduction
1. **Reduce Foreign Keys:** Minimize foreign key relationships to prevent circular dependency locks during table cleanups or migrations.
2. **Strict FK Use-Cases:** Foreign keys must ONLY be defined to link Master and Transaction tables (e.g., mapping a checklist definition to its assignment list) or when defining standard Audit columns.
3. **Remove Metadata/Status FKs:** Avoid setting up database-level foreign key constraints for status codes (e.g. `status_id` pointing to `ad_status_master`) or minor mapping details. Handle validation at the application service level instead. This prevents migration `DELETE` scripts from crashing due to dependency locks.

### C. Standard Audit Columns on Tables
It is highly recommended that all core tables (such as master, employee, transaction, and primary entities) include the following 5 columns:
*   `CREATED_BY NVARCHAR(100)`
*   `CREATED_DATE DATETIME`
*   `UPDATED_BY NVARCHAR(100)`
*   `UPDATED_DATE DATETIME`
*   `IS_ACTIVE BIT DEFAULT 1`

*Note: Minor mapping tables or simple helper join tables may omit these auditing columns if they do not store user-created transaction data.*

---

## 4. Module-by-Module Migration Details

### Module 1: Master (Global Common)
*   **Legacy Tables:**
    *   `MASTER_COUNTRY`
    *   `MASTER_STATE`
    *   `product_master`
    *   `freight_master`
    *   `mode_of_despatch`
*   **Standardized Schema Target:**
    *   `MST_COUNTRY` (PK: `PK_MST_COUNTRY`)
    *   `MST_STATE` (PK: `PK_MST_STATE`, FK: `FK_MST_STATE_COUNTRY`)
    *   `MST_PRODUCT` (PK: `PK_MST_PRODUCT`)
    *   `MST_FREIGHT` (PK: `PK_MST_FREIGHT`)
    *   `MST_DESPATCH_MODE` (PK: `PK_MST_DESPATCH_MODE`)

### Phase 2: User & Auth Module (Security/Admin)
*   **Step 2.1: User Credentials**
    *   Legacy: `ad_user_credential` $\rightarrow$ Target: `AD_USER_CREDENTIAL`
    *   Sizing: Optimize password length, role, and auth method limits.
*   **Step 2.2: Company Credentials**
    *   Legacy: `AD_COMPANY_CREDENTIAL` $\rightarrow$ Target: `AD_COMPANY_CREDENTIAL`
    *   Sizing: Relative paths for directory paths (`NVARCHAR(1000)`).
*   **Step 2.3: Division Master**
    *   Legacy: `AD_DIVISION_MASTER` $\rightarrow$ Target: `AD_DIVISION` (PK: `PK_AD_DIVISION`)
*   **Step 2.4: Mappings**
    *   Legacy: `AD_USER_COMPANY_MAPPING`, `AD_USER_DIVISION_MAPPING` $\rightarrow$ Targets unchanged.
*   **Step 2.5: Session Activity**
    *   Legacy: `AD_USER_SESSION_ACTIVITY`, `AD_USER_SESSION_AUDIT` $\rightarrow$ Targets unchanged.

---

### Phase 3: Department & Designation Masters
*   **Step 3.1: Department Master**
    *   Legacy: `HR_DEPARTMENT_MASTER` $\rightarrow$ Target: `HR_DEPARTMENT` (PK: `PK_HR_DEPARTMENT`)
    *   Sizing: `dept_name` to `NVARCHAR(100)`, `dept_no` to `NVARCHAR(20)`.
*   **Step 3.2: Designation Master**
    *   Legacy: `HR_DESIGNATION_MASTER` $\rightarrow$ Target: `HR_DESIGNATION` (PK: `PK_HR_DESIGNATION`)
*   **Step 3.3: Designation Level**
    *   Legacy: `HR_DESIGNATION_LEVEL` $\rightarrow$ Target: `HR_DESIGNATION_LEVEL`
*   **Step 3.4: Level Master**
    *   Legacy: `HR_LEVEL_MASTER` $\rightarrow$ Target: `HR_LEVEL` (PK: `PK_HR_LEVEL`)
*   **Step 3.5: Employee Type Master**
    *   Legacy: `HR_EMPLOYEE_TYPE_MASTER` $\rightarrow$ Target: `HR_EMPLOYEE_TYPE` (PK: `PK_HR_EMPLOYEE_TYPE`)

---

### Phase 4: Employee Master & Personal Details (Core HR)
*   **Step 4.1: Employee Master**
    *   Legacy: `HR_EMPLOYEE_MASTER` $\rightarrow$ Target: `HR_EMPLOYEE` (PK: `PK_HR_EMPLOYEE`)
    *   Sizing: Employee name fields (`NVARCHAR(100)`), file upload columns (photo, signature, fitness certificate) resized to `NVARCHAR(1000)` and standardized to relative URL paths.
*   **Step 4.2: Employee Contacts**
    *   Legacy: `HR_EMPLOYEE_CONTACT` $\rightarrow$ Target: `HR_EMPLOYEE_CONTACT` (FK: `FK_HR_EMPLOYEE_CONTACT_EMPLOYEE`)
*   **Step 4.3: Employee Personal Details**
    *   Legacy: `HR_EMPLOYEE_PERSONAL_DETAIL` $\rightarrow$ Target: `HR_EMPLOYEE_PERSONAL` (FK: `FK_HR_EMPLOYEE_PERSONAL_EMPLOYEE`)
*   **Step 4.4: Employee KYC & Uploads**
    *   Legacy: `HR_EMPLOYEE_KYC`, `HR_EMPLOYEE_KYC_DOCUMENT` $\rightarrow$ Target: `HR_EMPLOYEE_KYC`, `HR_EMPLOYEE_KYC_DOCUMENT`
    *   Sizing: Relative document upload paths using `NVARCHAR(1000)` instead of local paths.
*   **Step 4.5: Education & Experience**
    *   Legacy: `HR_EMPLOYEE_EDUCATION`, `HR_EMPLOYEE_EXPERIENCE` $\rightarrow$ Targets unchanged.

---

### Phase 5: Induction & Interview Modules
*   **Step 5.1: Induction Master**
    *   Legacy: `IND_INDUCTION_MASTER` $\rightarrow$ Target: `HR_INDUCTION` (PK: `PK_HR_INDUCTION`)
*   **Step 5.2: Induction Assignment**
    *   Legacy: `IND_INDUCTION_ASSIGNMENT` $\rightarrow$ Target: `HR_INDUCTION_ASSIGNMENT` (PK: `PK_HR_INDUCTION_ASSIGN`)
*   **Step 5.3: Induction Training Detail**
    *   Legacy: `IND_INDUCTION_TRAINING_DETAIL` $\rightarrow$ Target: `HR_INDUCTION_TRAINING` (PK: `PK_HR_INDUCTION_TRAINING`)
*   **Step 5.4: Interview Master**
    *   Legacy: `IND_INTERVIEW_MASTER` $\rightarrow$ Target: `HR_INTERVIEW` (PK: `PK_HR_INTERVIEW`)

---

### Phase 6: Customer, Supplier & CRM
*   **Step 6.1: Customer Master**
    *   Legacy: `SM_CUSTOMER_MASTER` $\rightarrow$ Target: `SLS_CUSTOMER` (PK: `PK_SLS_CUSTOMER`)
*   **Step 6.2: Customer Address**
    *   Legacy: `SM_CUSTOMER_ADDRESS` $\rightarrow$ Target: `SLS_CUSTOMER_ADDRESS` (PK: `PK_SLS_CUSTOMER_ADDR`, FK: `FK_SLS_CUSTOMER_ADDR_CUSTOMER`)
*   **Step 6.3: Customer Potential**
    *   Legacy: `SM_CUSTOMER_POTENTIAL` $\rightarrow$ Target: `SLS_CUSTOMER_POTENTIAL`
*   **Step 6.4: Supplier/Vendor Master**
    *   Legacy: `SM_SUPPLIER_MASTER` $\rightarrow$ Target: `VND_VENDOR` (PK: `PK_VND_VENDOR`)
*   **Step 6.5: Vendor Customer Mapping**
    *   Legacy: `SM_VENDOR_CUSTOMER_MASTER` $\rightarrow$ Target: `VND_CUSTOMER_MAPPING`

---

### Phase 7: QMS & Audit Module
*   **Step 7.1: Checklist Master**
    *   Legacy: `QMS_CHECKLIST_MASTER` $\rightarrow$ Target: `QMS_CHECKLIST` (PK: `PK_QMS_CHECKLIST`)
*   **Step 7.2: Checklist Assignment**
    *   Legacy: `QMS_CHECKLIST_ASSIGNMENT`, `QMS_CHECKLIST_VERIFICATION` $\rightarrow$ Target: `QMS_CHECKLIST_ASSIGNMENT`, `QMS_CHECKLIST_VERIFICATION`
*   **Step 7.3: Audit Schedule & Criteria**
    *   Legacy: `QMS_AUDIT_SCHEDULE`, `QMS_AUDIT_CRITERIA` $\rightarrow$ Target: `QMS_AUDIT_SCHEDULE`, `QMS_AUDIT_CRITERIA`
*   **Step 7.4: Audit Observation & Attendance**
    *   Legacy: `QMS_AUDIT_OBSERVATION`, `QMS_AUDIT_ATTENDANCE` $\rightarrow$ Target: `QMS_AUDIT_OBSERVATION`, `QMS_AUDIT_ATTENDANCE`
*   **Step 7.5: Meeting Master & Mom Details**
    *   Legacy: `QMS_MEETING_MASTER`, `QMS_MOM_MASTER`, `QMS_MOM_DETAIL` $\rightarrow$ Target: `QMS_MEETING`, `QMS_MOM`, `QMS_MOM_DETAIL`

---

### Module 4: QMS & Audit
*   **Legacy Tables:**
    *   `qms_checklist_master`
    *   `qms_checklist_assignment`
    *   `QMS_CHECKLIST_CLOSED`
    *   `QMS_AUDIT_SCHEDULE`
    *   `QMS_AUDIT_ATTENDANCE`
    *   `QMS_AUDIT_OBSERVATION`
    *   `qms_meeting_master`
    *   `qms_meeting_schedule`
    *   `qms_mom_master`
    *   `qms_mom_detail`
    *   `QMS_NCR_OFI_MASTER`
*   **Standardized Schema Target:**
    *   `QMS_CHECKLIST`
    *   `QMS_CHECKLIST_ASSIGNMENT`
    *   `QMS_CHECKLIST_CLOSED`
    *   `QMS_AUDIT_SCHEDULE`
    *   `QMS_AUDIT_ATTENDANCE`
    *   `QMS_AUDIT_OBSERVATION`
    *   `QMS_MEETING`
    *   `QMS_MEETING_SCHEDULE`
    *   `QMS_MOM`
    *   `QMS_MOM_DETAIL`
    *   `QMS_NCR_OFI`

---

### Module 5: Production & Inventory (NPD Master)
*   **Legacy Tables:**
    *   `npd_item_group`
    *   `npd_item_type`
    *   `npd_item_subtype`
    *   `npd_oem`
    *   `npd_model`
    *   `npd_capacity`
    *   `npd_oem_mapping`
    *   `npd_process`
    *   `npd_wind_farm`
*   **Standardized Schema Target:**
    *   `NPD_ITEM_GROUP`
    *   `NPD_ITEM_TYPE`
    *   `NPD_ITEM_SUBTYPE`
    *   `NPD_OEM`
    *   `NPD_MODEL`
    *   `NPD_CAPACITY`
    *   `NPD_OEM_MAPPING`
    *   `NPD_PROCESS`
    *   `NPD_WIND_FARM`

---

### Phase 9: Sales & Marketing Transactions Module
*   **Legacy Tables:**
    *   `SM_ENQUIRY`
    *   `SM_PRICE_MASTER`
    *   `SM_QUOTATION`
*   **Standardized Schema Target:**
    *   `SLS_ENQUIRY` (PK: `PK_SLS_ENQUIRY`, FK: `FK_SLS_ENQUIRY_CUSTOMER`)
    *   `SLS_PRICE_MASTER` (PK: `PK_SLS_PRICE_MASTER`, FK: `FK_SLS_PRICE_MASTER_CUSTOMER`)
    *   `SLS_QUOTATION` (PK: `PK_SLS_QUOTATION`, FK: `FK_SLS_QUOTATION_CUSTOMER`)

---

## 5. Workflow & Local Testing Guidelines

1. **Local Pre-Commit Testing:** Developers must pull the latest changes from the `main` branch, compile the codebase, verify database migrations, and run the workflow locally. Only push to `main` once they verify zero runtime errors.
2. **Error Reporting Strategy:** Whenever an error is encountered on the live console during testing or production setup, developers must instantly take a screenshot and share it directly in the internal group chat for collective troubleshooting.
