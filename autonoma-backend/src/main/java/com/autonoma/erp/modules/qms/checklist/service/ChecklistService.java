package com.autonoma.erp.modules.qms.checklist.service;

import AppUtil.AppConstants;
import com.autonoma.erp.model.admin.UserCredential;
import com.autonoma.erp.util.SecurityUtils;
import com.autonoma.erp.util.AttachmentUtil;

import com.autonoma.erp.modules.qms.checklist.entity.ChecklistAssignment;
import com.autonoma.erp.modules.qms.checklist.entity.ChecklistClosed;
import com.autonoma.erp.modules.qms.checklist.entity.ChecklistDepartment;
import com.autonoma.erp.modules.qms.checklist.entity.ChecklistVerification;
import com.autonoma.erp.modules.hr.orgstructure.entity.Department;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeManagerMapping;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.holiday.entity.HrHolidayMaster;
import com.autonoma.erp.modules.qms.checklist.entity.MasterChecklist;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import com.autonoma.erp.modules.qms.checklist.repository.ChecklistAssignmentRepository;
import com.autonoma.erp.modules.qms.checklist.repository.ChecklistClosedRepository;
import com.autonoma.erp.modules.qms.checklist.repository.ChecklistDepartmentRepository;
import com.autonoma.erp.modules.hr.orgstructure.repository.DepartmentRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeManagerMappingRepository;
import com.autonoma.erp.modules.hr.holiday.repository.HrHolidayMasterRepository;
import com.autonoma.erp.modules.qms.checklist.repository.MasterChecklistRepository;
import com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository;

import com.autonoma.erp.repository.admin.UserRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.HashSet;

@Service
@lombok.extern.slf4j.Slf4j
public class ChecklistService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ChecklistService.class);

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Autowired
    private MasterChecklistRepository masterRepo;

    @Autowired
    private ChecklistAssignmentRepository assignRepo;

    @Autowired
    private HrHolidayMasterRepository holidayRepo;

    @Autowired
    private StatusMasterRepository statusRepo;

    @Autowired
    private ChecklistDepartmentRepository deptRepo;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.autonoma.erp.repository.admin.BosUserPageAuthRepository bosUserPageAuthRepository;

    @Autowired
    private com.autonoma.erp.repository.admin.BosPageRepository bosPageRepository;

    @Autowired
    private ChecklistClosedRepository closedRepo;

    @Autowired
    private EmployeeMasterRepository employeeMasterRepository;

    @Autowired
    private com.autonoma.erp.modules.hr.employee.repository.EmployeeManagerMappingRepository managerMappingRepository;

    @Autowired
    @org.springframework.context.annotation.Lazy
    private ChecklistAutoAssignmentService checklistAutoAssignmentService;

    @Autowired
    private com.autonoma.erp.modules.platform.notification.service.NotificationService notificationService;

    @Autowired
    private com.autonoma.erp.modules.qms.checklist.repository.ChecklistAssignmentLogRepository logRepo;

    @Autowired
    private com.autonoma.erp.modules.qms.checklist.repository.ChecklistAcknowledgementRepository ackRepo;

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    private com.autonoma.erp.service.DatabaseFeatureService databaseFeatureService;

    // --- Master Checklist ---

    public String getNextSequenceNumber() {
        return masterRepo.findFirstByOrderByIdDesc()
                .map(m -> String.valueOf(m.getId() + 1))
                .orElse("1");
    }

    private String incrementSequence(String latest, String prefix) {
        if (latest == null || latest.isEmpty())
            return prefix + "001";
        try {
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\d+$");
            java.util.regex.Matcher matcher = pattern.matcher(latest.trim());
            if (matcher.find()) {
                String numericPart = matcher.group();
                int num = Integer.parseInt(numericPart);
                int length = Math.max(numericPart.length(), 3);
                String nextNum = String.format("%0" + length + "d", num + 1);
                return latest.substring(0, matcher.start()).trim() + nextNum;
            }
            return prefix + "001";
        } catch (Exception e) {
            return prefix + "001";
        }
    }

    /**
     * Retrieves master checklists based on comprehensive filtering criteria.
     *
     * @param status       The lifecycle status of the checklist (e.g., Active,
     *                     Inactive).
     * @param category     The functional category (RENEWAL, CHECK LIST).
     * @param department   Optional department filter.
     * @param searchBy     The field to perform textual search on.
     * @param searchValue  The textual search term.
     * @param dualCheck    Filter for dual verification requirements.
     * @param verifyStatus Filter by the current verification workflow state.
     * @param pageable     Pagination and sorting configuration.
     * @return A paginated result set of MasterChecklist entities.
     */
    @Transactional(readOnly = true, isolation = org.springframework.transaction.annotation.Isolation.READ_UNCOMMITTED)
    public Page<MasterChecklist> getAllChecklists(String status, String taskStatus, String category, String department,
            String searchBy,
            String searchValue, String dualCheck, String verifyStatus,
            String seqNo, String frequency, String checkingPoint, String description,
            String stockLink, String photoRequired, String carryForward,
            Date fromDate, Date toDate, String considerDate, Date considerDateValue,
            String taskType, String currentUser, String assignedTo,
            Pageable pageable) {
        Date queryFromDate = fromDate;
        Date queryToDate = toDate;

        if (queryFromDate != null) {
            java.util.Calendar cal = java.util.Calendar.getInstance(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
            cal.setTime(queryFromDate);
            cal.set(java.util.Calendar.HOUR_OF_DAY, 0);
            cal.set(java.util.Calendar.MINUTE, 0);
            cal.set(java.util.Calendar.SECOND, 0);
            cal.set(java.util.Calendar.MILLISECOND, 0);
            queryFromDate = cal.getTime();
        }
        if (queryToDate != null) {
            java.util.Calendar cal = java.util.Calendar.getInstance(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
            cal.setTime(queryToDate);
            cal.set(java.util.Calendar.HOUR_OF_DAY, 23);
            cal.set(java.util.Calendar.MINUTE, 59);
            cal.set(java.util.Calendar.SECOND, 59);
            cal.set(java.util.Calendar.MILLISECOND, 999);
            queryToDate = cal.getTime();
        }

        Long userEmpIdVar = null;
        boolean isUserAdminVar = false;
        if (currentUser != null && !currentUser.trim().isEmpty()) {
            String origTenant = com.autonoma.erp.config.TenantContextHolder.getTenantId();
            try {
                com.autonoma.erp.config.TenantContextHolder.setTenantId(AppUtil.AppConstants.DEFAULT_DB_SOURCE_NAME);
                isUserAdminVar = userRepository.findByUserId(currentUser)
                        .map(u -> u.getUserLevel() != null
                                && u.getUserLevel() >= AppUtil.AppConstants.USER_LEVEL_BOS_ADMIN)
                        .orElse(false);

                com.autonoma.erp.model.admin.UserCredential credential = userRepository
                        .findByUserId(currentUser).orElse(null);
                if (credential != null) {
                    userEmpIdVar = credential.getEmpId();
                }
            } finally {
                com.autonoma.erp.config.TenantContextHolder.setTenantId(origTenant);
            }
            if (userEmpIdVar == null) {
                EmployeeMaster empFallback = employeeMasterRepository.findByEmpCodeOrName(currentUser)
                        .orElse(null);
                if (empFallback != null) {
                    userEmpIdVar = empFallback.getId();
                }
            }
        }
        final Long finalUserEmpId = userEmpIdVar;
        final boolean isUserAdminFinal = isUserAdminVar;
        final boolean isSuperBoss = "SUPER BOSS".equalsIgnoreCase(currentUser) || "admin".equalsIgnoreCase(currentUser);

        boolean hasManager = false;
        boolean hasCompany = false;
        if (currentUser != null && !currentUser.trim().isEmpty()) {
            String origTenant = com.autonoma.erp.config.TenantContextHolder.getTenantId();
            try {
                com.autonoma.erp.config.TenantContextHolder.setTenantId(AppUtil.AppConstants.DEFAULT_DB_SOURCE_NAME);
                com.autonoma.erp.model.admin.BosPage pageObj = bosPageRepository.findByPageCode("QM1110").orElse(null);
                if (pageObj != null) {
                    com.autonoma.erp.model.admin.BosUserPageAuth auth = bosUserPageAuthRepository
                            .findByUserIdAndPageId(currentUser, pageObj.getPageId());
                    if (auth != null) {
                        hasManager = Integer.valueOf(1).equals(auth.getManager());
                        hasCompany = Integer.valueOf(1).equals(auth.getAdditional1());
                    }
                }
            } catch (Exception e) {
                log.error("Failed to check page permission for checklist", e);
            } finally {
                com.autonoma.erp.config.TenantContextHolder.setTenantId(origTenant);
            }
        }

        boolean isAuthorizedForCompany = isUserAdminFinal || isSuperBoss || hasCompany;
        boolean isAuthorizedForTeam = isUserAdminFinal || isSuperBoss || hasManager || hasCompany;

        String tempTaskType = taskType;
        if (tempTaskType == null || tempTaskType.trim().isEmpty()) {
            tempTaskType = "All";
        }
        if ("Company".equalsIgnoreCase(tempTaskType) && !isAuthorizedForCompany) {
            tempTaskType = isAuthorizedForTeam ? "Team" : "Mine";
        }
        if ("Team".equalsIgnoreCase(tempTaskType) && !isAuthorizedForTeam) {
            tempTaskType = "Mine";
        }
        final String effectiveTaskType = tempTaskType;

        // Restrict department-wise visibility for non-admin / non-superboss users
        String tempDepartment = department;
        if (tempDepartment == null || tempDepartment.trim().isEmpty()) {
            if (!isUserAdminFinal && !isSuperBoss && !isAuthorizedForCompany && !isAuthorizedForTeam) {
                String userDept = null;
                if (finalUserEmpId != null) {
                    EmployeeMaster emp = employeeMasterRepository.findById(finalUserEmpId).orElse(null);
                    if (emp != null && emp.getDepartment() != null) {
                        userDept = emp.getDepartment().getDepartmentName();
                    }
                }
                if (userDept != null && !userDept.trim().isEmpty()) {
                    tempDepartment = userDept;
                }
            }
        }
        final String resolvedDepartment = tempDepartment;

        final List<Long> reporteeIds = new ArrayList<>();
        if (("Team".equalsIgnoreCase(effectiveTaskType) || "Company".equalsIgnoreCase(effectiveTaskType))
                && finalUserEmpId != null) {
            reporteeIds.add(finalUserEmpId);
            try {
                if ("Team".equalsIgnoreCase(effectiveTaskType)) {
                    String sql = "WITH TeamCTE AS ( " +
                            "    SELECT EMP_ID FROM HR_EMPLOYEE_MANAGER_MAPPING WHERE VERTICAL_HEAD_ID = :empId AND STATUS = 'Active' "
                            +
                            "    UNION ALL " +
                            "    SELECT m.EMP_ID FROM HR_EMPLOYEE_MANAGER_MAPPING m " +
                            "    INNER JOIN TeamCTE t ON m.VERTICAL_HEAD_ID = t.EMP_ID " +
                            "    WHERE m.STATUS = 'Active' " +
                            ") " +
                            "SELECT DISTINCT EMP_ID FROM TeamCTE";
                    List<?> rawList = entityManager.createNativeQuery(sql)
                            .setParameter("empId", finalUserEmpId)
                            .getResultList();
                    for (Object val : rawList) {
                        if (val != null) {
                            reporteeIds.add(((Number) val).longValue());
                        }
                    }
                } else {
                    String sql = "WITH CompanyCTE AS ( " +
                            "    SELECT EMP_ID FROM HR_EMPLOYEE_MANAGER_MAPPING WHERE (VERTICAL_HEAD_ID = :empId OR HOME_MANAGER_ID = :empId OR BUSINESS_MANAGER_ID = :empId OR HR_ID = :empId) AND STATUS = 'Active' "
                            +
                            "    UNION ALL " +
                            "    SELECT m.EMP_ID FROM HR_EMPLOYEE_MANAGER_MAPPING m " +
                            "    INNER JOIN CompanyCTE c ON (m.VERTICAL_HEAD_ID = c.EMP_ID OR m.HOME_MANAGER_ID = c.EMP_ID OR m.BUSINESS_MANAGER_ID = c.EMP_ID OR m.HR_ID = c.EMP_ID) "
                            +
                            "    WHERE m.STATUS = 'Active' " +
                            ") " +
                            "SELECT DISTINCT EMP_ID FROM CompanyCTE";
                    List<?> rawList = entityManager.createNativeQuery(sql)
                            .setParameter("empId", finalUserEmpId)
                            .getResultList();
                    for (Object val : rawList) {
                        if (val != null) {
                            reporteeIds.add(((Number) val).longValue());
                        }
                    }
                }
            } catch (Exception e) {
                log.error("Failed to fetch recursive reportees for taskType: " + effectiveTaskType, e);
            }
        }

        if (searchValue != null && !searchValue.trim().isEmpty()) {
            Long cleanStatusVal = null;
            if (status != null && !"All".equalsIgnoreCase(status) && !status.trim().isEmpty()) {
                String normName = status.trim().toUpperCase();
                if ("IN ACTIVE".equals(normName))
                    normName = "INACTIVE";
                cleanStatusVal = statusRepo.findByNameIgnoreCase(normName).map(StatusMaster::getId).orElse(null);
            }
            String cleanCategory = (category == null || "All".equalsIgnoreCase(category)) ? null : category;
            Long cleanVerifyStatusVal = null;
            if (verifyStatus != null && !"All".equalsIgnoreCase(verifyStatus) && !verifyStatus.trim().isEmpty()) {
                String normName = verifyStatus.trim().toUpperCase();
                if ("PENDING FOR VERIFY".equals(normName) || "PENDING FOR VERIFICATION".equals(normName))
                    normName = "TO BE VERIFIED";
                cleanVerifyStatusVal = statusRepo.findByNameIgnoreCase(normName).map(StatusMaster::getId).orElse(null);
            }

            Page<MasterChecklist> pageResult;
            if (databaseFeatureService.isFtsInstalled()) {
                String ftsSearch = com.autonoma.erp.util.SearchQueryUtil.formatFtsSearchTerm(searchValue);
                if (ftsSearch != null) {
                    pageResult = masterRepo.searchChecklistsFts(cleanStatusVal, cleanCategory, cleanVerifyStatusVal,
                            ftsSearch,
                            pageable);
                } else {
                    pageResult = new org.springframework.data.domain.PageImpl<>(new ArrayList<>(), pageable, 0);
                }
            } else {
                String cleanSearch = searchValue.toLowerCase().trim();
                pageResult = masterRepo.searchChecklistsLike(cleanStatusVal, cleanCategory, cleanVerifyStatusVal,
                        cleanSearch,
                        pageable);
            }

            if (pageResult.getContent() != null) {
                populateMasterChecklistFilesBatch(pageResult.getContent());
            }
            return pageResult;
        }

        final Date finalFromDate = queryFromDate;
        final Date finalToDate = queryToDate;

        Page<MasterChecklist> page = masterRepo.findAll((root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Date Range and Consider Date Filtering predicates
            if ("Yes".equalsIgnoreCase(considerDate)) {
                Expression<Date> dateExpr = root.get("createdDate");
                if (finalFromDate != null) {
                    predicates.add(cb.greaterThanOrEqualTo(dateExpr, finalFromDate));
                }
                if (finalToDate != null) {
                    predicates.add(cb.lessThanOrEqualTo(dateExpr, finalToDate));
                }
            }

            if (dualCheck != null && !dualCheck.isEmpty() && !dualCheck.equals("All")) {
                predicates.add(cb.equal(root.get("dualCheck"), dualCheck));
            }

            if (verifyStatus != null && !verifyStatus.isEmpty() && !verifyStatus.equals("All")) {
                String norm = verifyStatus.trim().toUpperCase();
                if ("PENDING FOR VERIFY".equals(norm) || "TO BE VERIFIED".equals(norm)
                        || "PENDING FOR VERIFICATION".equals(norm)) {
                    predicates.add(cb.or(
                            cb.equal(root.get("verifyStatusObj").get("name"), "TO BE VERIFIED"),
                            cb.isNull(root.get("verifyStatusObj"))));
                } else {
                    predicates.add(cb.equal(root.get("verifyStatusObj").get("name"), norm));
                }
            }

            if (status != null && !status.equals("All") && !status.isEmpty()) {
                String norm = status.trim().toUpperCase();
                if ("IN ACTIVE".equals(norm) || "INACTIVE".equals(norm)) {
                    predicates.add(cb.or(
                            cb.equal(root.get("statusObj").get("name"), "INACTIVE"),
                            cb.isNull(root.get("statusObj"))));
                } else if ("ACTIVE".equals(norm)) {
                    predicates.add(cb.equal(root.get("statusObj").get("name"), "ACTIVE"));
                } else {
                    predicates.add(cb.equal(root.get("statusObj").get("name"), norm));
                }
            }

            if (taskStatus != null && !taskStatus.equals("All") && !taskStatus.isEmpty()) {
                Subquery<Long> assignSub = query.subquery(Long.class);
                Root<ChecklistAssignment> assignRoot = assignSub.from(ChecklistAssignment.class);
                assignSub.select(assignRoot.get("checklist").get("id"));
                assignSub.where(cb.equal(assignRoot.get("checklist").get("id"), root.get("id")));

                if ("Assigned".equalsIgnoreCase(taskStatus)) {
                    predicates.add(root.get("id").in(assignSub));
                } else if ("Unassigned".equalsIgnoreCase(taskStatus) || "Un assigned".equalsIgnoreCase(taskStatus)) {
                    predicates.add(cb.not(root.get("id").in(assignSub)));
                }
            }

            if (category != null && !category.equals("All")) {
                if ("CHECK LIST".equalsIgnoreCase(category) || "CHECKLIST".equalsIgnoreCase(category)) {
                    predicates.add(root.get("category").in("CHECK LIST", "CHECKLIST"));
                } else {
                    predicates.add(cb.equal(root.get("category"), category));
                }
            }

            if (assignedTo != null && !assignedTo.trim().isEmpty() && !"All".equalsIgnoreCase(assignedTo)) {
                Long targetMemberId = resolveEmployee(assignedTo)
                        .map(EmployeeMaster::getId)
                        .orElse(null);
                if (targetMemberId != null) {
                    final Long finalTargetMemberId = targetMemberId;

                    Subquery<Long> empAssignSub = query.subquery(Long.class);
                    Root<ChecklistAssignment> empAssignRoot = empAssignSub.from(ChecklistAssignment.class);
                    empAssignSub.select(empAssignRoot.get("checklist").get("id"));

                    List<Predicate> subPreds = new ArrayList<>();
                    subPreds.add(cb.equal(empAssignRoot.get("checklist").get("id"), root.get("id")));

                    Optional<EmployeeMaster> empObject = employeeMasterRepository.findById(finalTargetMemberId);
                    if (empObject.isPresent()) {
                        EmployeeMaster emp = empObject.get();
                        List<Predicate> empMatchPreds = new ArrayList<>();
                        empMatchPreds.add(cb.equal(empAssignRoot.get("assignedTo"), String.valueOf(emp.getId())));
                        if (emp.getEmpCode() != null) {
                            empMatchPreds.add(cb.equal(cb.lower(empAssignRoot.get("assignedTo")),
                                    emp.getEmpCode().toLowerCase().trim()));
                        }
                        if (emp.getEmployeeName() != null) {
                            empMatchPreds.add(cb.equal(cb.lower(empAssignRoot.get("assignedTo")),
                                    emp.getEmployeeName().toLowerCase().trim()));
                        }
                        subPreds.add(cb.or(empMatchPreds.toArray(new Predicate[0])));
                    } else {
                        subPreds.add(cb.equal(empAssignRoot.get("assignedTo"), String.valueOf(finalTargetMemberId)));
                    }

                    empAssignSub.where(subPreds.toArray(new Predicate[0]));

                    predicates.add(cb.or(
                            cb.equal(root.get("primaryEmployee").get("id"), finalTargetMemberId),
                            cb.equal(root.get("secondaryEmployee").get("id"), finalTargetMemberId),
                            cb.equal(root.get("tertiaryEmployee").get("id"), finalTargetMemberId),
                            root.get("id").in(empAssignSub)));
                }
            } else if (!"Unassigned".equalsIgnoreCase(taskStatus) && !"Un assigned".equalsIgnoreCase(taskStatus)) {
                if ("Mine".equalsIgnoreCase(effectiveTaskType)) {
                    if (finalUserEmpId != null) {
                        Subquery<Long> empAssignSub = query.subquery(Long.class);
                        Root<ChecklistAssignment> empAssignRoot = empAssignSub.from(ChecklistAssignment.class);
                        empAssignSub.select(empAssignRoot.get("checklist").get("id"));
                        empAssignSub.where(cb.and(
                                cb.equal(empAssignRoot.get("checklist").get("id"), root.get("id")),
                                cb.equal(empAssignRoot.get("assignedTo"), String.valueOf(finalUserEmpId))));

                        predicates.add(cb.or(
                                cb.equal(root.get("primaryEmployee").get("id"), finalUserEmpId),
                                cb.equal(root.get("secondaryEmployee").get("id"), finalUserEmpId),
                                cb.equal(root.get("tertiaryEmployee").get("id"), finalUserEmpId),
                                root.get("id").in(empAssignSub)));
                    }
                } else if ("Team".equalsIgnoreCase(effectiveTaskType)) {
                    if (!reporteeIds.isEmpty()) {
                        List<String> reporteeStrIds = reporteeIds.stream().map(String::valueOf).toList();
                        Subquery<Long> empAssignSub = query.subquery(Long.class);
                        Root<ChecklistAssignment> empAssignRoot = empAssignSub.from(ChecklistAssignment.class);
                        empAssignSub.select(empAssignRoot.get("checklist").get("id"));
                        empAssignSub.where(cb.and(
                                cb.equal(empAssignRoot.get("checklist").get("id"), root.get("id")),
                                empAssignRoot.get("assignedTo").in(reporteeStrIds)));

                        predicates.add(cb.or(
                                root.get("primaryEmployee").get("id").in(reporteeIds),
                                root.get("secondaryEmployee").get("id").in(reporteeIds),
                                root.get("tertiaryEmployee").get("id").in(reporteeIds),
                                root.get("id").in(empAssignSub)));
                    } else {
                        predicates.add(cb.disjunction());
                    }
                }
            }

            if (resolvedDepartment != null && !resolvedDepartment.isEmpty()) {
                Subquery<Long> deptSub = query.subquery(Long.class);
                Root<ChecklistDepartment> deptRoot = deptSub.from(ChecklistDepartment.class);
                Join<ChecklistDepartment, Department> deptObjJoin = deptRoot.join("department");
                deptSub.select(deptRoot.get("checklist").get("id"));
                deptSub.where(cb.equal(deptObjJoin.get("departmentName"), resolvedDepartment));
                predicates.add(root.get("id").in(deptSub));
            }

            if (seqNo != null && !seqNo.isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("seqNo")), "%" + seqNo.toLowerCase() + "%"));
            }

            if (frequency != null && !frequency.isEmpty() && !frequency.equals("All")) {
                predicates.add(cb.equal(root.get("frequency"), frequency));
            }

            if (checkingPoint != null && !checkingPoint.isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("checkingPoint")), "%" + checkingPoint.toLowerCase() + "%"));
            }

            if (description != null && !description.isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("description")), "%" + description.toLowerCase() + "%"));
            }

            if (stockLink != null && !stockLink.isEmpty() && !stockLink.equals("All")) {
                predicates.add(cb.equal(root.get("stockLink"), stockLink));
            }

            if (photoRequired != null && !photoRequired.isEmpty() && !photoRequired.equals("All")) {
                predicates.add(cb.equal(root.get("photoRequired"), photoRequired));
            }

            if (carryForward != null && !carryForward.isEmpty() && !carryForward.equals("All")) {
                predicates.add(cb.equal(root.get("carryForward"), carryForward));
            }

            if (searchValue != null && !searchValue.isEmpty()) {
                String searchTerm = "%" + searchValue.toLowerCase() + "%";
                if (searchBy != null && !searchBy.isEmpty()) {
                    if (searchBy.contains(".")) {
                        String[] parts = searchBy.split("\\.");
                        Path<Object> p = root.get(parts[0]);
                        for (int i = 1; i < parts.length; i++) {
                            p = p.get(parts[i]);
                        }
                        predicates.add(cb.like(cb.lower(p.as(String.class)), searchTerm));
                    } else {
                        // Safely cast to string for SQL Server compatibility
                        String field = searchBy;
                        if ("createdBy".equals(searchBy))
                            field = "createdUser";
                        else if ("updatedBy".equals(searchBy))
                            field = "updatedUser";
                        else if ("createdAt".equals(searchBy))
                            field = "createdDate";
                        else if ("updatedAt".equals(searchBy))
                            field = "updatedDate";
                        predicates.add(cb.like(cb.lower(root.get(field).as(String.class)), searchTerm));
                    }
                } else {
                    List<Predicate> orPredicates = new ArrayList<>();
                    orPredicates.add(cb.like(cb.lower(root.get("seqNo").as(String.class)), searchTerm));
                    orPredicates.add(cb.like(cb.lower(root.get("checkingPoint").as(String.class)), searchTerm));
                    orPredicates.add(cb.like(cb.lower(root.get("description")), searchTerm));
                    orPredicates.add(cb.like(cb.lower(root.get("category").as(String.class)), searchTerm));
                    orPredicates.add(cb.like(cb.lower(root.get("frequency").as(String.class)), searchTerm));
                    orPredicates.add(cb.like(cb.lower(root.get("status").as(String.class)), searchTerm));
                    orPredicates.add(cb.like(cb.lower(root.get("createdUser").as(String.class)), searchTerm));

                    Subquery<Long> dSub = query.subquery(Long.class);
                    Root<ChecklistDepartment> dRoot = dSub.from(ChecklistDepartment.class);
                    Join<ChecklistDepartment, Department> dObj = dRoot.join("department");
                    dSub.select(dRoot.get("checklist").get("id"));
                    dSub.where(cb.like(cb.lower(dObj.get("departmentName").as(String.class)), searchTerm));
                    orPredicates.add(root.get("id").in(dSub));

                    predicates.add(cb.or(orPredicates.toArray(new Predicate[0])));
                }
            }

            // Default order by SEQ NO numerical DESC (LEN DESC, seqNo DESC) then ID DESC to
            // ensure latest checklist records / SEQ NOs appear first
            if (query.getResultType() != Long.class && query.getResultType() != long.class) {
                query.orderBy(
                        cb.desc(cb.length(root.get("seqNo"))),
                        cb.desc(root.get("seqNo")));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        }, pageable);
        if (page != null && page.getContent() != null) {
            populateMasterChecklistFilesBatch(page.getContent());
        }
        return page;
    }

    @Transactional
    public MasterChecklist saveMasterChecklist(MasterChecklist checklist, List<String> departments) {
        // Vertical Head Validation
        Long userEmpId = null;
        String currentUser = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        if (currentUser != null && !currentUser.trim().isEmpty() && !"anonymousUser".equalsIgnoreCase(currentUser)) {
            String origTenant = com.autonoma.erp.config.TenantContextHolder.getTenantId();
            try {
                com.autonoma.erp.config.TenantContextHolder.setTenantId(AppUtil.AppConstants.DEFAULT_DB_SOURCE_NAME);
                com.autonoma.erp.model.admin.UserCredential credential = userRepository
                        .findByUserId(currentUser).orElse(null);
                if (credential != null) {
                    userEmpId = credential.getEmpId();
                }
            } finally {
                com.autonoma.erp.config.TenantContextHolder.setTenantId(origTenant);
            }
            if (userEmpId == null) {
                EmployeeMaster empFallback = employeeMasterRepository.findByEmpCodeOrName(currentUser)
                        .orElse(null);
                if (empFallback != null) {
                    userEmpId = empFallback.getId();
                }
            }
        }

        /*
         * if (userEmpId != null) {
         * java.util.Optional<EmployeeManagerMapping> mappingOpt =
         * managerMappingRepository.findByEmpId(userEmpId);
         * if (mappingOpt.isEmpty()) {
         * throw new IllegalArgumentException("Vertical Head is not mapped.");
         * }
         * EmployeeManagerMapping mapping = mappingOpt.get();
         * if (mapping.getVerticalHeadId() == null) {
         * throw new IllegalArgumentException("Vertical Head is not mapped.");
         * }
         * java.util.Optional<EmployeeMaster> vhOpt =
         * employeeMasterRepository.findById(mapping.getVerticalHeadId());
         * if (vhOpt.isEmpty()) {
         * throw new
         * IllegalArgumentException("Unable to retrieve Vertical Head mapping. Please contact the administrator."
         * );
         * }
         * } else {
         * throw new
         * IllegalArgumentException("Unable to retrieve Vertical Head mapping. Please contact the administrator."
         * );
         * }
         * 
         * // Validate verifier employees' Vertical Head mapping
         * if (checklist.getPrimaryEmployee() != null &&
         * checklist.getPrimaryEmployee().getId() != null) {
         * Long empId = checklist.getPrimaryEmployee().getId();
         * java.util.Optional<EmployeeManagerMapping> mOpt =
         * managerMappingRepository.findByEmpId(empId);
         * if (mOpt.isEmpty() || mOpt.get().getVerticalHeadId() == null) {
         * throw new IllegalArgumentException("Required mapping not found.");
         * }
         * }
         * if (checklist.getSecondaryEmployee() != null &&
         * checklist.getSecondaryEmployee().getId() != null) {
         * Long empId = checklist.getSecondaryEmployee().getId();
         * java.util.Optional<EmployeeManagerMapping> mOpt =
         * managerMappingRepository.findByEmpId(empId);
         * if (mOpt.isEmpty() || mOpt.get().getVerticalHeadId() == null) {
         * throw new IllegalArgumentException("Required mapping not found.");
         * }
         * }
         * if (checklist.getTertiaryEmployee() != null &&
         * checklist.getTertiaryEmployee().getId() != null) {
         * Long empId = checklist.getTertiaryEmployee().getId();
         * java.util.Optional<EmployeeManagerMapping> mOpt =
         * managerMappingRepository.findByEmpId(empId);
         * if (mOpt.isEmpty() || mOpt.get().getVerticalHeadId() == null) {
         * throw new IllegalArgumentException("Required mapping not found.");
         * }
         * }
         */

        boolean isAmendment = false;
        if (checklist.getId() != null) {
            MasterChecklist existing = masterRepo.findById(checklist.getId()).orElse(null);
            if (existing != null && "Verified".equals(existing.getVerifyStatus()) &&
                    checklist.getAmendmentReason() != null &&
                    !checklist.getAmendmentReason().isEmpty()) {
                isAmendment = true;
            }
        }

        // Duplicate Validation (Checking Point must be globally unique across all
        // active/pending checklists)
        if (!isAmendment && checklist.getCheckingPoint() != null && !checklist.getCheckingPoint().trim().isEmpty()) {
            List<MasterChecklist> duplicates = masterRepo.findDuplicates(
                    checklist.getCheckingPoint().trim(),
                    checklist.getId());
            if (!duplicates.isEmpty()) {
                throw new IllegalArgumentException("Checking point should not be duplicated");
            }
        }

        // Photo Required Validation
        if ("YES".equalsIgnoreCase(checklist.getPhotoRequired())) {
            boolean hasUploaded = checklist.getUploadedFiles() != null && !checklist.getUploadedFiles().trim().isEmpty()
                    && !"-".equals(checklist.getUploadedFiles().trim());
            boolean hasScanned = checklist.getScannedFiles() != null && !checklist.getScannedFiles().trim().isEmpty()
                    && !"-".equals(checklist.getScannedFiles().trim());
            if (!hasUploaded && !hasScanned) {
                throw new IllegalArgumentException(
                        "Please upload a photo or scanned document because Photo Required is enabled.");
            }
        }

        // Description minimum 500 characters validation
        if (checklist.getDescription() == null || checklist.getDescription().trim().length() < 500) {
            throw new IllegalArgumentException("Please enter a minimum of 500 characters in the Description field.");
        }

        // Restrict Backdated Checklist Creation (Effective From must be today or future
        // date)
        if (checklist.getEffectiveFrom() != null) {
            java.time.LocalDate localEffectiveFrom = java.time.Instant
                    .ofEpochMilli(checklist.getEffectiveFrom().getTime())
                    .atZone(java.time.ZoneId.of("Asia/Kolkata"))
                    .toLocalDate();
            java.time.LocalDate today = java.time.LocalDate.now(java.time.ZoneId.of("Asia/Kolkata"));

            boolean checkValidation = true;
            if (checklist.getId() != null) {
                MasterChecklist existing = masterRepo.findById(checklist.getId()).orElse(null);
                if (existing != null && existing.getEffectiveFrom() != null) {
                    java.time.LocalDate existingEffectiveFrom = java.time.Instant
                            .ofEpochMilli(existing.getEffectiveFrom().getTime())
                            .atZone(java.time.ZoneId.of("Asia/Kolkata"))
                            .toLocalDate();
                    if (existingEffectiveFrom.equals(localEffectiveFrom)) {
                        checkValidation = false; // Bypass validation if the date is unchanged
                    }
                }
            }

            if (checkValidation && !localEffectiveFrom.equals(today)) {
                throw new IllegalArgumentException("Effective From date must always be the current system date.");
            }
        }

        // Company Holiday Validation on Creation/Update
        if (checklist.getEffectiveFrom() != null) {
            java.time.LocalDate localEffectiveFrom = java.time.Instant
                    .ofEpochMilli(checklist.getEffectiveFrom().getTime())
                    .atZone(java.time.ZoneId.of("Asia/Kolkata"))
                    .toLocalDate();

            boolean isHoliday = false;
            for (com.autonoma.erp.modules.hr.holiday.entity.HrHolidayMaster holiday : holidayRepo
                    .findByIsActiveTrue()) {
                java.time.LocalDate start = holiday.getFromDate() != null ? holiday.getFromDate()
                        : holiday.getHolidayDate();
                if (start != null && localEffectiveFrom.equals(start)) {
                    isHoliday = true;
                    break;
                }
            }
            if (isHoliday) {
                java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter
                        .ofPattern("dd/MM/yyyy");
                throw new IllegalArgumentException("Checklist cannot be created on "
                        + localEffectiveFrom.format(formatter) + " because it is marked as a Company Holiday.");
            }
        }

        if (checklist.getId() != null) {
            MasterChecklist existing = masterRepo.findById(checklist.getId()).orElseThrow();

            boolean isAmendmentOfVerified = "Verified".equals(existing.getVerifyStatus()) &&
                    checklist.getAmendmentReason() != null &&
                    !checklist.getAmendmentReason().isEmpty();

            if (isAmendmentOfVerified) {
                // Create a new version for the amendment. The old one remains active until this
                // new one is verified.
                checklist.setId(null);
                checklist.setVerifyStatus("Pending for Verify");
                checklist.setVerifiedBy(null);
                checklist.setVerifiedDate(null);
                checklist.setStatus("Active");
                checklist.setCreatedDate(new Date());
                if (checklist.getUpdatedBy() != null && !checklist.getUpdatedBy().isEmpty()) {
                    checklist.setCreatedBy(checklist.getUpdatedBy());
                } else if (checklist.getCreatedBy() == null || checklist.getCreatedBy().isEmpty()) {
                    checklist.setCreatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
                }
                checklist.setUpdatedDate(null);
                checklist.setUpdatedBy(null);

                // Clear cascade departments before save to avoid FK violation;
                // they will be re-attached manually after the entity is persisted with a valid
                // ID.
                checklist.setDepartments(null);
                updateChecklistSearchText(checklist, departments);

                MasterChecklist saved = masterRepo.save(checklist);
                // Flush the parent INSERT to the DB immediately so the FK is resolvable
                // when child QMS_CHECKLIST_DEPARTMENT rows are inserted below.
                entityManager.flush();

                if (departments != null) {
                    for (String deptName : departments) {
                        ChecklistDepartment dept = new ChecklistDepartment();
                        dept.setChecklist(saved);
                        dept.setCreatedBy(saved.getCreatedBy() != null ? saved.getCreatedBy() : "System");
                        dept.setCreatedDate(new Date());
                        Department resolvedDept = departmentRepository.findByDepartmentName(deptName).orElse(null);
                        if (resolvedDept != null) {
                            dept.setDepartment(resolvedDept);
                            deptRepo.save(dept);
                        }
                    }
                }
                saved.setUploadedFiles(checklist.getUploadedFiles());
                saved.setScannedFiles(checklist.getScannedFiles());
                saveMasterChecklistFiles(saved);
                return saved;
            }

            // Normal update (either not verified yet, or no amendment reason)
            existing.setSeqNo(checklist.getSeqNo() != null ? checklist.getSeqNo() : existing.getSeqNo());
            existing.setCheckingPoint(
                    checklist.getCheckingPoint() != null ? checklist.getCheckingPoint() : existing.getCheckingPoint());
            existing.setDescription(
                    checklist.getDescription() != null ? checklist.getDescription() : existing.getDescription());
            existing.setCategory(checklist.getCategory() != null ? checklist.getCategory() : existing.getCategory());
            existing.setFrequency(
                    checklist.getFrequency() != null ? checklist.getFrequency() : existing.getFrequency());
            existing.setEffectiveFrom(
                    checklist.getEffectiveFrom() != null ? checklist.getEffectiveFrom() : existing.getEffectiveFrom());
            existing.setExpiryDate(checklist.getExpiryDate());
            existing.setReminderDays(checklist.getReminderDays());
            if (checklist.getReminderDate() != null) {
                existing.setReminderDate(checklist.getReminderDate());
            } else if (existing.getExpiryDate() != null) {
                Long remDays = existing.getReminderDays();
                java.util.Calendar cal = java.util.Calendar.getInstance();
                cal.setTime(existing.getExpiryDate());
                if (remDays != null) {
                    cal.add(java.util.Calendar.DAY_OF_MONTH, -remDays.intValue());
                }
                existing.setReminderDate(cal.getTime());
            } else {
                existing.setReminderDate(null);
            }
            existing.setStockLink(
                    checklist.getStockLink() != null ? checklist.getStockLink() : existing.getStockLink());
            existing.setPhotoRequired(
                    checklist.getPhotoRequired() != null ? checklist.getPhotoRequired() : existing.getPhotoRequired());
            existing.setVerificationRequired(
                    checklist.getVerificationRequired() != null ? checklist.getVerificationRequired()
                            : existing.getVerificationRequired());
            existing.setDualCheck(
                    checklist.getDualCheck() != null ? checklist.getDualCheck() : existing.getDualCheck());
            existing.setCarryForward(
                    checklist.getCarryForward() != null ? checklist.getCarryForward() : existing.getCarryForward());
            existing.setDynamicRuleJson(checklist.getDynamicRuleJson());
            existing.setPageId(checklist.getPageId());
            existing.setEventTrigger(checklist.getEventTrigger());
            existing.setOffsetDays(checklist.getOffsetDays());
            existing.setOffsetType(checklist.getOffsetType());

            existing.setWeekDays(checklist.getWeekDays() != null ? checklist.getWeekDays() : existing.getWeekDays());
            existing.setRepeatEveryValue(checklist.getRepeatEveryValue() != null ? checklist.getRepeatEveryValue()
                    : existing.getRepeatEveryValue());
            existing.setRepeatEveryUnit(checklist.getRepeatEveryUnit() != null ? checklist.getRepeatEveryUnit()
                    : existing.getRepeatEveryUnit());

            if (checklist.getStatus() != null) {
                existing.setStatus(checklist.getStatus());
            } else if (existing.getStatus() == null) {
                existing.setStatus("Active");
            }

            if (checklist.getVerificationRequired() == null
                    || "NO".equalsIgnoreCase(checklist.getVerificationRequired())
                    || checklist.getVerificationRequired().trim().isEmpty()) {
                existing.setVerifyStatus("N/A");
            } else {
                if ("Verified".equals(existing.getVerifyStatus()) || "N/A".equals(existing.getVerifyStatus())) {
                    existing.setVerifyStatus("Pending for Verify");
                } else if (checklist.getVerifyStatus() != null) {
                    existing.setVerifyStatus(checklist.getVerifyStatus());
                } else if (existing.getVerifyStatus() == null || "Rejected".equals(existing.getVerifyStatus())) {
                    existing.setVerifyStatus("Pending for Verify");
                }
            }

            if (checklist.getAmendmentReason() != null && !checklist.getAmendmentReason().isEmpty()) {
                existing.setVerifyStatus("Pending for Verify");
            }

            if ("Verified".equals(existing.getVerifyStatus())) {
                if (checklist.getVerifiedBy() != null)
                    existing.setVerifiedBy(checklist.getVerifiedBy());
                if (checklist.getVerifiedDate() != null)
                    existing.setVerifiedDate(checklist.getVerifiedDate());
            } else {
                existing.setVerifiedBy(null);
                existing.setVerifiedDate(null);
            }
            if (checklist.getRejReason() != null)
                existing.setRejReason(checklist.getRejReason());
            if (checklist.getAssignTo() != null)
                existing.setAssignTo(checklist.getAssignTo());
            if (checklist.getAssignDate() != null)
                existing.setAssignDate(checklist.getAssignDate());
            if (checklist.getItemCode() != null)
                existing.setItemCode(checklist.getItemCode());
            if (checklist.getQty() != null)
                existing.setQty(checklist.getQty());
            if (checklist.getLevelIds() != null)
                existing.setLevelIds(checklist.getLevelIds());
            if (checklist.getAmendmentReason() != null)
                existing.setAmendmentReason(checklist.getAmendmentReason());
            if (checklist.getUploadedFiles() != null)
                existing.setUploadedFiles(checklist.getUploadedFiles());
            if (checklist.getScannedFiles() != null)
                existing.setScannedFiles(checklist.getScannedFiles());

            // Auto assignment copy
            existing.setPrimaryEmployee(checklist.getPrimaryEmployee());
            existing.setSecondaryEmployee(checklist.getSecondaryEmployee());
            existing.setTertiaryEmployee(checklist.getTertiaryEmployee());
            existing.setCurrentAssignee(checklist.getCurrentAssignee());
            existing.setAssignmentType(checklist.getAssignmentType());
            if (checklist.getAutoAssignedFlag() != null)
                existing.setAutoAssignedFlag(checklist.getAutoAssignedFlag());
            if (checklist.getLastAssignmentDate() != null)
                existing.setLastAssignmentDate(checklist.getLastAssignmentDate());
            existing.setUpdatedDate(new Date());
            existing.setUpdatedBy(checklist.getUpdatedBy() != null && !checklist.getUpdatedBy().isEmpty()
                    ? checklist.getUpdatedBy()
                    : existing.getCreatedBy());

            // Re-sync departments safely via the managed list of the existing entity to
            // avoid Hibernate state desync
            if (existing.getDepartments() != null) {
                existing.getDepartments().clear();
            } else {
                existing.setDepartments(new ArrayList<>());
            }
            if (departments != null) {
                for (String deptName : departments) {
                    ChecklistDepartment dept = new ChecklistDepartment();
                    dept.setChecklist(existing);
                    dept.setCreatedBy(existing.getUpdatedBy() != null ? existing.getUpdatedBy()
                            : (existing.getCreatedBy() != null ? existing.getCreatedBy() : "System"));
                    dept.setCreatedDate(new Date());
                    Department resolvedDept = departmentRepository.findByDepartmentName(deptName).orElse(null);
                    if (resolvedDept != null) {
                        dept.setDepartment(resolvedDept);
                        existing.getDepartments().add(dept);
                    }
                }
            }
            updateChecklistSearchText(existing, departments);
            MasterChecklist saved = masterRepo.save(existing);
            saved.setUploadedFiles(existing.getUploadedFiles());
            saved.setScannedFiles(existing.getScannedFiles());
            saveMasterChecklistFiles(saved);
            return saved;
        } else {
            checklist.setCreatedDate(new Date());
            if (checklist.getStatus() == null || checklist.getStatus().trim().isEmpty()
                    || "null".equalsIgnoreCase(checklist.getStatus()))
                checklist.setStatus("Active");
            if (checklist.getVerificationRequired() == null
                    || "NO".equalsIgnoreCase(checklist.getVerificationRequired())
                    || checklist.getVerificationRequired().trim().isEmpty()) {
                checklist.setVerifyStatus("N/A");
            } else {
                if (checklist.getVerifyStatus() == null)
                    checklist.setVerifyStatus("Pending for Verify");
            }
            checklist.setVerifiedBy(null);
            checklist.setVerifiedDate(null);

            if (checklist.getCreatedBy() == null || checklist.getCreatedBy().isEmpty()) {
                checklist.setCreatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
            }
            checklist.setUpdatedDate(null);
            checklist.setUpdatedBy(null);

            // Clear cascade departments before save to avoid FK violation;
            // they will be re-attached manually after the entity is persisted with a valid
            // ID.
            checklist.setDepartments(null);
            updateChecklistSearchText(checklist, departments);

            MasterChecklist saved = masterRepo.save(checklist);
            // Flush the parent INSERT to the DB immediately so the FK is resolvable
            // when child QMS_CHECKLIST_DEPARTMENT rows are inserted below.
            entityManager.flush();

            if (departments != null) {
                for (String deptName : departments) {
                    ChecklistDepartment dept = new ChecklistDepartment();
                    dept.setChecklist(saved);
                    dept.setCreatedBy(saved.getCreatedBy() != null ? saved.getCreatedBy() : "System");
                    dept.setCreatedDate(new Date());
                    Department resolvedDept = departmentRepository.findByDepartmentName(deptName).orElse(null);
                    if (resolvedDept != null) {
                        dept.setDepartment(resolvedDept);
                        deptRepo.save(dept);
                    }
                }
            }

            saved.setUploadedFiles(checklist.getUploadedFiles());
            saved.setScannedFiles(checklist.getScannedFiles());
            saveMasterChecklistFiles(saved);

            // Automatic Assignment Trigger (Wiring 1)
            triggerInitialAssignmentIfVerified(saved);

            return saved;
        }
    }

    @Transactional
    public MasterChecklist updateChecklistStatus(Long id, String status) {
        MasterChecklist existing = masterRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Checklist not found with ID: " + id));
        existing.setStatus(status);
        existing.setUpdatedDate(new Date());
        existing.setUpdatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
        return masterRepo.save(existing);
    }

    private void updateChecklistSearchText(MasterChecklist checklist, List<String> departmentNames) {
        StringBuilder sb = new StringBuilder();
        if (checklist.getSeqNo() != null)
            sb.append(checklist.getSeqNo()).append(" ");
        if (checklist.getCheckingPoint() != null)
            sb.append(checklist.getCheckingPoint()).append(" ");
        if (checklist.getCategory() != null)
            sb.append(checklist.getCategory()).append(" ");
        if (checklist.getFrequency() != null)
            sb.append(checklist.getFrequency()).append(" ");
        if (departmentNames != null && !departmentNames.isEmpty()) {
            for (String deptName : departmentNames) {
                if (deptName != null) {
                    sb.append(deptName).append(" ");
                }
            }
        }
        checklist.setSearchText(sb.toString().trim().toLowerCase());
    }

    @Transactional
    public void deleteMasterChecklist(Long id) {
        MasterChecklist checklist = masterRepo.findById(id).orElseThrow();
        try {
            String deleteSql = "DELETE FROM QMS_ATTACHMENT_PATH WHERE PAGE_CODE = 'M1210' AND REF_ID = ?";
            jdbcTemplate.update(deleteSql, id);
        } catch (Exception e) {
            log.error("Error deleting attachments for checklist {}: {}", id, e.getMessage());
        }
        // Automatic cascade delete handles assignments, verifications, and departments
        masterRepo.delete(checklist);
    }

    @Transactional
    public MasterChecklist saveSchedulerConfig(Long checklistId, Long primaryId, Long secondaryId, Long tertiaryId) {
        MasterChecklist checklist = masterRepo.findById(checklistId)
                .orElseThrow(() -> new IllegalArgumentException("Checklist not found with ID: " + checklistId));

        if (primaryId != null) {
            EmployeeMaster primary = employeeMasterRepository.findById(primaryId)
                    .orElseThrow(
                            () -> new IllegalArgumentException("Primary employee not found with ID: " + primaryId));
            checklist.setPrimaryEmployee(primary);
        } else {
            checklist.setPrimaryEmployee(null);
        }

        if (secondaryId != null) {
            EmployeeMaster secondary = employeeMasterRepository.findById(secondaryId)
                    .orElseThrow(
                            () -> new IllegalArgumentException("Secondary employee not found with ID: " + secondaryId));
            checklist.setSecondaryEmployee(secondary);
        } else {
            checklist.setSecondaryEmployee(null);
        }

        if (tertiaryId != null) {
            EmployeeMaster tertiary = employeeMasterRepository.findById(tertiaryId)
                    .orElseThrow(
                            () -> new IllegalArgumentException("Tertiary employee not found with ID: " + tertiaryId));
            checklist.setTertiaryEmployee(tertiary);
        } else {
            checklist.setTertiaryEmployee(null);
        }

        checklist.setUpdatedDate(new Date());
        checklist.setUpdatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());

        return masterRepo.save(checklist);
    }

    // --- Assignments ---

    private ChecklistAssignment convertToAssignment(ChecklistClosed closed) {
        if (closed == null)
            return null;
        ChecklistAssignment dest = new ChecklistAssignment();
        dest.setId(closed.getId());
        dest.setChecklist(closed.getChecklist());
        dest.setAssignedTo(closed.getAssignedTo());
        dest.setAssignedToName(closed.getAssignedToName());
        dest.setAssignedBy(closed.getAssignedBy());
        dest.setAssignedDate(closed.getAssignedDate());
        dest.setStatus(closed.getStatus());
        dest.setVerifyStatus(closed.getVerifyStatus());
        dest.setRemarks(closed.getRemarks());
        dest.setChecklistDate(closed.getChecklistDate());
        dest.setCarryForward(closed.getCarryForward());
        dest.setCarryForwardCount(closed.getCarryForwardCount());
        dest.setAssignType(closed.getAssignType());
        dest.setVerifiedBy(closed.getVerifiedBy());
        dest.setVerifiedDate(closed.getVerifiedDate());
        dest.setComments(closed.getComments());
        dest.setActualFiles(closed.getActualFiles());
        dest.setIsActive(closed.getIsActive());
        dest.setCreatedUser(closed.getCreatedUser());
        dest.setCreatedDate(closed.getCreatedDate());
        dest.setUpdatedUser(closed.getUpdatedUser());
        dest.setUpdatedAt(closed.getUpdatedAt());
        dest.setDueDate(closed.getDueDate());
        dest.setNextRenewalDate(closed.getNextRenewalDate());
        return dest;
    }

    @Transactional(readOnly = true, isolation = org.springframework.transaction.annotation.Isolation.READ_UNCOMMITTED)
    public Page<ChecklistAssignment> getAssignments(
            Long checklistId, String status, String assignedTo, Date fromDate, Date toDate, String category,
            String searchBy, String searchValue, String masterVerifyStatus, String taskType,
            String currentUser, String pageCodeParam, boolean excludeCompleted, boolean excludePending,
            String dualCheck, String considerDate, Date considerDateValue,
            String seqNo, String checkingPoint, String frequency, String stockLink,
            String department, String assignedBy, String assignType, Pageable pageable) {
        Date queryFromDate = fromDate;
        Date queryToDate = toDate;
        if (queryFromDate != null) {
            java.util.Calendar cal = java.util.Calendar.getInstance(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
            cal.setTime(queryFromDate);
            cal.set(java.util.Calendar.HOUR_OF_DAY, 0);
            cal.set(java.util.Calendar.MINUTE, 0);
            cal.set(java.util.Calendar.SECOND, 0);
            cal.set(java.util.Calendar.MILLISECOND, 0);
            queryFromDate = cal.getTime();
        }
        if (queryToDate != null) {
            java.util.Calendar cal = java.util.Calendar.getInstance(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
            cal.setTime(queryToDate);
            cal.set(java.util.Calendar.HOUR_OF_DAY, 23);
            cal.set(java.util.Calendar.MINUTE, 59);
            cal.set(java.util.Calendar.SECOND, 59);
            cal.set(java.util.Calendar.MILLISECOND, 999);
            queryToDate = cal.getTime();
        }

        // Resolve target filter employee IDs
        List<String> assignedToIds = new ArrayList<>();
        if (assignedTo != null && !assignedTo.trim().isEmpty()) {
            for (String part : assignedTo.split(",")) {
                String trimmed = part.trim();
                Optional<EmployeeMaster> empOpt = resolveEmployee(trimmed);
                if (empOpt.isPresent()) {
                    assignedToIds.add(String.valueOf(empOpt.get().getId()));
                } else {
                    assignedToIds.add(trimmed);
                }
            }
        }

        final List<String> matchedEmployeeIdsAndCodes = new ArrayList<>();
        if (searchValue != null && !searchValue.trim().isEmpty()
                && (searchBy == null || "All".equalsIgnoreCase(searchBy) || searchBy.trim().isEmpty())) {
            try {
                String cleanSearch = searchValue.trim();
                String jpql = "SELECT e FROM EmployeeMaster e WHERE LOWER(e.employeeName) LIKE :term OR LOWER(e.empCode) LIKE :term";
                List<EmployeeMaster> matchedEmps = entityManager.createQuery(jpql, EmployeeMaster.class)
                        .setParameter("term", "%" + cleanSearch.toLowerCase() + "%")
                        .getResultList();
                for (EmployeeMaster emp : matchedEmps) {
                    matchedEmployeeIdsAndCodes.add(String.valueOf(emp.getId()));
                    if (emp.getEmpCode() != null) {
                        matchedEmployeeIdsAndCodes.add(emp.getEmpCode());
                    }
                }
            } catch (Exception e) {
                log.error("Failed to lookup matching employees for global search", e);
            }
        }

        final boolean finalIsUserAdmin;
        final boolean isSuperBoss = "SUPER BOSS".equalsIgnoreCase(currentUser);
        final Long finalUserEmpId;
        final String finalEmployeeName;
        final String finalUserEmpCode;

        boolean isUserAdminVar = false;
        Long userEmpIdVar = null;
        String employeeNameVar = null;
        String userEmpCodeVar = null;

        if (currentUser != null && !currentUser.trim().isEmpty()) {
            String origTenant = com.autonoma.erp.config.TenantContextHolder.getTenantId();
            try {
                com.autonoma.erp.config.TenantContextHolder.setTenantId(AppUtil.AppConstants.DEFAULT_DB_SOURCE_NAME);
                isUserAdminVar = userRepository.findByUserId(currentUser)
                        .map(u -> u.getUserLevel() != null
                                && u.getUserLevel() >= AppUtil.AppConstants.USER_LEVEL_BOS_ADMIN)
                        .orElse(false);

                com.autonoma.erp.model.admin.UserCredential credential = userRepository
                        .findByUserId(currentUser).orElse(null);
                if (credential != null) {
                    userEmpIdVar = credential.getEmpId();
                }
            } finally {
                com.autonoma.erp.config.TenantContextHolder.setTenantId(origTenant);
            }

            if (userEmpIdVar == null) {
                EmployeeMaster empFallback = employeeMasterRepository.findByEmpCodeOrName(currentUser)
                        .orElse(null);
                if (empFallback != null) {
                    userEmpIdVar = empFallback.getId();
                }
            }
            if (userEmpIdVar != null) {
                EmployeeMaster emp = employeeMasterRepository.findById(userEmpIdVar).orElse(null);
                if (emp != null) {
                    employeeNameVar = emp.getEmployeeName();
                    userEmpCodeVar = emp.getEmpCode();
                }
            }
        }

        finalIsUserAdmin = isUserAdminVar;
        finalUserEmpId = userEmpIdVar;
        finalEmployeeName = employeeNameVar;
        finalUserEmpCode = userEmpCodeVar;

        // Resolve pageCode
        String pageCode = "M1210";
        if (pageCodeParam != null && !pageCodeParam.trim().isEmpty()) {
            pageCode = pageCodeParam.trim();
        } else {
            if (status != null
                    && (status.contains("Verified") || status.contains("Accepted") || status.contains("Renewal"))) {
                pageCode = "QM1130";
            }
            if (masterVerifyStatus != null
                    && (masterVerifyStatus.contains("Verified") || masterVerifyStatus.contains("Accepted")
                            || masterVerifyStatus.contains("Renewal"))) {
                pageCode = "QM1130";
            }
        }
        final String finalPageCode = pageCode;

        String tempDepartment = department;
        if (tempDepartment == null || tempDepartment.trim().isEmpty()) {
            if (!"QM1130".equals(finalPageCode) && "Mine".equalsIgnoreCase(taskType) && !finalIsUserAdmin
                    && !("SUPER BOSS".equalsIgnoreCase(currentUser) || "admin".equalsIgnoreCase(currentUser))) {
                String userDept = null;
                if (finalUserEmpId != null) {
                    EmployeeMaster emp = employeeMasterRepository.findById(finalUserEmpId).orElse(null);
                    if (emp != null && emp.getDepartment() != null) {
                        userDept = emp.getDepartment().getDepartmentName();
                    }
                }
                if (userDept != null && !userDept.trim().isEmpty()) {
                    tempDepartment = userDept;
                }
            }
        }
        final String resolvedDepartment = tempDepartment;

        final String effectiveMasterVerifyStatus;
        if (masterVerifyStatus == null || masterVerifyStatus.trim().isEmpty()
                || "All".equalsIgnoreCase(masterVerifyStatus)) {
            if ("QM1120".equals(pageCode)) {
                effectiveMasterVerifyStatus = "Verified";
            } else {
                effectiveMasterVerifyStatus = null;
            }
        } else {
            effectiveMasterVerifyStatus = masterVerifyStatus;
        }

        // Check page permissions
        boolean hasManager = false;
        boolean hasCompany = false;
        if (currentUser != null && !currentUser.trim().isEmpty()) {
            String origTenant = com.autonoma.erp.config.TenantContextHolder.getTenantId();
            try {
                com.autonoma.erp.config.TenantContextHolder.setTenantId(AppUtil.AppConstants.DEFAULT_DB_SOURCE_NAME);
                com.autonoma.erp.model.admin.BosPage pageObj = bosPageRepository.findByPageCode(pageCode).orElse(null);
                if (pageObj != null) {
                    com.autonoma.erp.model.admin.BosUserPageAuth auth = bosUserPageAuthRepository
                            .findByUserIdAndPageId(currentUser, pageObj.getPageId());
                    if (auth != null) {
                        hasManager = Integer.valueOf(1).equals(auth.getManager());
                        hasCompany = Integer.valueOf(1).equals(auth.getAdditional1());
                    }
                }
            } catch (Exception e) {
                log.error("Failed to check page permission for checklist", e);
            } finally {
                com.autonoma.erp.config.TenantContextHolder.setTenantId(origTenant);
            }
        }

        // Determine effective taskType (no automatic shifting / maps directly to UI
        // selection)
        if (taskType == null || taskType.trim().isEmpty()) {
            taskType = "Mine";
        }
        final String effectiveTaskType = taskType;
        final boolean finalHasCompany = hasCompany;

        // Create effectively final status and excludeCompleted values
        final String finalStatusVal;
        final boolean finalExcludeCompletedVal;
        if ("QM1130".equals(pageCode)) {
            finalStatusVal = (status != null && !status.isEmpty()) ? status
                    : "Pending for Verify";
            finalExcludeCompletedVal = false;
        } else if ("QM1120".equals(pageCode)) {
            finalStatusVal = (status != null && !status.isEmpty()) ? status
                    : "Pending,Unresolved";
            finalExcludeCompletedVal = false;
        } else {
            finalStatusVal = status;
            finalExcludeCompletedVal = excludeCompleted;
        }

        // Effectively-final date snapshots for use inside lambda expressions
        final Date finalFromDate = queryFromDate;
        final Date finalToDate = queryToDate;

        // Fetch direct reportees by Vertical Head matching only employee IDs
        final List<String> reporteeMatchStrings = new ArrayList<>();
        if (("Team".equalsIgnoreCase(effectiveTaskType) || "Mine".equalsIgnoreCase(effectiveTaskType))
                && finalUserEmpId != null) {
            if (true) {
                try {
                    List<Long> reporteeIds = new ArrayList<>();
                    reporteeIds.add(finalUserEmpId);
                    String sql = "WITH TeamCTE AS ( " +
                            "    SELECT EMP_ID FROM HR_EMPLOYEE_MANAGER_MAPPING WHERE VERTICAL_HEAD_ID = :empId AND STATUS = 'Active' "
                            +
                            "    UNION ALL " +
                            "    SELECT EMP_ID FROM HR_EMPLOYEE_MANAGER_MAPPING WHERE HOME_MANAGER_ID = :empId AND STATUS = 'Active' "
                            +
                            "    UNION ALL " +
                            "    SELECT EMP_ID FROM HR_EMPLOYEE_MANAGER_MAPPING WHERE BUSINESS_MANAGER_ID = :empId AND STATUS = 'Active' "
                            +
                            ") " +
                            "SELECT DISTINCT EMP_ID FROM TeamCTE";
                    List<?> rawList = entityManager.createNativeQuery(sql)
                            .setParameter("empId", finalUserEmpId)
                            .getResultList();
                    for (Object val : rawList) {
                        if (val != null) {
                            reporteeIds.add(((Number) val).longValue());
                        }
                    }

                    if (!reporteeIds.isEmpty()) {
                        List<Object[]> empDetails = entityManager.createQuery(
                                "SELECT e.id, e.empCode, e.employeeName FROM EmployeeMaster e WHERE e.id IN :ids AND LOWER(e.status.name) = 'active'",
                                Object[].class)
                                .setParameter("ids", reporteeIds)
                                .getResultList();
                        for (Object[] detail : empDetails) {
                            if (detail[0] != null) {
                                reporteeMatchStrings.add(String.valueOf(detail[0]));
                            }
                            if (detail[1] != null && !((String) detail[1]).trim().isEmpty()) {
                                String code = ((String) detail[1]).trim();
                                reporteeMatchStrings.add(code);
                                reporteeMatchStrings.add(code.toUpperCase());
                            }
                            if (detail[2] != null && !((String) detail[2]).trim().isEmpty()) {
                                String name = ((String) detail[2]).trim();
                                reporteeMatchStrings.add(name);
                                reporteeMatchStrings.add(name.toUpperCase());
                            }
                        }
                    }
                } catch (Exception e) {
                    log.error("Failed to fetch direct reportees for taskType: " + effectiveTaskType, e);
                }
            }
        }

        final List<String> teamVerifierEmployees = new ArrayList<>();
        if ("Team".equalsIgnoreCase(effectiveTaskType) && "QM1130".equals(finalPageCode) && finalUserEmpId != null) {
            List<Long> teamMemberIds = new ArrayList<>();
            teamMemberIds.add(finalUserEmpId);

            // 1. Find the managers of finalUserEmpId
            List<Long> managerIds = new ArrayList<>();
            try {
                String mgrSql = "SELECT VERTICAL_HEAD_ID, HOME_MANAGER_ID, BUSINESS_MANAGER_ID, HR_ID " +
                        "FROM HR_EMPLOYEE_MANAGER_MAPPING WHERE EMP_ID = :empId AND STATUS = 'Active'";
                List<Object[]> rawMgrs = entityManager.createNativeQuery(mgrSql)
                        .setParameter("empId", finalUserEmpId)
                        .getResultList();
                for (Object[] row : rawMgrs) {
                    for (Object val : row) {
                        if (val != null) {
                            Long mId = ((Number) val).longValue();
                            if (!managerIds.contains(mId)) {
                                managerIds.add(mId);
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.error("Failed to fetch managers for user: " + finalUserEmpId, e);
            }

            // Add managers to team
            for (Long mId : managerIds) {
                if (!teamMemberIds.contains(mId)) {
                    teamMemberIds.add(mId);
                }
            }

            // 2. Find all employees who report to any of these managers (peers)
            if (!managerIds.isEmpty()) {
                try {
                    String peerSql = "SELECT DISTINCT EMP_ID FROM HR_EMPLOYEE_MANAGER_MAPPING " +
                            "WHERE STATUS = 'Active' AND (VERTICAL_HEAD_ID IN (:mgrIds) OR HOME_MANAGER_ID IN (:mgrIds) OR BUSINESS_MANAGER_ID IN (:mgrIds) OR HR_ID IN (:mgrIds))";
                    List<?> rawPeers = entityManager.createNativeQuery(peerSql)
                            .setParameter("mgrIds", managerIds)
                            .getResultList();
                    for (Object val : rawPeers) {
                        if (val != null) {
                            Long pId = ((Number) val).longValue();
                            if (!teamMemberIds.contains(pId)) {
                                teamMemberIds.add(pId);
                            }
                        }
                    }
                } catch (Exception e) {
                    log.error("Failed to fetch peers for user: " + finalUserEmpId, e);
                }
            }

            // 3. Find all employees who report directly/indirectly to finalUserEmpId
            // (reportees)
            try {
                String repSql = "WITH TeamCTE AS ( " +
                        "    SELECT EMP_ID FROM HR_EMPLOYEE_MANAGER_MAPPING WHERE VERTICAL_HEAD_ID = :empId AND STATUS = 'Active' "
                        +
                        "    UNION ALL " +
                        "    SELECT EMP_ID FROM HR_EMPLOYEE_MANAGER_MAPPING WHERE HOME_MANAGER_ID = :empId AND STATUS = 'Active' "
                        +
                        "    UNION ALL " +
                        "    SELECT EMP_ID FROM HR_EMPLOYEE_MANAGER_MAPPING WHERE BUSINESS_MANAGER_ID = :empId AND STATUS = 'Active' "
                        +
                        "    UNION ALL " +
                        "    SELECT EMP_ID FROM HR_EMPLOYEE_MANAGER_MAPPING WHERE HR_ID = :empId AND STATUS = 'Active' "
                        +
                        ") " +
                        "SELECT DISTINCT EMP_ID FROM TeamCTE";
                List<?> rawReps = entityManager.createNativeQuery(repSql)
                        .setParameter("empId", finalUserEmpId)
                        .getResultList();
                for (Object val : rawReps) {
                    if (val != null) {
                        Long rId = ((Number) val).longValue();
                        if (!teamMemberIds.contains(rId)) {
                            teamMemberIds.add(rId);
                        }
                    }
                }
            } catch (Exception e) {
                log.error("Failed to fetch reportees for user: " + finalUserEmpId, e);
            }

            // 4. Find all employees whose managers/verifiers belong to teamMemberIds
            if (!teamMemberIds.isEmpty()) {
                try {
                    String subSql = "SELECT DISTINCT EMP_ID FROM HR_EMPLOYEE_MANAGER_MAPPING " +
                            "WHERE STATUS = 'Active' AND (VERTICAL_HEAD_ID IN (:teamIds) OR HOME_MANAGER_ID IN (:teamIds) OR BUSINESS_MANAGER_ID IN (:teamIds) OR HR_ID IN (:teamIds))";
                    List<?> rawEmpIds = entityManager.createNativeQuery(subSql)
                            .setParameter("teamIds", teamMemberIds)
                            .getResultList();
                    List<Long> matchedIds = new ArrayList<>();
                    for (Object val : rawEmpIds) {
                        if (val != null) {
                            matchedIds.add(((Number) val).longValue());
                        }
                    }
                    if (!matchedIds.isEmpty()) {
                        List<Object[]> empDetails = entityManager.createQuery(
                                "SELECT e.id, e.empCode, e.employeeName FROM EmployeeMaster e WHERE e.id IN :ids AND LOWER(e.status.name) = 'active'",
                                Object[].class)
                                .setParameter("ids", matchedIds)
                                .getResultList();
                        for (Object[] detail : empDetails) {
                            if (detail[0] != null) {
                                teamVerifierEmployees.add(String.valueOf(detail[0]));
                            }
                            if (detail[1] != null && !((String) detail[1]).trim().isEmpty()) {
                                teamVerifierEmployees.add(((String) detail[1]).trim());
                                teamVerifierEmployees.add(((String) detail[1]).trim().toUpperCase());
                            }
                            if (detail[2] != null && !((String) detail[2]).trim().isEmpty()) {
                                teamVerifierEmployees.add(((String) detail[2]).trim());
                                teamVerifierEmployees.add(((String) detail[2]).trim().toUpperCase());
                            }
                        }
                    }
                } catch (Exception e) {
                    log.error("Failed to fetch employees under team verifiers", e);
                }
            }
        }

        List<Long> preFetchedNonOwnerIds = new ArrayList<>();
        if (!"QM1120".equals(pageCode) && "Mine".equalsIgnoreCase(effectiveTaskType) && currentUser != null) {
            preFetchedNonOwnerIds = assignRepo.findAll((root, query, cb) -> {
                List<Predicate> p = new ArrayList<>();
                p.add(root.get("assignType").in("SECONDARY", "TERTIARY"));
                p.add(cb.equal(root.get("isActive"), true));

                List<Predicate> userP = new ArrayList<>();
                if (finalUserEmpId != null)
                    userP.add(cb.equal(root.get("assignedTo"), String.valueOf(finalUserEmpId)));
                if (finalUserEmpCode != null && !finalUserEmpCode.trim().isEmpty())
                    userP.add(cb.equal(root.get("assignedTo"), finalUserEmpCode));
                if (finalEmployeeName != null && !finalEmployeeName.trim().isEmpty())
                    userP.add(cb.equal(root.get("assignedTo"), finalEmployeeName));
                if (currentUser != null && !currentUser.trim().isEmpty())
                    userP.add(cb.equal(root.get("assignedTo"), currentUser));

                if (!userP.isEmpty())
                    p.add(cb.or(userP.toArray(new Predicate[0])));
                return cb.and(p.toArray(new Predicate[0]));
            }).stream().map(a -> a.getChecklist().getId()).distinct().collect(java.util.stream.Collectors.toList());
        }
        final List<Long> finalNonOwnerChecklistIds = preFetchedNonOwnerIds;

        boolean queryClosed = !finalExcludeCompletedVal;
        boolean queryActive = !"QM1140".equals(pageCode);

        if ("QM1120".equals(pageCode) || "QM1130".equals(pageCode)) {
            queryClosed = true;
            queryActive = false;
        } else if (finalStatusVal != null && !finalStatusVal.trim().isEmpty()
                && !finalStatusVal.equalsIgnoreCase("All")) {
            String[] parts = finalStatusVal.split(",");
            boolean hasActive = false;
            boolean hasClosed = false;
            java.util.List<String> closedStatuses = java.util.Arrays.asList("Completed", "Closed", "Verified",
                    "Accepted");
            java.util.List<String> bothStatuses = java.util.Arrays.asList("Pending for Verified", "Pending For Verify",
                    "Pending for Accepted", "Pending For Accept");
            for (String p : parts) {
                String s = p.trim();
                if (bothStatuses.stream().anyMatch(bs -> bs.equalsIgnoreCase(s))) {
                    hasActive = true;
                    hasClosed = true;
                } else if (closedStatuses.stream().anyMatch(cs -> cs.equalsIgnoreCase(s))) {
                    hasClosed = true;
                } else {
                    hasActive = true;
                }
            }
            if (hasActive && !hasClosed) {
                queryClosed = false;
                queryActive = true;
            } else if (!hasActive && hasClosed) {
                queryClosed = true;
                queryActive = false;
            } else {
                queryClosed = true;
                queryActive = true;
            }
        }

        org.springframework.data.jpa.domain.Specification<ChecklistClosed> closedSpec = null;
        if (queryClosed) {
            closedSpec = (root, query, cb) -> {
                List<Predicate> predicates = new ArrayList<>();

                Join<ChecklistClosed, MasterChecklist> masterJoin = null;

                if (checklistId != null) {
                    masterJoin = root.join("checklist");
                    predicates.add(cb.equal(masterJoin.get("id"), checklistId));
                }

                if (effectiveMasterVerifyStatus != null && !effectiveMasterVerifyStatus.isEmpty()) {
                    if (masterJoin == null)
                        masterJoin = root.join("checklist");
                    if ("Verified".equals(effectiveMasterVerifyStatus)) {
                        predicates.add(masterJoin.get("verifyStatusObj").get("name").in("VERIFIED", "ACCEPTED"));
                    } else {
                        predicates.add(cb.equal(masterJoin.get("verifyStatusObj").get("name"),
                                effectiveMasterVerifyStatus.trim().toUpperCase()));
                    }
                }

                if (dualCheck != null && !dualCheck.isEmpty() && !dualCheck.equals("All")) {
                    if (masterJoin == null) {
                        masterJoin = root.join("checklist");
                    }
                    if ("YES".equalsIgnoreCase(dualCheck)) {
                        Predicate isChecklistAndDual = cb.and(
                                masterJoin.get("category").in("CHECKLIST", "CHECK LIST"),
                                masterJoin.get("dualCheck").in("1", "YES"));
                        Predicate isRenewalAndVerify = cb.and(
                                cb.equal(masterJoin.get("category"), "RENEWAL"),
                                cb.equal(masterJoin.get("verificationRequired"), "YES"));
                        predicates.add(cb.or(isChecklistAndDual, isRenewalAndVerify));
                    } else {
                        predicates.add(cb.equal(masterJoin.get("dualCheck"), dualCheck));
                    }
                }

                // Build assignedToMe predicate using IDs, codes, names, and user IDs
                List<Predicate> mePreds = new ArrayList<>();
                if (finalUserEmpId != null) {
                    mePreds.add(cb.equal(root.get("assignedTo"), String.valueOf(finalUserEmpId)));
                }
                if (finalUserEmpCode != null && !finalUserEmpCode.trim().isEmpty()) {
                    mePreds.add(cb.equal(root.get("assignedTo"), finalUserEmpCode));
                }
                if (finalEmployeeName != null && !finalEmployeeName.trim().isEmpty()) {
                    mePreds.add(cb.equal(root.get("assignedTo"), finalEmployeeName));
                }
                if (currentUser != null && !currentUser.trim().isEmpty()) {
                    mePreds.add(cb.equal(root.get("assignedTo"), currentUser));
                }

                Predicate assignedToMe = mePreds.isEmpty() ? cb.disjunction()
                        : cb.or(mePreds.toArray(new Predicate[0]));

                if ("Mine".equalsIgnoreCase(effectiveTaskType) && currentUser != null) {
                    Subquery<Long> nonOwnerSub = query.subquery(Long.class);
                    Root<ChecklistClosed> nonOwnerRoot = nonOwnerSub.from(ChecklistClosed.class);
                    nonOwnerSub.select(nonOwnerRoot.get("id"));

                    List<Predicate> nonOwnerPreds = new ArrayList<>();
                    nonOwnerPreds
                            .add(cb.equal(nonOwnerRoot.get("checklist").get("id"), root.get("checklist").get("id")));
                    nonOwnerPreds.add(nonOwnerRoot.get("assignType").in("SECONDARY", "TERTIARY"));

                    List<Predicate> nonOwnerUserPreds = new ArrayList<>();
                    if (finalUserEmpId != null) {
                        nonOwnerUserPreds.add(cb.equal(nonOwnerRoot.get("assignedTo"), String.valueOf(finalUserEmpId)));
                    }
                    if (finalUserEmpCode != null && !finalUserEmpCode.trim().isEmpty()) {
                        nonOwnerUserPreds.add(cb.equal(nonOwnerRoot.get("assignedTo"), finalUserEmpCode));
                    }
                    if (finalEmployeeName != null && !finalEmployeeName.trim().isEmpty()) {
                        nonOwnerUserPreds.add(cb.equal(nonOwnerRoot.get("assignedTo"), finalEmployeeName));
                    }
                    if (currentUser != null && !currentUser.trim().isEmpty()) {
                        nonOwnerUserPreds.add(cb.equal(nonOwnerRoot.get("assignedTo"), currentUser));
                    }
                    if (!nonOwnerUserPreds.isEmpty()) {
                        nonOwnerPreds.add(cb.or(nonOwnerUserPreds.toArray(new Predicate[0])));
                    } else {
                        nonOwnerPreds.add(cb.disjunction());
                    }
                    nonOwnerSub.where(nonOwnerPreds.toArray(new Predicate[0]));
                    Predicate isNonOwner = cb.exists(nonOwnerSub);

                    if ("QM1130".equals(finalPageCode)) {
                        // On Verify page, "Mine" queries reportees' tasks, excluding the user
                        // themselves
                        if (!reporteeMatchStrings.isEmpty()) {
                            List<String> verifyReportees = new ArrayList<>(reporteeMatchStrings);
                            if (finalUserEmpId != null)
                                verifyReportees.remove(String.valueOf(finalUserEmpId));
                            if (finalUserEmpCode != null)
                                verifyReportees.remove(finalUserEmpCode.trim());
                            if (finalEmployeeName != null)
                                verifyReportees.remove(finalEmployeeName.trim());
                            if (currentUser != null)
                                verifyReportees.remove(currentUser.trim());

                            if (!verifyReportees.isEmpty()) {
                                predicates.add(root.get("assignedTo").in(verifyReportees));
                            } else {
                                predicates.add(cb.disjunction());
                            }
                        } else {
                            predicates.add(cb.disjunction());
                        }
                    } else if ("QM1120".equals(finalPageCode)) {
                        predicates.add(assignedToMe);
                    } else {
                        List<Predicate> verifierPreds = new ArrayList<>();
                        if (masterJoin == null) {
                            masterJoin = root.join("checklist");
                        }
                        if (finalUserEmpId != null) {
                            Join<MasterChecklist, EmployeeMaster> primaryJoin = masterJoin.join("primaryEmployee",
                                    JoinType.LEFT);
                            Join<MasterChecklist, EmployeeMaster> secondaryJoin = masterJoin.join("secondaryEmployee",
                                    JoinType.LEFT);
                            Join<MasterChecklist, EmployeeMaster> tertiaryJoin = masterJoin.join("tertiaryEmployee",
                                    JoinType.LEFT);
                            verifierPreds.add(cb.equal(primaryJoin.get("id"), finalUserEmpId));
                            verifierPreds.add(cb.equal(secondaryJoin.get("id"), finalUserEmpId));
                            verifierPreds.add(cb.equal(tertiaryJoin.get("id"), finalUserEmpId));
                        }
                        if (finalUserEmpCode != null && !finalUserEmpCode.trim().isEmpty()) {
                            Join<MasterChecklist, EmployeeMaster> primaryJoin = masterJoin.join("primaryEmployee",
                                    JoinType.LEFT);
                            Join<MasterChecklist, EmployeeMaster> secondaryJoin = masterJoin.join("secondaryEmployee",
                                    JoinType.LEFT);
                            Join<MasterChecklist, EmployeeMaster> tertiaryJoin = masterJoin.join("tertiaryEmployee",
                                    JoinType.LEFT);
                            verifierPreds.add(cb.equal(primaryJoin.get("empCode"), finalUserEmpCode));
                            verifierPreds.add(cb.equal(secondaryJoin.get("empCode"), finalUserEmpCode));
                            verifierPreds.add(cb.equal(tertiaryJoin.get("empCode"), finalUserEmpCode));
                        }
                        Predicate isVerifier = verifierPreds.isEmpty() ? cb.disjunction()
                                : cb.or(verifierPreds.toArray(new Predicate[0]));

                        Predicate isVerticalHeadVerifier = cb.disjunction();
                        if (masterJoin == null) {
                            masterJoin = root.join("checklist");
                        }
                        if (!reporteeMatchStrings.isEmpty()) {
                            Predicate dualCheckYes = cb.or(
                                    cb.and(masterJoin.get("category").in("CHECKLIST", "CHECK LIST"),
                                            masterJoin.get("dualCheck").in("1", "YES")),
                                    cb.and(cb.equal(masterJoin.get("category"), "RENEWAL"),
                                            cb.equal(masterJoin.get("verificationRequired"), "YES")));
                            Predicate assigneeInReportees = root.get("assignedTo").in(reporteeMatchStrings);
                            isVerticalHeadVerifier = cb.and(dualCheckYes, assigneeInReportees);
                        }

                        predicates.add(cb.or(assignedToMe, isNonOwner, isVerifier, isVerticalHeadVerifier));
                    }
                } else if ("Team".equalsIgnoreCase(effectiveTaskType)) {
                    if (finalIsUserAdmin) {
                        predicates.add(cb.conjunction());
                    } else if ("QM1130".equals(finalPageCode)) {
                        if (!teamVerifierEmployees.isEmpty()) {
                            predicates.add(root.get("assignedTo").in(teamVerifierEmployees));
                        } else {
                            predicates.add(cb.disjunction());
                        }
                    } else {
                        if (masterJoin == null) {
                            masterJoin = root.join("checklist");
                        }
                        List<Predicate> teamPreds = new ArrayList<>();
                        if (!reporteeMatchStrings.isEmpty()) {
                            List<String> teamReportees = new ArrayList<>(reporteeMatchStrings);
                            if (!teamReportees.isEmpty()) {
                                teamPreds.add(root.get("assignedTo").in(teamReportees));

                                Join<MasterChecklist, EmployeeMaster> primaryJoin = masterJoin.join("primaryEmployee",
                                        JoinType.LEFT);
                                teamPreds.add(primaryJoin.get("id").as(String.class).in(teamReportees));
                                teamPreds.add(primaryJoin.get("empCode").in(teamReportees));
                                teamPreds.add(primaryJoin.get("employeeName").in(teamReportees));

                                Join<MasterChecklist, EmployeeMaster> secondaryJoin = masterJoin
                                        .join("secondaryEmployee", JoinType.LEFT);
                                teamPreds.add(secondaryJoin.get("id").as(String.class).in(teamReportees));
                                teamPreds.add(secondaryJoin.get("empCode").in(teamReportees));

                                Join<MasterChecklist, EmployeeMaster> tertiaryJoin = masterJoin.join("tertiaryEmployee",
                                        JoinType.LEFT);
                                teamPreds.add(tertiaryJoin.get("id").as(String.class).in(teamReportees));
                                teamPreds.add(tertiaryJoin.get("empCode").in(teamReportees));
                            }
                        }
                        if (!teamPreds.isEmpty()) {
                            predicates.add(cb.or(teamPreds.toArray(new Predicate[0])));
                        } else {
                            predicates.add(cb.disjunction());
                        }
                    }
                } else if ("Company".equalsIgnoreCase(effectiveTaskType)) {
                    if ("QM1130".equals(finalPageCode)) {
                        // Do not restrict by master checklist verifyStatus, as execution tasks have
                        // their own verifyStatus.
                    }
                }

                if (finalStatusVal != null && !finalStatusVal.equals("All") && !finalStatusVal.isEmpty()) {
                    Join<ChecklistClosed, StatusMaster> statusJoin = root.join("status",
                            jakarta.persistence.criteria.JoinType.LEFT);
                    Join<ChecklistClosed, StatusMaster> verifyStatusJoin = root.join("verifyStatus",
                            jakarta.persistence.criteria.JoinType.LEFT);
                    if ("Open".equalsIgnoreCase(finalStatusVal)) {
                        predicates.add(cb.or(
                                statusJoin.get("name").in("Pending", "Started", "Active"),
                                cb.isNull(statusJoin.get("name"))));
                    } else if (finalStatusVal.contains(",")) {
                        String[] statusArr = finalStatusVal.split(",");
                        List<String> statusList = new ArrayList<>();
                        boolean includesPending = false;
                        for (String s : statusArr) {
                            statusList.add(s.trim());
                            if (s.trim().equalsIgnoreCase("Pending") || s.trim().equalsIgnoreCase("Open")
                                    || s.trim().equalsIgnoreCase("Active")) {
                                includesPending = true;
                            }
                        }
                        Predicate statusPred;
                        List<String> upperList = statusList.stream().map(String::toUpperCase)
                                .collect(java.util.stream.Collectors.toList());
                        if ("QM1130".equals(finalPageCode)) {
                            statusPred = cb.or(
                                    statusJoin.get("name").in(statusList),
                                    verifyStatusJoin.get("name").in(statusList),
                                    cb.upper(statusJoin.get("name")).in(upperList),
                                    cb.upper(verifyStatusJoin.get("name")).in(upperList));
                        } else {
                            statusPred = cb.or(
                                    statusJoin.get("name").in(statusList),
                                    verifyStatusJoin.get("name").in(statusList),
                                    cb.upper(statusJoin.get("name")).in(upperList),
                                    cb.upper(verifyStatusJoin.get("name")).in(upperList));
                        }
                        if (statusList.stream().anyMatch(s -> s.equalsIgnoreCase("Pending for Verified")
                                || s.equalsIgnoreCase("Pending for Verify"))) {
                            statusPred = cb.or(statusPred,
                                    cb.upper(verifyStatusJoin.get("name")).in("PENDING FOR VERIFIED",
                                            "PENDING FOR VERIFY", "PENDING_FOR_VERIFIED"));
                        }
                        if (statusList.stream().anyMatch(s -> s.equalsIgnoreCase("Pending for Accepted")
                                || s.equalsIgnoreCase("Pending for Accept"))) {
                            statusPred = cb.or(statusPred,
                                    cb.equal(verifyStatusJoin.get("name"), "Pending For Accept"));
                        }
                        if (includesPending) {
                            predicates.add(cb.or(statusPred, cb.isNull(statusJoin.get("name"))));
                        } else {
                            predicates.add(statusPred);
                        }
                    } else {
                        Predicate statusPred = cb.or(cb.equal(statusJoin.get("name"), finalStatusVal),
                                cb.equal(verifyStatusJoin.get("name"), finalStatusVal));
                        if (finalStatusVal.equalsIgnoreCase("Pending for Verified")
                                || finalStatusVal.equalsIgnoreCase("Pending for Verify")) {
                            statusPred = cb.or(statusPred,
                                    cb.upper(verifyStatusJoin.get("name")).in("PENDING FOR VERIFIED",
                                            "PENDING FOR VERIFY", "PENDING_FOR_VERIFIED"));
                        }
                        if (finalStatusVal.equalsIgnoreCase("Pending for Accepted")
                                || finalStatusVal.equalsIgnoreCase("Pending for Accept")) {
                            statusPred = cb.or(statusPred,
                                    cb.equal(verifyStatusJoin.get("name"), "Pending For Accept"));
                        }
                        if (finalStatusVal.equalsIgnoreCase("Pending") || finalStatusVal.equalsIgnoreCase("Open")
                                || finalStatusVal.equalsIgnoreCase("Active")) {
                            predicates.add(cb.or(statusPred, cb.isNull(statusJoin.get("name"))));
                        } else {
                            predicates.add(statusPred);
                        }
                    }
                } else {
                    if (excludePending) {
                        Join<ChecklistClosed, StatusMaster> statusJoin = root.join("status",
                                jakarta.persistence.criteria.JoinType.LEFT);
                        predicates.add(cb.not(statusJoin.get("name").in("Pending", "Started", "Active")));
                    }
                }

                if (!assignedToIds.isEmpty()) {
                    predicates.add(root.get("assignedTo").in(assignedToIds));
                }

                if ("Yes".equalsIgnoreCase(considerDate)) {
                    Expression<Date> dateExpr = cb.coalesce(root.get("checklistDate"), root.get("createdDate"));
                    if (finalFromDate != null) {
                        predicates.add(cb.greaterThanOrEqualTo(dateExpr, finalFromDate));
                    }
                    if (finalToDate != null) {
                        predicates.add(cb.lessThanOrEqualTo(dateExpr, finalToDate));
                    }
                }

                if (seqNo != null && !seqNo.isEmpty()) {
                    if (masterJoin == null) {
                        masterJoin = root.join("checklist");
                    }
                    predicates.add(cb.like(cb.lower(masterJoin.get("seqNo")), "%" + seqNo.toLowerCase() + "%"));
                }

                if (checkingPoint != null && !checkingPoint.isEmpty()) {
                    if (masterJoin == null) {
                        masterJoin = root.join("checklist");
                    }
                    predicates.add(cb.like(cb.lower(masterJoin.get("checkingPoint")),
                            "%" + checkingPoint.toLowerCase() + "%"));
                }

                if (frequency != null && !frequency.isEmpty() && !frequency.equals("All")) {
                    if (masterJoin == null) {
                        masterJoin = root.join("checklist");
                    }
                    predicates.add(cb.equal(masterJoin.get("frequency"), frequency));
                }

                if (stockLink != null && !stockLink.isEmpty() && !stockLink.equals("All")) {
                    if (masterJoin == null) {
                        masterJoin = root.join("checklist");
                    }
                    predicates.add(cb.equal(masterJoin.get("stockLink"), stockLink));
                }

                if (checklistId == null && resolvedDepartment != null && !resolvedDepartment.isEmpty()) {
                    if (masterJoin == null) {
                        masterJoin = root.join("checklist");
                    }
                    Subquery<Long> deptSub = query.subquery(Long.class);
                    Root<ChecklistDepartment> deptRoot = deptSub.from(ChecklistDepartment.class);
                    Join<ChecklistDepartment, Department> deptObjJoin = deptRoot.join("department");
                    deptSub.select(deptRoot.get("checklist").get("id"));
                    deptSub.where(cb.equal(deptObjJoin.get("departmentName"), resolvedDepartment));
                    predicates.add(masterJoin.get("id").in(deptSub));
                }

                if (assignedBy != null && !assignedBy.isEmpty()) {
                    predicates.add(cb.like(cb.lower(root.get("assignedBy")), "%" + assignedBy.toLowerCase() + "%"));
                }

                if (category != null && !category.equals("All")) {
                    if (masterJoin == null) {
                        masterJoin = root.join("checklist");
                    }
                    if ("CHECK LIST".equalsIgnoreCase(category) || "CHECKLIST".equalsIgnoreCase(category)) {
                        predicates.add(masterJoin.get("category").in("CHECK LIST", "CHECKLIST"));
                    } else {
                        predicates.add(cb.equal(masterJoin.get("category"), category));
                    }
                }

                if (searchValue != null && !searchValue.isEmpty()) {
                    String searchTerm = "%" + searchValue.toLowerCase() + "%";
                    if (searchBy != null && !searchBy.isEmpty()) {
                        Expression<String> expression;
                        if (searchBy.contains(".")) {
                            String[] parts = searchBy.split("\\.");
                            if ("checklist".equals(parts[0])) {
                                Join<ChecklistClosed, MasterChecklist> cJoin = (masterJoin != null) ? masterJoin
                                        : root.join("checklist");
                                expression = cJoin.get(parts[1]);
                            } else if ("status".equals(parts[0])) {
                                Join<ChecklistClosed, StatusMaster> sJoin = root.join("status");
                                expression = sJoin.get(parts[1]);
                            } else {
                                Path<Object> p = root.get(parts[0]);
                                for (int i = 1; i < parts.length; i++) {
                                    p = p.get(parts[i]);
                                }
                                if (String.class.equals(p.getJavaType())) {
                                    expression = (Expression<String>) (Expression<?>) p;
                                } else {
                                    expression = p.as(String.class);
                                }
                            }
                        } else {
                            if (java.util.Arrays.asList("seqNo", "checkingPoint", "category", "frequency")
                                    .contains(searchBy)) {
                                Join<ChecklistClosed, MasterChecklist> cJoin = (masterJoin != null) ? masterJoin
                                        : root.join("checklist");
                                expression = cJoin.get(searchBy);
                            } else if ("status".equals(searchBy)) {
                                Join<ChecklistClosed, StatusMaster> sJoin = root.join("status");
                                expression = sJoin.get("name");
                            } else {
                                Path<Object> p = root.get(searchBy);
                                if (String.class.equals(p.getJavaType())) {
                                    expression = (Expression<String>) (Expression<?>) p;
                                } else {
                                    expression = p.as(String.class);
                                }
                            }
                        }
                        predicates.add(cb.like(cb.lower(expression), searchTerm));
                    } else {
                        List<Predicate> orPredicates = new ArrayList<>();
                        orPredicates.add(cb.like(cb.lower(root.get("assignedTo")), searchTerm));
                        if (!matchedEmployeeIdsAndCodes.isEmpty()) {
                            orPredicates.add(root.get("assignedTo").in(matchedEmployeeIdsAndCodes));
                        }
                        orPredicates.add(cb.like(cb.lower(root.get("assignedBy")), searchTerm));

                        Join<ChecklistClosed, StatusMaster> sJoin = root.join("status", JoinType.LEFT);
                        orPredicates.add(cb.like(cb.lower(sJoin.get("name")), searchTerm));

                        Join<ChecklistClosed, MasterChecklist> cJoin = root.join("checklist", JoinType.LEFT);
                        orPredicates.add(cb.like(cb.lower(cJoin.get("seqNo")), searchTerm));
                        orPredicates.add(cb.like(cb.lower(cJoin.get("checkingPoint")), searchTerm));
                        orPredicates.add(cb.like(cb.lower(cJoin.get("category")), searchTerm));
                        orPredicates.add(cb.like(cb.lower(cJoin.get("frequency")), searchTerm));

                        Subquery<Long> dSub = query.subquery(Long.class);
                        Root<ChecklistDepartment> dRoot = dSub.from(ChecklistDepartment.class);
                        Join<ChecklistDepartment, Department> dObj = dRoot.join("department");
                        dSub.select(dRoot.get("checklist").get("id"));
                        dSub.where(cb.like(cb.lower(dObj.get("departmentName")), searchTerm));
                        orPredicates.add(cJoin.get("id").in(dSub));

                        predicates.add(cb.or(orPredicates.toArray(new Predicate[0])));
                    }
                }

                return cb.and(predicates.toArray(new Predicate[0]));
            };
        }

        org.springframework.data.jpa.domain.Specification<ChecklistAssignment> activeSpec = null;
        if (queryActive) {
            activeSpec = (root, query, cb) -> {
                List<Predicate> predicates = new ArrayList<>();
                if (checklistId == null) {
                    predicates.add(cb.or(
                            cb.equal(root.get("isActive"), true),
                            cb.equal(root.get("pendingActivation"), true)));
                }

                Join<ChecklistAssignment, MasterChecklist> masterJoin = null;

                if (checklistId != null) {
                    masterJoin = root.join("checklist");
                    predicates.add(cb.equal(masterJoin.get("id"), checklistId));
                }

                if (effectiveMasterVerifyStatus != null && !effectiveMasterVerifyStatus.isEmpty()) {
                    if (masterJoin == null)
                        masterJoin = root.join("checklist");
                    if ("Verified".equals(effectiveMasterVerifyStatus)) {
                        predicates.add(masterJoin.get("verifyStatusObj").get("name").in("VERIFIED", "ACCEPTED"));
                    } else {
                        predicates.add(cb.equal(masterJoin.get("verifyStatusObj").get("name"),
                                effectiveMasterVerifyStatus.trim().toUpperCase()));
                    }
                }

                if (dualCheck != null && !dualCheck.isEmpty() && !dualCheck.equals("All")) {
                    if (masterJoin == null) {
                        masterJoin = root.join("checklist");
                    }
                    if ("YES".equalsIgnoreCase(dualCheck)) {
                        Predicate isChecklistAndDual = cb.and(
                                masterJoin.get("category").in("CHECKLIST", "CHECK LIST"),
                                masterJoin.get("dualCheck").in("1", "YES"));
                        Predicate isRenewalAndVerify = cb.and(
                                cb.equal(masterJoin.get("category"), "RENEWAL"),
                                cb.equal(masterJoin.get("verificationRequired"), "YES"));
                        predicates.add(cb.or(isChecklistAndDual, isRenewalAndVerify));
                    } else {
                        predicates.add(cb.equal(masterJoin.get("dualCheck"), dualCheck));
                    }
                }

                // Build assignedToMe predicate using IDs, codes, names, and user IDs
                List<Predicate> mePreds = new ArrayList<>();
                if (finalUserEmpId != null) {
                    mePreds.add(cb.equal(root.get("assignedTo"), String.valueOf(finalUserEmpId)));
                }
                if (finalUserEmpCode != null && !finalUserEmpCode.trim().isEmpty()) {
                    mePreds.add(cb.equal(root.get("assignedTo"), finalUserEmpCode));
                }
                if (finalEmployeeName != null && !finalEmployeeName.trim().isEmpty()) {
                    mePreds.add(cb.equal(root.get("assignedTo"), finalEmployeeName));
                }
                if (currentUser != null && !currentUser.trim().isEmpty()) {
                    mePreds.add(cb.equal(root.get("assignedTo"), currentUser));
                }

                Predicate assignedToMe = mePreds.isEmpty() ? cb.disjunction()
                        : cb.or(mePreds.toArray(new Predicate[0]));

                if ("Mine".equalsIgnoreCase(effectiveTaskType) && currentUser != null) {
                    if ("QM1130".equals(finalPageCode)) {
                        // On Verify page, "Mine" queries direct reportees pending verification,
                        // excluding the user themselves
                        if (!reporteeMatchStrings.isEmpty()) {
                            List<String> verifyReportees = new ArrayList<>(reporteeMatchStrings);
                            if (finalUserEmpId != null)
                                verifyReportees.remove(String.valueOf(finalUserEmpId));
                            if (finalUserEmpCode != null)
                                verifyReportees.remove(finalUserEmpCode.trim());
                            if (finalEmployeeName != null)
                                verifyReportees.remove(finalEmployeeName.trim());
                            if (currentUser != null)
                                verifyReportees.remove(currentUser.trim());

                            if (!verifyReportees.isEmpty()) {
                                predicates.add(root.get("assignedTo").in(verifyReportees));
                            } else {
                                predicates.add(cb.disjunction());
                            }
                        } else {
                            predicates.add(cb.disjunction());
                        }
                    } else {
                        Subquery<Long> nonOwnerSub = query.subquery(Long.class);
                        Root<ChecklistAssignment> nonOwnerRoot = nonOwnerSub.from(ChecklistAssignment.class);
                        nonOwnerSub.select(nonOwnerRoot.get("id"));

                        List<Predicate> nonOwnerPreds = new ArrayList<>();
                        nonOwnerPreds
                                .add(cb.equal(nonOwnerRoot.get("checklist").get("id"),
                                        root.get("checklist").get("id")));
                        nonOwnerPreds.add(nonOwnerRoot.get("assignType").in("SECONDARY", "TERTIARY"));
                        nonOwnerRoot.get("isActive").as(Boolean.class); // Keep compilation safe
                        nonOwnerPreds.add(cb.equal(nonOwnerRoot.get("isActive"), true));

                        List<Predicate> nonOwnerUserPreds = new ArrayList<>();
                        if (finalUserEmpId != null) {
                            nonOwnerUserPreds
                                    .add(cb.equal(nonOwnerRoot.get("assignedTo"), String.valueOf(finalUserEmpId)));
                        }
                        if (finalUserEmpCode != null && !finalUserEmpCode.trim().isEmpty()) {
                            nonOwnerUserPreds.add(cb.equal(nonOwnerRoot.get("assignedTo"), finalUserEmpCode));
                        }
                        if (finalEmployeeName != null && !finalEmployeeName.trim().isEmpty()) {
                            nonOwnerUserPreds.add(cb.equal(nonOwnerRoot.get("assignedTo"), finalEmployeeName));
                        }
                        if (currentUser != null && !currentUser.trim().isEmpty()) {
                            nonOwnerUserPreds.add(cb.equal(nonOwnerRoot.get("assignedTo"), currentUser));
                        }
                        if (!nonOwnerUserPreds.isEmpty()) {
                            nonOwnerPreds.add(cb.or(nonOwnerUserPreds.toArray(new Predicate[0])));
                        } else {
                            nonOwnerPreds.add(cb.disjunction());
                        }
                        nonOwnerSub.where(nonOwnerPreds.toArray(new Predicate[0]));
                        Predicate isNonOwner = cb.exists(nonOwnerSub);

                        List<Predicate> verifierPreds = new ArrayList<>();
                        if (masterJoin == null) {
                            masterJoin = root.join("checklist");
                        }
                        if (finalUserEmpId != null) {
                            Join<MasterChecklist, EmployeeMaster> primaryJoin = masterJoin.join("primaryEmployee",
                                    JoinType.LEFT);
                            Join<MasterChecklist, EmployeeMaster> secondaryJoin = masterJoin.join("secondaryEmployee",
                                    JoinType.LEFT);
                            Join<MasterChecklist, EmployeeMaster> tertiaryJoin = masterJoin.join("tertiaryEmployee",
                                    JoinType.LEFT);
                            verifierPreds.add(cb.equal(primaryJoin.get("id"), finalUserEmpId));
                            verifierPreds.add(cb.equal(secondaryJoin.get("id"), finalUserEmpId));
                            verifierPreds.add(cb.equal(tertiaryJoin.get("id"), finalUserEmpId));
                        }
                        if (finalUserEmpCode != null && !finalUserEmpCode.trim().isEmpty()) {
                            Join<MasterChecklist, EmployeeMaster> primaryJoin = masterJoin.join("primaryEmployee",
                                    JoinType.LEFT);
                            Join<MasterChecklist, EmployeeMaster> secondaryJoin = masterJoin.join("secondaryEmployee",
                                    JoinType.LEFT);
                            Join<MasterChecklist, EmployeeMaster> tertiaryJoin = masterJoin.join("tertiaryEmployee",
                                    JoinType.LEFT);
                            verifierPreds.add(cb.equal(primaryJoin.get("empCode"), finalUserEmpCode));
                            verifierPreds.add(cb.equal(secondaryJoin.get("empCode"), finalUserEmpCode));
                            verifierPreds.add(cb.equal(tertiaryJoin.get("empCode"), finalUserEmpCode));
                        }
                        Predicate isVerifier = verifierPreds.isEmpty() ? cb.disjunction()
                                : cb.or(verifierPreds.toArray(new Predicate[0]));

                        predicates.add(cb.or(assignedToMe, isNonOwner, isVerifier));
                    }
                } else if ("Team".equalsIgnoreCase(effectiveTaskType)) {
                    if (finalIsUserAdmin) {
                        predicates.add(cb.conjunction());
                    } else if ("QM1130".equals(finalPageCode)) {
                        if (!teamVerifierEmployees.isEmpty()) {
                            predicates.add(root.get("assignedTo").in(teamVerifierEmployees));
                        } else {
                            predicates.add(cb.disjunction());
                        }
                    } else {
                        if (masterJoin == null) {
                            masterJoin = root.join("checklist");
                        }
                        List<Predicate> teamPreds = new ArrayList<>();
                        if (!reporteeMatchStrings.isEmpty()) {
                            List<String> teamReportees = new ArrayList<>(reporteeMatchStrings);
                            if (!teamReportees.isEmpty()) {
                                teamPreds.add(root.get("assignedTo").in(teamReportees));

                                Join<MasterChecklist, EmployeeMaster> primaryJoin = masterJoin.join("primaryEmployee",
                                        JoinType.LEFT);
                                teamPreds.add(primaryJoin.get("id").as(String.class).in(teamReportees));
                                teamPreds.add(primaryJoin.get("empCode").in(teamReportees));
                                teamPreds.add(primaryJoin.get("employeeName").in(teamReportees));

                                Join<MasterChecklist, EmployeeMaster> secondaryJoin = masterJoin
                                        .join("secondaryEmployee", JoinType.LEFT);
                                teamPreds.add(secondaryJoin.get("id").as(String.class).in(teamReportees));
                                teamPreds.add(secondaryJoin.get("empCode").in(teamReportees));

                                Join<MasterChecklist, EmployeeMaster> tertiaryJoin = masterJoin.join("tertiaryEmployee",
                                        JoinType.LEFT);
                                teamPreds.add(tertiaryJoin.get("id").as(String.class).in(teamReportees));
                                teamPreds.add(tertiaryJoin.get("empCode").in(teamReportees));
                            }
                        }
                        if (!teamPreds.isEmpty()) {
                            predicates.add(cb.or(teamPreds.toArray(new Predicate[0])));
                        } else {
                            predicates.add(cb.disjunction());
                        }
                    }
                } else if ("Company".equalsIgnoreCase(effectiveTaskType)) {
                    if ("QM1130".equals(finalPageCode)) {
                        // Do not restrict by master checklist verifyStatus, as execution tasks have
                        // their own verifyStatus.
                    }
                }

                if (finalStatusVal != null && !finalStatusVal.equals("All") && !finalStatusVal.isEmpty()) {
                    Join<ChecklistAssignment, StatusMaster> statusJoin = root.join("status",
                            jakarta.persistence.criteria.JoinType.LEFT);
                    Join<ChecklistAssignment, StatusMaster> verifyStatusJoin = root.join("verifyStatus",
                            jakarta.persistence.criteria.JoinType.LEFT);
                    if ("Open".equalsIgnoreCase(finalStatusVal)) {
                        predicates.add(cb.or(
                                statusJoin.get("name").in("Pending", "Started", "Active"),
                                cb.isNull(statusJoin.get("name"))));
                    } else if (finalStatusVal.contains(",")) {
                        String[] statusArr = finalStatusVal.split(",");
                        List<String> statusList = new ArrayList<>();
                        boolean includesPending = false;
                        for (String s : statusArr) {
                            String trimmed = s.trim();
                            if (trimmed.equalsIgnoreCase("Pending for Verified")
                                    || trimmed.equalsIgnoreCase("Pending for Verify")) {
                                statusList.add("Pending for Verified");
                                statusList.add("Pending For Verify");
                                statusList.add("Pending for Verify");
                                statusList.add("Pending For Verified");
                            } else if (trimmed.equalsIgnoreCase("Pending for Accepted")
                                    || trimmed.equalsIgnoreCase("Pending for Accept")) {
                                statusList.add("Pending for Accepted");
                                statusList.add("Pending For Accept");
                            } else {
                                statusList.add(trimmed);
                            }
                            if (trimmed.equalsIgnoreCase("Pending") || trimmed.equalsIgnoreCase("Open")
                                    || trimmed.equalsIgnoreCase("Active")) {
                                includesPending = true;
                            }
                        }
                        Predicate statusPred;
                        List<String> upperList2 = statusList.stream().map(String::toUpperCase)
                                .collect(java.util.stream.Collectors.toList());
                        if ("QM1130".equals(finalPageCode)) {
                            statusPred = cb.or(
                                    statusJoin.get("name").in(statusList),
                                    verifyStatusJoin.get("name").in(statusList),
                                    cb.upper(statusJoin.get("name")).in(upperList2),
                                    cb.upper(verifyStatusJoin.get("name")).in(upperList2));
                        } else {
                            statusPred = cb.or(
                                    statusJoin.get("name").in(statusList),
                                    verifyStatusJoin.get("name").in(statusList),
                                    cb.upper(statusJoin.get("name")).in(upperList2),
                                    cb.upper(verifyStatusJoin.get("name")).in(upperList2));
                        }
                        if (includesPending) {
                            predicates.add(cb.or(statusPred, cb.isNull(statusJoin.get("name"))));
                        } else {
                            predicates.add(statusPred);
                        }
                    } else {
                        if (finalStatusVal.equalsIgnoreCase("Pending") || finalStatusVal.equalsIgnoreCase("Open")
                                || finalStatusVal.equalsIgnoreCase("Active")) {
                            predicates.add(cb.or(cb.equal(statusJoin.get("name"), finalStatusVal),
                                    cb.isNull(statusJoin.get("name"))));
                        } else {
                            Predicate statusPred;
                            if ("QM1130".equals(finalPageCode)) {
                                if (finalStatusVal.equalsIgnoreCase("Pending for Verified")
                                        || finalStatusVal.equalsIgnoreCase("Pending for Verify")) {
                                    statusPred = cb.or(
                                            verifyStatusJoin.get("name").in("Pending for Verified",
                                                    "Pending For Verify", "Pending for Verify", "Pending For Verified"),
                                            cb.upper(verifyStatusJoin.get("name")).in("PENDING FOR VERIFIED",
                                                    "PENDING FOR VERIFY", "PENDING_FOR_VERIFIED"));
                                } else if (finalStatusVal.equalsIgnoreCase("Pending for Accepted")
                                        || finalStatusVal.equalsIgnoreCase("Pending for Accept")) {
                                    statusPred = verifyStatusJoin.get("name").in("Pending for Accepted",
                                            "Pending For Accept");
                                } else {
                                    statusPred = cb.equal(verifyStatusJoin.get("name"), finalStatusVal);
                                }
                            } else {
                                if (finalStatusVal.equalsIgnoreCase("Pending for Verified")
                                        || finalStatusVal.equalsIgnoreCase("Pending for Verify")) {
                                    statusPred = cb.or(
                                            cb.upper(statusJoin.get("name")).in("PENDING FOR VERIFIED",
                                                    "PENDING FOR VERIFY", "PENDING_FOR_VERIFIED"),
                                            cb.upper(verifyStatusJoin.get("name")).in("PENDING FOR VERIFIED",
                                                    "PENDING FOR VERIFY", "PENDING_FOR_VERIFIED"));
                                } else if (finalStatusVal.equalsIgnoreCase("Pending for Accepted")
                                        || finalStatusVal.equalsIgnoreCase("Pending for Accept")) {
                                    statusPred = cb.or(cb.equal(statusJoin.get("name"), finalStatusVal),
                                            verifyStatusJoin.get("name").in("Pending for Accepted",
                                                    "Pending For Accept"));
                                } else {
                                    statusPred = cb.or(cb.equal(statusJoin.get("name"), finalStatusVal),
                                            cb.equal(verifyStatusJoin.get("name"), finalStatusVal));
                                }
                            }
                            predicates.add(statusPred);
                        }
                    }
                } else {
                    if (finalExcludeCompletedVal) {
                        // If "All" is selected and we want to focus on execution, exclude
                        // completed/finalized tasks
                        Join<ChecklistAssignment, StatusMaster> statusJoin = root.join("status",
                                jakarta.persistence.criteria.JoinType.LEFT);
                        predicates.add(cb.or(cb.isNull(statusJoin.get("name")),
                                cb.not(cb.upper(statusJoin.get("name")).in(
                                        "COMPLETED", "VERIFIED", "ACCEPTED", "ATTENDED", "REJECTED", "MISSED",
                                        "NOT COMPLETED",
                                        "PENDING FOR VERIFIED", "PENDING FOR ACCEPTED", "CLOSED", "PENDING FOR VERIFY",
                                        "PENDING FOR ACCEPT"))));
                    }
                    if (excludePending) {
                        Join<ChecklistAssignment, StatusMaster> statusJoin = root.join("status",
                                jakarta.persistence.criteria.JoinType.LEFT);
                        predicates.add(cb.not(statusJoin.get("name").in("Pending", "Started", "Active")));
                    }
                }

                if (!assignedToIds.isEmpty()) {
                    Predicate isNonOwner;
                    if (finalNonOwnerChecklistIds.isEmpty()) {
                        isNonOwner = cb.disjunction();
                    } else {
                        isNonOwner = root.get("checklist").get("id").in(finalNonOwnerChecklistIds);
                    }
                    predicates.add(cb.or(root.get("assignedTo").in(assignedToIds), isNonOwner));
                }

                // FIX 1: Removed the duplicate LIKE-based assignedTo predicate that previously
                // coexisted with the ID-based IN predicate above. When both were AND-ed
                // together
                // they produced contradictory conditions (numeric empId vs empCode string) that
                // allowed wrong rows through or blocked correct ones.
                // The ID-based IN predicate at assignedToIds is authoritative and sufficient.

                // FIX 2: Dashboard visibility rule - only show a task to an employee if:
                // Filter by assignType if explicitly provided (e.g. Checklist Renewal passes
                // PRIMARY).
                // Otherwise fall back to the original logic: only show PRIMARY rows when
                // excludeCompleted
                // is active AND an assignedTo filter is present (scheduler-reassigned rows are
                // also shown).
                if (assignType != null && !assignType.trim().isEmpty()) {
                    if (!"ALL".equalsIgnoreCase(assignType.trim())) {
                        predicates.add(cb.equal(
                                cb.upper(root.get("assignType")),
                                assignType.trim().toUpperCase()));
                    }
                } else if (finalExcludeCompletedVal && checklistId == null) {
                    Predicate isPrimary = cb.equal(root.get("assignType"), "PRIMARY");
                    Predicate wasReassigned = cb.isNotNull(root.get("reassignedFromType"));
                    Predicate isNonOwnerRow = root.get("assignType").in("SECONDARY", "TERTIARY");
                    predicates.add(cb.or(isPrimary, wasReassigned, isNonOwnerRow));
                }

                // Exclude future records from the active list: checklistDate <= today
                if (checklistId == null && !"Yes".equalsIgnoreCase(considerDate)) {
                    Expression<Date> dateExprForFutureCheck = cb.coalesce(root.get("checklistDate"),
                            root.get("createdDate"));
                    java.time.LocalDate todayLocal = java.time.LocalDate.now(java.time.ZoneId.of("Asia/Kolkata"));
                    java.time.LocalDateTime endOfToday = todayLocal.atTime(23, 59, 59, 999000000);
                    java.util.Date endOfTodayDate = java.util.Date
                            .from(endOfToday.atZone(java.time.ZoneId.of("Asia/Kolkata")).toInstant());
                    predicates.add(cb.lessThanOrEqualTo(dateExprForFutureCheck, endOfTodayDate));
                }

                if ("Yes".equalsIgnoreCase(considerDate)) {
                    Expression<Date> dateExpr = cb.coalesce(root.get("checklistDate"), root.get("createdDate"));
                    if (finalFromDate != null) {
                        predicates.add(cb.greaterThanOrEqualTo(dateExpr, finalFromDate));
                    }
                    if (finalToDate != null) {
                        predicates.add(cb.lessThanOrEqualTo(dateExpr, finalToDate));
                    }
                }

                if (seqNo != null && !seqNo.isEmpty()) {
                    if (masterJoin == null) {
                        masterJoin = root.join("checklist");
                    }
                    predicates.add(cb.like(cb.lower(masterJoin.get("seqNo")), "%" + seqNo.toLowerCase() + "%"));
                }

                if (checkingPoint != null && !checkingPoint.isEmpty()) {
                    if (masterJoin == null) {
                        masterJoin = root.join("checklist");
                    }
                    predicates.add(
                            cb.like(cb.lower(masterJoin.get("checkingPoint")),
                                    "%" + checkingPoint.toLowerCase() + "%"));
                }

                if (frequency != null && !frequency.isEmpty() && !frequency.equals("All")) {
                    if (masterJoin == null) {
                        masterJoin = root.join("checklist");
                    }
                    predicates.add(cb.equal(masterJoin.get("frequency"), frequency));
                }

                if (stockLink != null && !stockLink.isEmpty() && !stockLink.equals("All")) {
                    if (masterJoin == null) {
                        masterJoin = root.join("checklist");
                    }
                    predicates.add(cb.equal(masterJoin.get("stockLink"), stockLink));
                }

                if (checklistId == null && resolvedDepartment != null && !resolvedDepartment.isEmpty()) {
                    if (masterJoin == null) {
                        masterJoin = root.join("checklist");
                    }
                    Subquery<Long> deptSub = query.subquery(Long.class);
                    Root<ChecklistDepartment> deptRoot = deptSub.from(ChecklistDepartment.class);
                    Join<ChecklistDepartment, Department> deptObjJoin = deptRoot.join("department");
                    deptSub.select(deptRoot.get("checklist").get("id"));
                    deptSub.where(cb.equal(deptObjJoin.get("departmentName"), resolvedDepartment));
                    predicates.add(masterJoin.get("id").in(deptSub));
                }

                if (assignedBy != null && !assignedBy.isEmpty()) {
                    predicates.add(cb.like(cb.lower(root.get("assignedBy")), "%" + assignedBy.toLowerCase() + "%"));
                }

                if (category != null && !category.equals("All")) {
                    if (masterJoin == null) {
                        masterJoin = root.join("checklist");
                    }
                    if ("CHECK LIST".equalsIgnoreCase(category) || "CHECKLIST".equalsIgnoreCase(category)) {
                        predicates.add(masterJoin.get("category").in("CHECK LIST", "CHECKLIST"));
                    } else {
                        predicates.add(cb.equal(masterJoin.get("category"), category));
                    }
                }

                if (searchValue != null && !searchValue.isEmpty()) {
                    String searchTerm = "%" + searchValue.toLowerCase() + "%";
                    if (searchBy != null && !searchBy.isEmpty()) {
                        Expression<String> expression;
                        if (searchBy.contains(".")) {
                            String[] parts = searchBy.split("\\.");
                            if ("checklist".equals(parts[0])) {
                                Join<ChecklistAssignment, MasterChecklist> cJoin = (masterJoin != null) ? masterJoin
                                        : root.join("checklist");
                                expression = cJoin.get(parts[1]);
                            } else if ("status".equals(parts[0])) {
                                Join<ChecklistAssignment, StatusMaster> sJoin = root.join("status");
                                expression = sJoin.get(parts[1]);
                            } else {
                                Path<Object> p = root.get(parts[0]);
                                for (int i = 1; i < parts.length; i++) {
                                    p = p.get(parts[i]);
                                }
                                if (String.class.equals(p.getJavaType())) {
                                    expression = (Expression<String>) (Expression<?>) p;
                                } else {
                                    expression = p.as(String.class);
                                }
                            }
                        } else {
                            if (java.util.Arrays.asList("seqNo", "checkingPoint", "category", "frequency")
                                    .contains(searchBy)) {
                                Join<ChecklistAssignment, MasterChecklist> cJoin = (masterJoin != null) ? masterJoin
                                        : root.join("checklist");
                                expression = cJoin.get(searchBy);
                            } else if ("status".equals(searchBy)) {
                                Join<ChecklistAssignment, StatusMaster> sJoin = root.join("status");
                                expression = sJoin.get("name");
                            } else {
                                Path<Object> p = root.get(searchBy);
                                if (String.class.equals(p.getJavaType())) {
                                    expression = (Expression<String>) (Expression<?>) p;
                                } else {
                                    expression = p.as(String.class);
                                }
                            }
                        }
                        predicates.add(cb.like(cb.lower(expression), searchTerm));
                    } else {
                        List<Predicate> orPredicates = new ArrayList<>();
                        orPredicates.add(cb.like(cb.lower(root.get("assignedTo")), searchTerm));
                        if (!matchedEmployeeIdsAndCodes.isEmpty()) {
                            orPredicates.add(root.get("assignedTo").in(matchedEmployeeIdsAndCodes));
                        }
                        orPredicates.add(cb.like(cb.lower(root.get("assignedBy")), searchTerm));

                        Join<ChecklistAssignment, StatusMaster> sJoin = root.join("status", JoinType.LEFT);
                        orPredicates.add(cb.like(cb.lower(sJoin.get("name")), searchTerm));

                        Join<ChecklistAssignment, MasterChecklist> cJoin = root.join("checklist", JoinType.LEFT);
                        orPredicates.add(cb.like(cb.lower(cJoin.get("seqNo")), searchTerm));
                        orPredicates.add(cb.like(cb.lower(cJoin.get("checkingPoint")), searchTerm));
                        orPredicates.add(cb.like(cb.lower(cJoin.get("category")), searchTerm));
                        orPredicates.add(cb.like(cb.lower(cJoin.get("frequency")), searchTerm));

                        Subquery<Long> dSub = query.subquery(Long.class);
                        Root<ChecklistDepartment> dRoot = dSub.from(ChecklistDepartment.class);
                        Join<ChecklistDepartment, Department> dObj = dRoot.join("department");
                        dSub.select(dRoot.get("checklist").get("id"));
                        dSub.where(cb.like(cb.lower(dObj.get("departmentName")), searchTerm));
                        orPredicates.add(cJoin.get("id").in(dSub));

                        predicates.add(cb.or(orPredicates.toArray(new Predicate[0])));
                    }
                }

                return cb.and(predicates.toArray(new Predicate[0]));
            };
        }
        final Long finalUserEmpIdForVis = finalUserEmpId;
        String finalUserEmpCodeForVis = finalUserEmpCode;
        String finalEmployeeNameForVis = finalEmployeeName;
        boolean finalIsUserAdminForVis = finalIsUserAdmin;
        boolean finalIsSuperBossForVis = isSuperBoss;

        if (queryClosed && queryActive) {
            List<ChecklistClosed> closedList = closedRepo.findAll(closedSpec);
            List<ChecklistAssignment> activeList = assignRepo.findAll(activeSpec);
            List<ChecklistAssignment> combinedList = new ArrayList<>();
            combinedList.addAll(activeList);
            for (ChecklistClosed closed : closedList) {
                ChecklistAssignment converted = convertToAssignment(closed);
                if (converted.getId() != null) {
                    converted.setId(converted.getId() + 10000000L);
                }
                combinedList.add(converted);
            }
            if ("Mine".equalsIgnoreCase(effectiveTaskType)) {
                // Build the same verifyReportees list used in the DB predicate for QM1130
                final List<String> verifyReporteesForFilter = new ArrayList<>(reporteeMatchStrings);
                if (finalUserEmpIdForVis != null)
                    verifyReporteesForFilter.remove(String.valueOf(finalUserEmpIdForVis));
                if (finalUserEmpCodeForVis != null)
                    verifyReporteesForFilter.remove(finalUserEmpCodeForVis.trim());
                if (finalEmployeeNameForVis != null)
                    verifyReporteesForFilter.remove(finalEmployeeNameForVis.trim());
                if (currentUser != null)
                    verifyReporteesForFilter.remove(currentUser.trim());
                combinedList = combinedList.stream()
                        .filter(a -> {
                            if ("QM1130".equals(finalPageCode)) {
                                // For Verify page "Mine" scope: keep tasks assigned to the current
                                // user's direct reportees (so they can verify). isAssigneeVisible
                                // incorrectly returns true for all SECONDARY/TERTIARY assignments
                                // regardless of who the assignee is — use reporteeMatchStrings instead.
                                String targetAssignee = a.getAssignedTo();
                                if (targetAssignee == null)
                                    return false;
                                String cleanAssignedTo = targetAssignee.trim();
                                return verifyReporteesForFilter.stream()
                                        .anyMatch(r -> r.equalsIgnoreCase(cleanAssignedTo));
                            }
                            return (a.getVerifyStatus() != null)
                                    || isAssigneeVisible(a, finalUserEmpIdForVis, finalUserEmpCodeForVis,
                                            finalEmployeeNameForVis, finalIsUserAdminForVis, finalIsSuperBossForVis);
                        })
                        .collect(java.util.stream.Collectors.toList());
            } else if ("Team".equalsIgnoreCase(effectiveTaskType) && "QM1130".equals(finalPageCode)) {
                combinedList = combinedList.stream()
                        .filter(a -> {
                            String targetAssignee = a.getAssignedTo();
                            if (targetAssignee == null)
                                return false;
                            String cleanAssignedTo = targetAssignee.trim();
                            return teamVerifierEmployees.stream()
                                    .anyMatch(r -> r.equalsIgnoreCase(cleanAssignedTo));
                        })
                        .collect(java.util.stream.Collectors.toList());
            }
            combinedList.sort(
                    (a, b) -> Long.compare(b.getId() != null ? b.getId() : 0L, a.getId() != null ? a.getId() : 0L));
            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageable.getPageSize()), combinedList.size());
            List<ChecklistAssignment> paginatedList = new ArrayList<>();
            if (start < combinedList.size()) {
                paginatedList = combinedList.subList(start, end);
            }
            List<MasterChecklist> checklistsOnPage = paginatedList.stream()
                    .map(ChecklistAssignment::getChecklist)
                    .filter(java.util.Objects::nonNull)
                    .collect(java.util.stream.Collectors.toList());
            populateMasterChecklistFilesBatch(checklistsOnPage);
            paginatedList.forEach(this::populateAssignmentFiles);
            populateRejectionDetails(paginatedList);
            return new org.springframework.data.domain.PageImpl<>(paginatedList, pageable, combinedList.size());
        } else if (queryClosed) {
            org.springframework.data.domain.Page<ChecklistClosed> closedPage = closedRepo.findAll(closedSpec, pageable);
            if ("Mine".equalsIgnoreCase(effectiveTaskType)) {
                final List<String> verifyReporteesForFilter2 = new ArrayList<>(reporteeMatchStrings);
                if (finalUserEmpIdForVis != null)
                    verifyReporteesForFilter2.remove(String.valueOf(finalUserEmpIdForVis));
                if (finalUserEmpCodeForVis != null)
                    verifyReporteesForFilter2.remove(finalUserEmpCodeForVis.trim());
                if (finalEmployeeNameForVis != null)
                    verifyReporteesForFilter2.remove(finalEmployeeNameForVis.trim());
                if (currentUser != null)
                    verifyReporteesForFilter2.remove(currentUser.trim());
                List<ChecklistAssignment> filteredContent = closedPage.getContent().stream()
                        .map(closed -> {
                            ChecklistAssignment converted = convertToAssignment(closed);
                            if (converted.getId() != null) {
                                converted.setId(converted.getId() + 10000000L);
                            }
                            return converted;
                        })
                        .filter(a -> {
                            if ("QM1130".equals(finalPageCode)) {
                                String targetAssignee = a.getAssignedTo();
                                if (targetAssignee == null)
                                    return false;
                                String cleanAssignedTo = targetAssignee.trim();
                                return verifyReporteesForFilter2.stream()
                                        .anyMatch(r -> r.equalsIgnoreCase(cleanAssignedTo));
                            }
                            return true;
                        })
                        .collect(java.util.stream.Collectors.toList());
                List<MasterChecklist> checklistsOnPage = filteredContent.stream()
                        .map(ChecklistAssignment::getChecklist)
                        .filter(java.util.Objects::nonNull)
                        .collect(java.util.stream.Collectors.toList());
                populateMasterChecklistFilesBatch(checklistsOnPage);
                filteredContent.forEach(this::populateAssignmentFiles);
                populateRejectionDetails(filteredContent);

                return new org.springframework.data.domain.PageImpl<>(filteredContent, pageable,
                        closedPage.getTotalElements());
            } else if ("Team".equalsIgnoreCase(effectiveTaskType) && "QM1130".equals(finalPageCode)) {
                List<ChecklistAssignment> filteredContent = closedPage.getContent().stream()
                        .map(closed -> {
                            ChecklistAssignment converted = convertToAssignment(closed);
                            if (converted.getId() != null) {
                                converted.setId(converted.getId() + 10000000L);
                            }
                            return converted;
                        })
                        .filter(a -> {
                            String targetAssignee = a.getAssignedTo();
                            if (targetAssignee == null)
                                return false;
                            String cleanAssignedTo = targetAssignee.trim();
                            return teamVerifierEmployees.stream()
                                    .anyMatch(r -> r.equalsIgnoreCase(cleanAssignedTo));
                        })
                        .collect(java.util.stream.Collectors.toList());

                List<MasterChecklist> checklistsOnPage = filteredContent.stream()
                        .map(ChecklistAssignment::getChecklist)
                        .filter(java.util.Objects::nonNull)
                        .collect(java.util.stream.Collectors.toList());
                populateMasterChecklistFilesBatch(checklistsOnPage);
                filteredContent.forEach(this::populateAssignmentFiles);
                populateRejectionDetails(filteredContent);
                return new org.springframework.data.domain.PageImpl<>(filteredContent, pageable,
                        closedPage.getTotalElements());
            }
            if (closedPage != null && closedPage.getContent() != null) {
                List<MasterChecklist> checklistsOnPage = closedPage.getContent().stream()
                        .map(ChecklistClosed::getChecklist)
                        .filter(java.util.Objects::nonNull)
                        .collect(java.util.stream.Collectors.toList());
                populateMasterChecklistFilesBatch(checklistsOnPage);
            }
            org.springframework.data.domain.Page<ChecklistAssignment> mappedPage = closedPage.map(closed -> {
                ChecklistAssignment converted = convertToAssignment(closed);
                if (converted.getId() != null) {
                    converted.setId(converted.getId() + 10000000L);
                }
                return converted;
            });
            mappedPage.forEach(this::populateAssignmentFiles);
            populateEmployeeNames(mappedPage.getContent());
            return mappedPage;
        } else {
            org.springframework.data.domain.Page<ChecklistAssignment> page = assignRepo.findAll(activeSpec, pageable);
            if ("Mine".equalsIgnoreCase(effectiveTaskType)) {
                final List<String> verifyReporteesForFilter3 = new ArrayList<>(reporteeMatchStrings);
                if (finalUserEmpIdForVis != null)
                    verifyReporteesForFilter3.remove(String.valueOf(finalUserEmpIdForVis));
                if (finalUserEmpCodeForVis != null)
                    verifyReporteesForFilter3.remove(finalUserEmpCodeForVis.trim());
                if (finalEmployeeNameForVis != null)
                    verifyReporteesForFilter3.remove(finalEmployeeNameForVis.trim());
                if (currentUser != null)
                    verifyReporteesForFilter3.remove(currentUser.trim());
                List<ChecklistAssignment> filteredContent = page.getContent().stream()
                        .filter(a -> {
                            if ("QM1130".equals(finalPageCode)) {
                                String targetAssignee = a.getAssignedTo();
                                if (targetAssignee == null)
                                    return false;
                                String cleanAssignedTo = targetAssignee.trim();
                                return verifyReporteesForFilter3.stream()
                                        .anyMatch(r -> r.equalsIgnoreCase(cleanAssignedTo));
                            }
                            return isAssigneeVisible(a, finalUserEmpIdForVis, finalUserEmpCodeForVis,
                                    finalEmployeeNameForVis, finalIsUserAdminForVis, finalIsSuperBossForVis);
                        })
                        .collect(java.util.stream.Collectors.toList());
                List<MasterChecklist> checklistsOnPage = filteredContent.stream()
                        .map(ChecklistAssignment::getChecklist)
                        .filter(java.util.Objects::nonNull)
                        .collect(java.util.stream.Collectors.toList());
                populateMasterChecklistFilesBatch(checklistsOnPage);
                filteredContent.forEach(this::populateAssignmentFiles);
                populateRejectionDetails(filteredContent);

                return new org.springframework.data.domain.PageImpl<>(filteredContent, pageable,
                        page.getTotalElements());
            } else if ("Team".equalsIgnoreCase(effectiveTaskType) && "QM1130".equals(finalPageCode)) {
                List<ChecklistAssignment> filteredContent = page.getContent().stream()
                        .filter(a -> {
                            String targetAssignee = a.getAssignedTo();
                            if (targetAssignee == null)
                                return false;
                            String cleanAssignedTo = targetAssignee.trim();
                            return teamVerifierEmployees.stream()
                                    .anyMatch(r -> r.equalsIgnoreCase(cleanAssignedTo));
                        })
                        .collect(java.util.stream.Collectors.toList());

                List<MasterChecklist> checklistsOnPage = filteredContent.stream()
                        .map(ChecklistAssignment::getChecklist)
                        .filter(java.util.Objects::nonNull)
                        .collect(java.util.stream.Collectors.toList());
                populateMasterChecklistFilesBatch(checklistsOnPage);
                filteredContent.forEach(this::populateAssignmentFiles);
                populateRejectionDetails(filteredContent);
                return new org.springframework.data.domain.PageImpl<>(filteredContent, pageable,
                        page.getTotalElements());
            }
            if (page != null && page.getContent() != null) {
                List<MasterChecklist> checklistsOnPage = page.getContent().stream()
                        .map(ChecklistAssignment::getChecklist)
                        .filter(java.util.Objects::nonNull)
                        .collect(java.util.stream.Collectors.toList());
                populateMasterChecklistFilesBatch(checklistsOnPage);
                populateRejectionDetails(page.getContent());
            }
            page.forEach(this::populateAssignmentFiles);
            return page;
        }
    }

    private void populateClosedEmployeeNames(List<ChecklistClosed> list) {
        if (list == null || list.isEmpty()) {
            return;
        }
        java.util.Set<Long> empIds = new java.util.HashSet<>();
        java.util.Set<String> empCodesOrNames = new java.util.HashSet<>();
        for (ChecklistClosed c : list) {
            String assignedTo = c.getAssignedTo();
            if (assignedTo != null && !assignedTo.trim().isEmpty()) {
                String clean = assignedTo.trim();
                if (!"0".equals(clean)) {
                    try {
                        empIds.add(Long.parseLong(clean));
                    } catch (NumberFormatException e) {
                        empCodesOrNames.add(clean);
                    }
                }
            }
        }

        java.util.Map<String, String> nameMap = new java.util.HashMap<>();
        if (!empIds.isEmpty()) {
            try {
                List<com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster> emps = employeeMasterRepository
                        .findAllById(empIds);
                for (com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster emp : emps) {
                    if (emp.getEmployeeName() != null) {
                        nameMap.put(String.valueOf(emp.getId()), emp.getEmployeeName());
                    }
                }
            } catch (Exception e) {
                log.error("Failed to batch fetch employee names by IDs", e);
            }
        }
        if (!empCodesOrNames.isEmpty()) {
            try {
                String jpql = "SELECT e FROM EmployeeMaster e WHERE e.empCode IN :terms OR e.employeeName IN :terms";
                List<com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster> emps = entityManager
                        .createQuery(jpql, com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster.class)
                        .setParameter("terms", empCodesOrNames)
                        .getResultList();
                for (com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster emp : emps) {
                    if (emp.getEmployeeName() != null) {
                        if (emp.getEmpCode() != null) {
                            nameMap.put(emp.getEmpCode().trim(), emp.getEmployeeName());
                        }
                        nameMap.put(emp.getEmployeeName().trim(), emp.getEmployeeName());
                    }
                }
            } catch (Exception e) {
                log.error("Failed to batch fetch employee names by codes/names", e);
            }
        }

        for (ChecklistClosed c : list) {
            String assignedTo = c.getAssignedTo();
            if (assignedTo != null && !assignedTo.trim().isEmpty()) {
                String clean = assignedTo.trim();
                if ("0".equals(clean)) {
                    c.setAssignedToName("UNASSIGNED");
                } else {
                    String resolvedName = nameMap.get(clean);
                    if (resolvedName != null) {
                        c.setAssignedToName(resolvedName);
                    } else {
                        java.util.Optional<com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster> empOpt = resolveEmployee(
                                clean);
                        if (empOpt.isPresent()) {
                            c.setAssignedToName(empOpt.get().getEmployeeName());
                        } else {
                            c.setAssignedToName(assignedTo);
                        }
                    }
                }
            }
        }
    }

    private void populateEmployeeNames(List<ChecklistAssignment> assignments) {
        if (assignments == null || assignments.isEmpty()) {
            return;
        }
        java.util.Set<Long> empIds = new java.util.HashSet<>();
        java.util.Set<String> empCodesOrNames = new java.util.HashSet<>();
        for (ChecklistAssignment a : assignments) {
            String assignedTo = a.getAssignedTo();
            if (assignedTo != null && !assignedTo.trim().isEmpty()) {
                String clean = assignedTo.trim();
                if (!"0".equals(clean)) {
                    try {
                        empIds.add(Long.parseLong(clean));
                    } catch (NumberFormatException e) {
                        empCodesOrNames.add(clean);
                    }
                }
            }
        }

        java.util.Map<String, String> nameMap = new java.util.HashMap<>();
        if (!empIds.isEmpty()) {
            try {
                List<com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster> emps = employeeMasterRepository
                        .findAllById(empIds);
                for (com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster emp : emps) {
                    if (emp.getEmployeeName() != null) {
                        nameMap.put(String.valueOf(emp.getId()), emp.getEmployeeName());
                    }
                }
            } catch (Exception e) {
                log.error("Failed to batch fetch employee names by IDs for assignments", e);
            }
        }
        if (!empCodesOrNames.isEmpty()) {
            try {
                String jpql = "SELECT e FROM EmployeeMaster e WHERE e.empCode IN :terms OR e.employeeName IN :terms";
                List<com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster> emps = entityManager
                        .createQuery(jpql, com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster.class)
                        .setParameter("terms", empCodesOrNames)
                        .getResultList();
                for (com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster emp : emps) {
                    if (emp.getEmployeeName() != null) {
                        if (emp.getEmpCode() != null) {
                            nameMap.put(emp.getEmpCode().trim(), emp.getEmployeeName());
                        }
                        nameMap.put(emp.getEmployeeName().trim(), emp.getEmployeeName());
                    }
                }
            } catch (Exception e) {
                log.error("Failed to batch fetch employee names by codes/names for assignments", e);
            }
        }

        for (ChecklistAssignment a : assignments) {
            String assignedTo = a.getAssignedTo();
            if (assignedTo != null && !assignedTo.trim().isEmpty()) {
                String clean = assignedTo.trim();
                if ("0".equals(clean)) {
                    a.setAssignedToName("UNASSIGNED");
                } else {
                    String resolvedName = nameMap.get(clean);
                    if (resolvedName != null) {
                        a.setAssignedToName(resolvedName);
                    } else {
                        java.util.Optional<com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster> empOpt = resolveEmployee(
                                clean);
                        if (empOpt.isPresent()) {
                            a.setAssignedToName(empOpt.get().getEmployeeName());
                        } else {
                            a.setAssignedToName(assignedTo);
                        }
                    }
                }
            }
        }
    }

    private void populateRejectionDetails(List<ChecklistAssignment> assignments) {
        if (assignments == null || assignments.isEmpty()) {
            return;
        }
        populateEmployeeNames(assignments);

        java.util.Set<Long> checklistIds = new java.util.HashSet<>();
        java.util.Set<String> assignedTos = new java.util.HashSet<>();
        for (ChecklistAssignment a : assignments) {
            if (a.getChecklist() != null && a.getChecklist().getId() != null) {
                checklistIds.add(a.getChecklist().getId());
            }
            if (a.getAssignedTo() != null) {
                assignedTos.add(a.getAssignedTo());
            }
        }

        if (checklistIds.isEmpty() || assignedTos.isEmpty()) {
            return;
        }

        java.util.Map<String, ChecklistAssignment> rejectedMap = new java.util.HashMap<>();
        try {
            String jpql = "SELECT ca FROM ChecklistAssignment ca WHERE ca.checklist.id IN :checklistIds " +
                    "AND ca.assignedTo IN :assignedTos " +
                    "AND ca.status.name = 'Rejected' " +
                    "ORDER BY ca.updatedDate ASC";
            List<ChecklistAssignment> rejectedList = entityManager.createQuery(jpql, ChecklistAssignment.class)
                    .setParameter("checklistIds", checklistIds)
                    .setParameter("assignedTos", assignedTos)
                    .getResultList();

            java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd");
            for (ChecklistAssignment ca : rejectedList) {
                if (ca.getChecklist() != null && ca.getChecklist().getId() != null && ca.getAssignedTo() != null
                        && ca.getChecklistDate() != null) {
                    String key = ca.getChecklist().getId() + "_" + ca.getAssignedTo().trim() + "_"
                            + sdf.format(ca.getChecklistDate());
                    rejectedMap.put(key, ca);
                }
            }
        } catch (Exception e) {
            log.error("Failed to batch fetch rejection details for assignments", e);
        }

        java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd");
        for (ChecklistAssignment a : assignments) {
            if (a.getChecklist() == null || a.getChecklist().getId() == null || a.getAssignedTo() == null
                    || a.getChecklistDate() == null) {
                continue;
            }
            if (a.getStatus() != null && ("Pending".equalsIgnoreCase(a.getStatus().getName())
                    || "Active".equalsIgnoreCase(a.getStatus().getName())
                    || "Started".equalsIgnoreCase(a.getStatus().getName())
                    || "Rejected".equalsIgnoreCase(a.getStatus().getName()))) {
                String key = a.getChecklist().getId() + "_" + a.getAssignedTo().trim() + "_"
                        + sdf.format(a.getChecklistDate());
                ChecklistAssignment r = rejectedMap.get(key);
                if (r != null) {
                    a.setRejectedRemarks(r.getRemarks());
                    a.setRejectedBy(r.getUpdatedBy());
                    a.setRejectedDate(r.getUpdatedAt());
                }
            }
        }
    }

    private void populateClosedRejectionDetails(List<ChecklistClosed> closedList) {
        if (closedList == null || closedList.isEmpty()) {
            return;
        }

        java.util.Set<Long> checklistIds = new java.util.HashSet<>();
        java.util.Set<String> assignedTos = new java.util.HashSet<>();
        for (ChecklistClosed c : closedList) {
            if (c.getChecklist() != null && c.getChecklist().getId() != null) {
                checklistIds.add(c.getChecklist().getId());
            }
            if (c.getAssignedTo() != null) {
                assignedTos.add(c.getAssignedTo());
            }
        }

        if (checklistIds.isEmpty() || assignedTos.isEmpty()) {
            return;
        }

        java.util.Map<String, ChecklistAssignment> rejectedMap = new java.util.HashMap<>();
        try {
            String jpql = "SELECT ca FROM ChecklistAssignment ca WHERE ca.checklist.id IN :checklistIds " +
                    "AND ca.assignedTo IN :assignedTos " +
                    "AND ca.status.name = 'Rejected' " +
                    "ORDER BY ca.updatedDate ASC";
            List<ChecklistAssignment> rejectedList = entityManager.createQuery(jpql, ChecklistAssignment.class)
                    .setParameter("checklistIds", checklistIds)
                    .setParameter("assignedTos", assignedTos)
                    .getResultList();

            java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd");
            for (ChecklistAssignment ca : rejectedList) {
                if (ca.getChecklist() != null && ca.getChecklist().getId() != null && ca.getAssignedTo() != null
                        && ca.getChecklistDate() != null) {
                    String key = ca.getChecklist().getId() + "_" + ca.getAssignedTo().trim() + "_"
                            + sdf.format(ca.getChecklistDate());
                    rejectedMap.put(key, ca);
                }
            }
        } catch (Exception e) {
            log.error("Failed to batch fetch rejection details for closed checklists", e);
        }

        java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd");
        for (ChecklistClosed c : closedList) {
            if (c.getChecklist() == null || c.getChecklist().getId() == null || c.getAssignedTo() == null
                    || c.getChecklistDate() == null) {
                continue;
            }
            String key = c.getChecklist().getId() + "_" + c.getAssignedTo().trim() + "_"
                    + sdf.format(c.getChecklistDate());
            ChecklistAssignment r = rejectedMap.get(key);
            if (r != null) {
                c.setRejectedRemarks(r.getRemarks());
                c.setRejectedBy(r.getUpdatedBy());
                c.setRejectedDate(r.getUpdatedAt());
            }
        }
    }

    private boolean isAssigneeVisible(ChecklistAssignment assignment, Long userId, String empCode, String empName,
            boolean isUserAdmin, boolean isSuperBoss) {
        if (isUserAdmin || isSuperBoss)
            return true;
        if (assignment == null || assignment.getChecklist() == null)
            return false;

        String assignedTo = assignment.getAssignedTo();
        if (assignedTo != null) {
            String clean = assignedTo.trim();
            if ((userId != null && clean.equalsIgnoreCase(String.valueOf(userId))) ||
                    (empCode != null && clean.equalsIgnoreCase(empCode)) ||
                    (empName != null && clean.equalsIgnoreCase(empName))) {
                return true;
            }
        }

        String type = assignment.getAssignType();
        if (type == null)
            return true;
        java.time.LocalDate date = java.time.LocalDate.now();
        if (assignment.getChecklistDate() != null) {
            java.util.Date d = assignment.getChecklistDate();
            if (d instanceof java.sql.Date) {
                date = ((java.sql.Date) d).toLocalDate();
            } else {
                date = d.toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDate();
            }
        } else if (assignment.getAssignedDate() != null) {
            java.util.Date d = assignment.getAssignedDate();
            if (d instanceof java.sql.Date) {
                date = ((java.sql.Date) d).toLocalDate();
            } else {
                date = d.toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDate();
            }
        }

        MasterChecklist master = assignment.getChecklist();
        Long primId = master.getPrimaryEmployee() != null ? master.getPrimaryEmployee().getId() : null;
        Long secId = master.getSecondaryEmployee() != null ? master.getSecondaryEmployee().getId() : null;
        Long tertId = master.getTertiaryEmployee() != null ? master.getTertiaryEmployee().getId() : null;

        if ("PRIMARY".equalsIgnoreCase(type)) {
            if (userId != null && userId.equals(primId)) {
                return checklistAutoAssignmentService.isEmployeeAvailable(primId, date).available;
            }
            if (userId != null && userId.equals(secId)) {
                boolean primAvailable = primId != null
                        && checklistAutoAssignmentService.isEmployeeAvailable(primId, date).available;
                return !primAvailable && checklistAutoAssignmentService.isEmployeeAvailable(secId, date).available;
            }
            if (userId != null && userId.equals(tertId)) {
                boolean primAvailable = primId != null
                        && checklistAutoAssignmentService.isEmployeeAvailable(primId, date).available;
                boolean secAvailable = secId != null
                        && checklistAutoAssignmentService.isEmployeeAvailable(secId, date).available;
                return !primAvailable && !secAvailable
                        && checklistAutoAssignmentService.isEmployeeAvailable(tertId, date).available;
            }
            return false;
        }
        return true;
    }

    public List<EmployeeMaster> getMyTeamEmployees(String currentUser) {
        if (currentUser == null || currentUser.trim().isEmpty()) {
            return new ArrayList<>();
        }

        Long empId = null;
        String origTenant = com.autonoma.erp.config.TenantContextHolder.getTenantId();
        try {
            com.autonoma.erp.config.TenantContextHolder.setTenantId(AppUtil.AppConstants.DEFAULT_DB_SOURCE_NAME);
            com.autonoma.erp.model.admin.UserCredential credential = userRepository.findByUserId(currentUser)
                    .orElse(null);
            if (credential != null) {
                empId = credential.getEmpId();
            }
        } finally {
            com.autonoma.erp.config.TenantContextHolder.setTenantId(origTenant);
        }

        if (empId == null) {
            Optional<EmployeeMaster> verifierOpt = employeeMasterRepository.findByEmpCodeOrName(currentUser);
            if (verifierOpt.isPresent()) {
                empId = verifierOpt.get().getId();
            }
        }

        if (empId != null) {
            List<Long> reporteeEmpIds = managerMappingRepository.findReporteeEmpIdsByManagerId(empId);
            if (reporteeEmpIds != null && !reporteeEmpIds.isEmpty()) {
                return employeeMasterRepository.findAllById(reporteeEmpIds);
            }
        }
        return new ArrayList<>();
    }

    private java.util.Optional<EmployeeMaster> resolveEmployee(String assignedTo) {
        if (assignedTo == null || assignedTo.trim().isEmpty()) {
            return java.util.Optional.empty();
        }
        try {
            Long empId = Long.parseLong(assignedTo.trim());
            java.util.Optional<EmployeeMaster> empOpt = employeeMasterRepository.findById(empId);
            if (empOpt.isPresent()) {
                return empOpt;
            }
        } catch (NumberFormatException e) {
            // ignore
        }
        return employeeMasterRepository.findByEmpCodeOrName(assignedTo.trim());
    }

    private Long resolveEmployeeId(String idOrCodeOrName) {
        return resolveEmployee(idOrCodeOrName).map(EmployeeMaster::getId).orElse(null);
    }

    private ChecklistAssignment resolveAssignment(Long id) {
        if (id == null) {
            return null;
        }
        if (id >= 10000000L) {
            Long closedId = id - 10000000L;
            Optional<ChecklistClosed> closedOpt = closedRepo.findById(closedId);
            if (closedOpt.isPresent()) {
                ChecklistClosed closed = closedOpt.get();
                if (closed.getChecklist() != null) {
                    java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd");
                    sdf.setTimeZone(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
                    String closedDateStr = closed.getChecklistDate() != null ? sdf.format(closed.getChecklistDate())
                            : "";

                    java.util.List<ChecklistAssignment> candidates = assignRepo
                            .findByChecklistId(closed.getChecklist().getId());
                    if (candidates != null) {
                        Long closedEmpId = resolveEmployeeId(closed.getAssignedTo());
                        for (ChecklistAssignment candidate : candidates) {
                            Long candEmpId = resolveEmployeeId(candidate.getAssignedTo());
                            if (candEmpId != null && candEmpId.equals(closedEmpId)) {
                                String candDateStr = candidate.getChecklistDate() != null
                                        ? sdf.format(candidate.getChecklistDate())
                                        : "";
                                if (closedDateStr.equals(candDateStr)) {
                                    return candidate;
                                }
                            }
                        }
                    }
                    java.util.List<ChecklistAssignment> fallbacks = assignRepo
                            .findAllByChecklistIdAndAssignedToAndChecklistDate(
                                    closed.getChecklist().getId(), closed.getAssignedTo(), closed.getChecklistDate());
                    ChecklistAssignment fallback = fallbacks.isEmpty() ? null : fallbacks.get(0);
                    if (fallback != null) {
                        return fallback;
                    }
                    ChecklistAssignment reconstructed = convertToAssignment(closed);
                    if (reconstructed != null) {
                        reconstructed.setId(id);
                        return reconstructed;
                    }
                }
            }
            return null;
        }
        Optional<ChecklistAssignment> activeOpt = assignRepo.findById(id);
        if (activeOpt.isPresent()) {
            return activeOpt.get();
        }
        Optional<ChecklistClosed> closedOpt = closedRepo.findById(id);
        if (closedOpt.isPresent()) {
            ChecklistClosed closed = closedOpt.get();
            if (closed.getChecklist() != null) {
                java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd");
                sdf.setTimeZone(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
                String closedDateStr = closed.getChecklistDate() != null ? sdf.format(closed.getChecklistDate()) : "";

                java.util.List<ChecklistAssignment> candidates = assignRepo
                        .findByChecklistId(closed.getChecklist().getId());
                if (candidates != null) {
                    Long closedEmpId = resolveEmployeeId(closed.getAssignedTo());
                    for (ChecklistAssignment candidate : candidates) {
                        Long candEmpId = resolveEmployeeId(candidate.getAssignedTo());
                        if (candEmpId != null && candEmpId.equals(closedEmpId)) {
                            String candDateStr = candidate.getChecklistDate() != null
                                    ? sdf.format(candidate.getChecklistDate())
                                    : "";
                            if (closedDateStr.equals(candDateStr)) {
                                return candidate;
                            }
                        }
                    }
                }
                java.util.List<ChecklistAssignment> fallbacks = assignRepo
                        .findAllByChecklistIdAndAssignedToAndChecklistDate(
                                closed.getChecklist().getId(), closed.getAssignedTo(), closed.getChecklistDate());
                ChecklistAssignment fallback = fallbacks.isEmpty() ? null : fallbacks.get(0);
                if (fallback != null) {
                    return fallback;
                }
                ChecklistAssignment reconstructed = convertToAssignment(closed);
                if (reconstructed != null) {
                    reconstructed.setId(id);
                    return reconstructed;
                }
            }
        }
        return null;
    }

    public List<String> getDistinctGroupNames() {
        return assignRepo.findDistinctGroupNames();
    }

    @Transactional
    public ChecklistAssignment assignTask(Long id, Long checklistId, String assignedTo, String assignedBy,
            String assignType) {
        return assignTask(id, checklistId, assignedTo, assignedBy, assignType, null, null, false);
    }

    @Transactional
    public ChecklistAssignment assignTask(Long id, Long checklistId, String assignedTo, String assignedBy,
            String assignType, String groupName) {
        return assignTask(id, checklistId, assignedTo, assignedBy, assignType, groupName, null, false);
    }

    private String resolveEmployeeIdAsString(String assignedTo) {
        if (assignedTo == null || assignedTo.trim().isEmpty()) {
            return "";
        }
        return resolveEmployee(assignedTo)
                .map(emp -> String.valueOf(emp.getId()))
                .orElse(assignedTo.trim());
    }

    @Transactional
    public ChecklistAssignment assignTask(Long id, Long checklistId, String assignedTo, String assignedBy,
            String assignType, Date checklistDate) {
        return assignTask(id, checklistId, assignedTo, assignedBy, assignType, null, checklistDate, false);
    }

    @Transactional
    public ChecklistAssignment assignTask(Long id, Long checklistId, String assignedTo, String assignedBy,
            String assignType, String groupName, Date checklistDate) {
        return assignTask(id, checklistId, assignedTo, assignedBy, assignType, groupName, checklistDate, false);
    }

    @Transactional
    public ChecklistAssignment assignTask(Long id, Long checklistId, String assignedTo, String assignedBy,
            String assignType, Date checklistDate, boolean skipVerificationCheck) {
        return assignTask(id, checklistId, assignedTo, assignedBy, assignType, null, checklistDate,
                skipVerificationCheck);
    }

    @Transactional
    public ChecklistAssignment assignTask(Long id, Long checklistId, String assignedTo, String assignedBy,
            String assignType, String groupName, Date checklistDate, boolean skipVerificationCheck) {
        MasterChecklist checklist = masterRepo.findById(checklistId).orElseThrow();

        if (!skipVerificationCheck && !"VERIFIED".equalsIgnoreCase(checklist.getVerifyStatus())) {
            throw new IllegalArgumentException("The checklist must be verified before it can be assigned.");
        }

        if (checklistDate != null) {
            java.time.LocalDate localChecklistDate = java.time.Instant.ofEpochMilli(checklistDate.getTime())
                    .atZone(java.time.ZoneId.of("Asia/Kolkata"))
                    .toLocalDate();

            boolean isHoliday = false;
            String holidayName = "";
            for (com.autonoma.erp.modules.hr.holiday.entity.HrHolidayMaster holiday : holidayRepo
                    .findByIsActiveTrue()) {
                java.time.LocalDate start = holiday.getFromDate() != null ? holiday.getFromDate()
                        : holiday.getHolidayDate();
                if (start != null && localChecklistDate.equals(start)) {
                    isHoliday = true;
                    holidayName = holiday.getHolidayName();
                    break;
                }
            }
            if (isHoliday) {
                java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter
                        .ofPattern("dd/MM/yyyy");
                throw new IllegalArgumentException("Checklist cannot be assigned on "
                        + localChecklistDate.format(formatter) + " because it is marked as a Company Holiday.");
            }
        }

        // Resolve assignedTo to employee ID if possible
        String resolvedAssignedTo = assignedTo;
        if (assignedTo != null && !assignedTo.trim().isEmpty()) {
            resolvedAssignedTo = resolveEmployee(assignedTo)
                    .map(emp -> String.valueOf(emp.getId()))
                    .orElse(assignedTo);
        }

        // Validate if employee is active/not resigned for manual assignments
        if (!skipVerificationCheck && resolvedAssignedTo != null && !resolvedAssignedTo.trim().isEmpty()) {
            try {
                Long empId = Long.parseLong(resolvedAssignedTo.trim());
                Optional<EmployeeMaster> empOpt = employeeMasterRepository.findById(empId);
                if (empOpt.isPresent()) {
                    EmployeeMaster emp = empOpt.get();
                    boolean isActive = emp.getIsActive() == null || emp.getIsActive();
                    if (!isActive || emp.getStatus() == null || !"Active".equalsIgnoreCase(emp.getStatus().getName())) {
                        throw new IllegalArgumentException(
                                "Cannot assign checklist to an inactive or resigned employee (" + emp.getEmployeeName()
                                        + ").");
                    }
                }
            } catch (NumberFormatException e) {
                // ignore
            }
        }

        // Duplicate validation check before insert/update
        String targetEmpId = resolveEmployeeIdAsString(resolvedAssignedTo);
        String targetGroupName = groupName != null ? groupName.trim() : "";

        if (isDualCheckEnabled(checklist.getDualCheck())) {
            try {
                Long targetId = Long.parseLong(targetEmpId);
                java.util.Optional<EmployeeManagerMapping> mOpt = managerMappingRepository.findByEmpId(targetId);
                if (mOpt.isEmpty() || mOpt.get().getVerticalHeadId() == null) {
                    log.warn("Vertical head not mapped for Dual Check for target employee ID: {}", targetEmpId);
                }
            } catch (NumberFormatException e) {
                log.warn("Invalid employee ID for Dual Check validation: {}", targetEmpId);
            }
        }
        List<ChecklistAssignment> existing = assignRepo.findByChecklistId(checklistId);
        for (ChecklistAssignment ext : existing) {
            if (id != null && ext.getId().equals(id)) {
                continue;
            }

            boolean isInactive = (ext.getIsActive() != null && !ext.getIsActive()) ||
                    (ext.getStatus() != null && ("Inactive".equalsIgnoreCase(ext.getStatus().getName())
                            || "Deleted".equalsIgnoreCase(ext.getStatus().getName())));

            boolean isClosed = ext.getStatus() != null &&
                    ("Completed".equalsIgnoreCase(ext.getStatus().getName()) ||
                            "Closed".equalsIgnoreCase(ext.getStatus().getName()) ||
                            "Verified".equalsIgnoreCase(ext.getStatus().getName()) ||
                            "Accepted".equalsIgnoreCase(ext.getStatus().getName()));

            boolean isExtActive = !isInactive && !isClosed &&
                    ((ext.getIsActive() == null || ext.getIsActive()) ||
                            (ext.getPendingActivation() != null && ext.getPendingActivation()));

            if (!isExtActive) {
                continue;
            }

            String extGroup = ext.getGroupName() != null ? ext.getGroupName().trim() : "";
            boolean sameGroup = targetGroupName.equalsIgnoreCase(extGroup);

            // Compare dates at LocalDate level
            boolean sameDate = false;
            if (checklistDate != null && ext.getChecklistDate() != null) {
                java.time.LocalDate d1 = java.time.Instant.ofEpochMilli(checklistDate.getTime())
                        .atZone(java.time.ZoneId.of("Asia/Kolkata"))
                        .toLocalDate();
                java.time.LocalDate d2 = java.time.Instant.ofEpochMilli(ext.getChecklistDate().getTime())
                        .atZone(java.time.ZoneId.of("Asia/Kolkata"))
                        .toLocalDate();
                sameDate = d1.equals(d2);
            }

            boolean sameType = assignType != null && assignType.equalsIgnoreCase(ext.getAssignType());
            String extEmpId = resolveEmployeeIdAsString(ext.getAssignedTo());
            boolean samePerson = targetEmpId.equalsIgnoreCase(extEmpId);

            boolean isDuplicate;
            if (sameGroup) {
                // Within the same group (or both non-grouped), prevent duplicate person on same
                // date or same role
                isDuplicate = (samePerson && (sameDate || sameType));
            } else {
                // Different groups: each group triggers independently, never a duplicate
                isDuplicate = false;
            }

            if (isDuplicate) {
                String searchGroup = targetGroupName.isEmpty() ? null : targetGroupName;
                java.util.List<ChecklistClosed> closedList = closedRepo
                        .findByChecklistIdAndAssignedToAndGroupNameAndChecklistDate(
                                ext.getChecklist().getId(), ext.getAssignedTo(), searchGroup, ext.getChecklistDate());
                if (closedList.isEmpty()) {
                    saveToFrequencyTable(ext);
                }
                ChecklistAssignment duplicate = new ChecklistAssignment();
                duplicate.setRemarks("DUPLICATE_ASSIGNMENT");
                return duplicate;
            }
        }

        ChecklistAssignment assignment;
        if (id != null) {
            ChecklistAssignment oldAssignment = resolveAssignment(id);
            if (oldAssignment == null) {
                throw new java.util.NoSuchElementException("Checklist assignment not found for the given ID.");
            }
            String oldAssignedTo = oldAssignment.getAssignedTo();
            if (oldAssignedTo != null && !oldAssignedTo.equalsIgnoreCase(resolvedAssignedTo)) {
                // Reassignment: The old assignment is NOT immediately deactivated!
                // Instead, we leave it active and create a new one which is pending activation.
                assignment = new ChecklistAssignment();
                assignment.setCarryForward(checklist.getCarryForward());
                assignment.setCarryForwardCount(0);
                assignment.setStatus(getOrCreateStatus("Active"));
                if (isDualCheckEnabled(checklist.getDualCheck())) {
                    assignment.setVerifyStatus(getOrCreateStatus("Pending"));
                } else {
                    assignment.setVerifyStatus(getOrCreateStatus("N/A"));
                }
            } else {
                // Assignee didn't change, just update the existing one
                assignment = oldAssignment;
            }
        } else {
            assignment = new ChecklistAssignment();
            assignment.setCarryForward(checklist.getCarryForward());
            assignment.setCarryForwardCount(0);
            // Default status: Active for new manual assignments
            assignment.setStatus(getOrCreateStatus("Active"));
            if (isDualCheckEnabled(checklist.getDualCheck())) {
                assignment.setVerifyStatus(getOrCreateStatus("Pending"));
            } else {
                assignment.setVerifyStatus(getOrCreateStatus("N/A"));
            }
        }

        assignment.setChecklist(checklist);
        assignment.setAssignedTo(resolvedAssignedTo);
        assignment.setAssignedBy(assignedBy);
        assignment.setAssignType(assignType);

        String resolvedGroupName = groupName != null ? groupName.trim().toUpperCase() : null;
        if (resolvedGroupName != null && resolvedGroupName.isEmpty()) {
            resolvedGroupName = null;
        }
        assignment.setGroupName(resolvedGroupName);

        Date today = new Date();
        Date resolvedChecklistDate;
        if (assignment.getId() == null) {
            assignment.setAssignedDate(today);
            if (checklistDate != null) {
                resolvedChecklistDate = checklistDate;
            } else if (checklist.getEffectiveFrom() != null) {
                resolvedChecklistDate = checklist.getEffectiveFrom();
            } else {
                resolvedChecklistDate = calculateEffectiveDate(today);
            }
        } else {
            assignment.setAssignedDate(new Date());
            resolvedChecklistDate = checklistDate;
        }
        assignment.setChecklistDate(resolvedChecklistDate);

        boolean isFuture = false;
        if (resolvedChecklistDate != null) {
            java.time.LocalDate localToday = java.time.Instant.ofEpochMilli(today.getTime())
                    .atZone(java.time.ZoneId.of("Asia/Kolkata")).toLocalDate();
            java.time.LocalDate localChecklistDate = java.time.Instant.ofEpochMilli(resolvedChecklistDate.getTime())
                    .atZone(java.time.ZoneId.of("Asia/Kolkata")).toLocalDate();
            if (localChecklistDate.isAfter(localToday)) {
                isFuture = true;
            }
        }

        if (!skipVerificationCheck) {
            // Manual user assignment from UI (Master Template Configuration):
            // Saved as Pending Activation so it takes effect on the next day/scheduled
            // trigger via the 4 AM scheduler
            assignment.setPendingActivation(true);
            assignment.setIsActive(true);
            assignment.setStatus(getOrCreateStatus("Active"));
        } else if (isFuture) {
            assignment.setPendingActivation(true);
            assignment.setIsActive(false);
            if (assignment.getId() == null) {
                // Future-dated: stays Pending until scheduler activates it
                assignment.setStatus(getOrCreateStatus("Pending"));
            }
        } else {
            assignment.setPendingActivation(false);
            assignment.setIsActive(true);
            if (assignment.getId() == null) {
                // Current-date: task is immediately active and ready for execution
                assignment.setStatus(getOrCreateStatus("Active"));
            }
        }

        com.autonoma.erp.modules.qms.checklist.context.ChecklistSchedulerContext ctx = com.autonoma.erp.modules.qms.checklist.context.ChecklistSchedulerContext
                .get();
        if (ctx != null && ctx.getTriggerId() != null) {
            assignment.setExecutionType(ctx.getExecutionType());
            assignment.setSchedulerName(ctx.getSchedulerName());
            assignment.setTriggerId(ctx.getTriggerId());
            assignment.setDueDate(ctx.getDueDate());
        } else {
            if (assignment.getExecutionType() == null) {
                assignment.setExecutionType("AUTO");
            }
            if (assignment.getDueDate() == null) {
                assignment.setDueDate(resolvedChecklistDate);
            }
        }

        ChecklistAssignment savedAssignment;
        boolean isDynamic = checklist != null &&
                ("Default".equalsIgnoreCase(checklist.getEventTrigger()) ||
                        "DYNAMIC CHECKLIST".equalsIgnoreCase(checklist.getCategory()));

        if (skipVerificationCheck && !isDynamic) {
            // Triggered or created automatically by Scheduler: save ONLY to closed
            // checklist
            // (QMS_CHECKLIST_CLOSED)
            savedAssignment = assignment;
            ChecklistClosed closed = saveToFrequencyTable(assignment);
            if (closed != null && closed.getId() != null) {
                savedAssignment.setId(closed.getId() + 10000000L);
            }
        } else {
            // Save to active assignments table (QMS_CHECKLIST_ASSIGNMENT)
            savedAssignment = assignRepo.save(assignment);
            // Manual configuration changes from UI stay in QMS_CHECKLIST_ASSIGNMENT and do
            // NOT immediately create rows in QMS_CHECKLIST_CLOSED.
            if (skipVerificationCheck && savedAssignment.getIsActive() != null && savedAssignment.getIsActive()) {
                saveToFrequencyTable(savedAssignment);
            }
        }

        // Also update the MasterChecklist for the UI data table to show ALL active
        // assignees
        java.util.List<ChecklistAssignment> allAssignments = assignRepo.findByChecklistId(checklistId);
        String allAssignedTo = allAssignments.stream()
                .filter(a -> a.getIsActive() == null || a.getIsActive()
                        || Boolean.TRUE.equals(a.getPendingActivation()))
                .filter(a -> a.getAssignedTo() != null && !a.getAssignedTo().isEmpty())
                .map(ChecklistAssignment::getAssignedTo)
                .distinct()
                .collect(java.util.stream.Collectors.joining(", "));

        checklist.setAssignTo(allAssignedTo);
        checklist.setAssignDate(new Date());
        checklist.setTaskStatus("Pending");
        checklist.setSkipAuditUpdate(true);
        masterRepo.save(checklist);

        // Notify user if checklistDate is today or in the past
        try {
            boolean shouldNotify = true;
            if (checklistDate != null) {
                java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyyMMdd");
                sdf.setTimeZone(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
                String todayStr = sdf.format(new Date());
                String checklistDateStr = sdf.format(checklistDate);
                if (checklistDateStr.compareTo(todayStr) > 0) {
                    shouldNotify = false;
                }
            }
            if (shouldNotify) {
                Optional<EmployeeMaster> empOpt = resolveEmployee(assignedTo);
                if (empOpt.isPresent()) {
                    notificationService.notifyUserAboutChecklistAssignment(empOpt.get(), checklist, savedAssignment);
                }
            }
        } catch (Exception e) {
            log.error("Failed to send checklist assignment notification", e);
        }

        return savedAssignment;
    }

    private Date calculateEffectiveDate(Date creationDate) {
        java.util.Calendar cal = java.util.Calendar.getInstance(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
        cal.setTime(creationDate);
        cal.add(java.util.Calendar.DAY_OF_YEAR, 1);
        if (cal.get(java.util.Calendar.DAY_OF_WEEK) == java.util.Calendar.SUNDAY) {
            cal.add(java.util.Calendar.DAY_OF_YEAR, 1);
        }
        cal.set(java.util.Calendar.HOUR_OF_DAY, 4);
        cal.set(java.util.Calendar.MINUTE, 0);
        cal.set(java.util.Calendar.SECOND, 0);
        cal.set(java.util.Calendar.MILLISECOND, 0);
        return cal.getTime();
    }

    /**
     * Runs every day at 8:30 AM to send notifications for assignments that were
     * created in advance and are due today.
     */
    @org.springframework.scheduling.annotation.Scheduled(cron = "0 30 8 * * *", zone = "Asia/Kolkata")
    @Transactional
    public void notifyFutureAssignmentsDueToday() {
        log.info("Scanning for advance checklist assignments due today to send notifications...");
        try {
            Date today = new Date();
            java.util.Calendar cal = java.util.Calendar.getInstance(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
            cal.setTime(today);
            cal.set(java.util.Calendar.HOUR_OF_DAY, 0);
            cal.set(java.util.Calendar.MINUTE, 0);
            cal.set(java.util.Calendar.SECOND, 0);
            cal.set(java.util.Calendar.MILLISECOND, 0);
            Date startOfDay = cal.getTime();

            cal.set(java.util.Calendar.HOUR_OF_DAY, 23);
            cal.set(java.util.Calendar.MINUTE, 59);
            cal.set(java.util.Calendar.SECOND, 59);
            cal.set(java.util.Calendar.MILLISECOND, 999);
            Date endOfDay = cal.getTime();

            // Find assignments due today but created before today
            assignRepo.findAll((root, query, cb) -> {
                List<Predicate> predicates = new ArrayList<>();
                predicates.add(cb.between(root.get("checklistDate"), startOfDay, endOfDay));
                predicates.add(cb.lessThan(root.get("createdDate"), startOfDay));
                return cb.and(predicates.toArray(new Predicate[0]));
            }, Pageable.unpaged()).forEach(assignment -> {
                try {
                    Optional<EmployeeMaster> empOpt = resolveEmployee(assignment.getAssignedTo());
                    if (empOpt.isPresent()) {
                        notificationService.notifyUserAboutChecklistAssignment(empOpt.get(), assignment.getChecklist(),
                                assignment);
                    }
                } catch (Exception e) {
                    log.error("Failed to notify user for advance assignment {}", assignment.getId(), e);
                }
            });
        } catch (Exception e) {
            log.error("Error in notifyFutureAssignmentsDueToday", e);
        }
    }

    private void copyProperties(ChecklistAssignment src, ChecklistClosed dest) {
        dest.setChecklist(src.getChecklist());
        dest.setAssignedTo(src.getAssignedTo());
        dest.setAssignedBy(src.getAssignedBy());
        dest.setAssignedDate(src.getAssignedDate());
        dest.setStatus(src.getStatus());
        dest.setVerifyStatus(src.getVerifyStatus());
        dest.setRemarks(src.getRemarks());
        dest.setChecklistDate(src.getChecklistDate());
        dest.setCarryForward(src.getCarryForward());
        dest.setCarryForwardCount(src.getCarryForwardCount());
        dest.setAssignType(src.getAssignType());
        dest.setVerifiedBy(src.getVerifiedBy());
        dest.setVerifiedDate(src.getVerifiedDate());
        dest.setComments(src.getComments());
        dest.setFilePaths(src.getFilePaths());
        dest.setCreatedUser(src.getCreatedUser());
        dest.setCreatedAt(src.getCreatedAt());
        dest.setUpdatedUser(src.getUpdatedUser());
        dest.setUpdatedAt(src.getUpdatedAt());
        dest.setIsActive(src.getIsActive());
        dest.setDualCheck(src.getDualCheck());
        dest.setExecutionType(src.getExecutionType());
        dest.setSchedulerName(src.getSchedulerName());
        dest.setTriggerId(src.getTriggerId());
        dest.setDueDate(src.getDueDate());
        dest.setNextRenewalDate(src.getNextRenewalDate());
        dest.setGroupName(src.getGroupName());

        String freq = src.getChecklist().getFrequency();
        if (freq == null) {
            freq = "DAILY";
        }
        dest.setFrequency(freq.toUpperCase());
    }

    @Transactional
    public ChecklistClosed saveToFrequencyTable(ChecklistAssignment source) {
        String srcGroup = source.getGroupName();
        if (srcGroup != null && (srcGroup.trim().isEmpty() || "-".equals(srcGroup.trim()))) {
            srcGroup = null;
        }

        java.util.List<ChecklistClosed> closedList = closedRepo
                .findByChecklistIdAndAssignedToAndGroupNameAndChecklistDate(
                        source.getChecklist().getId(), source.getAssignedTo(), srcGroup, source.getChecklistDate());
        ChecklistClosed closed;
        if (!closedList.isEmpty()) {
            closed = closedList.get(0);
        } else {
            boolean isDynamic = source.getChecklist() != null &&
                    ("Default".equalsIgnoreCase(source.getChecklist().getEventTrigger()) ||
                            "DYNAMIC CHECKLIST".equalsIgnoreCase(source.getChecklist().getCategory()));
            if (isDynamic) {
                closed = new ChecklistClosed();
            } else {
                java.util.List<ChecklistClosed> existingByGroup = closedRepo
                        .findByChecklistIdAndGroupNameAndChecklistDateOrderByIdDesc(
                                source.getChecklist().getId(), srcGroup, source.getChecklistDate());
                if (!existingByGroup.isEmpty()) {
                    ChecklistClosed existing = existingByGroup.get(0);
                    // Protect PRIMARY: An existing PRIMARY task should NEVER be overwritten by
                    // SECONDARY/TERTIARY
                    if ("PRIMARY".equalsIgnoreCase(existing.getAssignType())
                            && !"PRIMARY".equalsIgnoreCase(source.getAssignType())) {
                        return existing;
                    }
                    closed = existing;
                } else {
                    closed = new ChecklistClosed();
                }
            }
        }
        boolean isNew = (closed.getId() == null);

        boolean isExistingRejected = closed.getId() != null && closed.getVerifyStatus() != null
                && "Rejected".equalsIgnoreCase(closed.getVerifyStatus().getName());
        boolean isIncomingActive = (source.getIsActive() != null && source.getIsActive())
                || (source.getStatus() != null
                        && ("Active".equalsIgnoreCase(source.getStatus().getName())
                                || "Pending".equalsIgnoreCase(source.getStatus().getName())
                                || "Started".equalsIgnoreCase(source.getStatus().getName())));
        if (isExistingRejected && isIncomingActive) {
            String existingVerifiedBy = closed.getVerifiedBy();
            Date existingVerifiedDate = closed.getVerifiedDate();
            String existingComments = closed.getComments();
            StatusMaster existingVerifyStatus = closed.getVerifyStatus();
            StatusMaster existingStatus = closed.getStatus();
            copyProperties(source, closed);
            closed.setStatus(existingStatus);
            closed.setVerifyStatus(existingVerifyStatus);
            closed.setVerifiedBy(existingVerifiedBy);
            closed.setVerifiedDate(existingVerifiedDate);
            closed.setComments(existingComments);
        } else {
            copyProperties(source, closed);
            if (source.getStatus() != null && "Rejected".equalsIgnoreCase(source.getStatus().getName())) {
                closed.setStatus(getOrCreateStatus("Unresolved"));
            }
        }

        // Always ensure initial task status for Closed Checklist is Pending (not
        // Active)
        if (closed.getStatus() == null || "Active".equalsIgnoreCase(closed.getStatus().getName())) {
            closed.setStatus(getOrCreateStatus("Pending"));
        }

        // Verify status: Pending if dual check is enabled, otherwise N/A
        String dualCheckVal = source.getDualCheck();
        if (dualCheckVal == null && source.getChecklist() != null) {
            dualCheckVal = source.getChecklist().getDualCheck();
        }
        if (closed.getVerifyStatus() == null || "Active".equalsIgnoreCase(closed.getVerifyStatus().getName())) {
            if (isDualCheckEnabled(dualCheckVal)) {
                closed.setVerifyStatus(getOrCreateStatus("Pending"));
            } else {
                closed.setVerifyStatus(getOrCreateStatus("N/A"));
            }
        }

        ChecklistClosed savedClosed = closedRepo.save(closed);

        // Sync attachments from active assignment ID to closed assignment ID
        try {
            if (source.getId() != null && savedClosed.getId() != null && !source.getId().equals(savedClosed.getId())) {
                jdbcTemplate.update(
                        "UPDATE QMS_ATTACHMENT_PATH SET REF_ID = ? WHERE PAGE_CODE = 'QM1120' AND REF_ID = ?",
                        savedClosed.getId(), source.getId());
            }
        } catch (Exception e) {
            log.error("Failed to sync attachments to closed assignment: " + e.getMessage());
        }

        return savedClosed;
    }

    private void populateAssignmentFiles(ChecklistAssignment assignment) {
        if (assignment == null || assignment.getId() == null) {
            return;
        }
        try {
            Long refId = assignment.getId();
            if (refId >= 10000000L) {
                refId = refId - 10000000L;
            }
            String sql = "SELECT PATH FROM QMS_ATTACHMENT_PATH WHERE PAGE_CODE = 'QM1120' AND REF_ID = ?";
            List<String> paths = jdbcTemplate.queryForList(sql, String.class, refId);
            assignment.setActualFiles(paths);
        } catch (Exception e) {
            log.error("Failed to populate assignment files: " + e.getMessage());
        }
    }

    @Transactional
    public void syncAssignmentUpdate(ChecklistAssignment assignment, String oldAssignedTo) {
        if (oldAssignedTo != null && !oldAssignedTo.equals(assignment.getAssignedTo())) {
            deleteFromFrequencyTable(assignment.getChecklist().getId(), oldAssignedTo, assignment.getChecklistDate(),
                    assignment.getChecklist().getFrequency());
        }
        saveToFrequencyTable(assignment);
    }

    private void deleteFromFrequencyTable(Long checklistId, String assignedTo, Date checklistDate, String freq) {
        java.util.List<ChecklistClosed> closedList = closedRepo
                .findByChecklistIdAndAssignedToAndChecklistDate(checklistId, assignedTo, checklistDate);
        if (!closedList.isEmpty()) {
            closedRepo.deleteAll(closedList);
        }
    }

    @Transactional
    public ChecklistAssignment getAssignmentById(Long id) {
        ChecklistAssignment converted;
        if (id != null && id >= 10000000L) {
            Long closedId = id - 10000000L;
            converted = closedRepo.findById(closedId).map(closed -> {
                ChecklistAssignment conv = convertToAssignment(closed);
                conv.setId(id);
                return conv;
            }).orElseThrow(() -> new IllegalArgumentException("Closed assignment not found with ID: " + closedId));
        } else {
            converted = assignRepo.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Assignment not found with ID: " + id));
        }
        if (converted != null) {
            if (converted.getChecklist() != null) {
                populateMasterChecklistFiles(converted.getChecklist());
            }
            populateRejectionDetails(java.util.Collections.singletonList(converted));
        }
        return converted;
    }

    public void deleteAssignment(Long id) {
        ChecklistAssignment assignment = resolveAssignment(id);
        if (assignment == null) {
            throw new java.util.NoSuchElementException("Checklist assignment not found for the given ID.");
        }
        MasterChecklist checklist = assignment.getChecklist();
        deleteFromFrequencyTable(checklist.getId(), assignment.getAssignedTo(), assignment.getChecklistDate(),
                checklist.getFrequency());

        assignRepo.delete(assignment);

        // Recalculate assigned users
        java.util.List<ChecklistAssignment> allAssignments = assignRepo.findByChecklistId(checklist.getId());
        String allAssignedTo = allAssignments.stream()
                .filter(a -> !a.getId().equals(id) && (a.getIsActive() == null || a.getIsActive()
                        || Boolean.TRUE.equals(a.getPendingActivation())))
                .filter(a -> a.getAssignedTo() != null && !a.getAssignedTo().isEmpty())
                .map(ChecklistAssignment::getAssignedTo)
                .distinct()
                .collect(java.util.stream.Collectors.joining(", "));

        checklist.setAssignTo(allAssignedTo);
        if (allAssignedTo.isEmpty()) {
            checklist.setAssignDate(null);
            checklist.setTaskStatus(null);
        }
        checklist.setSkipAuditUpdate(true);
        masterRepo.save(checklist);
    }

    // --- Verification ---

    public ChecklistVerification verifyTask(Long assignmentId, String verifiedBy, String statusName, String remarks,
            List<String> actualFiles) {
        return verifyTask(assignmentId, verifiedBy, statusName, remarks, actualFiles, null);
    }

    @Transactional
    public ChecklistVerification verifyTask(Long assignmentId, String verifiedBy, String statusName, String remarks,
            List<String> actualFiles, String nextRenewalDate) {
        String verifier = SecurityUtils.getCurrentUserEmployeeName();
        if (verifier == null || verifier.trim().isEmpty() || "anonymousUser".equalsIgnoreCase(verifier)) {
            verifier = verifiedBy;
        }
        verifiedBy = formatVerifierName(verifier);
        ChecklistAssignment assignment = resolveAssignment(assignmentId);
        if (assignment == null) {
            throw new java.util.NoSuchElementException("Checklist assignment not found for the given ID.");
        }

        Date parsedNextRenewalDate = null;
        if (nextRenewalDate != null && !nextRenewalDate.trim().isEmpty()) {
            try {
                java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd");
                parsedNextRenewalDate = sdf.parse(nextRenewalDate.trim());
            } catch (Exception e) {
                log.warn("Invalid nextRenewalDate format: {}", nextRenewalDate);
            }
        }
        if (parsedNextRenewalDate != null) {
            assignment.setNextRenewalDate(parsedNextRenewalDate);
        }

        // Temporarily bypass future dates check to allow manual testing/execution of
        // tomorrow's triggered tasks
        /*
         * if (assignment.getChecklistDate() != null) {
         * java.time.LocalDate today =
         * java.time.LocalDate.now(java.time.ZoneId.of("Asia/Kolkata"));
         * java.time.LocalDate taskDate =
         * java.time.Instant.ofEpochMilli(assignment.getChecklistDate().getTime())
         * .atZone(java.time.ZoneId.of("Asia/Kolkata"))
         * .toLocalDate();
         * if (taskDate.isAfter(today)) {
         * throw new
         * IllegalArgumentException("Verification/submission is not allowed for future dates."
         * );
         * }
         * }
         */
        if (assignment.getVerifyStatus() != null &&
                ("Verified".equalsIgnoreCase(assignment.getVerifyStatus().getName()) ||
                        "Accepted".equalsIgnoreCase(assignment.getVerifyStatus().getName()) ||
                        "Renewal Verified".equalsIgnoreCase(assignment.getVerifyStatus().getName()))) {
            throw new IllegalArgumentException("This checklist assignment has already been verified.");
        }

        MasterChecklist master = assignment.getChecklist();

        String origTenantForVerify = com.autonoma.erp.config.TenantContextHolder.getTenantId();
        com.autonoma.erp.model.admin.UserCredential verifierUserCred = null;
        try {
            com.autonoma.erp.config.TenantContextHolder.setTenantId(AppUtil.AppConstants.DEFAULT_DB_SOURCE_NAME);
            String curUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
            if (curUserId != null) {
                verifierUserCred = userRepository.findByUserId(curUserId).orElse(null);
            }
        } finally {
            com.autonoma.erp.config.TenantContextHolder.setTenantId(origTenantForVerify);
        }

        boolean isUserAdmin = false;
        String curUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        if (curUserId != null) {
            String origTenant = com.autonoma.erp.config.TenantContextHolder.getTenantId();
            try {
                com.autonoma.erp.config.TenantContextHolder.setTenantId(AppUtil.AppConstants.DEFAULT_DB_SOURCE_NAME);
                com.autonoma.erp.model.admin.BosPage pageObj = bosPageRepository.findByPageCode("QM1130").orElse(null);
                if (pageObj != null) {
                    com.autonoma.erp.model.admin.BosUserPageAuth auth = bosUserPageAuthRepository
                            .findByUserIdAndPageId(curUserId, pageObj.getPageId());
                    if (auth != null) {
                        isUserAdmin = Integer.valueOf(1).equals(auth.getApproval())
                                || Integer.valueOf(1).equals(auth.getAdditional1());
                    }
                }
                if (!isUserAdmin) {
                    isUserAdmin = userRepository.findByUserId(curUserId)
                            .map(u -> u.getUserLevel() != null
                                    && u.getUserLevel() >= AppUtil.AppConstants.USER_LEVEL_BOS_ADMIN)
                            .orElse(false);
                }
            } catch (Exception e) {
                log.error("Failed to check page permission for verification", e);
            } finally {
                com.autonoma.erp.config.TenantContextHolder.setTenantId(origTenant);
            }
        }

        if (!isUserAdmin) {
            String verifierUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
            Long verifierEmpId = null;

            String origTenant = com.autonoma.erp.config.TenantContextHolder.getTenantId();
            try {
                com.autonoma.erp.config.TenantContextHolder.setTenantId(AppUtil.AppConstants.DEFAULT_DB_SOURCE_NAME);
                if (verifierUserId != null) {
                    verifierEmpId = userRepository.findByUserId(verifierUserId)
                            .map(com.autonoma.erp.model.admin.UserCredential::getEmpId)
                            .orElse(null);
                }
                if (verifierEmpId == null && verifiedBy != null) {
                    verifierEmpId = userRepository.findByUserId(verifiedBy)
                            .map(com.autonoma.erp.model.admin.UserCredential::getEmpId)
                            .orElse(null);
                }
            } finally {
                com.autonoma.erp.config.TenantContextHolder.setTenantId(origTenant);
            }

            String verifierEmpCode = null;
            String verifierEmpName = null;
            if (verifierEmpId != null) {
                EmployeeMaster verifierEmp = employeeMasterRepository.findById(verifierEmpId).orElse(null);
                if (verifierEmp != null) {
                    verifierEmpCode = verifierEmp.getEmpCode();
                    verifierEmpName = verifierEmp.getEmployeeName();
                    if (verifierEmpName == null) {
                        verifierEmpName = (verifierEmp.getFirstName() + " " + verifierEmp.getLastName()).trim();
                    }
                }
            }

            boolean isAssignee = (verifierEmpCode != null
                    && verifierEmpCode.equalsIgnoreCase(assignment.getAssignedTo())) ||
                    (verifierEmpName != null && verifierEmpName.equalsIgnoreCase(assignment.getAssignedTo())) ||
                    (verifierEmpId != null && verifierEmpId.toString().equalsIgnoreCase(assignment.getAssignedTo())) ||
                    (verifierUserId != null && verifierUserId.equalsIgnoreCase(assignment.getAssignedTo()));

            boolean isAssignor = (verifierEmpCode != null
                    && verifierEmpCode.equalsIgnoreCase(assignment.getAssignedBy())) ||
                    (verifierEmpName != null && verifierEmpName.equalsIgnoreCase(assignment.getAssignedBy())) ||
                    (verifierEmpId != null && verifierEmpId.toString().equalsIgnoreCase(assignment.getAssignedBy())) ||
                    (verifierUserId != null && verifierUserId.equalsIgnoreCase(assignment.getAssignedBy()));

            boolean isCreator = (verifierEmpCode != null && verifierEmpCode.equalsIgnoreCase(assignment.getCreatedBy()))
                    ||
                    (verifierEmpName != null && verifierEmpName.equalsIgnoreCase(assignment.getCreatedBy())) ||
                    (verifierEmpId != null && verifierEmpId.toString().equalsIgnoreCase(assignment.getCreatedBy())) ||
                    (verifierUserId != null && verifierUserId.equalsIgnoreCase(assignment.getCreatedBy()));

            EmployeeMaster assignee = resolveEmployee(assignment.getAssignedTo())
                    .orElse(null);
            boolean isManager = false;
            if (assignee != null && verifierEmpId != null) {
                EmployeeManagerMapping mapping = managerMappingRepository
                        .findByEmpIdAndStatus(assignee.getId(), "Active").orElse(null);
                if (mapping != null) {
                    isManager = verifierEmpId.equals(mapping.getHomeManagerId()) ||
                            verifierEmpId.equals(mapping.getBusinessManagerId()) ||
                            verifierEmpId.equals(mapping.getVerticalHeadId()) ||
                            verifierEmpId.equals(mapping.getHrId());
                }
            }

            if ("Completed".equalsIgnoreCase(statusName) || "Started".equalsIgnoreCase(statusName)
                    || "25%".equalsIgnoreCase(statusName) || "50%".equalsIgnoreCase(statusName)
                    || "75%".equalsIgnoreCase(statusName) || "Not Completed".equalsIgnoreCase(statusName)
                    || "No Entry".equalsIgnoreCase(statusName)) {
                boolean isMatch = isAssignee || isAssignor || isCreator || isManager;
                if (!isMatch) {
                    throw new org.springframework.security.access.AccessDeniedException(
                            "Access Denied: You cannot submit or modify this task as you are not the assigned employee.");
                }
            } else {
                if (assignee != null && verifierEmpId != null) {
                    if (!isManager) {
                        throw new org.springframework.security.access.AccessDeniedException(
                                "Access Denied: You are not authorized to verify this task because you are not mapped as this employee's manager.");
                    }
                } else {
                    throw new org.springframework.security.access.AccessDeniedException(
                            "Access Denied: You are not authorized to verify this task.");
                }
            }
        }

        // --- USER REWORK COMPLETION WORKFLOW ----------------------------------
        if ("Completed".equalsIgnoreCase(statusName) && assignment.getStatus() != null
                && ("Pending".equalsIgnoreCase(assignment.getStatus().getName())
                        || "Active".equalsIgnoreCase(assignment.getStatus().getName())
                        || "Started".equalsIgnoreCase(assignment.getStatus().getName()))) {

            java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd");
            sdf.setTimeZone(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
            String dateStr = assignment.getChecklistDate() != null ? sdf.format(assignment.getChecklistDate()) : "";

            java.util.List<ChecklistAssignment> allAssigned = assignRepo.findByChecklistId(master.getId());
            ChecklistAssignment oldRejected = null;
            if (allAssigned != null) {
                oldRejected = allAssigned.stream()
                        .filter(a -> a.getAssignedTo() != null
                                && a.getAssignedTo().equalsIgnoreCase(assignment.getAssignedTo()))
                        .filter(a -> a.getChecklistDate() != null
                                && sdf.format(a.getChecklistDate()).equals(dateStr))
                        .filter(a -> !a.getId().equals(assignment.getId()) && a.getStatus() != null
                                && ("Rejected".equalsIgnoreCase(a.getStatus().getName())
                                        || "Unresolved".equalsIgnoreCase(a.getStatus().getName())))
                        .findFirst().orElse(null);
            }

            if (oldRejected != null) {
                // Determine the target status for A
                String nextStatusName = "Completed";
                StatusMaster aStatus = getOrCreateStatus(nextStatusName);

                // Promote A back to Completed with "Pending For Verify" so it
                // reappears on the verifier's dashboard for dual-check
                oldRejected.setStatus(aStatus);
                oldRejected.setVerifyStatus(getOrCreateStatus("Pending For Verify"));
                // Clear previous rejection markers so the verifier sees a fresh state
                oldRejected.setVerifiedBy(null);
                oldRejected.setVerifiedDate(null);
                oldRejected.setComments(null);
                oldRejected.setRemarks(remarks);
                if (actualFiles != null) {
                    oldRejected.setActualFiles(actualFiles);
                }
                oldRejected.setUpdatedBy(verifiedBy);
                oldRejected.setUpdatedAt(new Date());

                // Save A to assignRepo and sync to the frequency/closed table
                ChecklistAssignment savedOldRejected = assignRepo.save(oldRejected);
                saveToFrequencyTable(savedOldRejected);

                // IMPORTANT: Do NOT call deleteFromFrequencyTable for assignment B here.
                // B (the helper re-work row) shares the same checklistId+assignedTo+date key
                // as A in the frequency table. The row was already updated above for A.
                // We only delete B from the active assignments table.
                assignRepo.delete(assignment);

                // Notify the Vertical Head that the task has been re-submitted for dual
                // verification
                try {
                    EmployeeMaster assigneeObj = resolveEmployee(oldRejected.getAssignedTo())
                            .orElse(null);
                    if (assigneeObj != null) {
                        EmployeeManagerMapping mapping = managerMappingRepository
                                .findByEmpIdAndStatus(assigneeObj.getId(), "Active").orElse(null);
                        if (mapping != null && mapping.getVerticalHeadId() != null) {
                            EmployeeMaster verticalHead = employeeMasterRepository.findById(mapping.getVerticalHeadId())
                                    .orElse(null);
                            if (verticalHead != null) {
                                String empName = assigneeObj.getEmployeeName() != null ? assigneeObj.getEmployeeName()
                                        : oldRejected.getAssignedTo();
                                notificationService.notifyUserAboutChecklistVerification(verticalHead, master,
                                        savedOldRejected, empName);
                            }
                        }
                    }
                } catch (Exception e) {
                    log.error("Failed to notify Vertical Head about rework re-submission", e);
                }

                // Return a dummy verification object
                ChecklistVerification dummy = new ChecklistVerification();
                dummy.setAssignment(savedOldRejected);
                dummy.setVerifiedBy(verifiedBy);
                dummy.setStatus(aStatus);
                dummy.setRemarks(remarks);
                dummy.setVerifiedDate(new Date());
                return dummy;
            }
        }
        // ---------------------------------------------------------------------

        // DUAL CHECK & WORKFLOW MAPPING LOGIC:
        String finalStatusName = statusName;
        StatusMaster verifyStatusObj = null;
        boolean isVerificationRequired = "RENEWAL".equalsIgnoreCase(master.getCategory())
                ? "YES".equalsIgnoreCase(master.getVerificationRequired())
                : isDualCheckEnabled(master.getDualCheck());

        if ("Completed".equalsIgnoreCase(statusName)) {
            finalStatusName = "Completed";
            verifyStatusObj = isVerificationRequired ? getOrCreateStatus("Pending For Verify")
                    : getOrCreateStatus("N/A");
            assignment.setVerifiedBy(null);
            assignment.setVerifiedDate(null);
            assignment.setComments(null);

            // Send notification to Vertical Head
            try {
                EmployeeMaster assigneeObj = resolveEmployee(assignment.getAssignedTo())
                        .orElse(null);
                if (assigneeObj != null) {
                    EmployeeManagerMapping mapping = managerMappingRepository
                            .findByEmpIdAndStatus(assigneeObj.getId(), "Active").orElse(null);
                    if (mapping != null && mapping.getVerticalHeadId() != null) {
                        EmployeeMaster verticalHead = employeeMasterRepository.findById(mapping.getVerticalHeadId())
                                .orElse(null);
                        if (verticalHead != null) {
                            String empName = assigneeObj.getEmployeeName() != null ? assigneeObj.getEmployeeName()
                                    : assignment.getAssignedTo();
                            notificationService.notifyUserAboutChecklistVerification(verticalHead, master, assignment,
                                    empName);
                        }
                    }
                }
            } catch (Exception e) {
                log.error("Failed to notify Vertical Head about checklist completion", e);
            }
        } else if ("Not Completed".equalsIgnoreCase(statusName)) {
            finalStatusName = "Not Completed";
            verifyStatusObj = isVerificationRequired ? getOrCreateStatus("Pending For Verify")
                    : getOrCreateStatus("N/A");
        } else if ("Verified".equalsIgnoreCase(statusName) || "Accepted".equalsIgnoreCase(statusName)) {
            finalStatusName = "Completed";
            verifyStatusObj = getOrCreateStatus("Verified");
            assignment.setVerifiedBy(verifiedBy);
            assignment.setVerifiedDate(new Date());
            assignment.setComments(remarks);
            if ("RENEWAL".equalsIgnoreCase(master.getCategory())
                    && "Renewal Pending".equalsIgnoreCase(master.getStatus())) {
                verifyMasterChecklist(master.getId(), verifiedBy, "Renewal Verified", remarks);
            }
        } else if ("Rejected".equalsIgnoreCase(statusName)) {
            finalStatusName = "Unresolved";
            verifyStatusObj = getOrCreateStatus("Rejected");
            assignment.setVerifiedBy(verifiedBy);
            assignment.setVerifiedDate(new Date());
            assignment.setComments(remarks);
        } else {
            finalStatusName = statusName;
            verifyStatusObj = getOrCreateStatus("N/A");
        }

        // --- MASTER RENEWAL DATES UPDATE LOGIC ---
        // Verification Required - YES: Update Master on Verification
        // ('Verified'/'Accepted')
        // Verification Required - NO: Update Master immediately on Close ('Completed')
        if (master != null && "RENEWAL".equalsIgnoreCase(master.getCategory())) {
            Date targetRenewalDate = assignment.getNextRenewalDate();
            if (targetRenewalDate != null) {
                if ("Completed".equalsIgnoreCase(statusName) && !isVerificationRequired) {
                    updateMasterRenewalDates(master, targetRenewalDate);
                } else if (("Verified".equalsIgnoreCase(statusName) || "Accepted".equalsIgnoreCase(statusName)
                        || "Renewal Verified".equalsIgnoreCase(statusName)) && isVerificationRequired) {
                    updateMasterRenewalDates(master, targetRenewalDate);
                }
            }
        }

        StatusMaster status = getOrCreateStatus(finalStatusName);

        // Update assignment details
        assignment.setStatus(status);
        assignment.setVerifyStatus(verifyStatusObj);
        assignment.setRemarks(remarks);
        if (actualFiles != null) {
            assignment.setActualFiles(actualFiles);
        }
        assignment.setUpdatedBy(verifiedBy);
        assignment.setUpdatedAt(new Date());

        // Consolidate manager verification columns if finalized/closed
        if ("Verified".equalsIgnoreCase(finalStatusName) || "Accepted".equalsIgnoreCase(finalStatusName)
                || "Closed".equalsIgnoreCase(finalStatusName) || "Completed".equalsIgnoreCase(finalStatusName)) {
            if (assignment.getVerifiedBy() == null) {
                assignment.setVerifiedBy(verifiedBy);
                assignment.setVerifiedDate(new Date());
                assignment.setComments(remarks);
            }
        }

        // Save active/closed details directly in the respective frequency table
        ChecklistAssignment savedAssignment = assignRepo.save(assignment);
        saveToFrequencyTable(savedAssignment);

        // Create a dummy verification object to return (deprecation safety)
        ChecklistVerification dummyVerification = new ChecklistVerification();
        dummyVerification.setAssignment(assignment);
        dummyVerification.setVerifiedBy(verifiedBy);
        dummyVerification.setStatus(status);
        dummyVerification.setRemarks(remarks);
        dummyVerification.setVerifiedDate(new Date());

        // MANAGER REJECTION WORKFLOW:
        if ("Rejected".equalsIgnoreCase(finalStatusName) || "Unresolved".equalsIgnoreCase(finalStatusName)) {
            boolean alreadyExists = false;
            java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd");
            sdf.setTimeZone(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
            String dateStr = assignment.getChecklistDate() != null ? sdf.format(assignment.getChecklistDate()) : "";

            java.util.List<ChecklistAssignment> allAssigned = assignRepo.findByChecklistId(master.getId());
            if (allAssigned != null) {
                alreadyExists = allAssigned.stream()
                        .filter(a -> a.getAssignedTo() != null
                                && a.getAssignedTo().equalsIgnoreCase(assignment.getAssignedTo()))
                        .filter(a -> a.getChecklistDate() != null && sdf.format(a.getChecklistDate()).equals(dateStr))
                        .anyMatch(a -> !a.getId().equals(assignment.getId()) && a.getStatus() != null &&
                                ("Pending".equalsIgnoreCase(a.getStatus().getName())
                                        || "Active".equalsIgnoreCase(a.getStatus().getName())
                                        || "Started".equalsIgnoreCase(a.getStatus().getName())));
            }
            if (!alreadyExists) {
                ChecklistAssignment next = new ChecklistAssignment();
                next.setChecklist(master);
                next.setAssignedTo(assignment.getAssignedTo());
                next.setAssignedBy(verifiedBy);
                next.setAssignType(assignment.getAssignType());
                next.setAssignedDate(new Date());
                next.setChecklistDate(assignment.getChecklistDate());
                next.setCarryForward(master.getCarryForward());
                next.setCarryForwardCount(0);
                next.setStatus(getOrCreateStatus("Active"));
                ChecklistAssignment savedNext = assignRepo.save(next);
                saveToFrequencyTable(savedNext);
            }
        }

        boolean isFinalized = "Closed".equalsIgnoreCase(finalStatusName) ||
                "Verified".equalsIgnoreCase(finalStatusName) ||
                "Accepted".equalsIgnoreCase(finalStatusName) ||
                "Completed".equalsIgnoreCase(finalStatusName) ||
                "Pending for Verified".equalsIgnoreCase(finalStatusName);

        // ERASE ON VERIFY WORKFLOW:
        if (isFinalized) {
            java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd");
            sdf.setTimeZone(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
            String dateStr = assignment.getChecklistDate() != null ? sdf.format(assignment.getChecklistDate()) : "";

            java.util.List<ChecklistAssignment> allAssigned = assignRepo.findByChecklistId(master.getId());
            if (allAssigned != null) {
                java.util.List<ChecklistAssignment> matched = allAssigned.stream()
                        .filter(a -> a.getAssignedTo() != null
                                && a.getAssignedTo().equalsIgnoreCase(assignment.getAssignedTo()))
                        .filter(a -> a.getChecklistDate() != null && sdf.format(a.getChecklistDate()).equals(dateStr))
                        .collect(java.util.stream.Collectors.toList());

                // 1. Delete all Rejected/Unresolved assignments
                java.util.List<ChecklistAssignment> rejectedList = matched.stream()
                        .filter(a -> !a.getId().equals(assignment.getId()) && a.getStatus() != null
                                && ("Rejected".equalsIgnoreCase(a.getStatus().getName())
                                        || "Unresolved".equalsIgnoreCase(a.getStatus().getName())))
                        .collect(java.util.stream.Collectors.toList());
                if (!rejectedList.isEmpty()) {
                    for (ChecklistAssignment rej : rejectedList) {
                        deleteFromFrequencyTable(rej.getChecklist().getId(), rej.getAssignedTo(),
                                rej.getChecklistDate(), rej.getChecklist().getFrequency());
                    }
                    assignRepo.deleteAll(rejectedList);
                }

                // 2. Delete the again-created checklist (which is Pending/Started)
                java.util.List<ChecklistAssignment> pendingList = matched.stream()
                        .filter(a -> !a.getId().equals(assignment.getId()) && a.getStatus() != null &&
                                ("Pending".equalsIgnoreCase(a.getStatus().getName())
                                        || "Active".equalsIgnoreCase(a.getStatus().getName())
                                        || "Started".equalsIgnoreCase(a.getStatus().getName())))
                        .collect(java.util.stream.Collectors.toList());
                if (!pendingList.isEmpty()) {
                    for (ChecklistAssignment pend : pendingList) {
                        deleteFromFrequencyTable(pend.getChecklist().getId(), pend.getAssignedTo(),
                                pend.getChecklistDate(), pend.getChecklist().getFrequency());
                    }
                    assignRepo.deleteAll(pendingList);
                }
            }
        }

        // RECURRING LOGIC:
        // Commented out to ensure tasks are ONLY created dynamically by the 4:00 AM
        // scheduler on their respective due dates,
        // rather than pre-creating them as pending placeholders upon completion.
        // if (isFinalized && master.getFrequency() != null && !"ONE
        // TIME".equalsIgnoreCase(master.getFrequency())) {
        // generateNextAssignment(assignment);
        // }

        return dummyVerification;
    }

    private void generateNextAssignment(ChecklistAssignment current) {
        MasterChecklist master = current.getChecklist();
        if (!"Active".equalsIgnoreCase(master.getStatus())) {
            log.info("Checklist {} is status={}. Stopping future generation.", master.getSeqNo(), master.getStatus());
            return;
        }
        String freq = master.getFrequency().toUpperCase();
        Date currentDate = current.getChecklistDate() != null ? current.getChecklistDate() : new Date();

        java.util.Calendar cal = java.util.Calendar.getInstance(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
        cal.setTime(currentDate);

        switch (freq) {
            case "DAILY":
                cal.add(java.util.Calendar.DATE, 1);
                break;
            case "FORTNIGHTLY":
                cal.add(java.util.Calendar.DATE, 14);
                break;
            case "WEEKLY":
                cal.add(java.util.Calendar.DATE, 7);
                break;
            case "MONTHLY":
                cal.add(java.util.Calendar.MONTH, 1);
                break;
            case "QUARTERLY":
                cal.add(java.util.Calendar.MONTH, 3);
                break;
            case "HALF YEARLY":
            case "HALF-YEARLY":
                cal.add(java.util.Calendar.MONTH, 6);
                break;
            case "YEARLY":
                cal.add(java.util.Calendar.YEAR, 1);
                break;
            case "CUSTOM": {
                Integer val = master.getRepeatEveryValue();
                String unit = master.getRepeatEveryUnit();
                if (val != null && val > 0 && unit != null) {
                    if ("DAYS".equalsIgnoreCase(unit)) {
                        cal.add(java.util.Calendar.DATE, val);
                    } else if ("WEEKS".equalsIgnoreCase(unit)) {
                        cal.add(java.util.Calendar.DATE, val * 7);
                    } else if ("MONTHS".equalsIgnoreCase(unit)) {
                        cal.add(java.util.Calendar.MONTH, val);
                    } else if ("YEARS".equalsIgnoreCase(unit)) {
                        cal.add(java.util.Calendar.YEAR, val);
                    } else {
                        return; // Unknown unit
                    }
                } else {
                    return; // Invalid custom configuration
                }
                break;
            }
            default:
                return; // No recurrence
        }

        Date nextDate = cal.getTime();

        // DUPLICATE PREVENTION: Check if a future assignment for this date already
        // exists
        boolean exists = assignRepo.existsByChecklistIdAndAssignedToAndChecklistDate(
                master.getId(), current.getAssignedTo(), nextDate);
        if (exists)
            return; // Skip if already generated
    }

    @Transactional
    public ChecklistAssignment saveAssignment(ChecklistAssignment assignment) {
        ChecklistAssignment savedAssignment = assignRepo.save(assignment);
        saveToFrequencyTable(savedAssignment);
        return savedAssignment;
    }

    private String formatVerifierName(String name) {
        if (name == null || name.trim().isEmpty()) {
            return "Admin";
        }
        String clean = name.trim();
        if ("SUPER BOSS".equalsIgnoreCase(clean) || "superboss".equalsIgnoreCase(clean)) {
            return "Super Boss";
        }
        return clean;
    }

    private void updateMasterRenewalDates(MasterChecklist master, Date nextRenewalDate) {
        if (master == null || nextRenewalDate == null) {
            return;
        }
        try {
            master.setExpiryDate(nextRenewalDate);
            master.setNextDueDate(nextRenewalDate);

            Long reminderDays = master.getReminderDays();
            if (reminderDays != null) {
                java.util.Calendar cal = java.util.Calendar.getInstance();
                cal.setTime(nextRenewalDate);
                cal.add(java.util.Calendar.DAY_OF_MONTH, -reminderDays.intValue());
                master.setReminderDate(cal.getTime());
            } else {
                master.setReminderDate(nextRenewalDate);
            }
            master.setSkipAuditUpdate(true);
            masterRepo.save(master);
            log.info("Updated MasterChecklist ID {} ExpiryDate to {} and ReminderDate to {}",
                    master.getId(), master.getExpiryDate(), master.getReminderDate());
        } catch (Exception e) {
            log.error("Failed to update Master Checklist expiry and reminder date for next renewal: {}", e.getMessage(),
                    e);
        }
    }

    @Transactional
    public MasterChecklist verifyMasterChecklist(Long checklistId, String verifiedBy, String status, String remarks) {
        String verifier = SecurityUtils.getCurrentUserEmployeeName();
        if (verifier == null || verifier.trim().isEmpty() || "anonymousUser".equalsIgnoreCase(verifier)) {
            verifier = verifiedBy;
        }
        verifier = formatVerifierName(verifier);

        MasterChecklist checklist = masterRepo.findById(checklistId).orElseThrow();
        if ("Renewal Pending".equalsIgnoreCase(status)) {
            checklist.setStatus("Renewal Pending");
            checklist.setVerifyStatus("Renewal Pending");
        } else if ("Renewal Verified".equalsIgnoreCase(status)) {
            checklist.setStatus("Renewal Verified");
            checklist.setVerifyStatus("Renewal Verified");
            checklist.setVerifiedBy(verifier);
            checklist.setVerifiedDate(new Date());
        } else if ("Verified".equalsIgnoreCase(status)) {
            checklist.setStatus("Active");
            checklist.setVerifyStatus("Verified");
            checklist.setVerifiedBy(verifier);
            checklist.setVerifiedDate(new Date());
        } else if ("Rejected".equalsIgnoreCase(status) && "Renewal Pending".equalsIgnoreCase(checklist.getStatus())) {
            checklist.setStatus("Active");
            checklist.setVerifyStatus("Verified");
            checklist.setRejReason(remarks);
        } else {
            checklist.setVerifyStatus(status);
            if ("Verified".equals(status) || "Rejected".equals(status)) {
                checklist.setVerifiedBy(verifier);
                checklist.setVerifiedDate(new Date());
            } else {
                checklist.setVerifiedBy(null);
                checklist.setVerifiedDate(null);
            }
            if ("Rejected".equals(status)) {
                checklist.setRejReason(remarks);
            } else if ("Verified".equals(status)) {
                // Once the new version is verified, invalidate older versions with the same
                // sequence number
                java.util.List<MasterChecklist> oldVersions = masterRepo.findBySeqNoAndIdNot(checklist.getSeqNo(),
                        checklist.getId());
                for (MasterChecklist old : oldVersions) {
                    if (!"In Active".equals(old.getStatus())) {
                        old.setStatus("In Active");
                        masterRepo.save(old);
                    }
                }
            }
        }

        checklist.setSkipAuditUpdate(true);
        MasterChecklist saved = masterRepo.save(checklist);
        populateMasterChecklistFiles(saved);
        triggerInitialAssignmentIfVerified(saved);
        return saved;
    }

    private void triggerInitialAssignmentIfVerified(MasterChecklist checklist) {
        if ("Verified".equalsIgnoreCase(checklist.getVerifyStatus())
                || "Renewal Pending".equalsIgnoreCase(checklist.getVerifyStatus())) {
            try {
                if (checklist.getEffectiveFrom() != null) {
                    java.time.LocalDate effectiveLocal = java.time.Instant
                            .ofEpochMilli(checklist.getEffectiveFrom().getTime())
                            .atZone(java.time.ZoneId.of("Asia/Kolkata")).toLocalDate();
                    java.time.LocalDate todayLocal = java.time.LocalDate.now(java.time.ZoneId.of("Asia/Kolkata"));
                    if (effectiveLocal.isAfter(todayLocal)) {
                        log.info(
                                "Checklist {} has future effective date {}. Delaying initial assignment until scheduler runs on that date.",
                                checklist.getSeqNo(), effectiveLocal);
                        return;
                    }
                }
                log.info("Triggering immediate assignment for verified Checklist {}", checklist.getSeqNo());
                checklistAutoAssignmentService.processAutoAssignment(checklist.getId(),
                        checklist.getEffectiveFrom() != null ? checklist.getEffectiveFrom() : new Date());
            } catch (Exception e) {
                log.error("Failed to trigger immediate assignment for Checklist {}: {}", checklist.getSeqNo(),
                        e.getMessage());
            }
        }
    }

    // --- Status Master Helpers ---

    /**
     * Returns true if dualCheck is enabled.
     * Handles both legacy "YES"/"NO" values and normalized "1"/"0" values.
     */
    private boolean isDualCheckEnabled(String dualCheck) {
        if (dualCheck == null)
            return false;
        String v = dualCheck.trim().toUpperCase();
        return "YES".equals(v) || "1".equals(v) || "TRUE".equals(v);
    }

    private StatusMaster getOrCreateStatus(String name) {
        if (name == null || name.trim().isEmpty()) {
            return null;
        }
        String input = name.trim().toUpperCase();

        // ── Explicit pass-through: preserve the exact normalized name ─────────────
        // Execution progress statuses (RENEWAL category)
        if ("STARTED".equals(input)) {
            /* keep as STARTED */ } else if ("25%".equals(input)) {
            /* keep as 25% */ } else if ("50%".equals(input)) {
            /* keep as 50% */ } else if ("75%".equals(input)) {
            /* keep as 75% */ } else if ("COMPLETED".equals(input)) {
            /* keep as COMPLETED */ } else if ("NOT COMPLETED".equals(input)) {
            /* keep as NOT COMPLETED */ }
        // Execution outcome statuses (CHECK LIST / RENEWAL)
        else if ("MISSED".equals(input)) {
            /* keep as MISSED */ } else if ("ATTENDED".equals(input)) {
            /* keep as ATTENDED */ } else if ("UNRESOLVED".equals(input)) {
            /* keep as UNRESOLVED */ }
        // Verification pipeline statuses
        else if ("PENDING FOR VERIFY".equals(input)
                || "PENDING FOR VERIFIED".equals(input)) {
            input = "PENDING FOR VERIFY";
        } else if ("PENDING FOR ACCEPTED".equals(input)
                || "PENDING FOR ACCEPT".equals(input)) {
            input = "PENDING FOR ACCEPTED";
        } else if ("ACCEPTED".equals(input)
                || "ACCEPT".equals(input)) {
            input = "ACCEPTED";
        } else if ("RENEWAL PENDING".equals(input)) {
            /* keep as RENEWAL PENDING */ } else if ("RENEWAL VERIFIED".equals(input)) {
            /* keep as RENEWAL VERIFIED */ }
        // Closed is a distinct terminal state — NOT the same as INACTIVE
        else if ("CLOSED".equals(input)) {
            /* keep as CLOSED */ }
        // ── Canonical / generic statuses ─────────────────────────────────────────
        else if ("ACTIVE".equals(input)) {
            input = "ACTIVE";
        } else if ("INACTIVE".equals(input)
                || "IN ACTIVE".equals(input)
                || "EXPIRED".equals(input)
                || "CANCELLED".equals(input)
                || "CANCELED".equals(input)) {
            input = "INACTIVE";
        } else if ("VERIFIED".equals(input)
                || "APPROVED".equals(input)
                || "DONE".equals(input)) {
            input = "VERIFIED";
        } else if ("REJECTED".equals(input)
                || "REJECT".equals(input)) {
            input = "REJECTED";
        } else if ("PENDING".equals(input)) {
            input = "PENDING";
        } else if ("N/A".equals(input) || "NA".equals(input)) {
            input = "N/A";
        } else if ("UN ASSIGNED".equals(input)
                || "UNASSIGNED".equals(input)) {
            input = "UN ASSIGNED";
        } else if ("ASSIGNED".equals(input)
                || "IN PROGRESS".equals(input)
                || "INPROGRESS".equals(input)
                || "OVERDUE".equals(input)) {
            input = "ASSIGNED";
        } else if ("TO BE VERIFIED".equals(input)) {
            input = "TO BE VERIFIED";
        }
        // ── Unknown input — default to TO BE VERIFIED ────────────────────────────
        else {
            input = "TO BE VERIFIED";
        }

        String finalName = input;
        return statusRepo.findByNameIgnoreCase(finalName).orElseGet(() -> {
            StatusMaster sm = new StatusMaster();
            sm.setName(finalName);
            return statusRepo.save(sm);
        });
    }

    @Transactional
    public void seedStatuses() {
        String[] statuses = {
                // Core record statuses
                "ACTIVE", "INACTIVE", "PENDING",
                // Verification statuses
                "TO BE VERIFIED", "VERIFIED", "REJECTED",
                // Assignment statuses
                "UN ASSIGNED", "ASSIGNED",
                // Checklist execution statuses (CHECK LIST category)
                "COMPLETED", "NOT COMPLETED", "UNRESOLVED", "MISSED",
                // Checklist execution statuses (RENEWAL category)
                "STARTED", "25%", "50%", "75%", "ATTENDED",
                // Verification pipeline statuses
                "PENDING FOR VERIFY", "PENDING FOR ACCEPTED", "ACCEPTED",
                // Renewal lifecycle statuses
                "RENEWAL PENDING", "RENEWAL VERIFIED",
                // Terminal status
                "CLOSED",
                // Misc
                "N/A"
        };
        for (String s : statuses) {
            if (statusRepo.findByName(s).isEmpty()) {
                StatusMaster sm = new StatusMaster();
                sm.setName(s);
                statusRepo.save(sm);
            }
        }
    }

    @Transactional
    public String repairAssignedToFields() {
        // Build a map: employeeName (lower) -> empCode
        java.util.Map<String, String> nameToCode = new java.util.HashMap<>();
        for (com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster emp : employeeMasterRepository.findAll()) {
            if (emp.getEmpCode() != null && emp.getEmployeeName() != null) {
                nameToCode.put(emp.getEmployeeName().trim().toLowerCase(), emp.getEmpCode());
            }
        }

        // Collect all known empCodes so we can skip already-correct records
        java.util.Set<String> knownCodes = new java.util.HashSet<>(nameToCode.values());

        int fixedActive = 0;
        int fixedClosed = 0;
        int fixedMaster = 0;

        // 1. Repair active assignments
        java.util.List<ChecklistAssignment> allActive = assignRepo.findAll();
        for (ChecklistAssignment a : allActive) {
            String at = a.getAssignedTo();
            if (at == null || at.trim().isEmpty())
                continue;
            if (knownCodes.contains(at.trim()))
                continue;
            String code = nameToCode.get(at.trim().toLowerCase());
            if (code != null) {
                a.setAssignedTo(code);
                assignRepo.save(a);
                fixedActive++;
            }
        }

        // 2. Repair closed history assignments
        java.util.List<ChecklistClosed> allClosed = closedRepo.findAll();
        for (ChecklistClosed c : allClosed) {
            String at = c.getAssignedTo();
            if (at == null || at.trim().isEmpty())
                continue;
            if (knownCodes.contains(at.trim()))
                continue;
            String code = nameToCode.get(at.trim().toLowerCase());
            if (code != null) {
                c.setAssignedTo(code);
                closedRepo.save(c);
                fixedClosed++;
            }
        }

        // 3. Repair master checklists
        java.util.List<MasterChecklist> allMaster = masterRepo.findAll();
        for (MasterChecklist m : allMaster) {
            String at = m.getAssignTo();
            if (at != null && !at.trim().isEmpty()) {
                String[] parts = at.split(",");
                java.util.List<String> repairedParts = new java.util.ArrayList<>();
                boolean changed = false;
                for (String part : parts) {
                    String trimmed = part.trim();
                    if (knownCodes.contains(trimmed)) {
                        repairedParts.add(trimmed);
                    } else {
                        String code = nameToCode.get(trimmed.toLowerCase());
                        if (code != null) {
                            repairedParts.add(code);
                            changed = true;
                        } else {
                            repairedParts.add(trimmed);
                        }
                    }
                }
                if (changed) {
                    m.setAssignTo(String.join(", ", repairedParts));
                    masterRepo.save(m);
                    fixedMaster++;
                }
            }

            // 4. Recovery: If the master checklist has empty/null assignTo but has
            // assignments in active/closed, restore it!
            if (m.getAssignTo() == null || m.getAssignTo().trim().isEmpty()) {
                java.util.Set<String> assignees = new java.util.HashSet<>();
                // Check active
                for (ChecklistAssignment a : allActive) {
                    if (a.getChecklist().getId().equals(m.getId()) && a.getAssignedTo() != null
                            && !a.getAssignedTo().trim().isEmpty()) {
                        assignees.add(a.getAssignedTo().trim());
                    }
                }
                // Check closed
                for (ChecklistClosed c : allClosed) {
                    if (c.getChecklist().getId().equals(m.getId()) && c.getAssignedTo() != null
                            && !c.getAssignedTo().trim().isEmpty()) {
                        assignees.add(c.getAssignedTo().trim());
                    }
                }
                if (!assignees.isEmpty()) {
                    // Repair those assignees if they are names
                    java.util.List<String> repairedAssignees = new java.util.ArrayList<>();
                    for (String asg : assignees) {
                        if (knownCodes.contains(asg)) {
                            repairedAssignees.add(asg);
                        } else {
                            String code = nameToCode.get(asg.toLowerCase());
                            if (code != null) {
                                repairedAssignees.add(code);
                            } else {
                                repairedAssignees.add(asg);
                            }
                        }
                    }
                    m.setAssignTo(String.join(", ", repairedAssignees));
                    m.setAssignDate(new Date());
                    m.setTaskStatus("Pending");
                    masterRepo.save(m);
                    fixedMaster++;
                }
            }
        }

        return String.format("Repaired: Active=%d, Closed=%d, Master=%d. Scanned: Active=%d, Closed=%d, Master=%d.",
                fixedActive, fixedClosed, fixedMaster, allActive.size(), allClosed.size(), allMaster.size());
    }

    public String inspectDatabaseSchema() {
        StringBuilder sb = new StringBuilder();
        try {
            sb.append("=== DATABASE INSPECTOR ===\n");
            try (java.sql.Connection conn = jdbcTemplate.getDataSource().getConnection()) {
                sb.append("URL: ").append(conn.getMetaData().getURL()).append("\n");
            }

            sb.append("\n--- TABLES LIKE DEPARTMENT ---\n");
            jdbcTemplate.query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%DEPARTMENT%'",
                    (rs, rowNum) -> {
                        sb.append("Table: ").append(rs.getString("TABLE_NAME")).append("\n");
                        return null;
                    });

            sb.append("\n--- HR_DEPARTMENT COLUMNS ---\n");
            try {
                jdbcTemplate.query(
                        "SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'HR_DEPARTMENT'",
                        (rs, rowNum) -> {
                            sb.append("Column: ").append(rs.getString("COLUMN_NAME")).append(" (")
                                    .append(rs.getString("DATA_TYPE")).append(")\n");
                            return null;
                        });
            } catch (Exception e) {
                sb.append("Error: ").append(e.getMessage()).append("\n");
            }

            sb.append("\n--- HR_DEPARTMENT_MASTER COLUMNS ---\n");
            try {
                jdbcTemplate.query(
                        "SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'HR_DEPARTMENT_MASTER'",
                        (rs, rowNum) -> {
                            sb.append("Column: ").append(rs.getString("COLUMN_NAME")).append(" (")
                                    .append(rs.getString("DATA_TYPE")).append(")\n");
                            return null;
                        });
            } catch (Exception e) {
                sb.append("Error: ").append(e.getMessage()).append("\n");
            }

            sb.append("\n--- QMS_CHECKLIST_DEPARTMENT FOREIGN KEYS ---\n");
            try {
                jdbcTemplate.query(
                        "SELECT name, OBJECT_NAME(parent_object_id) AS parent_table, OBJECT_NAME(referenced_object_id) AS referenced_table FROM sys.foreign_keys WHERE parent_object_id = OBJECT_ID('QMS_CHECKLIST_DEPARTMENT')",
                        (rs, rowNum) -> {
                            sb.append("FK: ").append(rs.getString("name"))
                                    .append(" (").append(rs.getString("parent_table")).append(" -> ")
                                    .append(rs.getString("referenced_table")).append(")\n");
                            return null;
                        });
            } catch (Exception e) {
                sb.append("Error: ").append(e.getMessage()).append("\n");
            }

            sb.append("\n--- ROW COUNTS ---\n");
            try {
                int count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM HR_DEPARTMENT", Integer.class);
                sb.append("HR_DEPARTMENT count: ").append(count).append("\n");
            } catch (Exception e) {
                sb.append("HR_DEPARTMENT count error: ").append(e.getMessage()).append("\n");
            }
            try {
                int count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM HR_DEPARTMENT_MASTER", Integer.class);
                sb.append("HR_DEPARTMENT_MASTER count: ").append(count).append("\n");
            } catch (Exception e) {
                sb.append("HR_DEPARTMENT_MASTER count error: ").append(e.getMessage()).append("\n");
            }

        } catch (Exception e) {
            sb.append("Inspector failed: ").append(e.getMessage());
        }
        return sb.toString();
    }

    public List<MasterChecklist> getUnassignedChecklists() {
        List<MasterChecklist> list = masterRepo.findByAssignmentType("UNASSIGNED");
        List<MasterChecklist> listNone = masterRepo.findByAssignmentType("NONE");
        List<MasterChecklist> combined = new ArrayList<>();
        if (list != null)
            combined.addAll(list);
        if (listNone != null)
            combined.addAll(listNone);
        combined.forEach(this::populateMasterChecklistFiles);
        return combined;
    }

    private void populateMasterChecklistFiles(MasterChecklist checklist) {
        if (checklist == null || checklist.getId() == null) {
            return;
        }
        try {
            String sql = "SELECT DOC_TYPE, PATH FROM QMS_ATTACHMENT_PATH WHERE PAGE_CODE IN ('M1210', 'QM1110') AND REF_ID = ?";
            List<java.util.Map<String, Object>> rows = jdbcTemplate.queryForList(sql, checklist.getId());
            List<String> uploadedList = new ArrayList<>();
            List<String> scannedList = new ArrayList<>();
            for (java.util.Map<String, Object> row : rows) {
                String docType = (String) row.get("DOC_TYPE");
                String path = (String) row.get("PATH");
                if (path != null && !path.trim().isEmpty()) {
                    if ("MASTER CHECKLIST".equalsIgnoreCase(docType)) {
                        uploadedList.add(path.trim());
                    } else if ("MASTER CHECKLIST SCANNED".equalsIgnoreCase(docType)) {
                        scannedList.add(path.trim());
                    }
                }
            }
            checklist.setUploadedFiles(AttachmentUtil.toJsonString(uploadedList));
            checklist.setScannedFiles(AttachmentUtil.toJsonString(scannedList));

            // Dynamically check if a record exists in QMS_CHECKLIST_ASSIGNMENT for this
            // checklist
            String checkSql = "SELECT COUNT(*) FROM QMS_CHECKLIST_ASSIGNMENT a WITH (NOLOCK) " +
                    "LEFT JOIN AD_STATUS_MASTER s WITH (NOLOCK) ON a.STATUS_ID = s.id " +
                    "WHERE a.CHECKLIST_ID = ? AND (a.ACTIVE = 1 OR a.ACTIVE IS NULL OR a.PENDING_ACTIVATION = 1) " +
                    "AND (s.name IS NULL OR UPPER(s.name) != 'INACTIVE')";
            Integer count = jdbcTemplate.queryForObject(checkSql, Integer.class, checklist.getId());
            if (count != null && count > 0) {
                checklist.setTaskStatus("Assigned");
            } else {
                checklist.setTaskStatus("Unassigned");
            }

            // Dynamically populate @Transient assignTo field
            java.util.List<ChecklistAssignment> allAssignments = assignRepo.findByChecklistId(checklist.getId());
            String allAssignedTo = allAssignments.stream()
                    .filter(a -> (a.getIsActive() == null || a.getIsActive()
                            || Boolean.TRUE.equals(a.getPendingActivation()))
                            && (a.getStatus() == null || !"INACTIVE".equalsIgnoreCase(a.getStatus().getName())))
                    .filter(a -> a.getAssignedTo() != null && !a.getAssignedTo().isEmpty())
                    .map(a -> {
                        String assignedTo = a.getAssignedTo();
                        try {
                            // If it's a numeric ID, fetch the name from HR_EMPLOYEE ONLY IF ACTIVE!
                            Long empId = Long.parseLong(assignedTo.trim());
                            List<String> names = jdbcTemplate.queryForList(
                                    "SELECT employee_name FROM HR_EMPLOYEE WHERE id = ? AND (is_active = 1 OR is_active IS NULL) AND (status IS NULL OR UPPER(status) != 'INACTIVE')",
                                    String.class, empId);
                            return (names != null && !names.isEmpty()) ? names.get(0) : null;
                        } catch (Exception e) {
                            // Either not a number or not found, return as is
                            return assignedTo;
                        }
                    })
                    .filter(java.util.Objects::nonNull)
                    .distinct()
                    .collect(java.util.stream.Collectors.joining(", "));
            checklist.setAssignTo(allAssignedTo.isEmpty() ? null : allAssignedTo);

            // Populate lastCompletedDate from QMS_CHECKLIST_CLOSED
            try {
                String closedSql = "SELECT MAX(CHECKLIST_DATE) FROM QMS_CHECKLIST_CLOSED WITH (NOLOCK) WHERE CHECKLIST_ID = ?";
                Date maxClosedDate = jdbcTemplate.queryForObject(closedSql, Date.class, checklist.getId());
                checklist.setLastCompletedDate(maxClosedDate);
            } catch (Exception e) {
                // ignore
            }

            // Populate lastAssignmentDate from QMS_CHECKLIST_ASSIGNMENT
            try {
                String maxAssignSql = "SELECT MAX(CHECKLIST_DATE) FROM QMS_CHECKLIST_ASSIGNMENT WITH (NOLOCK) WHERE CHECKLIST_ID = ?";
                Date maxAssignDate = jdbcTemplate.queryForObject(maxAssignSql, Date.class, checklist.getId());
                checklist.setLastAssignmentDate(maxAssignDate);
            } catch (Exception e) {
                // ignore
            }

        } catch (Exception e) {
            log.error("Error populating master checklist files for id {}: {}", checklist.getId(), e.getMessage());
        }
    }

    public void populateMasterChecklistFilesBatch(List<MasterChecklist> checklists) {
        if (checklists == null || checklists.isEmpty()) {
            return;
        }
        List<Long> checklistIds = checklists.stream()
                .map(MasterChecklist::getId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .collect(java.util.stream.Collectors.toList());
        if (checklistIds.isEmpty()) {
            return;
        }

        try {
            // 1. Fetch attachment paths in batch
            String idsPlaceholder = checklistIds.stream().map(String::valueOf)
                    .collect(java.util.stream.Collectors.joining(","));
            String attachmentSql = "SELECT REF_ID, DOC_TYPE, PATH FROM QMS_ATTACHMENT_PATH WHERE PAGE_CODE IN ('M1210', 'QM1110') AND REF_ID IN ("
                    + idsPlaceholder + ")";
            List<java.util.Map<String, Object>> attachmentRows = jdbcTemplate.queryForList(attachmentSql);

            java.util.Map<Long, List<String>> uploadedFilesMap = new java.util.HashMap<>();
            java.util.Map<Long, List<String>> scannedFilesMap = new java.util.HashMap<>();
            for (java.util.Map<String, Object> row : attachmentRows) {
                Object refIdObj = row.get("REF_ID");
                if (refIdObj == null)
                    continue;
                Long refId;
                if (refIdObj instanceof Number) {
                    refId = ((Number) refIdObj).longValue();
                } else {
                    try {
                        refId = Long.valueOf(refIdObj.toString());
                    } catch (NumberFormatException e) {
                        continue;
                    }
                }
                String docType = (String) row.get("DOC_TYPE");
                String path = (String) row.get("PATH");
                if (path != null && !path.trim().isEmpty()) {
                    if ("MASTER CHECKLIST".equalsIgnoreCase(docType)) {
                        uploadedFilesMap.computeIfAbsent(refId, k -> new ArrayList<>()).add(path.trim());
                    } else if ("MASTER CHECKLIST SCANNED".equalsIgnoreCase(docType)) {
                        scannedFilesMap.computeIfAbsent(refId, k -> new ArrayList<>()).add(path.trim());
                    }
                }
            }

            // 2. Fetch counts for task status in batch
            String countSql = "SELECT a.CHECKLIST_ID, COUNT(*) as cnt FROM QMS_CHECKLIST_ASSIGNMENT a WITH (NOLOCK) " +
                    "LEFT JOIN AD_STATUS_MASTER s WITH (NOLOCK) ON a.STATUS_ID = s.id " +
                    "WHERE a.CHECKLIST_ID IN (" + idsPlaceholder + ") " +
                    "AND (a.ACTIVE = 1 OR a.ACTIVE IS NULL OR a.PENDING_ACTIVATION = 1) " +
                    "AND (s.name IS NULL OR UPPER(s.name) != 'INACTIVE') " +
                    "GROUP BY a.CHECKLIST_ID";
            List<java.util.Map<String, Object>> countRows = jdbcTemplate.queryForList(countSql);
            java.util.Map<Long, Long> assignmentCountsMap = new java.util.HashMap<>();
            for (java.util.Map<String, Object> row : countRows) {
                Number chkId = (Number) row.get("CHECKLIST_ID");
                Number cnt = (Number) row.get("cnt");
                if (chkId != null && cnt != null) {
                    assignmentCountsMap.put(chkId.longValue(), cnt.longValue());
                }
            }

            // 3. Fetch assignments in batch
            String assignmentsSql = "SELECT a.CHECKLIST_ID, a.ASSIGNED_TO, a.ASSIGN_TYPE " +
                    "FROM QMS_CHECKLIST_ASSIGNMENT a WITH (NOLOCK) " +
                    "LEFT JOIN AD_STATUS_MASTER s WITH (NOLOCK) ON a.STATUS_ID = s.id " +
                    "WHERE a.CHECKLIST_ID IN (" + idsPlaceholder + ") " +
                    "AND (a.ACTIVE = 1 OR a.ACTIVE IS NULL OR a.PENDING_ACTIVATION = 1) " +
                    "AND (s.name IS NULL OR UPPER(s.name) != 'INACTIVE')";
            List<java.util.Map<String, Object>> assignRows = jdbcTemplate.queryForList(assignmentsSql);

            // Gather all numeric assignedTo IDs
            java.util.Set<Long> empIdsToFetch = new java.util.HashSet<>();
            for (java.util.Map<String, Object> row : assignRows) {
                String assignedTo = (String) row.get("ASSIGNED_TO");
                if (assignedTo != null) {
                    try {
                        empIdsToFetch.add(Long.parseLong(assignedTo.trim()));
                    } catch (NumberFormatException e) {
                        // ignore
                    }
                }
            }

            // Fetch active employee names in batch
            java.util.Map<Long, String> empNameMap = new java.util.HashMap<>();
            if (!empIdsToFetch.isEmpty()) {
                String empSql = "SELECT id, employee_name FROM HR_EMPLOYEE WHERE id IN (" +
                        empIdsToFetch.stream().map(String::valueOf).collect(java.util.stream.Collectors.joining(","))
                        + ") AND (is_active = 1 OR is_active IS NULL) AND (status IS NULL OR UPPER(status) != 'INACTIVE')";
                List<java.util.Map<String, Object>> empRows = jdbcTemplate.queryForList(empSql);
                for (java.util.Map<String, Object> row : empRows) {
                    Number idNum = (Number) row.get("id");
                    String name = (String) row.get("employee_name");
                    if (idNum != null && name != null) {
                        empNameMap.put(idNum.longValue(), name.trim());
                    }
                }
            }

            java.util.Map<Long, java.util.Set<String>> assignToMap = new java.util.HashMap<>();
            for (java.util.Map<String, Object> row : assignRows) {
                Number chkId = (Number) row.get("CHECKLIST_ID");
                if (chkId == null)
                    continue;
                String assignedTo = (String) row.get("ASSIGNED_TO");
                String assignType = (String) row.get("ASSIGN_TYPE");
                String displayName = null;
                if (assignedTo != null && !assignedTo.trim().isEmpty()) {
                    try {
                        Long empId = Long.parseLong(assignedTo.trim());
                        if (empNameMap.containsKey(empId)) {
                            displayName = empNameMap.get(empId);
                        } else {
                            // Employee ID is inactive or not found, skip displaying
                            displayName = null;
                        }
                    } catch (NumberFormatException e) {
                        displayName = assignedTo;
                    }
                }
                if (displayName != null && !displayName.trim().isEmpty()) {
                    String suffix = "";
                    if ("PRIMARY".equalsIgnoreCase(assignType)) {
                        suffix = " (P)";
                    } else if ("SECONDARY".equalsIgnoreCase(assignType)) {
                        suffix = " (S)";
                    } else if ("TERTIARY".equalsIgnoreCase(assignType)) {
                        suffix = " (T)";
                    }
                    assignToMap.computeIfAbsent(chkId.longValue(), k -> new java.util.LinkedHashSet<>())
                            .add(displayName.trim() + suffix);
                }
            }

            // Batch fetch last completed date
            java.util.Map<Long, Date> lastCompletedDateMap = new java.util.HashMap<>();
            try {
                String closedSql = "SELECT CHECKLIST_ID, MAX(CHECKLIST_DATE) as lastDate FROM QMS_CHECKLIST_CLOSED WITH (NOLOCK) "
                        +
                        "WHERE CHECKLIST_ID IN (" + idsPlaceholder + ") GROUP BY CHECKLIST_ID";
                List<java.util.Map<String, Object>> closedRows = jdbcTemplate.queryForList(closedSql);
                for (java.util.Map<String, Object> row : closedRows) {
                    Number chkId = (Number) row.get("CHECKLIST_ID");
                    Object dVal = row.get("lastDate");
                    if (chkId != null && dVal instanceof Date) {
                        lastCompletedDateMap.put(chkId.longValue(), (Date) dVal);
                    } else if (chkId != null && dVal != null) {
                        try {
                            Date parsed = new java.text.SimpleDateFormat("yyyy-MM-dd").parse(dVal.toString());
                            lastCompletedDateMap.put(chkId.longValue(), parsed);
                        } catch (Exception e) {
                            // ignore
                        }
                    }
                }
            } catch (Exception e) {
                // ignore
            }

            // Batch fetch last assignment date
            java.util.Map<Long, Date> lastAssignmentDateMap = new java.util.HashMap<>();
            try {
                String lastAssignSql = "SELECT CHECKLIST_ID, MAX(CHECKLIST_DATE) as lastDate FROM QMS_CHECKLIST_ASSIGNMENT WITH (NOLOCK) "
                        +
                        "WHERE CHECKLIST_ID IN (" + idsPlaceholder + ") GROUP BY CHECKLIST_ID";
                List<java.util.Map<String, Object>> lastAssignRows = jdbcTemplate.queryForList(lastAssignSql);
                for (java.util.Map<String, Object> row : lastAssignRows) {
                    Number chkId = (Number) row.get("CHECKLIST_ID");
                    Object dVal = row.get("lastDate");
                    if (chkId != null && dVal instanceof Date) {
                        lastAssignmentDateMap.put(chkId.longValue(), (Date) dVal);
                    } else if (chkId != null && dVal != null) {
                        try {
                            Date parsed = new java.text.SimpleDateFormat("yyyy-MM-dd").parse(dVal.toString());
                            lastAssignmentDateMap.put(chkId.longValue(), parsed);
                        } catch (Exception e) {
                            // ignore
                        }
                    }
                }
            } catch (Exception e) {
                // ignore
            }

            // Map everything back to checklists
            for (MasterChecklist checklist : checklists) {
                Long id = checklist.getId();
                if (id == null)
                    continue;

                List<String> uploaded = uploadedFilesMap.get(id);
                checklist.setUploadedFiles(AttachmentUtil.toJsonString(uploaded));

                List<String> scanned = scannedFilesMap.get(id);
                checklist.setScannedFiles(AttachmentUtil.toJsonString(scanned));

                Long count = assignmentCountsMap.get(id);
                checklist.setTaskStatus(count != null && count > 0 ? "Assigned" : "Unassigned");

                java.util.Set<String> assignNames = assignToMap.get(id);
                checklist.setAssignTo(
                        assignNames == null || assignNames.isEmpty() ? null : String.join(", ", assignNames));

                checklist.setLastCompletedDate(lastCompletedDateMap.get(id));
                checklist.setLastAssignmentDate(lastAssignmentDateMap.get(id));
            }
        } catch (Exception e) {
            log.error("Error batch populating master checklist files: {}", e.getMessage(), e);
        }
    }

    private void saveMasterChecklistFiles(MasterChecklist checklist) {
        if (checklist == null || checklist.getId() == null) {
            return;
        }
        try {
            String deleteSql = "DELETE FROM QMS_ATTACHMENT_PATH WHERE PAGE_CODE = 'M1210' AND REF_ID = ?";
            jdbcTemplate.update(deleteSql, checklist.getId());

            String uploaded = checklist.getUploadedFiles();
            if (uploaded != null && !uploaded.trim().isEmpty()) {
                List<String> files = AttachmentUtil.parseFileList(uploaded);
                for (String file : files) {
                    String pathOrName = file.trim();
                    if (!pathOrName.isEmpty()) {
                        String fileNameOnly = pathOrName.substring(pathOrName.lastIndexOf('/') + 1);
                        String logicalPath = pathOrName;
                        if (!logicalPath.contains("/")) {
                            logicalPath = AppUtil.BosDocConstants.MASTER_QMS_CHECKLIST_CHECK_LIST_MASTER_PATH + "/"
                                    + pathOrName;
                        }
                        String insertSql = "INSERT INTO QMS_ATTACHMENT_PATH (PAGE_CODE, REF_ID, DOC_TYPE, PATH, FILE_NAME, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) VALUES ('M1210', ?, 'MASTER CHECKLIST', ?, ?, ?, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP)";
                        String user = checklist.getUpdatedBy() != null ? checklist.getUpdatedBy()
                                : (checklist.getCreatedBy() != null ? checklist.getCreatedBy() : "System");
                        jdbcTemplate.update(insertSql, checklist.getId(), logicalPath, fileNameOnly, user, user);
                    }
                }
            }

            String scanned = checklist.getScannedFiles();
            if (scanned != null && !scanned.trim().isEmpty()) {
                List<String> files = AttachmentUtil.parseFileList(scanned);
                for (String file : files) {
                    String pathOrName = file.trim();
                    if (!pathOrName.isEmpty()) {
                        String fileNameOnly = pathOrName.substring(pathOrName.lastIndexOf('/') + 1);
                        String logicalPath = pathOrName;
                        if (!logicalPath.contains("/")) {
                            logicalPath = AppUtil.BosDocConstants.MASTER_QMS_CHECKLIST_CHECK_LIST_MASTER_PATH + "/"
                                    + pathOrName;
                        }
                        String insertSql = "INSERT INTO QMS_ATTACHMENT_PATH (PAGE_CODE, REF_ID, DOC_TYPE, PATH, FILE_NAME, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) VALUES ('M1210', ?, 'MASTER CHECKLIST SCANNED', ?, ?, ?, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP)";
                        String user = checklist.getUpdatedBy() != null ? checklist.getUpdatedBy()
                                : (checklist.getCreatedBy() != null ? checklist.getCreatedBy() : "System");
                        jdbcTemplate.update(insertSql, checklist.getId(), logicalPath, fileNameOnly, user, user);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error saving master checklist files for id {}: {}", checklist.getId(), e.getMessage());
        }
    }

    public Optional<MasterChecklist> getChecklistById(Long id) {
        Optional<MasterChecklist> opt = masterRepo.findById(id);
        opt.ifPresent(this::populateMasterChecklistFiles);
        return opt;
    }

    @Transactional
    public MasterChecklist closeMasterChecklist(Long id) {
        MasterChecklist checklist = masterRepo.findById(id)
                .orElseThrow(
                        () -> new java.util.NoSuchElementException("Master Checklist not found for the given ID."));
        checklist.setStatus("Closed");
        checklist.setUpdatedDate(new Date());
        checklist.setUpdatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
        return masterRepo.save(checklist);
    }

    @Transactional
    public ChecklistAssignment markAssignmentInactive(Long id, String remarks) {
        ChecklistAssignment assignment = resolveAssignment(id);
        if (assignment == null) {
            throw new java.util.NoSuchElementException("Checklist assignment not found for the given ID.");
        }

        assignment.setIsActive(false);
        statusRepo.findByName("Inactive").ifPresent(assignment::setStatus);
        if (remarks != null && !remarks.trim().isEmpty()) {
            assignment.setRemarks(remarks);
        }
        assignment.setUpdatedDate(new Date());
        assignment.setUpdatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());

        ChecklistAssignment saved = assignRepo.save(assignment);

        // Remove from closed tables
        deleteFromFrequencyTable(saved.getChecklist().getId(), saved.getAssignedTo(), saved.getChecklistDate(),
                saved.getChecklist().getFrequency());

        return saved;
    }

    @Transactional
    public ChecklistAssignment reassignAssignment(Long id, String newAssignee, String remarks) {
        ChecklistAssignment assignment = resolveAssignment(id);
        if (assignment == null) {
            throw new java.util.NoSuchElementException("Checklist assignment not found for the given ID.");
        }

        String oldAssignee = assignment.getAssignedTo();
        if (oldAssignee != null && oldAssignee.equalsIgnoreCase(newAssignee)) {
            if (remarks != null && !remarks.trim().isEmpty()) {
                assignment.setRemarks(remarks);
            }
            return assignRepo.save(assignment);
        }

        // Delete old entry from closed tables
        deleteFromFrequencyTable(assignment.getChecklist().getId(), oldAssignee, assignment.getChecklistDate(),
                assignment.getChecklist().getFrequency());

        // Update assignment
        assignment.setAssignedTo(newAssignee);
        if (remarks != null && !remarks.trim().isEmpty()) {
            assignment.setRemarks(remarks);
        }
        assignment.setUpdatedDate(new Date());
        assignment.setUpdatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());

        ChecklistAssignment saved = assignRepo.save(assignment);

        // Save to frequency table for the new assignee
        saveToFrequencyTable(saved);

        // Save log entry in ChecklistAssignmentLog
        try {
            com.autonoma.erp.modules.qms.checklist.entity.ChecklistAssignmentLog logEntry = new com.autonoma.erp.modules.qms.checklist.entity.ChecklistAssignmentLog();
            logEntry.setChecklistId(saved.getChecklist().getId());

            resolveEmployee(oldAssignee)
                    .ifPresent(emp -> logEntry.setOldAssigneeId(emp.getId()));
            resolveEmployee(newAssignee)
                    .ifPresent(emp -> logEntry.setNewAssigneeId(emp.getId()));

            logEntry.setAssignmentType(saved.getAssignType());
            logEntry.setReason(remarks);
            logEntry.setAssignedDate(new Date());
            logEntry.setAssignedBySystem(false);
            logRepo.save(logEntry);
        } catch (Exception e) {
            log.error("Failed to save assignment reassignment log", e);
        }

        return saved;
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true, isolation = org.springframework.transaction.annotation.Isolation.READ_UNCOMMITTED)
    public Page<ChecklistClosed> getClosedChecklistsDirect(
            Long checklistId, String status, String assignedTo, Date fromDate, Date toDate, String category,
            String searchBy, String searchValue, String masterVerifyStatus, String taskType,
            String currentUser, boolean excludeCompleted, boolean excludePending,
            String dualCheck, String considerDate, Date considerDateValue,
            String seqNo, String checkingPoint, String frequency, String stockLink,
            String department, String assignedBy, String assignType, Pageable pageable) {

        Date queryFromDate = fromDate;
        Date queryToDate = toDate;
        if (queryFromDate != null) {
            java.util.Calendar cal = java.util.Calendar.getInstance(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
            cal.setTime(queryFromDate);
            cal.set(java.util.Calendar.HOUR_OF_DAY, 0);
            cal.set(java.util.Calendar.MINUTE, 0);
            cal.set(java.util.Calendar.SECOND, 0);
            cal.set(java.util.Calendar.MILLISECOND, 0);
            queryFromDate = cal.getTime();
        }
        if (queryToDate != null) {
            java.util.Calendar cal = java.util.Calendar.getInstance(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
            cal.setTime(queryToDate);
            cal.set(java.util.Calendar.HOUR_OF_DAY, 23);
            cal.set(java.util.Calendar.MINUTE, 59);
            cal.set(java.util.Calendar.SECOND, 59);
            cal.set(java.util.Calendar.MILLISECOND, 999);
            queryToDate = cal.getTime();
        }
        final Date finalFromDate = queryFromDate;
        final Date finalToDate = queryToDate;

        boolean isUserAdminVar = false;
        Long userEmpIdVar = null;
        String employeeNameVar = null;
        String userEmpCodeVar = null;

        if (currentUser != null && !currentUser.trim().isEmpty()) {
            // Use jdbcTemplate directly to avoid JPA EntityManager session conflicts.
            // Switching TenantContextHolder inside a @Transactional method while JPA holds
            // a
            // connection to the current tenant causes a connection leak. jdbcTemplate uses
            // the
            // raw DataSource directly and does not conflict with the outer JPA transaction.
            try {
                String sql = "SELECT ISNULL(USER_LEVEL, 0) AS USER_LEVEL, EMP_ID " +
                        "FROM AD_USER_CREDENTIAL WITH (NOLOCK) WHERE USER_ID = ?";
                java.util.List<java.util.Map<String, Object>> rows = jdbcTemplate.queryForList(sql, currentUser);
                if (!rows.isEmpty()) {
                    java.util.Map<String, Object> row = rows.get(0);
                    Object lvl = row.get("USER_LEVEL");
                    Object empIdVal = row.get("EMP_ID");
                    if (lvl != null) {
                        int level = ((Number) lvl).intValue();
                        isUserAdminVar = level >= AppUtil.AppConstants.USER_LEVEL_BOS_ADMIN;
                    }
                    if (empIdVal != null) {
                        userEmpIdVar = ((Number) empIdVal).longValue();
                    }
                }
            } catch (Exception ex) {
                log.warn("getClosedChecklistsDirect: failed to look up user '{}': {}", currentUser, ex.getMessage());
            }

            if (userEmpIdVar == null) {
                EmployeeMaster empFallback = employeeMasterRepository.findByEmpCodeOrName(currentUser)
                        .orElse(null);
                if (empFallback != null) {
                    userEmpIdVar = empFallback.getId();
                }
            }
            if (userEmpIdVar != null) {
                EmployeeMaster emp = employeeMasterRepository.findById(userEmpIdVar).orElse(null);
                if (emp != null) {
                    employeeNameVar = emp.getEmployeeName();
                    userEmpCodeVar = emp.getEmpCode();
                }
            }
        }

        final boolean finalIsUserAdmin = isUserAdminVar;
        final Long finalUserEmpId = userEmpIdVar;
        final String finalEmployeeName = employeeNameVar;
        final String finalUserEmpCode = userEmpCodeVar;

        final String finalStatusVal = (status != null && !status.isEmpty()) ? status : "Pending,Unresolved";

        final List<String> reporteeMatchStrings = new ArrayList<>();
        if (("Team".equalsIgnoreCase(taskType) || "Mine".equalsIgnoreCase(taskType)) && finalUserEmpId != null) {
            try {
                String sql = "WITH TeamCTE AS ( " +
                        "    SELECT EMP_ID FROM HR_EMPLOYEE_MANAGER_MAPPING WHERE VERTICAL_HEAD_ID = :empId AND STATUS = 'Active' "
                        +
                        "    UNION ALL " +
                        "    SELECT EMP_ID FROM HR_EMPLOYEE_MANAGER_MAPPING WHERE HOME_MANAGER_ID = :empId AND STATUS = 'Active' "
                        +
                        "    UNION ALL " +
                        "    SELECT EMP_ID FROM HR_EMPLOYEE_MANAGER_MAPPING WHERE BUSINESS_MANAGER_ID = :empId AND STATUS = 'Active' "
                        +
                        ") " +
                        "SELECT DISTINCT EMP_ID FROM TeamCTE";
                List<?> rawList = entityManager.createNativeQuery(sql)
                        .setParameter("empId", finalUserEmpId)
                        .getResultList();
                List<Long> reporteeIds = new ArrayList<>();
                reporteeIds.add(finalUserEmpId);
                for (Object val : rawList) {
                    if (val != null) {
                        reporteeIds.add(((Number) val).longValue());
                    }
                }

                if (!reporteeIds.isEmpty()) {
                    List<Object[]> empDetails = entityManager.createQuery(
                            "SELECT e.id, e.empCode, e.employeeName FROM EmployeeMaster e WHERE e.id IN :ids AND LOWER(e.status.name) = 'active'",
                            Object[].class)
                            .setParameter("ids", reporteeIds)
                            .getResultList();
                    for (Object[] detail : empDetails) {
                        if (detail[0] != null) {
                            reporteeMatchStrings.add(String.valueOf(detail[0]));
                        }
                        if (detail[1] != null && !((String) detail[1]).trim().isEmpty()) {
                            String code = ((String) detail[1]).trim();
                            reporteeMatchStrings.add(code);
                            reporteeMatchStrings.add(code.toUpperCase());
                        }
                        if (detail[2] != null && !((String) detail[2]).trim().isEmpty()) {
                            String name = ((String) detail[2]).trim();
                            reporteeMatchStrings.add(name);
                            reporteeMatchStrings.add(name.toUpperCase());
                        }
                    }
                }
            } catch (Exception e) {
                log.error("Failed to fetch reportees for Team/Mine taskType", e);
            }
        }

        final List<String> matchedEmployeeIdsAndCodes = new ArrayList<>();
        if (searchValue != null && !searchValue.trim().isEmpty()
                && (searchBy == null || "All".equalsIgnoreCase(searchBy) || searchBy.trim().isEmpty())) {
            try {
                String cleanSearch = searchValue.trim();
                String jpql = "SELECT e FROM EmployeeMaster e WHERE LOWER(e.employeeName) LIKE :term OR LOWER(e.empCode) LIKE :term";
                List<EmployeeMaster> matchedEmps = entityManager.createQuery(jpql, EmployeeMaster.class)
                        .setParameter("term", "%" + cleanSearch.toLowerCase() + "%")
                        .getResultList();
                for (EmployeeMaster emp : matchedEmps) {
                    matchedEmployeeIdsAndCodes.add(String.valueOf(emp.getId()));
                    if (emp.getEmpCode() != null) {
                        matchedEmployeeIdsAndCodes.add(emp.getEmpCode());
                    }
                }
            } catch (Exception e) {
                log.error("Failed to lookup matching employees for global search", e);
            }
        }

        org.springframework.data.jpa.domain.Specification<ChecklistClosed> closedSpec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Prevent duplicate rows from multiple LEFT JOINs
            if (query != null && query.getResultType() != Long.class && query.getResultType() != long.class)
                query.distinct(true);

            Join<ChecklistClosed, MasterChecklist> masterJoin = null;

            if (checklistId != null) {
                masterJoin = root.join("checklist");
                predicates.add(cb.equal(masterJoin.get("id"), checklistId));
            }

            if (masterVerifyStatus != null && !masterVerifyStatus.isEmpty()
                    && !"All".equalsIgnoreCase(masterVerifyStatus)) {
                if (masterJoin == null)
                    masterJoin = root.join("checklist");
                if ("Verified".equals(masterVerifyStatus)) {
                    // DB may store verifyStatus as "1" (bit/int) or as "Verified"/"Accepted" string
                    predicates.add(masterJoin.get("verifyStatusObj").get("name").in("VERIFIED", "ACCEPTED", "1"));
                } else {
                    predicates.add(cb.equal(masterJoin.get("verifyStatusObj").get("name"),
                            masterVerifyStatus.trim().toUpperCase()));
                }
            } else {
                if (masterJoin == null)
                    masterJoin = root.join("checklist");
                // DB may store verifyStatus as "1" (bit/int) or as "Verified"/"Accepted" string
                predicates.add(masterJoin.get("verifyStatusObj").get("name").in("VERIFIED", "ACCEPTED", "1"));
            }

            if (dualCheck != null && !dualCheck.isEmpty() && !dualCheck.equals("All")) {
                if (masterJoin == null) {
                    masterJoin = root.join("checklist");
                }
                if ("YES".equalsIgnoreCase(dualCheck)) {
                    Predicate isChecklistAndDual = cb.and(
                            masterJoin.get("category").in("CHECKLIST", "CHECK LIST"),
                            masterJoin.get("dualCheck").in("1", "YES"));
                    Predicate isRenewalAndVerify = cb.and(
                            cb.equal(masterJoin.get("category"), "RENEWAL"),
                            cb.equal(masterJoin.get("verificationRequired"), "YES"));
                    predicates.add(cb.or(isChecklistAndDual, isRenewalAndVerify));
                } else {
                    predicates.add(cb.equal(masterJoin.get("dualCheck"), dualCheck));
                }
            }

            List<Predicate> mePreds = new ArrayList<>();
            if (finalUserEmpId != null) {
                mePreds.add(cb.equal(root.get("assignedTo"), String.valueOf(finalUserEmpId)));
            }
            if (finalUserEmpCode != null && !finalUserEmpCode.trim().isEmpty()) {
                mePreds.add(cb.equal(root.get("assignedTo"), finalUserEmpCode));
            }
            if (finalEmployeeName != null && !finalEmployeeName.trim().isEmpty()) {
                mePreds.add(cb.equal(root.get("assignedTo"), finalEmployeeName));
            }
            if (currentUser != null && !currentUser.trim().isEmpty()) {
                mePreds.add(cb.equal(root.get("assignedTo"), currentUser));
            }

            Predicate assignedToMe = mePreds.isEmpty() ? cb.disjunction()
                    : cb.or(mePreds.toArray(new Predicate[0]));

            if ("Mine".equalsIgnoreCase(taskType) && currentUser != null) {
                predicates.add(assignedToMe);
            } else if ("Team".equalsIgnoreCase(taskType)) {

                if (finalIsUserAdmin) {
                    predicates.add(cb.conjunction());
                } else {
                    if (masterJoin == null) {
                        masterJoin = root.join("checklist");
                    }
                    List<Predicate> teamPreds = new ArrayList<>();
                    if (!reporteeMatchStrings.isEmpty()) {
                        List<String> teamReportees = new ArrayList<>(reporteeMatchStrings);
                        if (!teamReportees.isEmpty()) {
                            teamPreds.add(root.get("assignedTo").in(teamReportees));

                            Join<MasterChecklist, EmployeeMaster> primaryJoin = masterJoin.join("primaryEmployee",
                                    JoinType.LEFT);
                            teamPreds.add(primaryJoin.get("id").as(String.class).in(teamReportees));
                            teamPreds.add(primaryJoin.get("empCode").in(teamReportees));
                            teamPreds.add(primaryJoin.get("employeeName").in(teamReportees));

                            Join<MasterChecklist, EmployeeMaster> secondaryJoin = masterJoin.join("secondaryEmployee",
                                    JoinType.LEFT);
                            teamPreds.add(secondaryJoin.get("id").as(String.class).in(teamReportees));
                            teamPreds.add(secondaryJoin.get("empCode").in(teamReportees));

                            Join<MasterChecklist, EmployeeMaster> tertiaryJoin = masterJoin.join("tertiaryEmployee",
                                    JoinType.LEFT);
                            teamPreds.add(tertiaryJoin.get("id").as(String.class).in(teamReportees));
                            teamPreds.add(tertiaryJoin.get("empCode").in(teamReportees));
                        }
                    }
                    if (!teamPreds.isEmpty()) {
                        predicates.add(cb.or(teamPreds.toArray(new Predicate[0])));
                    } else {
                        predicates.add(cb.disjunction());
                    }
                }
            }

            if (finalStatusVal != null && !finalStatusVal.equals("All") && !finalStatusVal.isEmpty()) {
                Join<ChecklistClosed, StatusMaster> statusJoin = root.join("status", JoinType.LEFT);

                List<String> lowerStatusNames = java.util.Arrays.stream(finalStatusVal.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .map(String::toLowerCase)
                        .distinct()
                        .collect(java.util.stream.Collectors.toList());

                if (!lowerStatusNames.isEmpty()) {
                    predicates.add(cb.lower(statusJoin.get("name")).in(lowerStatusNames));
                }
            }

            if (considerDate != null && considerDate.equalsIgnoreCase("Yes")) {
                jakarta.persistence.criteria.Expression<Date> dateExpr = cb.coalesce(root.get("checklistDate"),
                        root.get("createdDate"));
                if (finalFromDate != null) {
                    predicates.add(cb.greaterThanOrEqualTo(dateExpr, finalFromDate));
                }
                if (finalToDate != null) {
                    predicates.add(cb.lessThanOrEqualTo(dateExpr, finalToDate));
                }
            }

            if (category != null && !category.isEmpty()) {
                if (masterJoin == null)
                    masterJoin = root.join("checklist");
                predicates.add(cb.equal(masterJoin.get("category"), category));
            }

            if (seqNo != null && !seqNo.isEmpty()) {
                if (masterJoin == null)
                    masterJoin = root.join("checklist");
                predicates.add(cb.like(cb.lower(masterJoin.get("seqNo")), "%" + seqNo.toLowerCase() + "%"));
            }

            if (checkingPoint != null && !checkingPoint.isEmpty()) {
                if (masterJoin == null)
                    masterJoin = root.join("checklist");
                predicates.add(
                        cb.like(cb.lower(masterJoin.get("checkingPoint")), "%" + checkingPoint.toLowerCase() + "%"));
            }

            if (frequency != null && !frequency.isEmpty()) {
                if (masterJoin == null)
                    masterJoin = root.join("checklist");
                predicates.add(cb.equal(masterJoin.get("frequency"), frequency));
            }

            if (stockLink != null && !stockLink.isEmpty()) {
                if (masterJoin == null)
                    masterJoin = root.join("checklist");
                predicates.add(cb.equal(masterJoin.get("stockLink"), stockLink));
            }

            if (department != null && !department.isEmpty()) {
                if (masterJoin == null)
                    masterJoin = root.join("checklist");
                Subquery<Long> dSub = query.subquery(Long.class);
                Root<ChecklistDepartment> dRoot = dSub.from(ChecklistDepartment.class);
                Join<ChecklistDepartment, Department> dObj = dRoot.join("department");
                dSub.select(dRoot.get("checklist").get("id"));
                dSub.where(cb.equal(dObj.get("departmentName"), department));
                predicates.add(masterJoin.get("id").in(dSub));
            }

            if (assignedBy != null && !assignedBy.isEmpty()) {
                predicates.add(cb.equal(root.get("assignedBy"), assignedBy));
            }

            if (assignType != null && !assignType.isEmpty()) {
                predicates.add(cb.equal(root.get("assignType"), assignType));
            }

            if (assignedTo != null && !assignedTo.isEmpty()) {
                predicates.add(cb.equal(root.get("assignedTo"), assignedTo));
            }

            if (searchValue != null && !searchValue.trim().isEmpty()) {
                String searchTerm = "%" + searchValue.trim().toLowerCase() + "%";
                if (searchBy != null && !searchBy.trim().isEmpty() && !"All".equalsIgnoreCase(searchBy)) {
                    if (searchBy.equalsIgnoreCase("seqNo") || searchBy.equalsIgnoreCase("checkingPoint")
                            || searchBy.equalsIgnoreCase("category") || searchBy.equalsIgnoreCase("frequency")) {
                        if (masterJoin == null)
                            masterJoin = root.join("checklist");
                        predicates.add(cb.like(cb.lower(masterJoin.get(searchBy)), searchTerm));
                    } else if (searchBy.equalsIgnoreCase("department")) {
                        if (masterJoin == null)
                            masterJoin = root.join("checklist");
                        Subquery<Long> dSub = query.subquery(Long.class);
                        Root<ChecklistDepartment> dRoot = dSub.from(ChecklistDepartment.class);
                        Join<ChecklistDepartment, Department> dObj = dRoot.join("department");
                        dSub.select(dRoot.get("checklist").get("id"));
                        dSub.where(cb.like(cb.lower(dObj.get("departmentName")), searchTerm));
                        predicates.add(masterJoin.get("id").in(dSub));
                    } else {
                        Path<Object> p = root.get(searchBy);
                        Expression<String> expression = String.class.equals(p.getJavaType())
                                ? (Expression<String>) (Expression<?>) p
                                : p.as(String.class);
                        predicates.add(cb.like(cb.lower(expression), searchTerm));
                    }
                } else {
                    List<Predicate> orPredicates = new ArrayList<>();
                    orPredicates.add(cb.like(cb.lower(root.get("assignedTo")), searchTerm));
                    if (!matchedEmployeeIdsAndCodes.isEmpty()) {
                        orPredicates.add(root.get("assignedTo").in(matchedEmployeeIdsAndCodes));
                    }
                    orPredicates.add(cb.like(cb.lower(root.get("assignedBy")), searchTerm));

                    Join<ChecklistClosed, StatusMaster> sJoin = root.join("status", JoinType.LEFT);
                    orPredicates.add(cb.like(cb.lower(sJoin.get("name")), searchTerm));

                    Join<ChecklistClosed, MasterChecklist> cJoin = root.join("checklist", JoinType.LEFT);
                    orPredicates.add(cb.like(cb.lower(cJoin.get("seqNo")), searchTerm));
                    orPredicates.add(cb.like(cb.lower(cJoin.get("checkingPoint")), searchTerm));
                    orPredicates.add(cb.like(cb.lower(cJoin.get("category")), searchTerm));
                    orPredicates.add(cb.like(cb.lower(cJoin.get("frequency")), searchTerm));

                    Subquery<Long> dSub = query.subquery(Long.class);
                    Root<ChecklistDepartment> dRoot = dSub.from(ChecklistDepartment.class);
                    Join<ChecklistDepartment, Department> dObj = dRoot.join("department");
                    dSub.select(dRoot.get("checklist").get("id"));
                    dSub.where(cb.like(cb.lower(dObj.get("departmentName")), searchTerm));
                    orPredicates.add(cJoin.get("id").in(dSub));

                    predicates.add(cb.or(orPredicates.toArray(new Predicate[0])));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        org.springframework.data.domain.Page<ChecklistClosed> closedPage = closedRepo.findAll(closedSpec, pageable);
        if (closedPage != null && closedPage.getContent() != null) {
            List<MasterChecklist> checklistsOnPage = closedPage.getContent().stream()
                    .map(ChecklistClosed::getChecklist)
                    .filter(java.util.Objects::nonNull)
                    .collect(java.util.stream.Collectors.toList());
            populateMasterChecklistFilesBatch(checklistsOnPage);
            populateClosedRejectionDetails(closedPage.getContent());
            populateClosedEmployeeNames(closedPage.getContent());
        }
        return closedPage;
    }

    public List<Map<String, Object>> getRawAssignmentsForChecklist(Long checklistId) {
        String sql = "SELECT id, checklist_id, assigned_to, checklist_date, status_id, verify_status_id, remarks, verified_by, verified_date FROM QMS_CHECKLIST_ASSIGNMENT WITH (NOLOCK) WHERE checklist_id = ? ORDER BY id DESC";
        return jdbcTemplate.queryForList(sql, checklistId);
    }

    public List<Map<String, Object>> getRawClosedForChecklist(Long checklistId) {
        String sql = "SELECT id, checklist_id, assigned_to, checklist_date, status_id, verify_status_id, remarks, verified_by, verified_date FROM QMS_CHECKLIST_CLOSED WITH (NOLOCK) WHERE checklist_id = ? ORDER BY id DESC";
        return jdbcTemplate.queryForList(sql, checklistId);
    }

    @Autowired
    @org.springframework.context.annotation.Lazy
    private com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @Transactional
    public void triggerDynamicChecklists(String pageName, String eventTrigger, Object entity) {
        if (pageName == null || pageName.trim().isEmpty() || eventTrigger == null || entity == null) {
            return;
        }

        try {
            // 1. Resolve page ID from page name or page code
            Integer resolvedPageId = null;
            try {
                resolvedPageId = jdbcTemplate.queryForObject(
                        "SELECT page_id FROM BOS_PAGES WHERE UPPER(TRIM(page_name)) = UPPER(TRIM(?)) OR UPPER(TRIM(page_code)) = UPPER(TRIM(?))",
                        Integer.class,
                        pageName, pageName);
            } catch (Exception e) {
                // If not found, ignore
            }

            if (resolvedPageId == null) {
                return;
            }

            // 2. Query all active and verified MasterChecklists matching page ID and event
            // trigger, plus any global Default triggers
            List<MasterChecklist> checklists = new ArrayList<>();
            List<MasterChecklist> pageChecklists = masterRepo.findByPageIdAndEventTriggerAndIsActiveTrue(resolvedPageId,
                    eventTrigger);
            if (pageChecklists != null) {
                checklists.addAll(pageChecklists);
            }
            List<MasterChecklist> defaultChecklists = masterRepo.findByDefaultEventTriggerAndIsActiveTrue();
            if (defaultChecklists != null) {
                checklists.addAll(defaultChecklists);
            }

            if (checklists.isEmpty()) {
                return;
            }

            for (MasterChecklist checklist : checklists) {
                // Check if checklist is verified
                if (checklist.getVerifyStatus() == null || !"Verified".equalsIgnoreCase(checklist.getVerifyStatus())) {
                    continue;
                }

                // 3. Get matched employee IDs
                Long currentEmpId = resolveEmployeeId(entity);
                List<Long> matchedEmpIds = new ArrayList<>();
                String eventTrig = checklist.getEventTrigger() != null ? checklist.getEventTrigger().trim() : "";

                if ("Default".equalsIgnoreCase(eventTrig)) {
                    matchedEmpIds = getMatchedEmployeeIds(checklist.getDynamicRuleJson(), currentEmpId);
                } else {
                    if (currentEmpId != null) {
                        matchedEmpIds.add(currentEmpId);
                    }
                }

                if (!matchedEmpIds.isEmpty()) {
                    // 4. Calculate target date based on offset
                    Date targetDate = new Date();

                    // 5. Trigger assignment for each matched employee
                    for (Long matchedEmpId : matchedEmpIds) {
                        log.info("Triggering dynamic checklist {} for target date {} for employee {}",
                                checklist.getSeqNo(), targetDate, matchedEmpId);
                        checklistAutoAssignmentService.processAutoAssignmentForEmployee(checklist.getId(), matchedEmpId,
                                targetDate);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error triggering dynamic checklists: " + e.getMessage(), e);
        }
    }

    private Object getFieldValue(Object entity, String fieldName) {
        if (fieldName == null || entity == null)
            return null;
        try {
            String camelFieldName = fieldName;
            if (fieldName.contains("_")) {
                StringBuilder sb = new StringBuilder();
                String[] parts = fieldName.toLowerCase().split("_");
                sb.append(parts[0]);
                for (int i = 1; i < parts.length; i++) {
                    if (!parts[i].isEmpty()) {
                        sb.append(parts[i].substring(0, 1).toUpperCase()).append(parts[i].substring(1));
                    }
                }
                camelFieldName = sb.toString();
            }

            Object val = getFieldValueRaw(entity, camelFieldName);
            if (val == null && !camelFieldName.equals(fieldName)) {
                val = getFieldValueRaw(entity, fieldName);
            }
            return val;
        } catch (Exception e) {
            return null;
        }
    }

    private Object getFieldValueRaw(Object entity, String fieldName) {
        try {
            String getterName = "get" + fieldName.substring(0, 1).toUpperCase() + fieldName.substring(1);
            try {
                java.lang.reflect.Method method = entity.getClass().getMethod(getterName);
                return method.invoke(entity);
            } catch (NoSuchMethodException e) {
                java.lang.reflect.Field field = entity.getClass().getDeclaredField(fieldName);
                field.setAccessible(true);
                return field.get(entity);
            }
        } catch (Exception e) {
            return null;
        }
    }

    private boolean compareValues(Object actual, Object expected) {
        if (actual == null && expected == null)
            return true;
        if (actual == null || expected == null)
            return false;

        String expectedStr = String.valueOf(expected).trim();
        java.time.LocalDate today = java.time.LocalDate.now(java.time.ZoneId.of("Asia/Kolkata"));

        // If the expected value is one of our special date/day/month placeholders, try
        // checking against date fields first
        if ("CURRENT_DAY".equalsIgnoreCase(expectedStr) || "CURRENT_MONTH".equalsIgnoreCase(expectedStr)
                || "CURRENT_DATE".equalsIgnoreCase(expectedStr) || "TODAY".equalsIgnoreCase(expectedStr)) {
            java.time.LocalDate actualDate = null;
            if (actual instanceof java.util.Date) {
                actualDate = ((java.util.Date) actual).toInstant().atZone(java.time.ZoneId.of("Asia/Kolkata"))
                        .toLocalDate();
            } else if (actual instanceof java.time.LocalDate) {
                actualDate = (java.time.LocalDate) actual;
            } else if (actual instanceof java.time.LocalDateTime) {
                actualDate = ((java.time.LocalDateTime) actual).toLocalDate();
            } else {
                try {
                    String strVal = String.valueOf(actual).trim();
                    if (strVal.length() >= 10) {
                        actualDate = java.time.LocalDate.parse(strVal.substring(0, 10));
                    }
                } catch (Exception e) {
                    // Ignore
                }
            }

            if (actualDate != null) {
                if ("CURRENT_DAY".equalsIgnoreCase(expectedStr)) {
                    return actualDate.getDayOfMonth() == today.getDayOfMonth();
                } else if ("CURRENT_MONTH".equalsIgnoreCase(expectedStr)) {
                    return actualDate.getMonthValue() == today.getMonthValue();
                } else {
                    return actualDate.equals(today);
                }
            }
        }

        // Default: Replace placeholder string and compare normally
        if ("CURRENT_DAY".equalsIgnoreCase(expectedStr)) {
            expectedStr = String.valueOf(today.getDayOfMonth());
        } else if ("CURRENT_MONTH".equalsIgnoreCase(expectedStr)) {
            expectedStr = String.valueOf(today.getMonthValue());
        } else if ("CURRENT_DATE".equalsIgnoreCase(expectedStr) || "TODAY".equalsIgnoreCase(expectedStr)) {
            expectedStr = today.toString();
        }

        String actualStr = String.valueOf(actual).trim();

        // Support simple operator checks
        if (expectedStr.startsWith(">=")) {
            try {
                double actNum = Double.parseDouble(actualStr);
                double expNum = Double.parseDouble(expectedStr.substring(2).trim());
                return actNum >= expNum;
            } catch (Exception e) {
                return false;
            }
        } else if (expectedStr.startsWith("<=")) {
            try {
                double actNum = Double.parseDouble(actualStr);
                double expNum = Double.parseDouble(expectedStr.substring(2).trim());
                return actNum <= expNum;
            } catch (Exception e) {
                return false;
            }
        } else if (expectedStr.startsWith(">")) {
            try {
                double actNum = Double.parseDouble(actualStr);
                double expNum = Double.parseDouble(expectedStr.substring(1).trim());
                return actNum > expNum;
            } catch (Exception e) {
                return false;
            }
        } else if (expectedStr.startsWith("<")) {
            try {
                double actNum = Double.parseDouble(actualStr);
                double expNum = Double.parseDouble(expectedStr.substring(1).trim());
                return actNum < expNum;
            } catch (Exception e) {
                return false;
            }
        } else if (expectedStr.startsWith("!=") || expectedStr.startsWith("<>")) {
            String val = expectedStr.substring(expectedStr.startsWith("!=") ? 2 : 2).trim();
            return !actualStr.equalsIgnoreCase(val);
        }

        return actualStr.equalsIgnoreCase(expectedStr);
    }

    private Long resolveEmployeeId(Object entity) {
        if (entity == null)
            return null;
        if (entity instanceof com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster) {
            return ((com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster) entity).getId();
        }
        Object empIdObj = getFieldValue(entity, "employeeId");
        if (empIdObj == null) {
            empIdObj = getFieldValue(entity, "empId");
        }
        if (empIdObj == null && entity.getClass().getSimpleName().contains("Employee")) {
            empIdObj = getFieldValue(entity, "id");
        }
        if (empIdObj != null) {
            try {
                return Long.valueOf(empIdObj.toString());
            } catch (Exception e) {
                // ignore
            }
        }
        return null;
    }

    public boolean evaluateEntityRules(Object entity, String ruleJson) {
        if (ruleJson == null || ruleJson.trim().isEmpty()) {
            return true;
        }
        Long empId = resolveEmployeeId(entity);
        if (empId == null) {
            return false;
        }
        List<Long> matchedIds = getMatchedEmployeeIds(ruleJson, empId);
        return matchedIds.contains(empId);
    }

    private boolean compareValuesWithOperator(Object actual, String operator, Object expected) {
        if (operator == null || operator.trim().isEmpty()) {
            return false;
        }
        String op = operator.trim().toUpperCase();

        if ("IS EMPTY".equals(op)) {
            return actual == null || String.valueOf(actual).trim().isEmpty();
        }
        if ("IS NOT EMPTY".equals(op)) {
            return actual != null && !String.valueOf(actual).trim().isEmpty();
        }

        java.time.LocalDate today = java.time.LocalDate.now(java.time.ZoneId.of("Asia/Kolkata"));
        java.time.LocalDate actualDate = null;
        if (actual != null) {
            if (actual instanceof java.util.Date) {
                actualDate = ((java.util.Date) actual).toInstant().atZone(java.time.ZoneId.of("Asia/Kolkata"))
                        .toLocalDate();
            } else if (actual instanceof java.time.LocalDate) {
                actualDate = (java.time.LocalDate) actual;
            } else if (actual instanceof java.time.LocalDateTime) {
                actualDate = ((java.time.LocalDateTime) actual).toLocalDate();
            } else {
                try {
                    String strVal = String.valueOf(actual).trim();
                    if (strVal.length() >= 10) {
                        actualDate = java.time.LocalDate.parse(strVal.substring(0, 10));
                    }
                } catch (Exception e) {
                    // ignore
                }
            }
        }

        if (actualDate != null) {
            switch (op) {
                case "TODAY":
                    return actualDate.equals(today);
                case "YESTERDAY":
                    return actualDate.equals(today.minusDays(1));
                case "TOMORROW":
                    return actualDate.equals(today.plusDays(1));
                case "CURRENT DAY":
                    return actualDate.getDayOfMonth() == today.getDayOfMonth();
                case "CURRENT MONTH":
                    return actualDate.getMonthValue() == today.getMonthValue();
                case "CURRENT WEEK":
                    return actualDate.get(java.time.temporal.ChronoField.ALIGNED_WEEK_OF_YEAR) == today
                            .get(java.time.temporal.ChronoField.ALIGNED_WEEK_OF_YEAR);
                case "CURRENT YEAR":
                    return actualDate.getYear() == today.getYear();
                case "BIRTHDAY TODAY":
                    return actualDate.getMonthValue() == today.getMonthValue()
                            && actualDate.getDayOfMonth() == today.getDayOfMonth();
                case "ANNIVERSARY TODAY":
                    return actualDate.getMonthValue() == today.getMonthValue()
                            && actualDate.getDayOfMonth() == today.getDayOfMonth();
                case "BEFORE N DAYS":
                    if (expected != null) {
                        try {
                            int n = Integer.parseInt(String.valueOf(expected).trim());
                            return actualDate.equals(today.minusDays(n));
                        } catch (Exception e) {
                            return false;
                        }
                    }
                    return false;
                case "AFTER N DAYS":
                    if (expected != null) {
                        try {
                            int n = Integer.parseInt(String.valueOf(expected).trim());
                            return actualDate.equals(today.plusDays(n));
                        } catch (Exception e) {
                            return false;
                        }
                    }
                    return false;
                case "WITHIN NEXT N DAYS":
                    if (expected != null) {
                        try {
                            int n = Integer.parseInt(String.valueOf(expected).trim());
                            return !actualDate.isBefore(today) && !actualDate.isAfter(today.plusDays(n));
                        } catch (Exception e) {
                            return false;
                        }
                    }
                    return false;
                case "WITHIN PREVIOUS N DAYS":
                    if (expected != null) {
                        try {
                            int n = Integer.parseInt(String.valueOf(expected).trim());
                            return !actualDate.isAfter(today) && !actualDate.isBefore(today.minusDays(n));
                        } catch (Exception e) {
                            return false;
                        }
                    }
                    return false;
            }
        }

        if (actual == null || expected == null) {
            return false;
        }

        String actualStr = String.valueOf(actual).trim();
        String expectedStr = String.valueOf(expected).trim();

        switch (op) {
            case "=":
            case "EQUALS":
                return actualStr.equalsIgnoreCase(expectedStr);
            case "!=":
            case "<>":
            case "NOT EQUAL":
                return !actualStr.equalsIgnoreCase(expectedStr);
            case ">":
                try {
                    return Double.parseDouble(actualStr) > Double.parseDouble(expectedStr);
                } catch (Exception e) {
                    return false;
                }
            case "<":
                try {
                    return Double.parseDouble(actualStr) < Double.parseDouble(expectedStr);
                } catch (Exception e) {
                    return false;
                }
            case ">=":
                try {
                    return Double.parseDouble(actualStr) >= Double.parseDouble(expectedStr);
                } catch (Exception e) {
                    return false;
                }
            case "<=":
                try {
                    return Double.parseDouble(actualStr) <= Double.parseDouble(expectedStr);
                } catch (Exception e) {
                    return false;
                }
            case "CONTAINS":
                return actualStr.toLowerCase().contains(expectedStr.toLowerCase());
            case "STARTS WITH":
                return actualStr.toLowerCase().startsWith(expectedStr.toLowerCase());
            case "ENDS WITH":
                return actualStr.toLowerCase().endsWith(expectedStr.toLowerCase());
            case "IN":
                for (String part : expectedStr.split(",")) {
                    if (actualStr.equalsIgnoreCase(part.trim())) {
                        return true;
                    }
                }
                return false;
            case "NOT IN":
                for (String part : expectedStr.split(",")) {
                    if (actualStr.equalsIgnoreCase(part.trim())) {
                        return false;
                    }
                }
                return true;
            default:
                return actualStr.equalsIgnoreCase(expectedStr);
        }
    }

    public List<Long> getMatchedEmployeeIds(String ruleJson, Long filterEmpId) {
        List<Long> matchedIds = new ArrayList<>();
        if (ruleJson == null || ruleJson.trim().isEmpty()) {
            return matchedIds;
        }
        try {
            Map<String, Object> ruleMap = objectMapper.readValue(ruleJson,
                    new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {
                    });
            Object rulesObj = ruleMap.get("rules");
            if (rulesObj == null) {
                return matchedIds;
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> rules = (Map<String, Object>) rulesObj;
            Object conditionsObj = rules.get("conditions");
            if (conditionsObj == null) {
                return matchedIds;
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> conditions = (List<Map<String, Object>>) conditionsObj;
            if (conditions.isEmpty()) {
                return matchedIds;
            }

            Set<Long> commonEmpIds = null;

            for (Map<String, Object> cond : conditions) {
                String tableName = cond.get("entityCode") != null ? cond.get("entityCode").toString().trim() : "";
                String columnName = cond.get("fieldCode") != null ? cond.get("fieldCode").toString().trim() : "";
                String operator = cond.get("operator") != null ? cond.get("operator").toString().trim() : "";
                Object expectedValue = cond.get("value");

                if (tableName.isEmpty() || columnName.isEmpty()) {
                    return new ArrayList<>();
                }

                List<String> dbColumns = jdbcTemplate.queryForList(
                        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE UPPER(TRIM(TABLE_NAME)) = UPPER(TRIM(?))",
                        String.class, tableName);

                if (dbColumns.isEmpty()) {
                    log.error("Table not found in metadata: " + tableName);
                    return new ArrayList<>();
                }

                boolean colExists = dbColumns.stream().anyMatch(c -> c.equalsIgnoreCase(columnName));
                if (!colExists) {
                    log.error("Column " + columnName + " not found in table " + tableName);
                    return new ArrayList<>();
                }

                String empIdCol = null;
                for (String col : dbColumns) {
                    if (col.equalsIgnoreCase("EMPLOYEE_ID")) {
                        empIdCol = col;
                        break;
                    }
                }
                if (empIdCol == null) {
                    for (String col : dbColumns) {
                        if (col.equalsIgnoreCase("EMP_ID")) {
                            empIdCol = col;
                            break;
                        }
                    }
                }
                if (empIdCol == null) {
                    for (String col : dbColumns) {
                        if (col.equalsIgnoreCase("ID")) {
                            empIdCol = col;
                            break;
                        }
                    }
                }

                if (empIdCol == null) {
                    log.error("No employee reference column found in table " + tableName);
                    return new ArrayList<>();
                }

                String op = operator.trim().toUpperCase();
                String sqlCond = "";
                List<Object> params = new ArrayList<>();

                if ("IS EMPTY".equals(op)) {
                    sqlCond = "(" + columnName + " IS NULL OR TRIM(CAST(" + columnName + " AS VARCHAR(MAX))) = '')";
                } else if ("IS NOT EMPTY".equals(op)) {
                    sqlCond = "(" + columnName + " IS NOT NULL AND TRIM(CAST(" + columnName
                            + " AS VARCHAR(MAX))) <> '')";
                } else if ("TODAY".equals(op)) {
                    sqlCond = "CAST(" + columnName + " AS DATE) = CAST(GETDATE() AS DATE)";
                } else if ("YESTERDAY".equals(op)) {
                    sqlCond = "CAST(" + columnName + " AS DATE) = CAST(DATEADD(day, -1, GETDATE()) AS DATE)";
                } else if ("TOMORROW".equals(op)) {
                    sqlCond = "CAST(" + columnName + " AS DATE) = CAST(DATEADD(day, 1, GETDATE()) AS DATE)";
                } else if ("CURRENT DAY".equals(op) || "CURRENT DAY (DATE)".equals(op)) {
                    sqlCond = "DAY(" + columnName + ") = DAY(GETDATE())";
                } else if ("CURRENT MONTH".equals(op) || "CURRENT MONTH (DATE)".equals(op)) {
                    sqlCond = "MONTH(" + columnName + ") = MONTH(GETDATE())";
                } else if ("CURRENT WEEK".equals(op) || "CURRENT WEEK (DATE)".equals(op)) {
                    sqlCond = "DATEPART(wk, " + columnName + ") = DATEPART(wk, GETDATE()) AND YEAR(" + columnName
                            + ") = YEAR(GETDATE())";
                } else if ("CURRENT YEAR".equals(op) || "CURRENT YEAR (DATE)".equals(op)) {
                    sqlCond = "YEAR(" + columnName + ") = YEAR(GETDATE())";
                } else if ("BIRTHDAY TODAY".equals(op) || "ANNIVERSARY TODAY".equals(op)) {
                    sqlCond = "MONTH(" + columnName + ") = MONTH(GETDATE()) AND DAY(" + columnName
                            + ") = DAY(GETDATE())";
                } else if ("BEFORE N DAYS".equals(op)) {
                    int n = Integer.parseInt(String.valueOf(expectedValue).trim());
                    sqlCond = "CAST(" + columnName + " AS DATE) = CAST(DATEADD(day, ?, GETDATE()) AS DATE)";
                    params.add(-n);
                } else if ("AFTER N DAYS".equals(op)) {
                    int n = Integer.parseInt(String.valueOf(expectedValue).trim());
                    sqlCond = "CAST(" + columnName + " AS DATE) = CAST(DATEADD(day, ?, GETDATE()) AS DATE)";
                    params.add(n);
                } else if ("WITHIN NEXT N DAYS".equals(op)) {
                    int n = Integer.parseInt(String.valueOf(expectedValue).trim());
                    sqlCond = "CAST(" + columnName + " AS DATE) >= CAST(GETDATE() AS DATE) AND CAST(" + columnName
                            + " AS DATE) <= CAST(DATEADD(day, ?, GETDATE()) AS DATE)";
                    params.add(n);
                } else if ("WITHIN PREVIOUS N DAYS".equals(op)) {
                    int n = Integer.parseInt(String.valueOf(expectedValue).trim());
                    sqlCond = "CAST(" + columnName + " AS DATE) <= CAST(GETDATE() AS DATE) AND CAST(" + columnName
                            + " AS DATE) >= CAST(DATEADD(day, ?, GETDATE()) AS DATE)";
                    params.add(-n);
                } else if ("=".equals(op) || "EQUALS".equals(op)) {
                    sqlCond = "UPPER(TRIM(CAST(" + columnName + " AS VARCHAR(MAX)))) = UPPER(TRIM(?))";
                    params.add(String.valueOf(expectedValue));
                } else if ("!=".equals(op) || "<>".equals(op) || "NOT EQUAL".equals(op)) {
                    sqlCond = "UPPER(TRIM(CAST(" + columnName + " AS VARCHAR(MAX)))) <> UPPER(TRIM(?))";
                    params.add(String.valueOf(expectedValue));
                } else if (">".equals(op)) {
                    sqlCond = "CAST(" + columnName + " AS DECIMAL(18,4)) > CAST(? AS DECIMAL(18,4))";
                    params.add(String.valueOf(expectedValue));
                } else if ("<".equals(op)) {
                    sqlCond = "CAST(" + columnName + " AS DECIMAL(18,4)) < CAST(? AS DECIMAL(18,4))";
                    params.add(String.valueOf(expectedValue));
                } else if (">=".equals(op)) {
                    sqlCond = "CAST(" + columnName + " AS DECIMAL(18,4)) >= CAST(? AS DECIMAL(18,4))";
                    params.add(String.valueOf(expectedValue));
                } else if ("<=".equals(op)) {
                    sqlCond = "CAST(" + columnName + " AS DECIMAL(18,4)) <= CAST(? AS DECIMAL(18,4))";
                    params.add(String.valueOf(expectedValue));
                } else if ("CONTAINS".equals(op)) {
                    sqlCond = "UPPER(CAST(" + columnName + " AS VARCHAR(MAX))) LIKE UPPER(?)";
                    params.add("%" + String.valueOf(expectedValue).trim() + "%");
                } else if ("STARTS WITH".equals(op)) {
                    sqlCond = "UPPER(CAST(" + columnName + " AS VARCHAR(MAX))) LIKE UPPER(?)";
                    params.add(String.valueOf(expectedValue).trim() + "%");
                } else if ("ENDS WITH".equals(op)) {
                    sqlCond = "UPPER(CAST(" + columnName + " AS VARCHAR(MAX))) LIKE UPPER(?)";
                    params.add("%" + String.valueOf(expectedValue).trim());
                } else if ("IN".equals(op)) {
                    String[] parts = String.valueOf(expectedValue).split(",");
                    StringBuilder inBuilder = new StringBuilder();
                    for (int i = 0; i < parts.length; i++) {
                        inBuilder.append("UPPER(TRIM(?))");
                        params.add(parts[i].trim());
                        if (i < parts.length - 1) {
                            inBuilder.append(",");
                        }
                    }
                    sqlCond = "UPPER(TRIM(CAST(" + columnName + " AS VARCHAR(MAX)))) IN (" + inBuilder.toString() + ")";
                } else if ("NOT IN".equals(op)) {
                    String[] parts = String.valueOf(expectedValue).split(",");
                    StringBuilder inBuilder = new StringBuilder();
                    for (int i = 0; i < parts.length; i++) {
                        inBuilder.append("UPPER(TRIM(?))");
                        params.add(parts[i].trim());
                        if (i < parts.length - 1) {
                            inBuilder.append(",");
                        }
                    }
                    sqlCond = "UPPER(TRIM(CAST(" + columnName + " AS VARCHAR(MAX)))) NOT IN (" + inBuilder.toString()
                            + ")";
                } else {
                    sqlCond = "UPPER(TRIM(CAST(" + columnName + " AS VARCHAR(MAX)))) = UPPER(TRIM(?))";
                    params.add(String.valueOf(expectedValue));
                }

                String sql = "SELECT DISTINCT " + empIdCol + " FROM " + tableName + " WHERE " + sqlCond;
                if (filterEmpId != null) {
                    sql += " AND " + empIdCol + " = ?";
                    params.add(filterEmpId);
                }

                List<Long> currentCondEmpIds = jdbcTemplate.queryForList(sql, Long.class, params.toArray());
                Set<Long> currentSet = new HashSet<>(currentCondEmpIds);

                if (commonEmpIds == null) {
                    commonEmpIds = currentSet;
                } else {
                    commonEmpIds.retainAll(currentSet);
                }

                if (commonEmpIds.isEmpty()) {
                    break;
                }
            }

            if (commonEmpIds != null) {
                matchedIds.addAll(commonEmpIds);
            }
        } catch (Exception e) {
            log.error("Error finding matched employee IDs: " + e.getMessage(), e);
        }
        return matchedIds;
    }

    // --- Checklist Acknowledgement Workflow Services ---

    @org.springframework.transaction.annotation.Transactional
    public com.autonoma.erp.modules.qms.checklist.entity.ChecklistAcknowledgement createReassignmentAcknowledgement(
            Long checklistId, Long oldAssigneeId, Long newAssigneeId, String memberType, String reason,
            String currentUserId) {

        if (checklistId == null || newAssigneeId == null || memberType == null) {
            throw new IllegalArgumentException("Checklist ID, New Assignee, and Member Type are required.");
        }

        String normMemberType = memberType.trim().toUpperCase();

        // 1. Find existing PENDING acknowledgement requests for this checklist and
        // member type and mark as INACTIVE
        List<com.autonoma.erp.modules.qms.checklist.entity.ChecklistAcknowledgement> existingPending = ackRepo
                .findByChecklistIdAndMemberTypeAndAckStatus(checklistId, normMemberType, "PENDING");

        for (com.autonoma.erp.modules.qms.checklist.entity.ChecklistAcknowledgement prev : existingPending) {
            prev.setAckStatus("INACTIVE");
            prev.setUpdatedBy(currentUserId != null ? currentUserId : "SYSTEM");
            prev.setUpdatedDate(new Date());
            ackRepo.save(prev);

            // Notify previous pending employee that the reassignment has been closed and
            // moved
            try {
                if (prev.getNewAssigneeId() != null) {
                    EmployeeMaster prevEmp = employeeMasterRepository.findById(prev.getNewAssigneeId()).orElse(null);
                    MasterChecklist chk = masterRepo.findById(checklistId).orElse(null);
                    String chkName = chk != null ? (chk.getSeqNo() + " - " + chk.getCheckingPoint())
                            : ("ID #" + checklistId);
                    if (prevEmp != null) {
                        notificationService.notifyUserAboutLoan(prevEmp, "Checklist Reassignment Inactivated",
                                "Reassignment for Checklist " + chkName
                                        + " has been closed and moved to another employee.",
                                "/qms/checklist/acknowledgement");
                    }
                }
            } catch (Exception ex) {
                log.warn("Could not notify previous pending employee on inactivation: {}", ex.getMessage());
            }
        }

        // 2. Create new PENDING acknowledgement record
        com.autonoma.erp.modules.qms.checklist.entity.ChecklistAcknowledgement ack = new com.autonoma.erp.modules.qms.checklist.entity.ChecklistAcknowledgement();
        ack.setChecklistId(checklistId);
        ack.setOldAssigneeId(oldAssigneeId);
        ack.setNewAssigneeId(newAssigneeId);
        ack.setMemberType(normMemberType);
        ack.setReassignedBy(currentUserId != null ? currentUserId : "SYSTEM");
        ack.setReassignedDate(new Date());
        ack.setReassignmentReason(reason);
        ack.setAckStatus("PENDING");
        ack.setCreatedBy(currentUserId != null ? currentUserId : "SYSTEM");
        ack.setCreatedDate(new Date());

        com.autonoma.erp.modules.qms.checklist.entity.ChecklistAcknowledgement savedAck = ackRepo.save(ack);

        // 3. Notify new assignee
        try {
            EmployeeMaster newEmp = employeeMasterRepository.findById(newAssigneeId).orElse(null);
            MasterChecklist chk = masterRepo.findById(checklistId).orElse(null);
            String chkName = chk != null ? (chk.getSeqNo() + " - " + chk.getCheckingPoint()) : ("ID #" + checklistId);
            if (newEmp != null) {
                notificationService.notifyUserAboutLoan(newEmp, "New Checklist Reassignment Received",
                        "You have been reassigned Checklist " + chkName + " (" + normMemberType + ") by "
                                + currentUserId + ". Please navigate to Checklist Acknowledgement to Accept or Reject.",
                        "/qms/checklist/acknowledgement");
            }
        } catch (Exception ex) {
            log.warn("Could not notify new assignee on reassignment creation: {}", ex.getMessage());
        }

        return savedAck;
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<com.autonoma.erp.modules.qms.checklist.entity.ChecklistAcknowledgement> getPendingAcknowledgementsForUser(
            String currentUserId) {
        Long empId = resolveCurrentEmployeeId(currentUserId);
        if (empId == null)
            return new ArrayList<>();
        return ackRepo.findByNewAssigneeIdAndAckStatusOrderByIdDesc(empId, "PENDING");
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<com.autonoma.erp.modules.qms.checklist.entity.ChecklistAcknowledgement> getAllAcknowledgementsForUser(
            String currentUserId) {
        Long empId = resolveCurrentEmployeeId(currentUserId);
        if (empId == null)
            return new ArrayList<>();
        return ackRepo.findAllByNewAssigneeId(empId);
    }

    @org.springframework.transaction.annotation.Transactional
    public com.autonoma.erp.modules.qms.checklist.entity.ChecklistAcknowledgement respondToAcknowledgement(
            Long ackId, String action, String rejectionReason, String currentUserId) {

        com.autonoma.erp.modules.qms.checklist.entity.ChecklistAcknowledgement ack = ackRepo.findById(ackId)
                .orElseThrow(() -> new IllegalArgumentException("Acknowledgement record not found with ID: " + ackId));

        if (!"PENDING".equalsIgnoreCase(ack.getAckStatus())) {
            throw new IllegalStateException("This acknowledgement request has already been processed or inactivated.");
        }

        String normAction = action != null ? action.trim().toUpperCase() : "";
        if (!"ACCEPTED".equals(normAction) && !"REJECTED".equals(normAction)) {
            throw new IllegalArgumentException("Invalid action. Must be ACCEPTED or REJECTED.");
        }

        ack.setAckStatus(normAction);
        ack.setAcknowledgedDate(new Date());
        ack.setUpdatedBy(currentUserId != null ? currentUserId : "SYSTEM");
        ack.setUpdatedDate(new Date());

        MasterChecklist checklist = masterRepo.findById(ack.getChecklistId()).orElse(null);
        String chkName = checklist != null ? (checklist.getSeqNo() + " - " + checklist.getCheckingPoint())
                : ("ID #" + ack.getChecklistId());
        EmployeeMaster newEmp = employeeMasterRepository.findById(ack.getNewAssigneeId()).orElse(null);
        String empName = newEmp != null ? newEmp.getEmployeeName() : ("Emp #" + ack.getNewAssigneeId());

        if ("REJECTED".equals(normAction)) {
            if (rejectionReason == null || rejectionReason.trim().length() < 5) {
                throw new IllegalArgumentException("Rejection reason comments are mandatory (minimum 5 characters).");
            }
            ack.setRejectionReason(rejectionReason.trim());

            // Notify Reassigner & Checklist Master Administrators (QM1110 page access)
            try {
                String notifMsg = "HIGH PRIORITY: " + empName + " has REJECTED the reassignment for Checklist "
                        + chkName + ". Reason: \"" + rejectionReason.trim() + "\"";
                notifyChecklistMasterAdmins(notifMsg);
            } catch (Exception ex) {
                log.warn("Failed to dispatch rejection notification to admins: {}", ex.getMessage());
            }

        } else if ("ACCEPTED".equals(normAction)) {
            // Update MasterChecklist member binding permanently
            if (checklist != null && newEmp != null) {
                String memberType = ack.getMemberType() != null ? ack.getMemberType().toUpperCase() : "PRIMARY";
                if ("PRIMARY".equals(memberType)) {
                    checklist.setPrimaryEmployee(newEmp);
                } else if ("SECONDARY".equals(memberType)) {
                    checklist.setSecondaryEmployee(newEmp);
                } else if ("TERTIARY".equals(memberType)) {
                    checklist.setTertiaryEmployee(newEmp);
                }
                masterRepo.save(checklist);
            }

            // Notify Reassigner
            try {
                if (ack.getReassignedBy() != null) {
                    com.autonoma.erp.model.admin.UserCredential userCred = userRepository
                            .findByUserId(ack.getReassignedBy()).orElse(null);
                    if (userCred != null && userCred.getEmpId() != null) {
                        EmployeeMaster reassignerEmp = employeeMasterRepository.findById(userCred.getEmpId())
                                .orElse(null);
                        if (reassignerEmp != null) {
                            notificationService.notifyUserAboutLoan(reassignerEmp, "Checklist Reassignment Accepted",
                                    empName + " has ACCEPTED the reassignment for Checklist " + chkName + " ("
                                            + ack.getMemberType() + ").",
                                    "/master/qms/checklist/master");
                        }
                    }
                }
            } catch (Exception ex) {
                log.warn("Failed to notify reassigner on acceptance: {}", ex.getMessage());
            }
        }

        return ackRepo.save(ack);
    }

    private Long resolveCurrentEmployeeId(String currentUserId) {
        if (currentUserId == null || currentUserId.trim().isEmpty())
            return null;
        com.autonoma.erp.model.admin.UserCredential userCred = userRepository.findByUserId(currentUserId).orElse(null);
        if (userCred != null && userCred.getEmpId() != null) {
            return userCred.getEmpId();
        }
        EmployeeMaster emp = employeeMasterRepository.findByEmpCodeOrName(currentUserId).orElse(null);
        return emp != null ? emp.getId() : null;
    }

    private void notifyChecklistMasterAdmins(String message) {
        try {
            com.autonoma.erp.model.admin.BosPage page = bosPageRepository.findByPageCode("QM1110").orElse(null);
            if (page != null) {
                List<com.autonoma.erp.model.admin.BosUserPageAuth> auths = bosUserPageAuthRepository.findAll();
                if (auths != null) {
                    for (com.autonoma.erp.model.admin.BosUserPageAuth auth : auths) {
                        if (page.getPageId().equals(auth.getPageId()) && Integer.valueOf(1).equals(auth.getEnable())
                                && auth.getUserId() != null) {
                            com.autonoma.erp.model.admin.UserCredential cred = userRepository
                                    .findByUserId(auth.getUserId()).orElse(null);
                            if (cred != null && cred.getEmpId() != null) {
                                EmployeeMaster adminEmp = employeeMasterRepository.findById(cred.getEmpId())
                                        .orElse(null);
                                if (adminEmp != null) {
                                    notificationService.notifyUserAboutLoan(adminEmp, "Checklist Reassignment Rejected",
                                            message, "/master/qms/checklist/master");
                                }
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to notify Checklist Master Administrators: {}", e.getMessage());
        }
    }
}
