-- V384.0 EPM (Enterprise Performance Management) Schema

-- 1. epm_level_master
CREATE TABLE epm_level_master (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    level_name VARCHAR(100) NOT NULL,
    min_points BIGINT NOT NULL,
    max_points BIGINT NOT NULL,
    icon_name VARCHAR(100),
    is_active BIT DEFAULT 1,
    created_by BIGINT,
    created_date DATETIME2 DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_date DATETIME2 DEFAULT CURRENT_TIMESTAMP
);

-- 2. epm_badge_master
CREATE TABLE epm_badge_master (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    badge_name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    icon_name VARCHAR(100),
    criteria_rule VARCHAR(100),
    is_active BIT DEFAULT 1,
    created_by BIGINT,
    created_date DATETIME2 DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_date DATETIME2 DEFAULT CURRENT_TIMESTAMP
);

-- 3. epm_score_rule_master
CREATE TABLE epm_score_rule_master (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    rule_code VARCHAR(100) NOT NULL UNIQUE,
    rule_name VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    default_points BIGINT,
    formula_expression VARCHAR(MAX),
    is_penalty BIT DEFAULT 0,
    is_active BIT DEFAULT 1,
    created_by BIGINT,
    created_date DATETIME2 DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_date DATETIME2 DEFAULT CURRENT_TIMESTAMP
);

-- 4. epm_business_impact_master
CREATE TABLE epm_business_impact_master (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    transaction_type VARCHAR(100) NOT NULL UNIQUE,
    impact_weight BIGINT NOT NULL,
    is_active BIT DEFAULT 1,
    created_by BIGINT,
    created_date DATETIME2 DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_date DATETIME2 DEFAULT CURRENT_TIMESTAMP
);

-- 5. epm_weightage_master
CREATE TABLE epm_weightage_master (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    task_priority VARCHAR(50) NOT NULL UNIQUE,
    weight_value BIGINT NOT NULL,
    is_active BIT DEFAULT 1,
    created_by BIGINT,
    created_date DATETIME2 DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_date DATETIME2 DEFAULT CURRENT_TIMESTAMP
);

-- 6. epm_kpi_master
CREATE TABLE epm_kpi_master (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    department_id BIGINT,
    kpi_name VARCHAR(200) NOT NULL,
    weightage_pct DECIMAL(5,2),
    is_active BIT DEFAULT 1,
    created_by BIGINT,
    created_date DATETIME2 DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_date DATETIME2 DEFAULT CURRENT_TIMESTAMP
);

-- 7. epm_score_transaction (Ledger)
CREATE TABLE epm_score_transaction (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    transaction_type VARCHAR(100) NOT NULL,
    reference_id VARCHAR(100),
    rule_id BIGINT,
    points BIGINT NOT NULL,
    reason VARCHAR(500),
    transaction_date DATETIME2 DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    created_date DATETIME2 DEFAULT CURRENT_TIMESTAMP
);

-- 8. epm_employee_score_summary
CREATE TABLE epm_employee_score_summary (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    department_id BIGINT,
    total_score BIGINT DEFAULT 0,
    monthly_score BIGINT DEFAULT 0,
    yearly_score BIGINT DEFAULT 0,
    productivity_pct DECIMAL(5,2) DEFAULT 0,
    quality_pct DECIMAL(5,2) DEFAULT 0,
    accuracy_pct DECIMAL(5,2) DEFAULT 0,
    level_id BIGINT,
    last_updated DATETIME2 DEFAULT CURRENT_TIMESTAMP
);

-- 9. epm_badge_history
CREATE TABLE epm_badge_history (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    badge_id BIGINT NOT NULL,
    awarded_date DATETIME2 DEFAULT CURRENT_TIMESTAMP,
    reason VARCHAR(500)
);

-- 10. epm_performance_audit_log
CREATE TABLE epm_performance_audit_log (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT,
    action_type VARCHAR(100),
    old_value VARCHAR(MAX),
    new_value VARCHAR(MAX),
    reason VARCHAR(500),
    action_by BIGINT,
    action_date DATETIME2 DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IX_epm_score_tx_user ON epm_score_transaction(user_id);
CREATE INDEX IX_epm_score_tx_type ON epm_score_transaction(transaction_type);
CREATE INDEX IX_epm_emp_summary_dept ON epm_employee_score_summary(department_id);
CREATE INDEX IX_epm_badge_history_user ON epm_badge_history(user_id);

-- Seed Initial Data
INSERT INTO epm_level_master (level_name, min_points, max_points, icon_name) VALUES
('Beginner', 0, 500, 'IconStar'),
('Contributor', 501, 1500, 'IconTrendingUp'),
('Performer', 1501, 3000, 'IconRocket'),
('Expert', 3001, 6000, 'IconDiamond'),
('Champion', 6001, 9999999, 'IconCrown');

INSERT INTO epm_weightage_master (task_priority, weight_value) VALUES
('Very Low', 10),
('Low', 20),
('Medium', 40),
('High', 70),
('Critical', 100);

INSERT INTO epm_business_impact_master (transaction_type, impact_weight) VALUES
('Customer Complaint Resolution', 30),
('Production Order Completion', 25),
('Purchase Order', 20),
('Sales Order', 20),
('Quality Inspection', 18),
('Material Issue', 10),
('Inventory Adjustment', 8),
('Approval', 5);

INSERT INTO epm_score_rule_master (rule_code, rule_name, default_points, is_penalty) VALUES
('RULE_SLA_BONUS', 'Completed before due date', 20, 0),
('RULE_SLA_PENALTY', 'Completed after due date', 20, 1),
('RULE_QC_REWORK', 'Returned for correction', 15, 1),
('RULE_ERROR', 'Transaction Error/Mistake', 25, 1),
('RULE_INNOVATION', 'Innovation/Process Improvement Bonus', 50, 0);

INSERT INTO epm_badge_master (badge_name, description, icon_name) VALUES
('First Task', 'Completed first ERP transaction', 'IconMedal'),
('Centurion', 'Completed 100 Tasks', 'IconTrophy'),
('Zero Error', '100% Accuracy for a month', 'IconShieldCheck'),
('Speed Master', 'Completed 50 tasks before SLA', 'IconBolt');

-- 11. Register EPM Dashboard in BOS Pages
BEGIN TRY 
    INSERT INTO bos_pages (mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) 
    VALUES (15, 151, 'DB1300', 'My Performance (EPM)', 1, '/epm/dashboard', 'IconTrendingUp'); 
END TRY 
BEGIN CATCH 
END CATCH;
