package com.autonoma.erp.modules.master.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class MasterDataService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Cacheable(value = "masterCache", key = "'common'")
    public Map<String, Object> getCommonMasterData() {
        Map<String, Object> result = new HashMap<>();
        result.put("divisions", jdbcTemplate
                .queryForList("SELECT id, division_name as divisionName FROM AD_DIVISION WHERE status='ACTIVE'"));
        result.put("departments", jdbcTemplate.queryForList(
                "SELECT id, department_name as departmentName, category_id as categoryId, " +
                "CASE category_id WHEN 1 THEN 'QMS' WHEN 2 THEN 'HR' WHEN 3 THEN 'MANAGEMENT' ELSE 'MANAGEMENT' END as categoryName, " +
                "status FROM HR_DEPARTMENT WHERE status='ACTIVE'"));
        // Add more common masters as needed
        return result;
    }

    @Cacheable(value = "masterCache", key = "'product'")
    public Map<String, Object> getProductMasterData() {
        Map<String, Object> result = new HashMap<>();
        try {
            result.put("categories", jdbcTemplate.queryForList(
                    "SELECT GROUP_NAME as id, GROUP_NAME as categoryName FROM NPD_ITEM_GROUP WHERE STATUS=1"));
            result.put("productTypes", jdbcTemplate.queryForList(
                    "SELECT ITEM_TYPE as id, ITEM_TYPE as typeName FROM NPD_ITEM_TYPE WHERE STATUS='ACTIVE'"));
        } catch (Exception e) {
        }
        result.put("grades", jdbcTemplate.queryForList(
                "SELECT id, grade_code as gradeCode, grade_name as gradeName FROM HR_GRADE_DETAIL WHERE UPPER(status)='ACTIVE'"));
        return result;
    }

    @Cacheable(value = "masterCache", key = "'hr'")
    public Map<String, Object> getHrMasterData() {
        Map<String, Object> result = new HashMap<>();
        result.put("designations", jdbcTemplate.queryForList(
                "SELECT id, designation_name as designationName, is_active as status FROM HR_DESIGNATION WHERE is_active=1"));
        result.put("levels", jdbcTemplate.queryForList("SELECT id, level_name as levelName FROM HR_LEVEL"));
        result.put("employees", jdbcTemplate.queryForList(
                "SELECT e.id, e.employee_name as employeeName, " +
                        "COALESCE(NULLIF(e.old_emp_code, ''), e.emp_code) as empCode, " +
                        "e.old_emp_code as oldEmpCode, e.profile_upload as employeePhotoUpload, " +
                        "e.FROMWHERE as fromWhere, 'Active' as status, " +
                        "org.department_id as departmentId, org.emp_level_id as empLevelId, org.designation_id as designationId "
                        +
                        "FROM HR_EMPLOYEE e " +
                        "LEFT JOIN HR_EMPLOYEE_ORGANIZATION org ON e.id = org.employee_id " +
                        "WHERE e.status=(SELECT ID FROM AD_STATUS_MASTER WHERE UPPER(TRIM(NAME)) = 'ACTIVE') " +
                        "AND (e.FROMWHERE IS NULL OR UPPER(TRIM(e.FROMWHERE)) <> 'ATS') " +
                        "AND (NULLIF(e.emp_code, '') IS NOT NULL OR NULLIF(e.old_emp_code, '') IS NOT NULL)"));
        return result;
    }

    // Dynamic bulk lookup using caching for individual types
    @Cacheable(value = "masterCache", key = "#type", condition = "!#type.equalsIgnoreCase('MEETINGS')")
    public Object getLookupByType(String type) {
        switch (type.toUpperCase()) {
            case "DEPARTMENTS":
                return jdbcTemplate.queryForList(
                        "SELECT id, department_name as departmentName, department_mail_id as departmentMailId, category_id as categoryId, " +
                        "CASE category_id WHEN 1 THEN 'QMS' WHEN 2 THEN 'HR' WHEN 3 THEN 'MANAGEMENT' ELSE 'MANAGEMENT' END as categoryName, " +
                        "status FROM HR_DEPARTMENT WHERE status='ACTIVE'");
            case "DESIGNATIONS":
                return jdbcTemplate.queryForList(
                        "SELECT id, designation_name as designationName, sub_category_level as subCategoryLevel, is_active as status FROM HR_DESIGNATION WHERE is_active=1");
            case "TYPES":
            case "EMPLOYEE_TYPES":
                return jdbcTemplate.queryForList(
                        "SELECT id, type_name as typeName, description, status FROM HR_EMPLOYEE_TYPE");
            case "CATEGORIES":
                return jdbcTemplate.queryForList("SELECT id, category_name as categoryName FROM HR_CATEGORY_MASTER");
            case "LEVELS":
                return jdbcTemplate.queryForList("SELECT id, level_name as levelName FROM HR_LEVEL");
            case "DESIGNATION_LEVELS":
                return jdbcTemplate.queryForList(
                        "SELECT row_id as id, level as level, screening_level as screeningLevel FROM HR_DESIGNATION_LEVEL WHERE is_active = 1");
            case "AUDIT_CRITERIA":
                return jdbcTemplate.queryForList(
                        "SELECT c.id, c.seq_no as seqNo, c.clause, c.criteria_text as criteriaText, " +
                                "c.attachment_required as attachmentRequired, c.is_active as isActive, c.level, " +
                                "c.mandatory_criteria as mandatoryCriteria, " +
                                "(SELECT STRING_AGG(t.audit_type, ',') FROM QMS_AUDIT_CRITERIA_TYPE ct JOIN QMS_AUDIT_TYPE t ON ct.audit_type_id = t.id WHERE ct.audit_criteria_id = c.id) as auditType, "
                                +
                                "(SELECT STRING_AGG(dept.department_name, ',') FROM QMS_AUDIT_DEPARTMENT ad JOIN HR_DEPARTMENT dept ON ad.dept_id = dept.id WHERE ad.ref_id = c.id) as departments "
                                +
                                "FROM QMS_AUDIT_CRITERIA c WHERE c.is_active = 1");
            case "CUSTOMERS":
                return jdbcTemplate.queryForList(
                        "SELECT id, CODE as customerCode, LEDGER_NAME as customerName FROM FA_ACCOUNT_LEDGER WHERE IS_CUSTOMER = 1 AND (IS_ACTIVE = 1 OR IS_ACTIVE IS NULL)");
            case "CONTACTS":
                return jdbcTemplate.queryForList(
                        "SELECT id, group_name as groupName, contact_name as contactName, email_id as emailId, mobile_no as mobileNo, status FROM SM_CONTACT_MASTER WHERE status='Active'");
            case "AUDIT_AREA":
                return jdbcTemplate.queryForList(
                        "SELECT id, type, description, is_active as isActive, 'ACTIVE' as status FROM QMS_AUDIT_AREA WHERE IS_ACTIVE=1");
            case "PROCESS":
                return jdbcTemplate.queryForList(
                        "SELECT id, process_name as processName, process_cd as processCd, division, description, status FROM NPD_PROCESS WHERE status = 1");
            case "EMPLOYEES":
                return jdbcTemplate.queryForList(
                        "SELECT e.id as id, e.id as ID, e.employee_name as employeeName, " +
                                "COALESCE(NULLIF(e.old_emp_code, ''), e.emp_code) as empCode, " +
                                "e.emp_code as newEmpCode, " +
                                "e.old_emp_code as oldEmpCode, e.profile_upload as employeePhotoUpload, " +
                                "e.FROMWHERE as fromWhere, 'Active' as status, "
                                +
                                "ind.induction_status as inductionStatus, " +
                                "o.department_id as departmentId, o.designation_id as designationId, o.emp_level_id as empLevelId, o.office_mail as officeMail, " +
                                "CASE WHEN a.is_chaired = 'YES' OR (a.chaired_type IS NOT NULL AND LTRIM(RTRIM(a.chaired_type)) <> '') THEN 'YES' ELSE 'NO' END as isChaired, " +
                                "CASE WHEN a.is_host = 'YES' OR (a.host_type IS NOT NULL AND LTRIM(RTRIM(a.host_type)) <> '') THEN 'YES' ELSE 'NO' END as isHost, " +
                                "CASE WHEN a.is_participants = 'YES' OR (a.participants_type IS NOT NULL AND LTRIM(RTRIM(a.participants_type)) <> '') THEN 'YES' ELSE 'NO' END as isParticipants, " +
                                "a.chaired_type as chairedType, a.host_type as hostType, a.participants_type as participantsType, "
                                +
                                "a.is_interviewer as isInterviewer, " +
                                "CASE WHEN a.is_auditee = '1' OR UPPER(TRIM(CAST(a.is_auditee AS NVARCHAR(10)))) = 'YES' OR UPPER(TRIM(CAST(a.is_auditee AS NVARCHAR(10)))) = 'TRUE' OR (a.auditee_type IS NOT NULL AND LTRIM(RTRIM(a.auditee_type)) <> '') THEN 'YES' ELSE 'NO' END as isAuditee, " +
                                "a.auditee_type as auditeeType, " +
                                "CASE WHEN a.is_auditor = '1' OR UPPER(TRIM(CAST(a.is_auditor AS NVARCHAR(10)))) = 'YES' OR UPPER(TRIM(CAST(a.is_auditor AS NVARCHAR(10)))) = 'TRUE' OR (a.auditor_type IS NOT NULL AND LTRIM(RTRIM(a.auditor_type)) <> '') THEN 'YES' ELSE 'NO' END as isAuditor, " +
                                "a.auditor_type as auditorType, " +
                                "CASE WHEN a.is_ncr_approver = '1' OR UPPER(TRIM(CAST(a.is_ncr_approver AS NVARCHAR(10)))) = 'YES' OR UPPER(TRIM(CAST(a.is_ncr_approver AS NVARCHAR(10)))) = 'TRUE' OR (a.ncr_approver_type IS NOT NULL AND LTRIM(RTRIM(a.ncr_approver_type)) <> '') THEN 'YES' ELSE 'NO' END as isNcrApprover, " +
                                "a.ncr_approver_type as ncrApproverType " +
                                "FROM HR_EMPLOYEE e " +
                                "LEFT JOIN HR_EMPLOYEE_ORGANIZATION o ON e.id = o.employee_id " +
                                "LEFT JOIN HR_EMPLOYEE_ABILITY a ON e.id = a.employee_id " +
                                "LEFT JOIN HR_EMPLOYEE_INDUCTION ind ON e.id = ind.employee_id " +
                                "WHERE e.status=(SELECT ID FROM AD_STATUS_MASTER WHERE UPPER(TRIM(NAME)) = 'ACTIVE') " +
                                "AND (e.FROMWHERE IS NULL OR UPPER(TRIM(e.FROMWHERE)) <> 'ATS') " +
                                "AND (NULLIF(e.emp_code, '') IS NOT NULL OR NULLIF(e.old_emp_code, '') IS NOT NULL)");

            case "PAYROLL_EMPLOYEES":
                return jdbcTemplate.queryForList(
                        "SELECT e.id as id, e.id as ID, e.employee_name as employeeName, " +
                                "COALESCE(NULLIF(e.old_emp_code, ''), e.emp_code) as empCode, " +
                                "e.emp_code as newEmpCode, " +
                                "e.old_emp_code as oldEmpCode, e.profile_upload as employeePhotoUpload, " +
                                "e.FROMWHERE as fromWhere, " +
                                "CASE WHEN st.NAME = 'Active' THEN 'Active' ELSE 'Exited' END as status, " +
                                "o.department_id as departmentId, o.designation_id as designationId, o.emp_level_id as empLevelId, o.office_mail as officeMail " +
                                "FROM HR_EMPLOYEE e " +
                                "LEFT JOIN AD_STATUS_MASTER st ON e.status = st.ID " +
                                "LEFT JOIN HR_EMPLOYEE_ORGANIZATION o ON e.id = o.employee_id " +
                                "LEFT JOIN HR_EMPLOYEE_SCHEDULING s ON e.id = s.employee_id " +
                                "WHERE (UPPER(TRIM(st.NAME)) = 'ACTIVE' " +
                                "OR (s.exit_date >= DATEADD(month, -1, DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0)) " +
                                "AND s.exit_date < DATEADD(month, 1, DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0)))) " +
                                "AND (e.FROMWHERE IS NULL OR UPPER(TRIM(e.FROMWHERE)) <> 'ATS') " +
                                "AND (NULLIF(e.emp_code, '') IS NOT NULL OR NULLIF(e.old_emp_code, '') IS NOT NULL)");

            case "USERS":
                return jdbcTemplate.queryForList(
                        "SELECT USER_ID as userId, EMP_ID as empId FROM AD_USER_CREDENTIAL WHERE IS_ACTIVE=1");
            case "GRADES":
                return jdbcTemplate.queryForList(
                        "SELECT id, grade_code as gradeCode, grade_name as gradeName FROM HR_GRADE_DETAIL WHERE UPPER(status)='ACTIVE'");
            case "DIVISIONS":
                return jdbcTemplate
                        .queryForList("SELECT id, division_name as divisionName FROM AD_DIVISION WHERE is_active=1");
            case "SEGMENTS":
                return jdbcTemplate.queryForList(
                        "SELECT id, segment_name as segmentName FROM SM_SEGMENT WITH (NOLOCK) WHERE status='ACTIVE'");
            case "SUB_SEGMENTS":
                return jdbcTemplate.queryForList(
                        "SELECT id, sub_segment_name as subSegmentName FROM SM_SUB_SEGMENT WITH (NOLOCK) WHERE status='ACTIVE'");
            case "AUDIT_TYPE":
                return jdbcTemplate
                        .queryForList(
                                "SELECT t.id, t.audit_type as auditType, t.criteria_type as criteriaType, t.criteria_min_count as criteriaMinCount, t.customer_audit_area as customerAuditArea, "
                                        +
                                        "(SELECT STRING_AGG(a.description, ', ') FROM QMS_AUDIT_TYPE_AREA ta JOIN QMS_AUDIT_AREA a ON ta.audit_area_id = a.id WHERE ta.audit_type_id = t.id) as auditArea "
                                        +
                                        "FROM qms_audit_type t WHERE t.is_active=1");
            case "MEETINGS": {
                return jdbcTemplate.queryForList(
                        "SELECT m.id, m.meeting_name as meetingName, m.meeting_prefix as meetingPrefix, m.meeting_description as meetingDescription, m.meeting_agenda as meetingAgenda "
                                +
                                "FROM qms_meeting_master m " +
                                "WHERE m.is_active = 1");
            }
            case "MY_MEETINGS": {
                String currentUserId = null;
                try {
                    currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
                } catch (Exception e) {
                }

                Long loggedInEmpId = null;
                if (currentUserId != null && !currentUserId.trim().isEmpty()) {
                    try {
                        java.util.List<Long> empIds = jdbcTemplate.queryForList(
                                "SELECT EMP_ID FROM AD_USER_CREDENTIAL WHERE UPPER(USER_ID) = UPPER(?)",
                                Long.class,
                                currentUserId);
                        if (empIds != null && !empIds.isEmpty()) {
                            loggedInEmpId = empIds.get(0);
                        }
                    } catch (Exception e) {
                    }
                }

                if (loggedInEmpId == null) {
                    return new java.util.ArrayList<>();
                } else {
                    return jdbcTemplate.queryForList(
                            "SELECT DISTINCT m.id, m.meeting_name as meetingName, m.meeting_prefix as meetingPrefix, m.meeting_description as meetingDescription, m.meeting_agenda as meetingAgenda "
                                    +
                                    "FROM qms_meeting_master m " +
                                    "INNER JOIN QMS_MEETING_EMPLOYEE_MAPPING map ON m.id = map.meeting_id " +
                                    "WHERE m.is_active = 1 AND map.employee_id = ?",
                            loggedInEmpId);
                }
            }
            case "DELIVERY_TERMS":
                return jdbcTemplate.queryForList(
                        "SELECT id, description as deliveryTerms, code as termCode FROM MST_TERMS_MASTER WHERE status = 1 AND UPPER(type) LIKE '%DELIVERY%'");
            case "PAYMENT_TERMS":
                return jdbcTemplate.queryForList(
                        "SELECT id, description as paymentTerms, code as termCode FROM MST_TERMS_MASTER WHERE status = 1 AND UPPER(type) = 'PAYMENT'");
            case "CURRENCIES":
                return jdbcTemplate.queryForList("SELECT id, currency FROM SM_CURRENCY WHERE status='Active'");
            case "COUNTRIES":
                return jdbcTemplate
                        .queryForList("SELECT id, country_name as countryName FROM MST_COUNTRY WHERE status='Active'");
            case "STATES":
                return jdbcTemplate
                        .queryForList("SELECT id, state_name as stateName FROM MST_STATE WHERE status='Active'");
            case "TYPE_OF_SERVICE":
                return jdbcTemplate.queryForList(
                        "SELECT id, type_of_service as typeOfService FROM SM_TYPE_OF_SERVICE WHERE status='Active'");
            case "INVENTORY_TYPES":
                return jdbcTemplate.queryForList(
                        "SELECT CODE as code, TYPE_NAME as typeName FROM NPD_INVENTORY_TYPE WHERE STATUS = 1 ORDER BY TYPE_NAME");
            case "ITEM_GROUPS":
                return jdbcTemplate.queryForList(
                        "SELECT GROUP_NAME as groupName FROM NPD_ITEM_GROUP WHERE STATUS = 1 ORDER BY GROUP_NAME");
            case "ITEM_CATEGORIES":
                return jdbcTemplate.queryForList(
                        "SELECT ITEM_TYPE as itemType FROM NPD_ITEM_TYPE WHERE STATUS = 1 ORDER BY ITEM_TYPE");
            case "ITEM_SUB_CATEGORIES":
                return jdbcTemplate.queryForList(
                        "SELECT SUB_TYPE as subType FROM NPD_ITEM_SUBTYPE WHERE STATUS = 1 ORDER BY SUB_TYPE");
            case "OEMS":
                return jdbcTemplate.queryForList(
                        "SELECT OEM_SHORT_NAME as oemName FROM NPD_OEM WHERE STATUS = 1 ORDER BY OEM_SHORT_NAME");
            case "CAPACITIES":
                return jdbcTemplate.queryForList(
                        "SELECT UOM as uom, CAPACITY_VAL as capacityVal FROM NPD_CAPACITY ORDER BY CAPACITY_VAL");
            case "HSNS":
                return jdbcTemplate.queryForList(
                        "SELECT HSN_CODE as hsnCode, DECRIPTION as description FROM MST_HSN_MASTER ORDER BY HSN_CODE");
            case "ELEMENTS":
                return jdbcTemplate.queryForList(
                        "SELECT CODE as code, TYPE_NAME as typeName FROM NPD_MATERIAL_TYPE WHERE STATUS = 1 ORDER BY CODE");
            case "MATERIAL_GRADES":
                return jdbcTemplate.queryForList(
                        "SELECT CODE as code, GRADE_NAME as gradeName FROM NPD_MATERIAL_GRADE WHERE STATUS = 1 ORDER BY CODE");
            case "SHAPES":
                return jdbcTemplate.queryForList(
                        "SELECT CODE as code, SHAPE_NAME as shapeName FROM NPD_SHAPE_MASTER WHERE STATUS = 1 ORDER BY CODE");
            case "CONDITIONS":
                return jdbcTemplate.queryForList(
                        "SELECT CODE as code, CONDITION as conditionName FROM NPD_MATERIAL_CONDITIONS WHERE STATUS = 1 ORDER BY CODE");
            case "UOMS":
                return jdbcTemplate.queryForList(
                        "SELECT UOM_CODE as uomCode, UOM_DESCRIPTION as uomName FROM MST_UOM WHERE status = 'ACTIVE' ORDER BY UOM_CODE");
            case "MODELS":
                return jdbcTemplate
                        .queryForList("SELECT MODEL_NO as modelNo FROM NPD_MODEL WHERE STATUS = 1 ORDER BY MODEL_NO");
            default:
                return null;
        }
    }
}
