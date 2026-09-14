-- ============================================================
-- V396.0 — BOS Business Capability Platform
-- Creates 4 metadata tables that make BOS AI metadata-driven:
--   BOS_AI_ENTITY          → registered business entities
--   BOS_AI_ENTITY_FIELDS   → field-level metadata + security
--   BOS_AI_RELATIONSHIPS   → entity graph edges
--   BOS_AI_OPERATIONS      → supported operations per entity
--
-- Seeded with all 7 existing domain entities.
-- ============================================================

-- ─── 1. BOS_AI_ENTITY ──────────────────────────────────────

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'BOS_AI_ENTITY')
BEGIN
    CREATE TABLE BOS_AI_ENTITY (
        ID              BIGINT          IDENTITY(1,1) PRIMARY KEY,
        ENTITY_CODE     NVARCHAR(50)    NOT NULL,  -- e.g. "CHECKLIST"
        DISPLAY_NAME    NVARCHAR(100)   NOT NULL,  -- e.g. "QMS Checklist"
        ERP_MODULE      NVARCHAR(50)    NOT NULL,  -- e.g. "QMS_CHECKLIST"
        DB_TABLE        NVARCHAR(100)   NULL,       -- e.g. "QMS_CHECKLIST_MASTER"
        ID_COLUMN       NVARCHAR(50)    NULL,       -- e.g. "ID"
        IDENTIFIER_COL  NVARCHAR(50)    NULL,       -- e.g. "CHECKLIST_NO" (human-readable key)
        PAGE_CODES      NVARCHAR(500)   NULL,       -- comma-separated page codes
        SYNONYMS        NVARCHAR(MAX)   NULL,       -- pipe-separated: "checklist|master checklist"
        DESCRIPTION     NVARCHAR(500)   NULL,
        DEFAULT_SCOPE   NVARCHAR(20)    NOT NULL DEFAULT 'SELF',  -- SELF|COMPANY|DIVISION
        MAX_HOPS        INT             NOT NULL DEFAULT 2,        -- graph traversal depth limit
        ACTIVE_STATUS   NCHAR(1)        NOT NULL DEFAULT 'Y',
        CREATED_BY      NVARCHAR(50)    NOT NULL DEFAULT 'SYSTEM',
        CREATED_DATE    DATETIME        NOT NULL DEFAULT GETDATE(),
        UPDATED_BY      NVARCHAR(50)    NULL,
        UPDATED_DATE    DATETIME        NULL,
        CONSTRAINT UQ_BOS_AI_ENTITY_CODE UNIQUE (ENTITY_CODE)
    );
    PRINT 'Created BOS_AI_ENTITY';
END

-- ─── 2. BOS_AI_ENTITY_FIELDS ───────────────────────────────

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'BOS_AI_ENTITY_FIELDS')
BEGIN
    CREATE TABLE BOS_AI_ENTITY_FIELDS (
        ID              BIGINT          IDENTITY(1,1) PRIMARY KEY,
        ENTITY_CODE     NVARCHAR(50)    NOT NULL,  -- FK → BOS_AI_ENTITY.ENTITY_CODE
        FIELD_CODE      NVARCHAR(50)    NOT NULL,  -- e.g. "CHECKLIST_NO"
        DISPLAY_NAME    NVARCHAR(100)   NOT NULL,  -- e.g. "Checklist Number"
        DB_COLUMN       NVARCHAR(100)   NULL,       -- actual SQL column (may differ from FIELD_CODE)
        FIELD_TYPE      NVARCHAR(20)    NOT NULL DEFAULT 'TEXT',  -- TEXT|NUMBER|DATE|BOOLEAN|ENUM
        SEARCHABLE      NCHAR(1)        NOT NULL DEFAULT 'Y',
        VISIBLE         NCHAR(1)        NOT NULL DEFAULT 'Y',
        SENSITIVE       NCHAR(1)        NOT NULL DEFAULT 'N',  -- if Y: requires elevated permission
        REQUIRED_PAGE   NVARCHAR(100)   NULL,       -- additional page code needed for sensitive field
        DESCRIPTION     NVARCHAR(500)   NULL,
        DISPLAY_ORDER   INT             NOT NULL DEFAULT 0,
        ACTIVE_STATUS   NCHAR(1)        NOT NULL DEFAULT 'Y',
        CONSTRAINT UQ_BOS_AI_ENTITY_FIELD UNIQUE (ENTITY_CODE, FIELD_CODE)
    );
    CREATE INDEX IDX_BOS_AI_FIELDS_ENTITY ON BOS_AI_ENTITY_FIELDS (ENTITY_CODE);
    PRINT 'Created BOS_AI_ENTITY_FIELDS';
END

-- ─── 3. BOS_AI_RELATIONSHIPS ───────────────────────────────

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'BOS_AI_RELATIONSHIPS')
BEGIN
    CREATE TABLE BOS_AI_RELATIONSHIPS (
        ID              BIGINT          IDENTITY(1,1) PRIMARY KEY,
        FROM_ENTITY     NVARCHAR(50)    NOT NULL,  -- e.g. "CHECKLIST"
        TO_ENTITY       NVARCHAR(50)    NOT NULL,  -- e.g. "CHECKLIST_POINT"
        CARDINALITY     NVARCHAR(10)    NOT NULL,  -- "1:N" | "N:M" | "1:1"
        JOIN_COLUMN     NVARCHAR(100)   NULL,       -- FK column in child table, e.g. "CHECKLIST_ID"
        PARENT_COLUMN   NVARCHAR(100)   NULL,       -- PK column in parent table (default: ID)
        EXPAND_NAME     NVARCHAR(50)    NULL,       -- e.g. "POINTS", "ATTACHMENTS"
        LABEL           NVARCHAR(100)   NULL,       -- human label: "has points"
        EAGER_LOAD      NCHAR(1)        NOT NULL DEFAULT 'N',  -- auto-include in DETAIL?
        MAX_ROWS        INT             NOT NULL DEFAULT 50,   -- safety limit per expansion
        ACTIVE_STATUS   NCHAR(1)        NOT NULL DEFAULT 'Y'
    );
    CREATE INDEX IDX_BOS_AI_REL_FROM ON BOS_AI_RELATIONSHIPS (FROM_ENTITY);
    PRINT 'Created BOS_AI_RELATIONSHIPS';
END

-- ─── 4. BOS_AI_OPERATIONS ──────────────────────────────────

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'BOS_AI_OPERATIONS')
BEGIN
    CREATE TABLE BOS_AI_OPERATIONS (
        ID              BIGINT          IDENTITY(1,1) PRIMARY KEY,
        ENTITY_CODE     NVARCHAR(50)    NOT NULL,   -- FK → BOS_AI_ENTITY.ENTITY_CODE
        OPERATION_CODE  NVARCHAR(50)    NOT NULL,   -- "COUNT", "DETAIL", "ANALYTICS"
        DISPLAY_NAME    NVARCHAR(100)   NOT NULL,
        REQUIRED_SCOPE  NVARCHAR(20)    NOT NULL DEFAULT 'SELF',   -- SELF|COMPANY|PRIVILEGED
        KEYWORDS        NVARCHAR(MAX)   NULL,        -- pipe-separated: "pending|open|not closed"
        DISPLAY_ORDER   INT             NOT NULL DEFAULT 0,
        ACTIVE_STATUS   NCHAR(1)        NOT NULL DEFAULT 'Y',
        CONSTRAINT UQ_BOS_AI_OPERATION UNIQUE (ENTITY_CODE, OPERATION_CODE)
    );
    CREATE INDEX IDX_BOS_AI_OPS_ENTITY ON BOS_AI_OPERATIONS (ENTITY_CODE);
    PRINT 'Created BOS_AI_OPERATIONS';
END

-- ═══════════════════════════════════════════════════════════
-- SEED DATA — 7 existing domain entities
-- ═══════════════════════════════════════════════════════════

-- ─── CHECKLIST ─────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM BOS_AI_ENTITY WHERE ENTITY_CODE = 'CHECKLIST')
BEGIN
    INSERT INTO BOS_AI_ENTITY (ENTITY_CODE, DISPLAY_NAME, ERP_MODULE, DB_TABLE, ID_COLUMN, IDENTIFIER_COL, PAGE_CODES, SYNONYMS, DESCRIPTION, DEFAULT_SCOPE, MAX_HOPS)
    VALUES ('CHECKLIST', 'QMS Checklist', 'QMS_CHECKLIST', 'QMS_CHECKLIST_MASTER', 'ID', 'CHECKLIST_NO',
            'QMS_CHECKLIST_MASTER,QMS_CHECKLIST_ASSIGNMENT,QMS_CHECKLIST_CLOSED',
            'master checklist|checklist assignment|qms checklist|checklist|checklists|check list',
            'QMS master checklists and assignments', 'SELF', 2);
END

-- CHECKLIST operations
IF NOT EXISTS (SELECT 1 FROM BOS_AI_OPERATIONS WHERE ENTITY_CODE = 'CHECKLIST' AND OPERATION_CODE = 'COUNT')
INSERT INTO BOS_AI_OPERATIONS (ENTITY_CODE, OPERATION_CODE, DISPLAY_NAME, REQUIRED_SCOPE, KEYWORDS, DISPLAY_ORDER)
VALUES
    ('CHECKLIST', 'COUNT',     'Checklist Count',     'SELF',      'how many|total|count|in number|number of', 1),
    ('CHECKLIST', 'LIST',      'Checklist List',      'SELF',      'list|show all|all checklists', 2),
    ('CHECKLIST', 'DETAIL',    'Checklist Detail',    'SELF',      'show checklist|checklist detail|what is checklist|checklist id|checklist no', 3),
    ('CHECKLIST', 'PENDING',   'Pending Checklists',  'SELF',      'pending|open|not closed|not completed|outstanding|overdue|due today', 4),
    ('CHECKLIST', 'COMPLETED', 'Completed Checklists','SELF',      'completed|closed|done|finished|submitted', 5),
    ('CHECKLIST', 'ANALYTICS', 'Checklist Analytics', 'COMPANY',   'analytics|trend|breakdown|overdue|avg closure|average closure|department summary|top department', 6),
    ('CHECKLIST', 'SUMMARY',   'Checklist Summary',   'SELF',      'my checklist|assigned to me|my assigned', 7);

-- CHECKLIST fields
IF NOT EXISTS (SELECT 1 FROM BOS_AI_ENTITY_FIELDS WHERE ENTITY_CODE = 'CHECKLIST')
INSERT INTO BOS_AI_ENTITY_FIELDS (ENTITY_CODE, FIELD_CODE, DISPLAY_NAME, DB_COLUMN, FIELD_TYPE, SEARCHABLE, VISIBLE, SENSITIVE, DISPLAY_ORDER)
VALUES
    ('CHECKLIST', 'CHECKLIST_NO',   'Checklist Number',  'CHECKLIST_NO',   'TEXT',   'Y', 'Y', 'N', 1),
    ('CHECKLIST', 'CHECKLIST_NAME', 'Checklist Name',    'CHECKLIST_NAME', 'TEXT',   'Y', 'Y', 'N', 2),
    ('CHECKLIST', 'DESCRIPTION',    'Description',       'DESCRIPTION',    'TEXT',   'Y', 'Y', 'N', 3),
    ('CHECKLIST', 'REVISION_NO',    'Revision Number',   'REVISION_NO',    'TEXT',   'Y', 'Y', 'N', 4),
    ('CHECKLIST', 'STATUS',         'Status',            'STATUS',         'ENUM',   'Y', 'Y', 'N', 5),
    ('CHECKLIST', 'DEPARTMENT_ID',  'Department',        'DEPARTMENT_ID',  'NUMBER', 'Y', 'Y', 'N', 6),
    ('CHECKLIST', 'CREATED_DATE',   'Created Date',      'CREATED_DATE',   'DATE',   'N', 'Y', 'N', 7),
    ('CHECKLIST', 'ACTIVE_STATUS',  'Active',            'ACTIVE_STATUS',  'ENUM',   'N', 'N', 'N', 8);

-- CHECKLIST relationships
IF NOT EXISTS (SELECT 1 FROM BOS_AI_RELATIONSHIPS WHERE FROM_ENTITY = 'CHECKLIST')
INSERT INTO BOS_AI_RELATIONSHIPS (FROM_ENTITY, TO_ENTITY, CARDINALITY, JOIN_COLUMN, PARENT_COLUMN, EXPAND_NAME, LABEL, EAGER_LOAD, MAX_ROWS)
VALUES
    ('CHECKLIST', 'CHECKLIST_POINT',      '1:N', 'CHECKLIST_ID', 'ID', 'POINTS',      'has checklist points',  'N', 100),
    ('CHECKLIST', 'CHECKLIST_ATTACHMENT', '1:N', 'CHECKLIST_ID', 'ID', 'ATTACHMENTS', 'has attachments',       'N', 20),
    ('CHECKLIST', 'CHECKLIST_REVISION',   '1:N', 'CHECKLIST_ID', 'ID', 'REVISIONS',   'revision history',      'N', 20),
    ('CHECKLIST', 'AUDIT',                'N:M', 'CHECKLIST_ID', 'ID', 'AUDITS',       'linked to audits',      'N', 10);

-- ─── EMPLOYEE ──────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM BOS_AI_ENTITY WHERE ENTITY_CODE = 'EMPLOYEE')
BEGIN
    INSERT INTO BOS_AI_ENTITY (ENTITY_CODE, DISPLAY_NAME, ERP_MODULE, DB_TABLE, ID_COLUMN, IDENTIFIER_COL, PAGE_CODES, SYNONYMS, DESCRIPTION, DEFAULT_SCOPE, MAX_HOPS)
    VALUES ('EMPLOYEE', 'Employee', 'EMPLOYEE', 'HR_EMPLOYEE', 'ID', 'EMP_CODE',
            'HR_EMPLOYEE_MASTER,HR_ATTENDANCE_DAILY,HR_LEAVE_BALANCE,HR_EMPLOYEE_PERSONAL,HR_EMPLOYEE_ORGANIZATION',
            'payslip|pay slip|attendance summary|leave balance|leave request|headcount|employee count|staff count|employee|staff|worker|personnel|leave|attendance|salary|payroll',
            'Employee master, attendance, leave, and payroll', 'SELF', 2);
END

IF NOT EXISTS (SELECT 1 FROM BOS_AI_OPERATIONS WHERE ENTITY_CODE = 'EMPLOYEE')
INSERT INTO BOS_AI_OPERATIONS (ENTITY_CODE, OPERATION_CODE, DISPLAY_NAME, REQUIRED_SCOPE, KEYWORDS, DISPLAY_ORDER)
VALUES
    ('EMPLOYEE', 'COUNT',      'Employee Count',      'COMPANY',   'how many employees|headcount|staff count|employee count', 1),
    ('EMPLOYEE', 'SEARCH',     'Employee Search',     'SELF',      'find employee|search employee|who is|lookup employee', 2),
    ('EMPLOYEE', 'DETAIL',     'Employee Profile',    'SELF',      'employee profile|my profile|employee E|emp id|employee detail', 3),
    ('EMPLOYEE', 'LEAVE',      'Leave Balance',       'SELF',      'leave balance|my leave|leave remaining|leave days', 4),
    ('EMPLOYEE', 'ATTENDANCE', 'Attendance',          'SELF',      'am I present|attendance today|present today|attendance this month', 5),
    ('EMPLOYEE', 'LIST',       'Employee List',       'COMPANY',   'list employees|all employees|all staff|department employees', 6),
    ('EMPLOYEE', 'SUMMARY',    'My Employee Summary', 'SELF',      'my details|my info|who am I', 7);

IF NOT EXISTS (SELECT 1 FROM BOS_AI_ENTITY_FIELDS WHERE ENTITY_CODE = 'EMPLOYEE')
INSERT INTO BOS_AI_ENTITY_FIELDS (ENTITY_CODE, FIELD_CODE, DISPLAY_NAME, DB_COLUMN, FIELD_TYPE, SEARCHABLE, VISIBLE, SENSITIVE, REQUIRED_PAGE, DISPLAY_ORDER)
VALUES
    ('EMPLOYEE', 'EMP_CODE',        'Employee Code',     'EMP_CODE',        'TEXT',   'Y', 'Y', 'N', NULL, 1),
    ('EMPLOYEE', 'EMPLOYEE_NAME',   'Employee Name',     'EMPLOYEE_NAME',   'TEXT',   'Y', 'Y', 'N', NULL, 2),
    ('EMPLOYEE', 'STATUS',          'Status',            'STATUS',          'ENUM',   'Y', 'Y', 'N', NULL, 3),
    ('EMPLOYEE', 'DEPARTMENT',      'Department',        'DEPARTMENT_NAME', 'TEXT',   'Y', 'Y', 'N', NULL, 4),
    ('EMPLOYEE', 'DESIGNATION',     'Designation',       'DESIGNATION_NAME','TEXT',   'Y', 'Y', 'N', NULL, 5),
    ('EMPLOYEE', 'DATE_OF_JOINING', 'Date of Joining',   'DATE_OF_JOINING', 'DATE',   'N', 'Y', 'N', NULL, 6),
    ('EMPLOYEE', 'SALARY',          'Salary',            'BASIC_SALARY',    'NUMBER', 'N', 'N', 'Y', 'HR_PAYROLL_MASTER', 7);

-- ─── CUSTOMER ──────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM BOS_AI_ENTITY WHERE ENTITY_CODE = 'CUSTOMER')
BEGIN
    INSERT INTO BOS_AI_ENTITY (ENTITY_CODE, DISPLAY_NAME, ERP_MODULE, DB_TABLE, ID_COLUMN, IDENTIFIER_COL, PAGE_CODES, SYNONYMS, DESCRIPTION, DEFAULT_SCOPE, MAX_HOPS)
    VALUES ('CUSTOMER', 'Customer', 'CUSTOMER', 'SLS_CUSTOMER', 'ID', 'CUSTOMER_CODE',
            'SLS_CUSTOMER,TICKET_TRACEABILITY_CENTER,SLS_QUOTATION',
            'support ticket|customer ticket|sales quotation|customer enquiry|sales order|customer|client|buyer|ticket|support|quotation|order|enquiry',
            'Customer master, orders, quotations, and support tickets', 'SELF', 2);
END

IF NOT EXISTS (SELECT 1 FROM BOS_AI_OPERATIONS WHERE ENTITY_CODE = 'CUSTOMER')
INSERT INTO BOS_AI_OPERATIONS (ENTITY_CODE, OPERATION_CODE, DISPLAY_NAME, REQUIRED_SCOPE, KEYWORDS, DISPLAY_ORDER)
VALUES
    ('CUSTOMER', 'COUNT',      'Customer Count',     'COMPANY',   'how many customers|customer count', 1),
    ('CUSTOMER', 'SEARCH',     'Customer Search',    'SELF',      'find customer|search customer|customer detail', 2),
    ('CUSTOMER', 'DETAIL',     'Customer Profile',   'SELF',      'customer profile|customer ABC|customer id', 3),
    ('CUSTOMER', 'ORDERS',     'Customer Orders',    'SELF',      'customer order|sales order|pending order', 4),
    ('CUSTOMER', 'QUOTATIONS', 'Quotations',         'SELF',      'quotation|quote|pending quotation', 5),
    ('CUSTOMER', 'SUPPORT',    'Support Tickets',    'SELF',      'support ticket|open ticket|customer ticket', 6),
    ('CUSTOMER', 'LIST',       'Customer List',      'COMPANY',   'all customers|active customers', 7),
    ('CUSTOMER', 'ANALYTICS',  'Customer Analytics', 'COMPANY',   'customer analytics|top customers|customer trend', 8);

IF NOT EXISTS (SELECT 1 FROM BOS_AI_RELATIONSHIPS WHERE FROM_ENTITY = 'CUSTOMER')
INSERT INTO BOS_AI_RELATIONSHIPS (FROM_ENTITY, TO_ENTITY, CARDINALITY, JOIN_COLUMN, PARENT_COLUMN, EXPAND_NAME, LABEL, EAGER_LOAD, MAX_ROWS)
VALUES
    ('CUSTOMER', 'SALES_ORDER',   '1:N', 'CUSTOMER_ID', 'ID', 'ORDERS',   'has orders',  'N', 20),
    ('CUSTOMER', 'QUOTATION',     '1:N', 'CUSTOMER_ID', 'ID', 'QUOTES',   'has quotes',  'N', 20),
    ('CUSTOMER', 'SUPPORT_TICKET','1:N', 'CUSTOMER_ID', 'ID', 'TICKETS',  'has tickets', 'N', 10);

-- ─── MACHINE ───────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM BOS_AI_ENTITY WHERE ENTITY_CODE = 'MACHINE')
BEGIN
    INSERT INTO BOS_AI_ENTITY (ENTITY_CODE, DISPLAY_NAME, ERP_MODULE, DB_TABLE, ID_COLUMN, IDENTIFIER_COL, PAGE_CODES, SYNONYMS, DESCRIPTION, DEFAULT_SCOPE, MAX_HOPS)
    VALUES ('MACHINE', 'Machine / Equipment', 'MACHINE', 'QMT_MACHINE', 'ID', 'MACHINE_CODE',
            'QMT_MACHINE,QMT_MACHINE_CATEGORY',
            'machine category|machine maintenance|machine downtime|machine|equipment|downtime|maintenance',
            'Machine master and maintenance schedule', 'SELF', 1);
END

IF NOT EXISTS (SELECT 1 FROM BOS_AI_OPERATIONS WHERE ENTITY_CODE = 'MACHINE')
INSERT INTO BOS_AI_OPERATIONS (ENTITY_CODE, OPERATION_CODE, DISPLAY_NAME, REQUIRED_SCOPE, KEYWORDS, DISPLAY_ORDER)
VALUES
    ('MACHINE', 'COUNT',   'Machine Count',   'COMPANY', 'how many machines|machine count', 1),
    ('MACHINE', 'LIST',    'Machine List',    'SELF',    'all machines|active machines|list machines', 2),
    ('MACHINE', 'DETAIL',  'Machine Detail',  'SELF',    'machine M|machine detail|machine profile', 3),
    ('MACHINE', 'PENDING', 'Maintenance Due', 'SELF',    'maintenance today|maintenance due|downtime', 4);

IF NOT EXISTS (SELECT 1 FROM BOS_AI_ENTITY_FIELDS WHERE ENTITY_CODE = 'MACHINE')
INSERT INTO BOS_AI_ENTITY_FIELDS (ENTITY_CODE, FIELD_CODE, DISPLAY_NAME, DB_COLUMN, FIELD_TYPE, SEARCHABLE, VISIBLE, SENSITIVE, DISPLAY_ORDER)
VALUES
    ('MACHINE', 'MACHINE_NAME',   'Machine Name',     'MACHINE_NAME',   'TEXT', 'Y', 'Y', 'N', 1),
    ('MACHINE', 'MACHINE_CODE',   'Machine Code',     'MACHINE_CODE',   'TEXT', 'Y', 'Y', 'N', 2),
    ('MACHINE', 'MACHINE_TYPE',   'Machine Type',     'MACHINE_TYPE',   'TEXT', 'Y', 'Y', 'N', 3),
    ('MACHINE', 'STATUS',         'Status',           'STATUS',         'ENUM', 'Y', 'Y', 'N', 4),
    ('MACHINE', 'LAST_MAINT',     'Last Maintenance', 'LAST_MAINTENANCE_DATE', 'DATE', 'N', 'Y', 'N', 5),
    ('MACHINE', 'NEXT_MAINT',     'Next Maintenance', 'NEXT_MAINTENANCE_DATE', 'DATE', 'N', 'Y', 'N', 6);

-- ─── SUPPLIER ──────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM BOS_AI_ENTITY WHERE ENTITY_CODE = 'SUPPLIER')
BEGIN
    INSERT INTO BOS_AI_ENTITY (ENTITY_CODE, DISPLAY_NAME, ERP_MODULE, DB_TABLE, ID_COLUMN, IDENTIFIER_COL, PAGE_CODES, SYNONYMS, DESCRIPTION, DEFAULT_SCOPE, MAX_HOPS)
    VALUES ('SUPPLIER', 'Supplier / Vendor', 'SUPPLIER', 'VND_VENDOR', 'ID', 'SUPPLIER_CODE',
            'VND_VENDOR',
            'approved supplier|vendor master|supplier|vendor|subcontractor',
            'Supplier and vendor master', 'SELF', 1);
END

IF NOT EXISTS (SELECT 1 FROM BOS_AI_OPERATIONS WHERE ENTITY_CODE = 'SUPPLIER')
INSERT INTO BOS_AI_OPERATIONS (ENTITY_CODE, OPERATION_CODE, DISPLAY_NAME, REQUIRED_SCOPE, KEYWORDS, DISPLAY_ORDER)
VALUES
    ('SUPPLIER', 'COUNT',  'Supplier Count',  'COMPANY', 'how many suppliers|supplier count|vendor count', 1),
    ('SUPPLIER', 'LIST',   'Supplier List',   'SELF',    'all suppliers|approved suppliers|active vendors', 2),
    ('SUPPLIER', 'SEARCH', 'Supplier Search', 'SELF',    'find supplier|search vendor|supplier detail', 3),
    ('SUPPLIER', 'DETAIL', 'Supplier Profile','SELF',    'supplier profile|vendor ABC', 4);

IF NOT EXISTS (SELECT 1 FROM BOS_AI_ENTITY_FIELDS WHERE ENTITY_CODE = 'SUPPLIER')
INSERT INTO BOS_AI_ENTITY_FIELDS (ENTITY_CODE, FIELD_CODE, DISPLAY_NAME, DB_COLUMN, FIELD_TYPE, SEARCHABLE, VISIBLE, SENSITIVE, DISPLAY_ORDER)
VALUES
    ('SUPPLIER', 'SUPPLIER_CODE',   'Supplier Code',    'SUPPLIER_CODE',   'TEXT', 'Y', 'Y', 'N', 1),
    ('SUPPLIER', 'SUPPLIER_NAME',   'Supplier Name',    'SUPPLIER_NAME',   'TEXT', 'Y', 'Y', 'N', 2),
    ('SUPPLIER', 'CONTACT_PERSON',  'Contact Person',   'CONTACT_PERSON',  'TEXT', 'Y', 'Y', 'N', 3),
    ('SUPPLIER', 'STATUS',          'Status',           'STATUS',          'ENUM', 'Y', 'Y', 'N', 4);

-- ─── INVENTORY ─────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM BOS_AI_ENTITY WHERE ENTITY_CODE = 'INVENTORY')
BEGIN
    INSERT INTO BOS_AI_ENTITY (ENTITY_CODE, DISPLAY_NAME, ERP_MODULE, DB_TABLE, ID_COLUMN, IDENTIFIER_COL, PAGE_CODES, SYNONYMS, DESCRIPTION, DEFAULT_SCOPE, MAX_HOPS)
    VALUES ('INVENTORY', 'Inventory / Product', 'INVENTORY', 'NPD_PRODUCT_MASTER', 'ID', 'ITEM_NO',
            'NPD_PRODUCT_MASTER,ITEM_TRANSACTION',
            'low stock|zero stock|stock level|inventory report|inventory|stock|product|item|bom',
            'Inventory and product master', 'SELF', 1);
END

IF NOT EXISTS (SELECT 1 FROM BOS_AI_OPERATIONS WHERE ENTITY_CODE = 'INVENTORY')
INSERT INTO BOS_AI_OPERATIONS (ENTITY_CODE, OPERATION_CODE, DISPLAY_NAME, REQUIRED_SCOPE, KEYWORDS, DISPLAY_ORDER)
VALUES
    ('INVENTORY', 'COUNT',  'Product Count',     'COMPANY', 'how many products|inventory count|product count', 1),
    ('INVENTORY', 'LIST',   'Product List',      'SELF',    'all products|active products|top products', 2),
    ('INVENTORY', 'SEARCH', 'Product Search',    'SELF',    'find product|product XYZ|search item', 3),
    ('INVENTORY', 'DETAIL', 'Product Detail',    'SELF',    'product detail|item detail|product profile', 4),
    ('INVENTORY', 'PENDING','Low Stock',         'SELF',    'low stock|zero stock|out of stock|stock alert', 5);

IF NOT EXISTS (SELECT 1 FROM BOS_AI_ENTITY_FIELDS WHERE ENTITY_CODE = 'INVENTORY')
INSERT INTO BOS_AI_ENTITY_FIELDS (ENTITY_CODE, FIELD_CODE, DISPLAY_NAME, DB_COLUMN, FIELD_TYPE, SEARCHABLE, VISIBLE, SENSITIVE, DISPLAY_ORDER)
VALUES
    ('INVENTORY', 'ITEM_NO',    'Item Number',  'ITEM_NO',    'TEXT',   'Y', 'Y', 'N', 1),
    ('INVENTORY', 'ITEM_NAME',  'Item Name',    'ITEM_NAME',  'TEXT',   'Y', 'Y', 'N', 2),
    ('INVENTORY', 'STOCK_QTY',  'Stock Qty',    'STOCK_QTY',  'NUMBER', 'N', 'Y', 'N', 3),
    ('INVENTORY', 'UOM',        'Unit',         'UOM',        'TEXT',   'N', 'Y', 'N', 4),
    ('INVENTORY', 'STATUS',     'Status',       'STATUS',     'ENUM',   'Y', 'Y', 'N', 5);

-- ─── AUDIT ─────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM BOS_AI_ENTITY WHERE ENTITY_CODE = 'AUDIT')
BEGIN
    INSERT INTO BOS_AI_ENTITY (ENTITY_CODE, DISPLAY_NAME, ERP_MODULE, DB_TABLE, ID_COLUMN, IDENTIFIER_COL, PAGE_CODES, SYNONYMS, DESCRIPTION, DEFAULT_SCOPE, MAX_HOPS)
    VALUES ('AUDIT', 'QMS Audit', 'QMS_AUDIT', 'QMS_AUDIT_SCHEDULE', 'ID', 'SCHEDULE_NO',
            'QMS_AUDIT_SCHEDULE,QMS_NCR_OFI_MASTER',
            'ncr observation|ofi observation|nonconformance|audit schedule|audit observation|audit|ncr|ofi',
            'QMS audit schedules, NCRs, and OFIs', 'SELF', 2);
END

IF NOT EXISTS (SELECT 1 FROM BOS_AI_OPERATIONS WHERE ENTITY_CODE = 'AUDIT')
INSERT INTO BOS_AI_OPERATIONS (ENTITY_CODE, OPERATION_CODE, DISPLAY_NAME, REQUIRED_SCOPE, KEYWORDS, DISPLAY_ORDER)
VALUES
    ('AUDIT', 'COUNT',     'Audit Count',     'COMPANY', 'how many audits|audit count', 1),
    ('AUDIT', 'LIST',      'Audit List',      'SELF',    'all audits|upcoming audits|audit schedule', 2),
    ('AUDIT', 'DETAIL',    'Audit Detail',    'SELF',    'audit detail|audit profile', 3),
    ('AUDIT', 'PENDING',   'Open Audits',     'SELF',    'open ncr|open ofi|pending audit', 4),
    ('AUDIT', 'ANALYTICS', 'Audit Analytics', 'COMPANY', 'audit analytics|ncr trend|audit affecting production', 5);

IF NOT EXISTS (SELECT 1 FROM BOS_AI_RELATIONSHIPS WHERE FROM_ENTITY = 'AUDIT')
INSERT INTO BOS_AI_RELATIONSHIPS (FROM_ENTITY, TO_ENTITY, CARDINALITY, JOIN_COLUMN, PARENT_COLUMN, EXPAND_NAME, LABEL, EAGER_LOAD, MAX_ROWS)
VALUES
    ('AUDIT', 'CHECKLIST', 'N:M', 'AUDIT_ID', 'ID', 'CHECKLISTS', 'linked checklists', 'N', 10);

PRINT 'V396.0 complete — BOS Business Capability Platform tables created and seeded with 7 entities';
