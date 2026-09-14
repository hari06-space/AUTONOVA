package com.autonoma.erp.modules.hr.employee.service;

import com.autonoma.erp.repository.admin.UserRepository;
import com.autonoma.erp.util.SecurityUtils;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeActivity;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeAsset;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeContact;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeDependent;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeEducation;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeEmergencyContact;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeExperience;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeJobProfile;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeKyc;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeKycDocument;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeOfficeMailCredentials;
import com.autonoma.erp.modules.hr.employee.entity.EmployeePassport;
import com.autonoma.erp.modules.hr.employee.entity.EmployeePersonalDetail;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeSelfAssessment;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeActivityRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeAssetRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeContactRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeDependentRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeEducationRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeEmergencyContactRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeExperienceRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeJobProfileRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeKycDocumentRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeKycRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeManagerMappingRepository;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeManagerMapping;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeePassportRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeePersonalDetailRepository;
import com.autonoma.erp.modules.qms.checklist.service.ChecklistAutoAssignmentService;
import com.autonoma.erp.modules.induction.entity.HrAttachmentPath;
import com.autonoma.erp.modules.induction.repository.HrAttachmentPathRepository;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeSalaryComponent;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeSalaryComponentRepository;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeTypeMaster;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeTypeMasterRepository;
import com.autonoma.erp.model.payroll.HrPayrollComponent;
import com.autonoma.erp.repository.payroll.HrPayrollComponentRepository;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeSalaryComponentLog;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeSalaryComponentLogRepository;
import com.autonoma.erp.repository.payroll.HrPayrollStructureRepository;
import com.autonoma.erp.repository.payroll.HrPayrollStructureDetailRepository;
import com.autonoma.erp.model.payroll.HrPayrollStructure;
import com.autonoma.erp.model.payroll.HrPayrollStructureDetail;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;
import jakarta.persistence.FlushModeType;
import jakarta.persistence.PersistenceContext;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class EmployeeMasterService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(EmployeeMasterService.class);

    @Autowired
    private EmployeeMasterRepository employeeRepo;
    @Autowired
    private HrAttachmentPathRepository attachmentRepo;
    @Autowired
    private EmployeePersonalDetailRepository personalRepo;
    @Autowired
    private EmployeeContactRepository contactRepo;
    @Autowired
    private EmployeeJobProfileRepository jobProfileRepo;
    @Autowired
    private EmployeeEducationRepository educationRepo;
    @Autowired
    private EmployeeExperienceRepository experienceRepo;
    @Autowired
    private EmployeeEmergencyContactRepository emergencyContactRepo;
    @Autowired
    private EmployeePassportRepository passportRepo;
    @Autowired
    private EmployeeDependentRepository dependentRepo;
    @Autowired
    private EmployeeAssetRepository assetRepo;
    @Autowired
    private EmployeeKycRepository kycRepo;
    @Autowired
    private EmployeeKycDocumentRepository kycDocumentRepo;
    @Autowired
    private EmployeeActivityRepository activityRepo;
    @Autowired
    private EmployeeManagerMappingRepository managerMappingRepo;
    @Autowired
    private EmployeeSalaryComponentRepository employeeSalaryComponentRepo;
    @Autowired
    private HrPayrollComponentRepository hrPayrollComponentRepo;
    @Autowired
    private HrPayrollStructureRepository hrPayrollStructureRepo;
    @Autowired
    private HrPayrollStructureDetailRepository hrPayrollStructureDetailRepo;
    @Autowired
    private EmployeeSalaryComponentLogRepository employeeSalaryComponentLogRepo;
    @Autowired
    private com.autonoma.erp.repository.admin.UserRepository userRepo;
    @Autowired
    private com.autonoma.erp.modules.hra.recruitment.service.AtsStatusResolver statusResolver;
    @Autowired
    private com.autonoma.erp.modules.hr.employee.repository.EmployeeTypeMasterRepository employeeTypeRepo;
    @Autowired
    private com.autonoma.erp.modules.master.geography.repository.CountryMasterRepository countryRepo;
    @Autowired
    private com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository statusMasterRepo;
    @PersistenceContext
    private EntityManager entityManager;

    public com.autonoma.erp.repository.admin.UserRepository getUserRepo() {
        return userRepo;
    }

    @Autowired
    @org.springframework.context.annotation.Lazy
    private ChecklistAutoAssignmentService checklistAutoAssignmentService;

    // ======================== EMPLOYEE MASTER CRUD ========================

    public List<EmployeeMaster> getAllEmployees() {
        List<EmployeeMaster> all = employeeRepo.findAll();
        List<EmployeeMaster> filtered = new ArrayList<>();
        for (EmployeeMaster emp : all) {
            if (emp.getEmpCode() != null && (emp.getFromWhere() == null || !"ATS".equalsIgnoreCase(emp.getFromWhere()))) {
                filtered.add(emp);
            }
        }
        populateTransientMailFields(filtered);
        return filtered;
    }

    private String getManagerNameWithLogging(Long managerId, Long empId, String managerType,
            Map<Long, String> employeeNameMap) {
        if (managerId == null || managerId == 0) {
            return "-";
        }
        String name = employeeNameMap.get(managerId);
        if (name == null) {
            org.slf4j.LoggerFactory.getLogger(EmployeeMasterService.class)
                    .warn("Missing mapped manager record in database: {} ID {} for employee ID {}", managerType,
                            managerId, empId);
            return "-";
        }
        return name;
    }

    public List<com.autonoma.erp.modules.hr.employee.dto.EmployeeMasterListDto> getAllEmployeesProjected() {
        List<com.autonoma.erp.modules.hr.employee.dto.EmployeeMasterListDto> all = employeeRepo.findAllProjected();
        List<com.autonoma.erp.modules.hr.employee.dto.EmployeeMasterListDto> filtered = new ArrayList<>();

        List<com.autonoma.erp.model.admin.UserCredential> users = userRepo.findAll();
        java.util.Map<Long, String> empUserMap = new java.util.HashMap<>();
        for (com.autonoma.erp.model.admin.UserCredential u : users) {
            if (u.getEmpId() != null) {
                empUserMap.put(u.getEmpId(), u.getUserId());
            }
        }

        List<EmployeeManagerMapping> mappings = managerMappingRepo.findAll();
        Map<Long, EmployeeManagerMapping> mappingMap = new HashMap<>();
        for (EmployeeManagerMapping m : mappings) {
            if (m.getEmpId() != null) {
                mappingMap.put(m.getEmpId(), m);
            }
        }

        Map<Long, String> employeeNameMap = new HashMap<>();
        for (Object[] row : employeeRepo.findAllIdAndNames()) {
            Long id = (Long) row[0];
            String firstName = (String) row[1];
            String lastName = (String) row[2];
            String empName = (String) row[3];
            String fullName = ((firstName != null ? firstName : "") + " " + (lastName != null ? lastName : "")).trim();
            if (fullName.isEmpty()) {
                fullName = empName != null ? empName : "-";
            }
            employeeNameMap.put(id, fullName);
        }

        List<EmployeeJobProfile> jobProfiles = jobProfileRepo.findAll();
        Map<Long, EmployeeJobProfile> jobProfileMap = new HashMap<>();
        for (EmployeeJobProfile jp : jobProfiles) {
            if (jp.getEmployeeId() != null) {
                jobProfileMap.put(jp.getEmployeeId(), jp);
            }
        }

        for (com.autonoma.erp.modules.hr.employee.dto.EmployeeMasterListDto emp : all) {
            if (emp.getEmpCode() != null && (emp.getFromWhere() == null || !"ATS".equalsIgnoreCase(emp.getFromWhere()))) {
                emp.setUserId(empUserMap.get(emp.getId()));

                EmployeeJobProfile jp = jobProfileMap.get(emp.getId());
                if (jp != null) {
                    emp.setLeaveAllowed(jp.getLeaveAllowed());
                    emp.setOdAllowed(jp.getOdAllowed());
                    emp.setPermissionRequest(jp.getPermissionRequest());
                }

                EmployeeManagerMapping m = mappingMap.get(emp.getId());
                if (m != null) {
                    emp.setHomeManagerName(getManagerNameWithLogging(m.getHomeManagerId(), emp.getId(), "Home Manager",
                            employeeNameMap));
                    emp.setBusinessManagerName(getManagerNameWithLogging(m.getBusinessManagerId(), emp.getId(),
                            "Business Manager", employeeNameMap));
                    emp.setVerticalHeadName(getManagerNameWithLogging(m.getVerticalHeadId(), emp.getId(),
                            "Vertical Head", employeeNameMap));
                    emp.setHrName(getManagerNameWithLogging(m.getHrId(), emp.getId(), "HR Manager", employeeNameMap));
                } else {
                    emp.setHomeManagerName("-");
                    emp.setBusinessManagerName("-");
                    emp.setVerticalHeadName("-");
                    emp.setHrName("-");
                }

                filtered.add(emp);
            }
        }
        return filtered;
    }

    public List<EmployeeMaster> getActiveEmployees() {
        List<EmployeeMaster> active = employeeRepo.findByStatus("Active");
        List<EmployeeMaster> filtered = new ArrayList<>();
        for (EmployeeMaster emp : active) {
            if (emp.getEmpCode() != null && (emp.getFromWhere() == null || !"ATS".equalsIgnoreCase(emp.getFromWhere()))) {
                filtered.add(emp);
            }
        }
        populateTransientMailFields(filtered);
        return filtered;
    }

    public List<EmployeeMaster> getActiveEmployeesWithSalary() {
        List<EmployeeMaster> active = getActiveEmployees();
        List<Long> empIdsWithSalary = employeeSalaryComponentRepo.findEmployeeIdsWithSalary();
        List<EmployeeMaster> filtered = new ArrayList<>();
        for (EmployeeMaster emp : active) {
            if (empIdsWithSalary.contains(emp.getId())) {
                filtered.add(emp);
            }
        }
        return filtered;
    }

    public List<EmployeeMaster> getActiveEligibleManagers(Long empId, int empLevelVal) {
        return employeeRepo.findActiveEligibleManagers(empId, empLevelVal);
    }

    public EmployeeMaster getEmployeeById(Long id) {
        EmployeeMaster emp = employeeRepo.findById(id).orElse(null);
        populateTransientMailFields(emp);
        populateTransientFileInfoFields(emp);
        populateManagerFieldsFromMapping(emp);
        return emp;
    }

    /**
     * Returns the employee with ALL sub-resource data in a single Map.
     * This powers the full form load on the frontend.
     */
    public Map<String, Object> getEmployeeFull(Long id) {
        EmployeeMaster emp = employeeRepo.findById(id).orElse(null);
        if (emp == null)
            return null;
        populateTransientMailFields(emp);
        populateTransientFileInfoFields(emp);
        populateManagerFieldsFromMapping(emp);

        Map<String, Object> result = new HashMap<>();
        result.put("employee", emp);
        result.put("personal", personalRepo.findFirstByEmployeeId(id).orElse(null));
        result.put("contact", contactRepo.findByEmployeeId(id).orElse(null));
        result.put("jobProfile", jobProfileRepo.findByEmployeeId(id).orElse(null));
        result.put("education", educationRepo.findByEmployeeId(id));
        result.put("experience", experienceRepo.findByEmployeeId(id));
        result.put("emergencyContacts", emergencyContactRepo.findByEmployeeId(id));
        result.put("passport", passportRepo.findByEmployeeId(id).orElse(null));
        result.put("dependents", dependentRepo.findByEmployeeId(id));
        result.put("assets", assetRepo.findByEmployeeId(id));
        result.put("kyc", kycRepo.findByEmployeeId(id).orElse(null));
        result.put("kycDocuments", kycDocumentRepo.findByEmployeeId(id));
        result.put("activities", activityRepo.findByEmployeeId(id));
        return result;
    }

    public String getNextEmpCode() {
        return employeeRepo.findFirstByEmpCodeStartingWithOrderByEmpCodeDesc("EMP-")
                .map(latest -> incrementSequence(latest.getEmpCode(), "EMP-"))
                .orElse("EMP-001");
    }

    @Transactional
    public EmployeeMaster createEmployee(EmployeeMaster employee) {
        if (employee.getCreatedAt() == null) {
            employee.setCreatedAt(new Date());
        }

        if (employee.getCreatedBy() == null) {
            employee.setCreatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
        }

        if (employee.getFromWhere() == null) {
            employee.setFromWhere("EMPLOYEE");
        }

        validateAbilityInductionConstraint(employee);
        sanitizeEmployee(employee);

        // ── empCode derivation must happen AFTER sanitizeEmployee() ──────────────────
        // Background: getEmpCode() has a custom getter that returns oldEmpCode when
        // oldEmpCode is set. This means any null-check on getEmpCode() inside
        // sanitizeEmployee() would incorrectly pass even when the private field
        // this.empCode is "". We therefore derive empCode here, after sanitization,
        // reading the raw fields directly.
        String userOldEmpCode = (employee.getOldEmpCode() != null) ? employee.getOldEmpCode().trim() : "";

        // Read the raw private empCode field via its setter-paired state
        // (setEmpCode writes to the private field; getEmpCode may return oldEmpCode)
        // We compare directly so we can detect an empty/missing empCode DB value.
        String rawEmpCode = "";
        try {
            // Reflect to read the actual private field, bypassing the custom getter
            java.lang.reflect.Field f = employee.getClass().getDeclaredField("empCode");
            f.setAccessible(true);
            Object v = f.get(employee);
            rawEmpCode = (v != null) ? v.toString().trim() : "";
        } catch (Exception ignored) {
        }

        if (rawEmpCode.isEmpty()) {
            if (!userOldEmpCode.isEmpty()) {
                // Mirror the human-readable HR code into the system empCode column
                employee.setEmpCode(userOldEmpCode);
            } else {
                // Fallback: auto-generate a sequential EMP-XXX code
                String nextCode = employeeRepo.findFirstByEmpCodeStartingWithOrderByEmpCodeDesc("EMP-")
                        .map(latest -> incrementSequence(latest.getEmpCode(), "EMP-"))
                        .orElse("EMP-001");
                employee.setEmpCode(nextCode);
            }
        }

        // Ensure oldEmpCode is populated if blank
        if (userOldEmpCode.isEmpty()) {
            String nextOldCode = employeeRepo.findFirstByOldEmpCodeStartingWithOrderByOldEmpCodeDesc("EMP-")
                    .map(latest -> incrementSequence(latest.getOldEmpCode(), "EMP-"))
                    .orElse("EMP-001");
            employee.setOldEmpCode(nextOldCode);
        }

        // Final uniqueness guard on the private empCode field
        try {
            java.lang.reflect.Field f = employee.getClass().getDeclaredField("empCode");
            f.setAccessible(true);
            String finalCode = (f.get(employee) != null) ? f.get(employee).toString().trim() : "";
            if (finalCode.isEmpty()) {
                throw new RuntimeException("Employee Code cannot be empty. Please provide an Employee Code.");
            }
            if (employeeRepo.existsByEmpCode(finalCode)) {
                throw new RuntimeException("Employee Code '" + finalCode + "' already exists!");
            }
        } catch (RuntimeException re) {
            throw re;
        } catch (Exception ignored) {
        }
        // ─────────────────────────────────────────────────────────────────────────────

        EmployeeMaster saved = employeeRepo.save(employee);
        saveAbilityAttachments(saved);

        // Save/update the office email & password in the job profile
        if (employee.getOfficeMail() != null || employee.getOfficeMailPassword() != null) {
            EmployeeJobProfile jp = new EmployeeJobProfile();
            jp.setEmployeeId(saved.getId());
            jp.setOfficeEmail(employee.getOfficeMail());
            jp.setOfficialPassword(employee.getOfficeMailPassword());
            String currentUserId = null;
            try {
                currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
            } catch (Exception ignored) {}
            jp.setCreatedBy((currentUserId != null && !currentUserId.trim().isEmpty()) ? currentUserId : "Admin");
            jp.setCreatedDate(new Date());
            jobProfileRepo.save(jp);
        }

        populateTransientFileInfoFields(saved);
        saveOrUpdateManagerMapping(saved);
        processExitStatusAndUserSuspension(saved);
        return saved;
    }

    @Transactional
    public EmployeeMaster updateEmployee(Long id, EmployeeMaster details) {
        if (entityManager != null) {
            entityManager.setFlushMode(FlushModeType.COMMIT);
        }
        if (details.getEmpCode() != null && !details.getEmpCode().trim().isEmpty()) {
            if (employeeRepo.existsByEmpCodeAndIdNot(details.getEmpCode(), id)) {
                throw new RuntimeException("Employee Code already exists!");
            }
        }

        EmployeeMaster emp = employeeRepo.findById(id).orElse(null);
        if (emp == null)
            return null;

        // (Note: employeeTypeId can be updated by the user)
        details.setOldEmpCode(emp.getOldEmpCode());

        // Force load ability and populate transient file fields from central
        // HR_ATTACHMENT_PATH table
        try {
            org.hibernate.Hibernate.initialize(emp.getAbility());
        } catch (Exception e) {
            System.err.println("[updateEmployee] Could not initialize ability proxy: " + e.getMessage());
        }
        populateTransientFileInfoFields(emp);

        // Copy all fields from details, preserving id and audit trail
        if (details.getCreatedBy() != null)
            emp.setCreatedBy(details.getCreatedBy());
        if (details.getCreatedAt() != null)
            emp.setCreatedAt(details.getCreatedAt());

        emp.setUpdatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
        emp.setUpdatedAt(new Date());

        copyFields(details, emp);

        validateAbilityInductionConstraint(emp);
        sanitizeEmployee(emp);
        EmployeeMaster saved = employeeRepo.save(emp);
        saveAbilityAttachments(saved);

        // Save/update the office email & password in the job profile
        if (details.getOfficeMail() != null || details.getOfficeMailPassword() != null) {
            EmployeeJobProfile jp = jobProfileRepo.findByEmployeeId(id).orElse(new EmployeeJobProfile());
            if (jp.getId() == null) {
                jp.setEmployeeId(id);
                jp.setCreatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
                jp.setCreatedDate(new Date());
            } else {
                jp.setUpdatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
                jp.setUpdatedDate(new Date());
            }
            if (details.getOfficeMail() != null)
                jp.setOfficeEmail(details.getOfficeMail());
            if (details.getOfficeMailPassword() != null)
                jp.setOfficialPassword(details.getOfficeMailPassword());
            jobProfileRepo.save(jp);
        }

        try {
            checklistAutoAssignmentService.runReassignmentCheckForOpenAssignments();
        } catch (Exception e) {
            System.err.println("Failed to trigger checklist auto-reassignment on employee update: " + e.getMessage());
        }

        // Populate transient mail fields directly from the incoming request
        // (avoids a DB query that would trigger another Hibernate auto-flush on the
        // dirty session)
        if (details.getOfficeMail() != null)
            saved.setOfficeMail(details.getOfficeMail());
        if (details.getOfficeMailPassword() != null)
            saved.setOfficeMailPassword(details.getOfficeMailPassword());
        populateTransientFileInfoFields(saved);
        saveOrUpdateManagerMapping(saved);
        processExitStatusAndUserSuspension(saved);
        return saved;
    }

    private void processExitStatusAndUserSuspension(EmployeeMaster emp) {
        if (emp == null || emp.getExitDate() == null) {
            return;
        }

        // 1. Set Employee status to Inactive
        if (statusMasterRepo != null) {
            statusMasterRepo.findByNameIgnoreCase("Inactive").ifPresent(emp::setStatus);
        }
        emp.setIsActive(false);
        employeeRepo.save(emp);

        // 2. Suspend linked User Account Credentials
        if (emp.getId() != null && userRepo != null) {
            List<com.autonoma.erp.model.admin.UserCredential> users = userRepo.findByEmpId(emp.getId());
            if (users != null && !users.isEmpty()) {
                for (com.autonoma.erp.model.admin.UserCredential user : users) {
                    user.setStatus(0); // 0 = Suspended / Inactive
                    user.setUpdatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
                    user.setUpdatedDate(new Date());
                    userRepo.save(user);
                }
            }
        }
    }

    private void copyFields(EmployeeMaster details, EmployeeMaster emp) {
        // --- Owned fields ---
        if (details.getEmpCode() != null)
            emp.setEmpCode(details.getEmpCode());
        if (details.getOldEmpCode() != null)
            emp.setOldEmpCode(details.getOldEmpCode());
        if (details.getTitle() != null)
            emp.setTitle(details.getTitle());
        if (details.getEmployeeName() != null)
            emp.setEmployeeName(details.getEmployeeName());
        if (details.getFirstName() != null)
            emp.setFirstName(details.getFirstName());
        if (details.getLastName() != null)
            emp.setLastName(details.getLastName());
        if (details.getFatherHusbandName() != null)
            emp.setFatherHusbandName(details.getFatherHusbandName());
        if (details.getEmployeePhotoUpload() != null)
            emp.setEmployeePhotoUpload(details.getEmployeePhotoUpload());
        if (details.getEmployeeSignatureUpload() != null)
            emp.setEmployeeSignatureUpload(details.getEmployeeSignatureUpload());
        if (details.getNdaUpload() != null)
            emp.setNdaUpload(details.getNdaUpload());
        if (details.getFitnessCertificateUpload() != null)
            emp.setFitnessCertificateUpload(details.getFitnessCertificateUpload());
        if (details.getStatus() != null)
            emp.setStatus(details.getStatus());
        if (details.getIsActive() != null)
            emp.setIsActive(details.getIsActive());

        // --- Organization fields ---
        if (details.getCategoryId() != null)
            emp.setCategoryId(details.getCategoryId());
        if (details.getEmpLevelId() != null)
            emp.setEmpLevelId(details.getEmpLevelId());
        if (details.getEmployeeTypeId() != null)
            emp.setEmployeeTypeId(details.getEmployeeTypeId());
        if (details.getGradeCode() != null)
            emp.setGradeCode(details.getGradeCode());
        if (details.getUnitId() != null)
            emp.setUnitId(details.getUnitId());
        if (details.getDepartmentId() != null)
            emp.setDepartmentId(details.getDepartmentId());
        if (details.getDesignationId() != null)
            emp.setDesignationId(details.getDesignationId());
        if (details.getVerticalHead() != null)
            emp.setVerticalHead(details.getVerticalHead());
        if (details.getHrManager() != null)
            emp.setHrManager(details.getHrManager());
        if (details.getOfficeMail() != null)
            emp.setOfficeMail(details.getOfficeMail());
        if (details.getOfficeMailPassword() != null)
            emp.setOfficeMailPassword(details.getOfficeMailPassword());

        // --- Reference fields ---
        if (details.getVendorName() != null)
            emp.setVendorName(details.getVendorName());
        if (details.getReferMode() != null)
            emp.setReferMode(details.getReferMode());
        if (details.getReferenceComments() != null)
            emp.setReferenceComments(details.getReferenceComments());
        if (details.getHomeManager() != null)
            emp.setHomeManager(details.getHomeManager());
        if (details.getBusinessManager() != null)
            emp.setBusinessManager(details.getBusinessManager());
        if (details.getSupplierName() != null)
            emp.setSupplierName(details.getSupplierName());

        // --- Scheduling fields ---
        if (details.getDateOfJoining() != null)
            emp.setDateOfJoining(details.getDateOfJoining());
        if (details.getProbationPeriod() != null)
            emp.setProbationPeriod(details.getProbationPeriod());
        if (details.getConfirmationDate() != null)
            emp.setConfirmationDate(details.getConfirmationDate());
        if (details.getExitDate() != null)
            emp.setExitDate(details.getExitDate());
        if (details.getExitReason() != null)
            emp.setExitReason(details.getExitReason());
        if (details.getExitComments() != null)
            emp.setExitComments(details.getExitComments());
        if (details.getRejoiningDate() != null)
            emp.setRejoiningDate(details.getRejoiningDate());

        // --- Induction fields ---
        if (details.getInductionStatus() != null)
            emp.setInductionStatus(details.getInductionStatus());
        if (details.getIsInductionEligible() != null)
            emp.setIsInductionEligible(details.getIsInductionEligible());

        // --- Operations fields ---
        if (details.getGraceMinutes() != null)
            emp.setGraceMinutes(details.getGraceMinutes());
        if (details.getPetrolMode() != null)
            emp.setPetrolMode(details.getPetrolMode());
        if (details.getPetrolAllowance() != null)
            emp.setPetrolAllowance(details.getPetrolAllowance());
        if (details.getShift() != null)
            emp.setShift(details.getShift());
        if (details.getShiftName() != null)
            emp.setShiftName(details.getShiftName());
        if (details.getShiftDuration() != null)
            emp.setShiftDuration(details.getShiftDuration());
        if (details.getSegment() != null)
            emp.setSegment(details.getSegment());
        if (details.getSubSegment() != null)
            emp.setSubSegment(details.getSubSegment());

        // --- Statutory fields ---
        if (details.getPfToggle() != null)
            emp.setPfToggle(details.getPfToggle());
        if (details.getPfRestriction() != null)
            emp.setPfRestriction(details.getPfRestriction());
        if (details.getEsiToggle() != null)
            emp.setEsiToggle(details.getEsiToggle());
        if (details.getPTaxToggle() != null)
            emp.setPTaxToggle(details.getPTaxToggle());
        if (details.getBonusToggle() != null)
            emp.setBonusToggle(details.getBonusToggle());
        if (details.getOtToggle() != null)
            emp.setOtToggle(details.getOtToggle());
        if (details.getOtFactorial() != null)
            emp.setOtFactorial(details.getOtFactorial());
        if (details.getLomDeduction() != null)
            emp.setLomDeduction(details.getLomDeduction());
        if (details.getLomAllow() != null)
            emp.setLomAllow(details.getLomAllow());
        if (details.getLtaEligible() != null)
            emp.setLtaEligible(details.getLtaEligible());
        if (details.getPermissionToggle() != null)
            emp.setPermissionToggle(details.getPermissionToggle());
        if (details.getPermissionLimit() != null)
            emp.setPermissionLimit(details.getPermissionLimit());

        // --- Ability fields ---
        // Auditor (qualification-dependent)
        String auditorType = details.getAuditorType();
        emp.setAuditorType(auditorType);
        emp.setIsAuditor(auditorType != null && !auditorType.trim().isEmpty() ? "YES" : "NO");

        // Auditee (qualification-dependent)
        String auditeeType = details.getAuditeeType();
        emp.setAuditeeType(auditeeType);
        emp.setIsAuditee(auditeeType != null && !auditeeType.trim().isEmpty() ? "YES" : "NO");

        // NCR Approver (qualification-dependent)
        String ncrApproverType = details.getNcrApproverType();
        emp.setNcrApproverType(ncrApproverType);
        emp.setIsNcrApprover(ncrApproverType != null && !ncrApproverType.trim().isEmpty() ? "YES" : "NO");

        // Task Verifier (independent toggle)
        if (details.getIsTaskVerifier() != null)
            emp.setIsTaskVerifier(details.getIsTaskVerifier());
        if (details.getTaskVerifierType() != null)
            emp.setTaskVerifierType(details.getTaskVerifierType());

        // Task Tester (independent toggle)
        if (details.getIsTaskTester() != null)
            emp.setIsTaskTester(details.getIsTaskTester());
        if (details.getTaskTesterType() != null)
            emp.setTaskTesterType(details.getTaskTesterType());

        // Chaired (qualification-dependent)
        String chairedType = details.getChairedType();
        emp.setChairedType(chairedType);
        emp.setIsChaired(chairedType != null && !chairedType.trim().isEmpty() ? "YES" : "NO");

        // Host (qualification-dependent)
        String hostType = details.getHostType();
        emp.setHostType(hostType);
        emp.setIsHost(hostType != null && !hostType.trim().isEmpty() ? "YES" : "NO");

        // Participants (qualification-dependent)
        String participantsType = details.getParticipantsType();
        emp.setParticipantsType(participantsType);
        emp.setIsParticipants(participantsType != null && !participantsType.trim().isEmpty() ? "YES" : "NO");
        if (details.getIsFirstAid() != null)
            emp.setIsFirstAid(details.getIsFirstAid());
        if (details.getFirstAidFileInfo() != null)
            emp.setFirstAidFileInfo(details.getFirstAidFileInfo());
        if (details.getIsFireFighter() != null)
            emp.setIsFireFighter(details.getIsFireFighter());
        if (details.getFireFighterFileInfo() != null)
            emp.setFireFighterFileInfo(details.getFireFighterFileInfo());
        if (details.getIsTwoWheeler() != null)
            emp.setIsTwoWheeler(details.getIsTwoWheeler());
        if (details.getTwoWheelerFileInfo() != null)
            emp.setTwoWheelerFileInfo(details.getTwoWheelerFileInfo());
        if (details.getIsFourWheeler() != null)
            emp.setIsFourWheeler(details.getIsFourWheeler());
        if (details.getFourWheelerFileInfo() != null)
            emp.setFourWheelerFileInfo(details.getFourWheelerFileInfo());
        if (details.getIsInterviewer() != null)
            emp.setIsInterviewer(details.getIsInterviewer());
        if (details.getIsEnquiryAssignee() != null)
            emp.setIsEnquiryAssignee(details.getIsEnquiryAssignee());
        if (details.getIsPrAssignee() != null)
            emp.setIsPrAssignee(details.getIsPrAssignee());
        if (details.getAuditorFileInfo() != null)
            emp.setAuditorFileInfo(details.getAuditorFileInfo());
        if (details.getAuditeeFileInfo() != null)
            emp.setAuditeeFileInfo(details.getAuditeeFileInfo());
        if (details.getNcrApproverFileInfo() != null)
            emp.setNcrApproverFileInfo(details.getNcrApproverFileInfo());
        if (details.getTaskVerifierFileInfo() != null)
            emp.setTaskVerifierFileInfo(details.getTaskVerifierFileInfo());
        if (details.getTaskTesterFileInfo() != null)
            emp.setTaskTesterFileInfo(details.getTaskTesterFileInfo());
        if (details.getChairedFileInfo() != null)
            emp.setChairedFileInfo(details.getChairedFileInfo());
        if (details.getHostFileInfo() != null)
            emp.setHostFileInfo(details.getHostFileInfo());
        if (details.getParticipantsFileInfo() != null)
            emp.setParticipantsFileInfo(details.getParticipantsFileInfo());

        // Element collections copying removed because the frontend sends *FileInfo
        // string fields,
        // which populate the element collections in the respective setter methods.
        // Copying the
        // lists directly from the deserialized details object would clear them out, as
        // details
        // doesn't have the list data.

        // --- Self Assessment fields ---
        if (details.getQ1_native() != null)
            emp.setQ1_native(details.getQ1_native());
        if (details.getQ2_presentAddress() != null)
            emp.setQ2_presentAddress(details.getQ2_presentAddress());
        if (details.getQ3_permanentAddress() != null)
            emp.setQ3_permanentAddress(details.getQ3_permanentAddress());
        if (details.getQ4_fatherOccupation() != null)
            emp.setQ4_fatherOccupation(details.getQ4_fatherOccupation());
        if (details.getQ5_motherOccupation() != null)
            emp.setQ5_motherOccupation(details.getQ5_motherOccupation());
        if (details.getQ6_maritalStatus() != null)
            emp.setQ6_maritalStatus(details.getQ6_maritalStatus());
        if (details.getQ7_spouseOccupation() != null)
            emp.setQ7_spouseOccupation(details.getQ7_spouseOccupation());
        if (details.getQ8_children() != null)
            emp.setQ8_children(details.getQ8_children());
        if (details.getQ9_hasRelativesInCompany() != null)
            emp.setQ9_hasRelativesInCompany(details.getQ9_hasRelativesInCompany());
        if (details.getQ10_relativesDetails() != null)
            emp.setQ10_relativesDetails(details.getQ10_relativesDetails());
        if (details.getQ11_siblingsOccupations() != null)
            emp.setQ11_siblingsOccupations(details.getQ11_siblingsOccupations());
        if (details.getQ12_hasTwoWheeler() != null)
            emp.setQ12_hasTwoWheeler(details.getQ12_hasTwoWheeler());
        if (details.getQ13_hasAndroidPhone() != null)
            emp.setQ13_hasAndroidPhone(details.getQ13_hasAndroidPhone());
        if (details.getQ14_knowsCarDriving() != null)
            emp.setQ14_knowsCarDriving(details.getQ14_knowsCarDriving());
        if (details.getQ15_willingToTravel() != null)
            emp.setQ15_willingToTravel(details.getQ15_willingToTravel());
        if (details.getQ16_covidVaccination() != null)
            emp.setQ16_covidVaccination(details.getQ16_covidVaccination());
        if (details.getQ47_hasInsurance() != null)
            emp.setQ47_hasInsurance(details.getQ47_hasInsurance());
        if (details.getQ48_insuranceNumber() != null)
            emp.setQ48_insuranceNumber(details.getQ48_insuranceNumber());
        if (details.getQ17_positivePoints() != null)
            emp.setQ17_positivePoints(details.getQ17_positivePoints());
        if (details.getQ18_negativePoints() != null)
            emp.setQ18_negativePoints(details.getQ18_negativePoints());
        if (details.getQ19_lifeGoals() != null)
            emp.setQ19_lifeGoals(details.getQ19_lifeGoals());
        if (details.getQ20_improvementSuggestions() != null)
            emp.setQ20_improvementSuggestions(details.getQ20_improvementSuggestions());
        if (details.getQ21_isExperienced() != null)
            emp.setQ21_isExperienced(details.getQ21_isExperienced());
        if (details.getQ22_totalExperience() != null)
            emp.setQ22_totalExperience(details.getQ22_totalExperience());
        if (details.getQ23_coreExperience() != null)
            emp.setQ23_coreExperience(details.getQ23_coreExperience());
        if (details.getQ24_prevNetSalary() != null)
            emp.setQ24_prevNetSalary(details.getQ24_prevNetSalary());
        if (details.getQ25_prevGrossSalary() != null)
            emp.setQ25_prevGrossSalary(details.getQ25_prevGrossSalary());
        if (details.getQ26_expectedNetSalary() != null)
            emp.setQ26_expectedNetSalary(details.getQ26_expectedNetSalary());
        if (details.getQ27_expectedGrossSalary() != null)
            emp.setQ27_expectedGrossSalary(details.getQ27_expectedGrossSalary());
        if (details.getQ28_pfHigherPension() != null)
            emp.setQ28_pfHigherPension(details.getQ28_pfHigherPension());
        if (details.getQ29_pfDeductionAmount() != null)
            emp.setQ29_pfDeductionAmount(details.getQ29_pfDeductionAmount());
        if (details.getQ30_alternativeDepartment() != null)
            emp.setQ30_alternativeDepartment(details.getQ30_alternativeDepartment());
        if (details.getQ31_prevLocation() != null)
            emp.setQ31_prevLocation(details.getQ31_prevLocation());
        if (details.getQ32_prevShift() != null)
            emp.setQ32_prevShift(details.getQ32_prevShift());
        if (details.getQ33_reasonForLeaving() != null)
            emp.setQ33_reasonForLeaving(details.getQ33_reasonForLeaving());
        if (details.getQ34_noticePeriod() != null)
            emp.setQ34_noticePeriod(details.getQ34_noticePeriod());
        if (details.getQ35_prevDeptPosition() != null)
            emp.setQ35_prevDeptPosition(details.getQ35_prevDeptPosition());
        if (details.getQ36_prevDeptCount() != null)
            emp.setQ36_prevDeptCount(details.getQ36_prevDeptCount());
        if (details.getQ38_handleMistake() != null)
            emp.setQ38_handleMistake(details.getQ38_handleMistake());
        if (details.getQ39_handleOpinionDifference() != null)
            emp.setQ39_handleOpinionDifference(details.getQ39_handleOpinionDifference());
        if (details.getQ40_computerSelfRating() != null)
            emp.setQ40_computerSelfRating(details.getQ40_computerSelfRating());
        if (details.getQ41_hrMgrName() != null)
            emp.setQ41_hrMgrName(details.getQ41_hrMgrName());
        if (details.getQ42_hrMgrEmail() != null)
            emp.setQ42_hrMgrEmail(details.getQ42_hrMgrEmail());
        if (details.getQ43_hrMgrPhone() != null)
            emp.setQ43_hrMgrPhone(details.getQ43_hrMgrPhone());
        if (details.getQ44_vertHeadName() != null)
            emp.setQ44_vertHeadName(details.getQ44_vertHeadName());
        if (details.getQ45_vertHeadEmail() != null)
            emp.setQ45_vertHeadEmail(details.getQ45_vertHeadEmail());
        if (details.getQ46_vertHeadPhone() != null)
            emp.setQ46_vertHeadPhone(details.getQ46_vertHeadPhone());

        // --- ATS fields ---
        if (details.getApplicantDate() != null)
            emp.setApplicantDate(details.getApplicantDate());
        if (details.getAge() != null)
            emp.setAge(details.getAge());
        if (details.getCallStatus() != null)
            emp.setCallStatus(details.getCallStatus());
        if (details.getInterviewStatus() != null)
            emp.setInterviewStatus(details.getInterviewStatus());
        if (details.getOfferStatus() != null)
            emp.setOfferStatus(details.getOfferStatus());
        if (details.getVerificationStatus() != null)
            emp.setVerificationStatus(details.getVerificationStatus());
        if (details.getCallLetterDate() != null)
            emp.setCallLetterDate(details.getCallLetterDate());
        if (details.getCallLetterTime() != null)
            emp.setCallLetterTime(details.getCallLetterTime());
        if (details.getResumePath() != null)
            emp.setResumePath(details.getResumePath());
        if (details.getAadharPath() != null)
            emp.setAadharPath(details.getAadharPath());
        if (details.getPayslipPath() != null)
            emp.setPayslipPath(details.getPayslipPath());
        if (details.getPhotoVerifiedStatus() != null)
            emp.setPhotoVerifiedStatus(details.getPhotoVerifiedStatus());
        if (details.getResumeVerifiedStatus() != null)
            emp.setResumeVerifiedStatus(details.getResumeVerifiedStatus());
        if (details.getPayslipVerifiedStatus() != null)
            emp.setPayslipVerifiedStatus(details.getPayslipVerifiedStatus());
        if (details.getAadharVerifiedStatus() != null)
            emp.setAadharVerifiedStatus(details.getAadharVerifiedStatus());
        if (details.getPhotoRejectReason() != null)
            emp.setPhotoRejectReason(details.getPhotoRejectReason());
        if (details.getResumeRejectReason() != null)
            emp.setResumeRejectReason(details.getResumeRejectReason());
        if (details.getPayslipRejectReason() != null)
            emp.setPayslipRejectReason(details.getPayslipRejectReason());
        if (details.getAadharRejectReason() != null)
            emp.setAadharRejectReason(details.getAadharRejectReason());
        if (details.getNextSalaryHikeMonth() != null)
            emp.setNextSalaryHikeMonth(details.getNextSalaryHikeMonth());
        if (details.getMinimumAmount() != null)
            emp.setMinimumAmount(details.getMinimumAmount());
        if (details.getMaximumAmount() != null)
            emp.setMaximumAmount(details.getMaximumAmount());
    }

    /**
     * Validates that restricted ability flags (Auditor, Auditee, NCR Approver)
     * cannot be set to YES unless the employee has completed induction.
     */
    private void validateAbilityInductionConstraint(EmployeeMaster e) {
        boolean hasRestrictedAbility = "YES".equalsIgnoreCase(e.getIsAuditor()) ||
                "YES".equalsIgnoreCase(e.getIsAuditee()) ||
                "YES".equalsIgnoreCase(e.getIsNcrApprover());

        boolean inductionComplete = "COMPLETED".equalsIgnoreCase(e.getInductionStatus());

        if (hasRestrictedAbility && !inductionComplete) {
            throw new RuntimeException(
                    "Cannot assign Auditor / Auditee / NCR Approver ability: " +
                            "This employee has not completed Induction (current status: " +
                            (e.getInductionStatus() != null ? e.getInductionStatus() : "PENDING") + "). " +
                            "Please complete the induction process first.");
        }
    }

    /**
     * Coerce null Strings to empty string to satisfy NOT NULL DB columns.
     * NOTE: empCode derivation is done AFTER this method in createEmployee() —
     * do NOT set empCode here, as getEmpCode() has a custom getter that may
     * return oldEmpCode instead of the private field, causing incorrect null
     * checks.
     */
    private void sanitizeEmployee(EmployeeMaster e) {
        // empCode is intentionally NOT defaulted here — see createEmployee() for
        // derivation logic.
        if (e.getFatherHusbandName() == null)
            e.setFatherHusbandName("");
        if (e.getGradeCode() == null)
            e.setGradeCode("");
        if (e.getExitReason() == null)
            e.setExitReason("");
        if (e.getReferMode() == null)
            e.setReferMode("");
        if (e.getHomeManager() == null)
            e.setHomeManager("");
        if (e.getBusinessManager() == null)
            e.setBusinessManager("");
        if (e.getSupplierName() == null)
            e.setSupplierName("");
        if (e.getEmployeePhotoUpload() == null)
            e.setEmployeePhotoUpload("");
        if (e.getEmployeeSignatureUpload() == null)
            e.setEmployeeSignatureUpload("");
        if (e.getNdaUpload() == null)
            e.setNdaUpload("");
        if (e.getFitnessCertificateUpload() == null)
            e.setFitnessCertificateUpload("");
        if (e.getShiftDuration() == null)
            e.setShiftDuration("480");
        if (e.getShiftName() == null)
            e.setShiftName("GENERAL");
        if (e.getShift() == null)
            e.setShift("Yes");
        if (e.getInductionStatus() == null)
            e.setInductionStatus("PENDING");
        if (e.getStatus() == null)
            e.setStatus(statusResolver.get("Active"));
        // Ability fields — safe nulls (columns were added nullable in V2.6)
        if (e.getIsAuditor() == null)
            e.setIsAuditor("NO");
        if (e.getIsAuditee() == null)
            e.setIsAuditee("NO");
        if (e.getIsNcrApprover() == null)
            e.setIsNcrApprover("NO");
        if (e.getIsChaired() == null)
            e.setIsChaired("NO");
        if (e.getIsHost() == null)
            e.setIsHost("NO");
        if (e.getIsParticipants() == null)
            e.setIsParticipants("NO");
        if (e.getIsFirstAid() == null)
            e.setIsFirstAid("NO");
        if (e.getIsFireFighter() == null)
            e.setIsFireFighter("NO");
        if (e.getIsTwoWheeler() == null)
            e.setIsTwoWheeler("NO");
        if (e.getIsFourWheeler() == null)
            e.setIsFourWheeler("NO");
        if (e.getIsInductionEligible() == null)
            e.setIsInductionEligible("NO");
        if (e.getIsInterviewer() == null)
            e.setIsInterviewer("NO");
        if (e.getIsEnquiryAssignee() == null)
            e.setIsEnquiryAssignee("NO");
        if (e.getIsPrAssignee() == null)
            e.setIsPrAssignee("NO");
        if (e.getCallStatus() == null)
            e.setCallStatus(statusResolver.get("Pending"));
        if (e.getInterviewStatus() == null)
            e.setInterviewStatus(statusResolver.get("Pending"));
        if (e.getOfferStatus() == null)
            e.setOfferStatus(statusResolver.get("Pending"));
        if (e.getVerificationStatus() == null)
            e.setVerificationStatus(statusResolver.get("Pending"));
        if (e.getSelfAssessment() == null) {
            e.setSelfAssessment(new EmployeeSelfAssessment());
            e.getSelfAssessment().setEmployee(e);
        }
        if (e.getSelfAssessment().getSelfAssessmentStatus() == null) {
            e.getSelfAssessment().setSelfAssessmentStatus(statusResolver.get("Draft"));
        }
    }

    private String incrementSequence(String latest, String prefix) {
        if (latest == null || latest.isEmpty())
            return "001";
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
        } catch (Exception ex) {
            return prefix + "001";
        }
    }

    @Transactional
    public void deleteEmployee(Long id) {
        try {
            personalRepo.deleteByEmployeeId(id);
            contactRepo.deleteByEmployeeId(id);
            jobProfileRepo.deleteByEmployeeId(id);
            educationRepo.deleteByEmployeeId(id);
            experienceRepo.deleteByEmployeeId(id);
            emergencyContactRepo.deleteByEmployeeId(id);
            passportRepo.deleteByEmployeeId(id);
            dependentRepo.deleteByEmployeeId(id);
            assetRepo.deleteByEmployeeId(id);
            kycRepo.deleteByEmployeeId(id);
            kycDocumentRepo.deleteByEmployeeId(id);
            activityRepo.deleteByEmployeeId(id);
            managerMappingRepo.deleteByEmpId(id);
            userRepo.deleteByEmpId(id);

            employeeRepo.deleteById(id);
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            throw new RuntimeException(
                    "Cannot delete employee: The employee is linked to other system records (e.g., Audits, Meetings, or Inductions). Please deactivate them instead.");
        }
    }

    // ======================== PERSONAL DETAIL ========================

    public EmployeePersonalDetail getPersonalDetail(Long employeeId) {
        return personalRepo.findFirstByEmployeeId(employeeId).orElse(null);
    }

    @Transactional
    public EmployeePersonalDetail savePersonalDetail(Long employeeId, EmployeePersonalDetail detail) {
        if (!employeeRepo.existsById(employeeId))
            throw new RuntimeException("Employee not found with ID: " + employeeId);

        EmployeePersonalDetail existing = personalRepo.findFirstByEmployeeId(employeeId)
                .orElse(new EmployeePersonalDetail());
        if (existing.getId() == null) {
            existing.setEmployeeId(employeeId);
            existing.setCreatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
        }

        // Merge fields (Personal Details + ID Details)
        if (detail.getGender() != null)
            existing.setGender(detail.getGender());
        if (detail.getMaritalStatus() != null)
            existing.setMaritalStatus(detail.getMaritalStatus());
        if (detail.getMarriageDate() != null)
            existing.setMarriageDate(detail.getMarriageDate());
        if (detail.getBirthDate() != null)
            existing.setBirthDate(detail.getBirthDate());
        if (detail.getNationality() != null)
            existing.setNationality(detail.getNationality());
        if (detail.getPersonalEmail() != null)
            existing.setPersonalEmail(detail.getPersonalEmail());
        if (detail.getBloodGroup() != null)
            existing.setBloodGroup(detail.getBloodGroup());
        if (detail.getRegion() != null)
            existing.setRegion(detail.getRegion());
        if (detail.getShirtSize() != null)
            existing.setShirtSize(detail.getShirtSize());
        if (detail.getPantSize() != null)
            existing.setPantSize(detail.getPantSize());
        if (detail.getShoeSize() != null)
            existing.setShoeSize(detail.getShoeSize());
        if (detail.getHeight() != null)
            existing.setHeight(detail.getHeight());
        if (detail.getWeight() != null)
            existing.setWeight(detail.getWeight());

        // ID Details
        if (detail.getAadharNumber() != null)
            existing.setAadharNumber(detail.getAadharNumber());
        if (detail.getDrivingLicenseNumber() != null)
            existing.setDrivingLicenseNumber(detail.getDrivingLicenseNumber());
        if (detail.getPassportNumber() != null)
            existing.setPassportNumber(detail.getPassportNumber());
        if (detail.getPassportIssueCity() != null)
            existing.setPassportIssueCity(detail.getPassportIssueCity());
        if (detail.getLicenseExpiryDate() != null)
            existing.setLicenseExpiryDate(detail.getLicenseExpiryDate());
        if (detail.getLoanInstallmentMonth() != null)
            existing.setLoanInstallmentMonth(detail.getLoanInstallmentMonth());

        // Statutory Details
        if (detail.getPanNumber() != null)
            existing.setPanNumber(detail.getPanNumber());
        if (detail.getPfNumber() != null)
            existing.setPfNumber(detail.getPfNumber());
        if (detail.getUanNumber() != null)
            existing.setUanNumber(detail.getUanNumber());

        if (existing.getId() != null) {
            existing.setUpdatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
            existing.setUpdatedDate(new Date());
        }
        return personalRepo.save(existing);
    }

    // ======================== CONTACT ========================

    public EmployeeContact getContact(Long employeeId) {
        return contactRepo.findByEmployeeId(employeeId).orElse(null);
    }

    @Transactional
    public EmployeeContact saveContact(Long employeeId, EmployeeContact contact) {
        if (!employeeRepo.existsById(employeeId))
            throw new RuntimeException("Employee not found");

        EmployeeContact existing = contactRepo.findByEmployeeId(employeeId).orElse(new EmployeeContact());
        if (existing.getId() == null) {
            existing.setEmployeeId(employeeId);
            existing.setCreatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
        }

        if (contact.getAddress() != null)
            existing.setAddress(contact.getAddress());
        if (contact.getCity() != null)
            existing.setCity(contact.getCity());
        if (contact.getState() != null)
            existing.setState(contact.getState());
        if (contact.getCountry() != null)
            existing.setCountry(contact.getCountry());
        if (contact.getPincode() != null)
            existing.setPincode(contact.getPincode());
        if (contact.getMobile() != null)
            existing.setMobile(sanitizeAndValidatePhone("Mobile No", contact.getMobile()));
        if (contact.getAlternateMobile() != null)
            existing.setAlternateMobile(sanitizeAndValidatePhone("Alternate Mobile No", contact.getAlternateMobile()));

        if (existing.getId() != null) {
            existing.setUpdatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
            existing.setUpdatedDate(new Date());
        }
        return contactRepo.save(existing);
    }

    // ======================== JOB PROFILE ========================

    public EmployeeJobProfile getJobProfile(Long employeeId) {
        EmployeeJobProfile jp = jobProfileRepo.findByEmployeeId(employeeId).orElse(null);
        if (jp != null) {
            List<EmployeeSalaryComponent> comps = employeeSalaryComponentRepo.findByEmployeeId(employeeId);
            if (!comps.isEmpty()) {
                try {
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    Map<String, Object> dynMap = new HashMap<>();
                    if (jp.getDynamicComponents() != null && !jp.getDynamicComponents().trim().isEmpty()) {
                        dynMap = mapper.readValue(jp.getDynamicComponents(),
                                new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {
                                });
                    }
                    for (EmployeeSalaryComponent c : comps) {
                        if (c.getComponentCode() != null && c.getAmount() != null) {
                            dynMap.put(c.getComponentCode(), c.getAmount());
                        }
                    }
                    jp.setDynamicComponents(mapper.writeValueAsString(dynMap));
                } catch (Exception e) {
                    System.err.println(
                            "Failed to merge salary components into dynamicComponents JSON: " + e.getMessage());
                }
            }
        }
        return jp;
    }

    @Transactional
    public EmployeeJobProfile saveJobProfile(Long employeeId, EmployeeJobProfile profile) {
        if (!employeeRepo.existsById(employeeId))
            throw new RuntimeException("Employee not found");

        EmployeeJobProfile existing = jobProfileRepo.findByEmployeeId(employeeId).orElse(new EmployeeJobProfile());
        if (existing.getId() == null) {
            existing.setEmployeeId(employeeId);
            existing.setCreatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
            existing.setCreatedDate(new Date());
        }

        // Parse dynamic components (merging existing database ones with incoming ones)
        // to get rates
        Map<String, Object> dynMap = new HashMap<>();
        if (existing.getDynamicComponents() != null && !existing.getDynamicComponents().trim().isEmpty()) {
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                Map<String, Object> existingDyn = mapper.readValue(existing.getDynamicComponents(),
                        new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {
                        });
                dynMap.putAll(existingDyn);
            } catch (Exception e) {
                // ignore
            }
        }
        if (profile.getDynamicComponents() != null && !profile.getDynamicComponents().trim().isEmpty()) {
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                Map<String, Object> incomingDyn = mapper.readValue(profile.getDynamicComponents(),
                        new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {
                        });
                dynMap.putAll(incomingDyn);
            } catch (Exception e) {
                // ignore
            }
        }

        // Validate Wages Type and Rates
        String currentWagesType = profile.getWagesType() != null ? profile.getWagesType() : existing.getWagesType();
        if ("DAILY".equalsIgnoreCase(currentWagesType)) {
            Object dailyRateVal = dynMap.get("dailyRate");
            if (dailyRateVal == null || String.valueOf(dailyRateVal).trim().isEmpty()) {
                throw new RuntimeException("Daily Amount is required when Wages Type is DAILY");
            }
        } else if ("HOURLY".equalsIgnoreCase(currentWagesType)) {
            Object hourlyRateVal = dynMap.get("hourlyRate");
            if (hourlyRateVal == null || String.valueOf(hourlyRateVal).trim().isEmpty()) {
                throw new RuntimeException("Per Hour Rate is required when Wages Type is HOURLY");
            }
            // Force disable overtime for Hourly employees
            existing.setOverTimeAllowed("NO");
            existing.setOverTimeFactorial(null);
            existing.setOverTimeRatePerHour(null);
        }

        // Merge Bank Details
        if (profile.getSalaryAccountNumber() != null)
            existing.setSalaryAccountNumber(profile.getSalaryAccountNumber());
        if (profile.getAccountName() != null)
            existing.setAccountName(profile.getAccountName());
        if (profile.getBankAccountType() != null)
            existing.setBankAccountType(profile.getBankAccountType());
        if (profile.getBankName() != null)
            existing.setBankName(profile.getBankName());
        if (profile.getIfscCode() != null)
            existing.setIfscCode(profile.getIfscCode());
        if (profile.getBranchName() != null)
            existing.setBranchName(profile.getBranchName());
        if (profile.getPersonalAccountNumber() != null)
            existing.setPersonalAccountNumber(profile.getPersonalAccountNumber());

        // Validate Bank Details if Payment Mode is BANK
        if ("BANK".equalsIgnoreCase(profile.getPaymentMode())) {
            if (profile.getSalaryAccountNumber() == null || profile.getSalaryAccountNumber().trim().isEmpty()) {
                throw new RuntimeException("Salary Account Number is required when Payment Mode is BANK");
            }
            if (profile.getAccountName() == null || profile.getAccountName().trim().isEmpty()) {
                throw new RuntimeException("Account Name is required when Payment Mode is BANK");
            }
            if (profile.getBankName() == null || profile.getBankName().trim().isEmpty()) {
                throw new RuntimeException("Bank Name is required when Payment Mode is BANK");
            }
            if (profile.getBankAccountType() == null || profile.getBankAccountType().trim().isEmpty()) {
                throw new RuntimeException("Bank Account Type is required when Payment Mode is BANK");
            }
            if (profile.getIfscCode() == null || profile.getIfscCode().trim().isEmpty()) {
                throw new RuntimeException("IFSC Code is required when Payment Mode is BANK");
            }
            if (profile.getBranchName() == null || profile.getBranchName().trim().isEmpty()) {
                throw new RuntimeException("Branch Name is required when Payment Mode is BANK");
            }
        }

        // Merge Wages and Payment details
        if (profile.getWagesType() != null)
            existing.setWagesType(profile.getWagesType());
        if (profile.getPaymentMode() != null && !profile.getPaymentMode().trim().isEmpty()) {
            existing.setPaymentMode(profile.getPaymentMode());
        } else if (existing.getPaymentMode() == null) {
            existing.setPaymentMode("CASH");
        }

        // Merge Toggles (PF, ESI, PTAX, LTA, LOM, Permission, Leave, OD)
        if (profile.getProvidentFund() != null)
            existing.setProvidentFund(profile.getProvidentFund());
        if (profile.getEsiAllowed() != null)
            existing.setEsiAllowed(profile.getEsiAllowed());
        if (profile.getProfessionalTax() != null)
            existing.setProfessionalTax(profile.getProfessionalTax());
        if (profile.getLtaEligible() != null)
            existing.setLtaEligible(profile.getLtaEligible());
        if (profile.getLossOfMinutesDeduct() != null)
            existing.setLossOfMinutesDeduct(profile.getLossOfMinutesDeduct());
        if (profile.getPermissionRequest() != null)
            existing.setPermissionRequest(profile.getPermissionRequest());
        if (profile.getLeaveAllowed() != null)
            existing.setLeaveAllowed(profile.getLeaveAllowed());
        if (profile.getOdAllowed() != null)
            existing.setOdAllowed(profile.getOdAllowed());

        // Merge officeEmail and officialPassword
        if (profile.getOfficeEmail() != null) {
            String email = profile.getOfficeEmail().trim();
            if (!email.isEmpty()) {
                if (!email.matches("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
                    throw new RuntimeException("Invalid Office Email format: '" + email + "'. Must be a valid email address (e.g. name@domain.com).");
                }
                existing.setOfficeEmail(email);
            } else {
                existing.setOfficeEmail(null);
            }
        }
        if (profile.getOfficialPassword() != null)
            existing.setOfficialPassword(profile.getOfficialPassword());

        // Merge Official Contact fields
        if (profile.getCompanyContact1() != null)
            existing.setCompanyContact1(sanitizeAndValidatePhone("Official Contact 1", profile.getCompanyContact1()));
        if (profile.getCompanyContact2() != null)
            existing.setCompanyContact2(sanitizeAndValidatePhone("Official Contact 2", profile.getCompanyContact2()));

        // Merge Overtime Settings
        if (profile.getOverTimeAllowed() != null)
            existing.setOverTimeAllowed(profile.getOverTimeAllowed());
        if (profile.getOverTimeFactorial() != null)
            existing.setOverTimeFactorial(profile.getOverTimeFactorial());
        if (profile.getOverTimeRatePerHour() != null)
            existing.setOverTimeRatePerHour(profile.getOverTimeRatePerHour());

        if (profile.getDynamicComponents() != null) {
            String newDyn = profile.getDynamicComponents();
            String existingDyn = existing.getDynamicComponents();
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                Map<String, Object> finalMap = new HashMap<>();
                if (existingDyn != null && !existingDyn.trim().isEmpty()) {
                    finalMap = mapper.readValue(existingDyn,
                            new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {
                            });
                }
                Map<String, Object> incomingMap = new HashMap<>();
                if (newDyn != null && !newDyn.trim().isEmpty()) {
                    incomingMap = mapper.readValue(newDyn,
                            new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {
                            });
                }
                finalMap.putAll(incomingMap);

                // Fetch registered active payroll components to intercept and save them to
                // separate table
                List<HrPayrollComponent> activeComps = hrPayrollComponentRepo.findByIsActiveTrueOrderBySequenceNoAsc();
                boolean hasSalaryComponents = false;
                for (HrPayrollComponent pc : activeComps) {
                    if (incomingMap.containsKey(pc.getComponentCode())) {
                        hasSalaryComponents = true;
                        break;
                    }
                }

                if (hasSalaryComponents) {
                    List<EmployeeSalaryComponent> existingComps = employeeSalaryComponentRepo
                            .findByEmployeeId(employeeId);
                    Map<String, EmployeeSalaryComponent> existingMap = new HashMap<>();
                    for (EmployeeSalaryComponent ec : existingComps) {
                        if (ec.getComponentCode() != null) {
                            existingMap.put(ec.getComponentCode(), ec);
                        }
                    }

                    // Construct a set of component codes to check (all active + all currently
                    // saved)
                    Set<String> codesToCheck = new HashSet<>();
                    for (HrPayrollComponent pc : activeComps) {
                        codesToCheck.add(pc.getComponentCode());
                    }
                    codesToCheck.addAll(existingMap.keySet());

                    List<EmployeeSalaryComponent> toSaveList = new ArrayList<>();
                    List<EmployeeSalaryComponentLog> logList = new ArrayList<>();
                    String currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
                    if (currentUserId == null || currentUserId.trim().isEmpty()) {
                        currentUserId = "System";
                    }

                    for (String code : codesToCheck) {
                        HrPayrollComponent pc = activeComps.stream()
                                .filter(c -> code.equals(c.getComponentCode()))
                                .findFirst()
                                .orElse(null);

                        EmployeeSalaryComponent existingComp = existingMap.get(code);

                        if (finalMap.containsKey(code)) {
                            Object val = finalMap.get(code);
                            java.math.BigDecimal amount = java.math.BigDecimal.ZERO;
                            if (val instanceof Number) {
                                amount = java.math.BigDecimal.valueOf(((Number) val).doubleValue());
                            } else if (val instanceof String && !((String) val).trim().isEmpty()) {
                                try {
                                    amount = new java.math.BigDecimal((String) val);
                                } catch (Exception e) {
                                }
                            }

                            // Remove from dynamicComponents map so they are NOT stored in JSON string
                            finalMap.remove(code);

                            boolean isZero = amount.compareTo(java.math.BigDecimal.ZERO) == 0;
                            java.math.BigDecimal oldAmt = existingComp != null ? existingComp.getAmount()
                                    : java.math.BigDecimal.ZERO;

                            if (existingComp == null) {
                                if (!isZero) {
                                    EmployeeSalaryComponent esc = new EmployeeSalaryComponent();
                                    esc.setEmployeeId(employeeId);
                                    if (pc != null) {
                                        esc.setComponentId(pc.getRowId());
                                        esc.setComponentName(pc.getComponentName());
                                        esc.setFormula(pc.getFormulaExpression());
                                    } else {
                                        esc.setComponentName(code);
                                    }
                                    esc.setComponentCode(code);
                                    esc.setAmount(amount);
                                    toSaveList.add(esc);

                                    EmployeeSalaryComponentLog scl = new EmployeeSalaryComponentLog();
                                    scl.setEmployeeId(employeeId);
                                    scl.setComponentCode(code);
                                    scl.setComponentName(pc != null ? pc.getComponentName() : code);
                                    scl.setOldAmount(java.math.BigDecimal.ZERO);
                                    scl.setNewAmount(amount);
                                    scl.setActionType("INSERT");
                                    logList.add(scl);
                                }
                            } else {
                                if (isZero) {
                                    if (oldAmt.compareTo(java.math.BigDecimal.ZERO) != 0) {
                                        EmployeeSalaryComponentLog scl = new EmployeeSalaryComponentLog();
                                        scl.setEmployeeId(employeeId);
                                        scl.setComponentCode(code);
                                        scl.setComponentName(existingComp.getComponentName());
                                        scl.setOldAmount(oldAmt);
                                        scl.setNewAmount(java.math.BigDecimal.ZERO);
                                        scl.setActionType("DELETE");
                                        logList.add(scl);
                                    }
                                } else {
                                    EmployeeSalaryComponent esc = new EmployeeSalaryComponent();
                                    esc.setEmployeeId(employeeId);
                                    esc.setComponentId(existingComp.getComponentId());
                                    esc.setComponentCode(code);
                                    esc.setComponentName(existingComp.getComponentName());
                                    esc.setFormula(pc != null ? pc.getFormulaExpression() : existingComp.getFormula());
                                    esc.setAmount(amount);
                                    toSaveList.add(esc);

                                    if (amount.compareTo(oldAmt) != 0) {
                                        EmployeeSalaryComponentLog scl = new EmployeeSalaryComponentLog();
                                        scl.setEmployeeId(employeeId);
                                        scl.setComponentCode(code);
                                        scl.setComponentName(existingComp.getComponentName());
                                        scl.setOldAmount(oldAmt);
                                        scl.setNewAmount(amount);
                                        scl.setActionType("UPDATE");
                                        logList.add(scl);
                                    }
                                }
                            }
                        } else if (existingComp != null) {
                            toSaveList.add(existingComp);
                        }
                    }

                    employeeSalaryComponentRepo.deleteByEmployeeId(employeeId);
                    if (!toSaveList.isEmpty()) {
                        employeeSalaryComponentRepo.saveAll(toSaveList);
                    }
                    if (!logList.isEmpty()) {
                        employeeSalaryComponentLogRepo.saveAll(logList);
                    }
                }

                existing.setDynamicComponents(mapper.writeValueAsString(finalMap));
            } catch (Exception e) {
                existing.setDynamicComponents(newDyn);
            }
        }

        // Force Overtime rules for HOURLY employees at the final entity state
        if ("HOURLY".equalsIgnoreCase(existing.getWagesType())) {
            existing.setOverTimeAllowed("NO");
            existing.setOverTimeFactorial(null);
            existing.setOverTimeRatePerHour(null);
        }

        if (existing.getId() != null) {
            existing.setUpdatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
            existing.setUpdatedDate(new Date());
        }
        return jobProfileRepo.save(existing);
    }

    public List<HrPayrollComponent> getPayrollComponentsForEmployee(Long employeeId) {
        return getPayrollComponentsForEmployee(employeeId, null);
    }

    public List<HrPayrollComponent> getPayrollComponentsForEmployee(Long employeeId, String employeeType) {
        List<HrPayrollComponent> activeComps = new ArrayList<>();
        EmployeeMaster emp = employeeRepo.findById(employeeId).orElse(null);
        Long resolvedEmployeeTypeId = null;
        if (employeeType != null && !employeeType.trim().isEmpty()) {
            EmployeeTypeMaster typeMaster = employeeTypeRepo.findByTypeNameIgnoreCase(employeeType.trim());
            if (typeMaster != null) {
                resolvedEmployeeTypeId = typeMaster.getId();
            }
        }
        if (resolvedEmployeeTypeId == null && emp != null) {
            resolvedEmployeeTypeId = emp.getEmployeeTypeId();
        }

        if (resolvedEmployeeTypeId != null) {
            List<HrPayrollStructure> structures = hrPayrollStructureRepo
                    .findByEmployeeTypeIdAndIsActiveTrueOrderByRowIdDesc(resolvedEmployeeTypeId);
            if (!structures.isEmpty()) {
                HrPayrollStructure latestStruct = structures.get(0);
                List<HrPayrollStructureDetail> details = hrPayrollStructureDetailRepo
                        .findByStructureId(latestStruct.getRowId());
                for (HrPayrollStructureDetail detail : details) {
                    if (detail.getComponent() != null && detail.getComponent().getIsActive() == true) {
                        HrPayrollComponent comp = detail.getComponent();
                        HrPayrollComponent copy = new HrPayrollComponent();
                        copy.setRowId(comp.getRowId());
                        copy.setComponentCode(comp.getComponentCode());
                        copy.setComponentName(comp.getComponentName());
                        copy.setComponentType(comp.getComponentType());
                        copy.setCategory(comp.getCategory());
                        copy.setSequenceNo(comp.getSequenceNo());
                        copy.setIsActive(comp.getIsActive());
                        copy.setIsLopApplicable(comp.getIsLopApplicable());
                        copy.setShowInPayslip(comp.getShowInPayslip());
                        copy.setShowInRegister(comp.getShowInRegister());
                        copy.setEffectiveFrom(comp.getEffectiveFrom());
                        copy.setCalculationType(detail.getCalculationType() != null ? detail.getCalculationType()
                                : comp.getCalculationType());
                        copy.setCalculationValue(detail.getCalculationValue() != null ? detail.getCalculationValue()
                                : comp.getCalculationValue());
                        copy.setFormulaExpression(detail.getFormulaExpression() != null ? detail.getFormulaExpression()
                                : comp.getFormulaExpression());
                        activeComps.add(copy);
                    }
                }
            }
        }

        if (activeComps.isEmpty()) {
            activeComps = hrPayrollComponentRepo.findByIsActiveTrueOrderBySequenceNoAsc();
        } else {
            activeComps.sort(
                    Comparator.comparing(HrPayrollComponent::getSequenceNo, Comparator.nullsLast(Integer::compareTo)));
        }

        List<EmployeeSalaryComponent> savedComps = employeeSalaryComponentRepo.findByEmployeeId(employeeId);
        List<HrPayrollComponent> resultList = new ArrayList<>(activeComps);

        for (EmployeeSalaryComponent sc : savedComps) {
            boolean alreadyIncluded = resultList.stream()
                    .anyMatch(ac -> ac.getComponentCode().equals(sc.getComponentCode()));

            if (!alreadyIncluded) {
                Optional<HrPayrollComponent> inactiveCompOpt = hrPayrollComponentRepo
                        .findByComponentCode(sc.getComponentCode());
                if (inactiveCompOpt.isPresent()) {
                    resultList.add(inactiveCompOpt.get());
                } else {
                    HrPayrollComponent placeholder = new HrPayrollComponent();
                    placeholder.setComponentCode(sc.getComponentCode());
                    placeholder.setComponentName(
                            sc.getComponentName() != null ? sc.getComponentName() : sc.getComponentCode());
                    placeholder.setFormulaExpression(sc.getFormula());
                    placeholder.setIsActive(false);
                    placeholder.setComponentType("EARNING");
                    placeholder.setCalculationType("MANUAL");
                    resultList.add(placeholder);
                }
            }
        }

        // Map saved amounts to transient amount field
        for (HrPayrollComponent c : resultList) {
            savedComps.stream()
                    .filter(sc -> sc.getComponentCode().equals(c.getComponentCode()))
                    .findFirst()
                    .ifPresent(sc -> c.setAmount(sc.getAmount()));
        }
        return resultList;
    }

    public List<EmployeeSalaryComponentLog> getSalaryHistory(Long employeeId) {
        List<EmployeeSalaryComponentLog> logs = employeeSalaryComponentLogRepo.findByEmployeeIdOrderByCreatedDateDesc(employeeId);
        List<HrPayrollComponent> masterComps = hrPayrollComponentRepo.findAll();
        java.util.Map<String, Boolean> showInRegisterMap = masterComps.stream()
                .filter(c -> c.getComponentCode() != null)
                .collect(java.util.stream.Collectors.toMap(
                        c -> c.getComponentCode().trim().toUpperCase(),
                        c -> Boolean.TRUE.equals(c.getShowInRegister()),
                        (existing, replacement) -> existing
                ));
        return logs.stream()
                .filter(log -> {
                    if (log.getComponentCode() == null) return true;
                    String codeKey = log.getComponentCode().trim().toUpperCase();
                    Boolean showInReg = showInRegisterMap.get(codeKey);
                    return showInReg == null || showInReg;
                })
                .collect(java.util.stream.Collectors.toList());
    }

    // ======================== EDUCATION (1:N) ========================

    public List<EmployeeEducation> getEducation(Long employeeId) {
        return educationRepo.findByEmployeeId(employeeId);
    }

    @Transactional
    public EmployeeEducation saveEducation(Long employeeId, EmployeeEducation edu) {
        if (!employeeRepo.existsById(employeeId))
            throw new RuntimeException("Employee not found");
        edu.setEmployeeId(employeeId);
        if (edu.getFromWhere() == null || edu.getFromWhere().trim().isEmpty()) {
            edu.setFromWhere("EMPLOYEE");
        }
        return educationRepo.save(edu);
    }

    public void deleteEducation(Long id) {
        educationRepo.deleteById(id);
    }

    // ======================== EXPERIENCE (1:N) ========================

    public List<EmployeeExperience> getExperience(Long employeeId) {
        return experienceRepo.findByEmployeeId(employeeId);
    }

    @Transactional
    public EmployeeExperience saveExperience(Long employeeId, EmployeeExperience exp) {
        if (!employeeRepo.existsById(employeeId))
            throw new RuntimeException("Employee not found");
        exp.setEmployeeId(employeeId);
        if (exp.getFromWhere() == null || exp.getFromWhere().trim().isEmpty()) {
            exp.setFromWhere("EMPLOYEE");
        }
        return experienceRepo.save(exp);
    }

    public void deleteExperience(Long id) {
        experienceRepo.deleteById(id);
    }

    // ======================== EMERGENCY CONTACT (1:N) ========================

    public List<EmployeeEmergencyContact> getEmergencyContacts(Long employeeId) {
        return emergencyContactRepo.findByEmployeeId(employeeId);
    }

    public EmployeeEmergencyContact saveEmergencyContact(Long employeeId, EmployeeEmergencyContact ec) {
        ec.setEmployeeId(employeeId);
        if (ec.getMobileNumber() != null) {
            ec.setMobileNumber(sanitizeAndValidatePhone("Mobile Number", ec.getMobileNumber()));
        }
        if (ec.getHomePhoneNumber() != null) {
            ec.setHomePhoneNumber(sanitizeAndValidatePhone("Home Phone Number", ec.getHomePhoneNumber()));
        }
        return emergencyContactRepo.save(ec);
    }

    public void deleteEmergencyContact(Long id) {
        emergencyContactRepo.deleteById(id);
    }

    // ======================== PASSPORT ========================

    public EmployeePassport getPassport(Long employeeId) {
        return passportRepo.findByEmployeeId(employeeId).orElse(null);
    }

    public EmployeePassport savePassport(Long employeeId, EmployeePassport passport) {
        passport.setEmployeeId(employeeId);
        EmployeePassport existing = passportRepo.findByEmployeeId(employeeId).orElse(null);
        if (existing != null) {
            passport.setId(existing.getId());
            passport.setCreatedBy(existing.getCreatedBy());
            passport.setCreatedDate(existing.getCreatedDate());
        }
        return passportRepo.save(passport);
    }

    // ======================== DEPENDENT (1:N) ========================

    public List<EmployeeDependent> getDependents(Long employeeId) {
        return dependentRepo.findByEmployeeId(employeeId);
    }

    public EmployeeDependent saveDependent(Long employeeId, EmployeeDependent dep) {
        dep.setEmployeeId(employeeId);
        if (dep.getContactNo() != null) {
            dep.setContactNo(sanitizeAndValidatePhone("Contact No", dep.getContactNo()));
        }
        return dependentRepo.save(dep);
    }

    public void deleteDependent(Long id) {
        dependentRepo.deleteById(id);
    }

    // ======================== ASSET (1:N) ========================

    public List<EmployeeAsset> getAssets(Long employeeId) {
        return assetRepo.findByEmployeeId(employeeId);
    }

    public EmployeeAsset saveAsset(Long employeeId, EmployeeAsset asset) {
        asset.setEmployeeId(employeeId);
        return assetRepo.save(asset);
    }

    public void deleteAsset(Long id) {
        assetRepo.deleteById(id);
    }

    // ======================== KYC ========================

    public EmployeeKyc getKyc(Long employeeId) {
        return kycRepo.findByEmployeeId(employeeId).orElse(null);
    }

    public EmployeeKyc saveKyc(Long employeeId, EmployeeKyc kyc) {
        kyc.setEmployeeId(employeeId);
        EmployeeKyc existing = kycRepo.findByEmployeeId(employeeId).orElse(null);
        if (existing != null) {
            kyc.setId(existing.getId());
            kyc.setCreatedBy(existing.getCreatedBy());
            kyc.setCreatedDate(existing.getCreatedDate());
        }
        return kycRepo.save(kyc);
    }

    // ======================== KYC DOCUMENT (1:N) ========================

    public List<EmployeeKycDocument> getKycDocuments(Long employeeId) {
        return kycDocumentRepo.findByEmployeeId(employeeId);
    }

    public EmployeeKycDocument saveKycDocument(Long employeeId, EmployeeKycDocument doc) {
        doc.setEmployeeId(employeeId);
        if (doc.getFromWhere() == null || doc.getFromWhere().trim().isEmpty()) {
            doc.setFromWhere("EMPLOYEE");
        }
        if (doc.getAttachment() != null && (doc.getFileName() == null || doc.getFileName().trim().isEmpty())) {
            String attachment = doc.getAttachment();
            String name = attachment.substring(Math.max(attachment.lastIndexOf('/'), attachment.lastIndexOf('\\')) + 1);
            doc.setFileName(name);
        }
        return kycDocumentRepo.save(doc);
    }

    public void deleteKycDocument(Long id) {
        kycDocumentRepo.deleteById(id);
    }

    // ======================== ACTIVITY (1:N) ========================

    public List<EmployeeActivity> getActivities(Long employeeId) {
        return activityRepo.findByEmployeeId(employeeId);
    }

    public EmployeeActivity saveActivity(Long employeeId, EmployeeActivity activity) {
        activity.setEmployeeId(employeeId);
        if (activity.getFromWhere() == null || activity.getFromWhere().trim().isEmpty()) {
            activity.setFromWhere("EMPLOYEE");
        }
        return activityRepo.save(activity);
    }

    public void deleteActivity(Long id) {
        activityRepo.deleteById(id);
    }

    private void populateTransientMailFields(EmployeeMaster emp) {
        if (emp != null && emp.getId() != null) {
            jobProfileRepo.findByEmployeeId(emp.getId()).ifPresent(jp -> {
                emp.setOfficeMail(jp.getOfficeEmail());
                emp.setOfficeMailPassword(jp.getOfficialPassword());
            });
            if (emp.getOfficeMail() == null || emp.getOfficeMail().isBlank()) {
                personalRepo.findFirstByEmployeeId(emp.getId()).ifPresent(p -> {
                    if (p.getPersonalEmail() != null && !p.getPersonalEmail().isBlank()) {
                        emp.setOfficeMail(p.getPersonalEmail().trim());
                    }
                });
            }
        }
    }

    private void populateTransientFileInfoFields(EmployeeMaster emp) {
        if (emp == null || emp.getId() == null || emp.getAbility() == null) {
            return;
        }

        List<HrAttachmentPath> attachments = attachmentRepo.findByPageCodeAndRefId("M2110", emp.getId());

        List<String> auditorFiles = new ArrayList<>();
        List<String> auditeeFiles = new ArrayList<>();
        List<String> ncrApproverFiles = new ArrayList<>();
        List<String> taskVerifierFiles = new ArrayList<>();
        List<String> taskTesterFiles = new ArrayList<>();
        List<String> chairedFiles = new ArrayList<>();
        List<String> hostFiles = new ArrayList<>();
        List<String> participantsFiles = new ArrayList<>();

        for (HrAttachmentPath att : attachments) {
            String dt = att.getDocType();
            String path = att.getPath();
            String refStr = att.getReferenceIdString();
            if (dt == null || path == null)
                continue;

            if (dt.equals("ABILITY_AUDITOR") || dt.equals("AUDITOR") || dt.startsWith("AUDITOR_")) {
                String finalRef = (refStr != null && !refStr.trim().isEmpty()) ? refStr
                        : (dt.startsWith("AUDITOR_") ? dt.substring(8) : null);
                if (finalRef != null && !finalRef.trim().isEmpty()) {
                    auditorFiles.add(finalRef + ":" + path);
                } else {
                    auditorFiles.add(path);
                }
            } else if (dt.equals("ABILITY_AUDITEE") || dt.equals("AUDITEE") || dt.startsWith("AUDITEE_")) {
                String finalRef = (refStr != null && !refStr.trim().isEmpty()) ? refStr
                        : (dt.startsWith("AUDITEE_") ? dt.substring(8) : null);
                if (finalRef != null && !finalRef.trim().isEmpty()) {
                    auditeeFiles.add(finalRef + ":" + path);
                } else {
                    auditeeFiles.add(path);
                }
            } else if (dt.equals("ABILITY_NC_APPROVAL") || dt.equals("NCR_APPROVER")
                    || dt.startsWith("NCR_APPROVER_")) {
                String finalRef = (refStr != null && !refStr.trim().isEmpty()) ? refStr
                        : (dt.startsWith("NCR_APPROVER_") ? dt.substring(13) : null);
                if (finalRef != null && !finalRef.trim().isEmpty()) {
                    ncrApproverFiles.add(finalRef + ":" + path);
                } else {
                    ncrApproverFiles.add(path);
                }
            } else if (dt.equals("ABILITY_TASK_VERIFY") || dt.equals("TASK_VERIFIER")
                    || dt.startsWith("TASK_VERIFIER_")) {
                String finalRef = (refStr != null && !refStr.trim().isEmpty()) ? refStr
                        : (dt.startsWith("TASK_VERIFIER_") ? dt.substring(14) : null);
                if (finalRef != null && !finalRef.trim().isEmpty()) {
                    taskVerifierFiles.add(finalRef + ":" + path);
                } else {
                    taskVerifierFiles.add(path);
                }
            } else if (dt.equals("ABILITY_TASK_TESTER") || dt.equals("TASK_TESTER") || dt.startsWith("TASK_TESTER_")) {
                String finalRef = (refStr != null && !refStr.trim().isEmpty()) ? refStr
                        : (dt.startsWith("TASK_TESTER_") ? dt.substring(12) : null);
                if (finalRef != null && !finalRef.trim().isEmpty()) {
                    taskTesterFiles.add(finalRef + ":" + path);
                } else {
                    taskTesterFiles.add(path);
                }
            } else if (dt.startsWith("CHAIRED")) {
                String finalRef = (refStr != null && !refStr.trim().isEmpty()) ? refStr
                        : (dt.startsWith("CHAIRED_") ? dt.substring(8) : null);
                if (finalRef != null && !finalRef.trim().isEmpty()) {
                    chairedFiles.add(finalRef + ":" + path);
                } else {
                    chairedFiles.add(path);
                }
            } else if (dt.startsWith("HOST")) {
                String finalRef = (refStr != null && !refStr.trim().isEmpty()) ? refStr
                        : (dt.startsWith("HOST_") ? dt.substring(5) : null);
                if (finalRef != null && !finalRef.trim().isEmpty()) {
                    hostFiles.add(finalRef + ":" + path);
                } else {
                    hostFiles.add(path);
                }
            } else if (dt.startsWith("PARTICIPANTS")) {
                String finalRef = (refStr != null && !refStr.trim().isEmpty()) ? refStr
                        : (dt.startsWith("PARTICIPANTS_") ? dt.substring(13) : null);
                if (finalRef != null && !finalRef.trim().isEmpty()) {
                    participantsFiles.add(finalRef + ":" + path);
                } else {
                    participantsFiles.add(path);
                }
            }
        }

        com.autonoma.erp.modules.hr.employee.entity.EmployeeAbility ability = emp.getAbility();
        ability.setAuditorFileList(auditorFiles);
        ability.setAuditeeFileList(auditeeFiles);
        ability.setNcrApproverFileList(ncrApproverFiles);
        ability.setTaskVerifierFileList(taskVerifierFiles);
        ability.setTaskTesterFileList(taskTesterFiles);
        ability.setChairedFileList(chairedFiles);
        ability.setHostFileList(hostFiles);
        ability.setParticipantsFileList(participantsFiles);

        if (!auditorFiles.isEmpty())
            emp.setAuditorFileInfo(String.join(",", auditorFiles));
        if (!auditeeFiles.isEmpty())
            emp.setAuditeeFileInfo(String.join(",", auditeeFiles));
        if (!ncrApproverFiles.isEmpty())
            emp.setNcrApproverFileInfo(String.join(",", ncrApproverFiles));
        if (!taskVerifierFiles.isEmpty())
            emp.setTaskVerifierFileInfo(String.join(",", taskVerifierFiles));
        if (!taskTesterFiles.isEmpty())
            emp.setTaskTesterFileInfo(String.join(",", taskTesterFiles));
        if (!chairedFiles.isEmpty())
            emp.setChairedFileInfo(String.join(",", chairedFiles));
        if (!hostFiles.isEmpty())
            emp.setHostFileInfo(String.join(",", hostFiles));
        if (!participantsFiles.isEmpty())
            emp.setParticipantsFileInfo(String.join(",", participantsFiles));
    }

    private void saveAbilityAttachments(EmployeeMaster emp) {
        if (emp == null || emp.getId() == null || emp.getAbility() == null) {
            return;
        }

        // 1. Delete existing attachments of these types
        List<HrAttachmentPath> existingAtts = attachmentRepo.findByPageCodeAndRefId("M2110", emp.getId());
        List<HrAttachmentPath> toDelete = existingAtts.stream()
                .filter(a -> {
                    String dt = a.getDocType();
                    if (dt == null)
                        return false;
                    return dt.startsWith("AUDITOR_") || dt.equals("AUDITOR") || dt.equals("ABILITY_AUDITOR") ||
                            dt.startsWith("AUDITEE_") || dt.equals("AUDITEE") || dt.equals("ABILITY_AUDITEE") ||
                            dt.startsWith("NCR_APPROVER_") || dt.equals("NCR_APPROVER")
                            || dt.equals("ABILITY_NC_APPROVAL") ||
                            dt.startsWith("TASK_VERIFIER_") || dt.equals("TASK_VERIFIER")
                            || dt.equals("ABILITY_TASK_VERIFY") ||
                            dt.startsWith("TASK_TESTER_") || dt.equals("TASK_TESTER")
                            || dt.equals("ABILITY_TASK_TESTER") ||
                            dt.startsWith("CHAIRED_") || dt.equals("CHAIRED") ||
                            dt.startsWith("HOST_") || dt.equals("HOST") ||
                            dt.startsWith("PARTICIPANTS_") || dt.equals("PARTICIPANTS");
                })
                .collect(Collectors.toList());
        attachmentRepo.deleteAll(toDelete);

        // 2. Insert new attachments
        String updatedBy = emp.getUpdatedBy() != null ? emp.getUpdatedBy()
                : (emp.getCreatedBy() != null ? emp.getCreatedBy() : "System");
        com.autonoma.erp.modules.hr.employee.entity.EmployeeAbility ability = emp.getAbility();

        saveAbilityList(emp.getId(), ability.getAuditorFileList(), "ABILITY_AUDITOR", updatedBy);
        saveAbilityList(emp.getId(), ability.getAuditeeFileList(), "ABILITY_AUDITEE", updatedBy);
        saveAbilityList(emp.getId(), ability.getNcrApproverFileList(), "ABILITY_NC_APPROVAL", updatedBy);
        saveAbilityList(emp.getId(), ability.getTaskVerifierFileList(), "ABILITY_TASK_VERIFY", updatedBy);
        saveAbilityList(emp.getId(), ability.getTaskTesterFileList(), "ABILITY_TASK_TESTER", updatedBy);
        saveAbilityList(emp.getId(), ability.getChairedFileList(), "CHAIRED", updatedBy);
        saveAbilityList(emp.getId(), ability.getHostFileList(), "HOST", updatedBy);
        saveAbilityList(emp.getId(), ability.getParticipantsFileList(), "PARTICIPANTS", updatedBy);
    }

    private void saveAbilityList(Long employeeId, List<String> fileList, String docType, String updatedBy) {
        if (fileList == null)
            return;
        for (String entry : fileList) {
            if (entry == null || entry.trim().isEmpty())
                continue;
            String refStr = null;
            String path = entry;
            if (entry.contains(":")) {
                int colonIdx = entry.indexOf(":");
                refStr = entry.substring(0, colonIdx);
                path = entry.substring(colonIdx + 1);
            }
            HrAttachmentPath att = new HrAttachmentPath();
            att.setPageCode("M2110");
            att.setRefId(employeeId);
            att.setDocType(docType);
            att.setPath(path);
            att.setReferenceIdString(refStr);
            att.setFileName(getFileNameFromPath(path));
            att.setFromWhere("EMPLOYEE");
            att.setCreatedBy(updatedBy != null ? updatedBy : "System");
            att.setCreatedDate(new Date());
            attachmentRepo.save(att);
        }
    }

    private String getFileNameFromPath(String path) {
        if (path == null)
            return "";
        int slashIdx = path.lastIndexOf('/');
        if (slashIdx > -1) {
            return path.substring(slashIdx + 1);
        }
        return path;
    }

    private void populateManagerFieldsFromMapping(EmployeeMaster emp) {
        if (emp == null || emp.getId() == null)
            return;
        if (!employeeRepo.existsById(emp.getId()))
            return;
        EmployeeManagerMapping mapping = managerMappingRepo.findByEmpId(emp.getId()).orElse(null);
        boolean isNew = false;
        if (mapping == null) {
            mapping = new EmployeeManagerMapping(null, emp.getId(), null, null, null, null, "System", new Date(), null,
                    null, "Active");
            isNew = true;
        }

        boolean modified = false;
        String vh = emp.getVerticalHead();
        if (mapping.getVerticalHeadId() == null && vh != null && !vh.trim().isEmpty()) {
            EmployeeMaster mgr = employeeRepo.findByEmpCodeOrName(vh).orElse(null);
            if (mgr != null) {
                mapping.setVerticalHeadId(mgr.getId());
                modified = true;
            }
        }
        String hrVal = emp.getHrManager();
        if (mapping.getHrId() == null && hrVal != null && !hrVal.trim().isEmpty()) {
            EmployeeMaster hr = employeeRepo.findByEmpCodeOrName(hrVal).orElse(null);
            if (hr != null) {
                mapping.setHrId(hr.getId());
                modified = true;
            }
        }
        String hm = emp.getHomeManager();
        if (mapping.getHomeManagerId() == null && hm != null && !hm.trim().isEmpty()) {
            EmployeeMaster mgr = employeeRepo.findByEmpCodeOrName(hm).orElse(null);
            if (mgr != null) {
                mapping.setHomeManagerId(mgr.getId());
                modified = true;
            }
        }
        String bm = emp.getBusinessManager();
        if (mapping.getBusinessManagerId() == null && bm != null && !bm.trim().isEmpty()) {
            EmployeeMaster mgr = employeeRepo.findByEmpCodeOrName(bm).orElse(null);
            if (mgr != null) {
                mapping.setBusinessManagerId(mgr.getId());
                modified = true;
            }
        }

        if (isNew || modified) {
            try {
                mapping = managerMappingRepo.saveAndFlush(mapping);
            } catch (Exception e) {
                log.warn("[ManagerMapping] Skipped saving mapping for emp ID {}: {}", emp.getId(), e.getMessage());
            }
        }

        final EmployeeManagerMapping finalMapping = mapping;
        if (finalMapping.getVerticalHeadId() != null) {
            employeeRepo.findById(finalMapping.getVerticalHeadId()).ifPresent(mgr -> {
                emp.setVerticalHead(
                        mgr.getOldEmpCode() != null && !mgr.getOldEmpCode().trim().isEmpty() ? mgr.getOldEmpCode()
                                : mgr.getEmpCode());
            });
        } else {
            emp.setVerticalHead(null);
        }
        if (finalMapping.getHrId() != null) {
            employeeRepo.findById(finalMapping.getHrId()).ifPresent(hr -> {
                emp.setHrManager(hr.getOldEmpCode() != null && !hr.getOldEmpCode().trim().isEmpty() ? hr.getOldEmpCode()
                        : hr.getEmpCode());
            });
        } else {
            emp.setHrManager(null);
        }
        if (finalMapping.getHomeManagerId() != null) {
            employeeRepo.findById(finalMapping.getHomeManagerId()).ifPresent(hMgr -> {
                emp.setHomeManager(
                        hMgr.getOldEmpCode() != null && !hMgr.getOldEmpCode().trim().isEmpty() ? hMgr.getOldEmpCode()
                                : hMgr.getEmpCode());
            });
        } else {
            emp.setHomeManager(null);
        }
        if (finalMapping.getBusinessManagerId() != null) {
            employeeRepo.findById(finalMapping.getBusinessManagerId()).ifPresent(bMgr -> {
                emp.setBusinessManager(
                        bMgr.getOldEmpCode() != null && !bMgr.getOldEmpCode().trim().isEmpty() ? bMgr.getOldEmpCode()
                                : bMgr.getEmpCode());
            });
        } else {
            emp.setBusinessManager(null);
        }
    }

    @Transactional
    public void syncAllMappingsFromExistingColumns() {
        List<EmployeeMaster> all = employeeRepo.findAll();
        for (EmployeeMaster emp : all) {
            if (emp.getId() == null || !employeeRepo.existsById(emp.getId()))
                continue;
            EmployeeManagerMapping mapping = managerMappingRepo.findByEmpId(emp.getId()).orElse(null);
            boolean isNew = false;
            if (mapping == null) {
                mapping = new EmployeeManagerMapping(null, emp.getId(), null, null, null, null, "System", new Date(),
                        null, null, "Active");
                isNew = true;
            }

            boolean modified = false;
            if (mapping.getVerticalHeadId() == null) {
                String vh = emp.getVerticalHead();
                if (vh != null && !vh.trim().isEmpty()) {
                    EmployeeMaster mgr = employeeRepo.findByEmpCodeOrName(vh).orElse(null);
                    if (mgr != null) {
                        mapping.setVerticalHeadId(mgr.getId());
                        modified = true;
                    }
                }
            }
            if (mapping.getHrId() == null) {
                String hrVal = emp.getHrManager();
                if (hrVal != null && !hrVal.trim().isEmpty()) {
                    EmployeeMaster hr = employeeRepo.findByEmpCodeOrName(hrVal).orElse(null);
                    if (hr != null) {
                        mapping.setHrId(hr.getId());
                        modified = true;
                    }
                }
            }
            if (mapping.getHomeManagerId() == null) {
                String hm = emp.getHomeManager();
                if (hm != null && !hm.trim().isEmpty()) {
                    EmployeeMaster mgr = employeeRepo.findByEmpCodeOrName(hm).orElse(null);
                    if (mgr != null) {
                        mapping.setHomeManagerId(mgr.getId());
                        modified = true;
                    }
                }
            }
            if (mapping.getBusinessManagerId() == null) {
                String bm = emp.getBusinessManager();
                if (bm != null && !bm.trim().isEmpty()) {
                    EmployeeMaster mgr = employeeRepo.findByEmpCodeOrName(bm).orElse(null);
                    if (mgr != null) {
                        mapping.setBusinessManagerId(mgr.getId());
                        modified = true;
                    }
                }
            }

            if (isNew || modified) {
                String currentUserId = null;
                try {
                    currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
                } catch (Exception ignored) {}
                if (currentUserId == null || currentUserId.trim().isEmpty()) {
                    currentUserId = "Admin";
                }
                if (mapping.getCreatedBy() == null || mapping.getCreatedBy().trim().isEmpty()) {
                    mapping.setCreatedBy(currentUserId);
                }
                mapping.setUpdatedBy(currentUserId);
                mapping.setUpdatedDate(new Date());
                managerMappingRepo.save(mapping);
            }
        }
        managerMappingRepo.flush();
    }

    private void saveOrUpdateManagerMapping(EmployeeMaster employee) {
        if (employee == null || employee.getId() == null || !employeeRepo.existsById(employee.getId()))
            return;
        EmployeeManagerMapping mapping = managerMappingRepo.findByEmpId(employee.getId())
                .orElse(new EmployeeManagerMapping(null, employee.getId(), null, null, null, null, null, null, null,
                        null, "Active"));

        Long verticalHeadId = null;
        if (employee.getVerticalHead() != null && !employee.getVerticalHead().trim().isEmpty()) {
            EmployeeMaster mgr = employeeRepo.findByEmpCodeOrName(employee.getVerticalHead()).orElse(null);
            if (mgr != null) {
                verticalHeadId = mgr.getId();
            }
        }
        mapping.setVerticalHeadId(verticalHeadId);

        Long hrId = null;
        if (employee.getHrManager() != null && !employee.getHrManager().trim().isEmpty()) {
            EmployeeMaster hr = employeeRepo.findByEmpCodeOrName(employee.getHrManager()).orElse(null);
            if (hr != null) {
                hrId = hr.getId();
            }
        }
        mapping.setHrId(hrId);

        Long homeManagerId = null;
        if (employee.getHomeManager() != null && !employee.getHomeManager().trim().isEmpty()) {
            EmployeeMaster hm = employeeRepo.findByEmpCodeOrName(employee.getHomeManager()).orElse(null);
            if (hm != null) {
                homeManagerId = hm.getId();
            }
        }
        mapping.setHomeManagerId(homeManagerId);

        Long businessManagerId = null;
        if (employee.getBusinessManager() != null && !employee.getBusinessManager().trim().isEmpty()) {
            EmployeeMaster bm = employeeRepo.findByEmpCodeOrName(employee.getBusinessManager()).orElse(null);
            if (bm != null) {
                businessManagerId = bm.getId();
            }
        }
        mapping.setBusinessManagerId(businessManagerId);

        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception ignored) {}
        if (currentUserId == null || currentUserId.trim().isEmpty()) {
            currentUserId = "Admin";
        }

        if (mapping.getId() == null) {
            mapping.setCreatedBy(currentUserId);
            mapping.setCreatedDate(new Date());
        } else {
            mapping.setUpdatedBy(currentUserId);
            mapping.setUpdatedDate(new Date());
            if (mapping.getCreatedBy() == null || mapping.getCreatedBy().trim().isEmpty()) {
                mapping.setCreatedBy(currentUserId);
            }
        }
        managerMappingRepo.save(mapping);
    }

    private void populateTransientMailFields(Collection<EmployeeMaster> employees) {
        if (employees != null && !employees.isEmpty()) {
            List<Long> empIds = employees.stream()
                    .map(EmployeeMaster::getId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
            if (empIds.isEmpty()) return;
            List<EmployeeJobProfile> profiles = jobProfileRepo.findByEmployeeIdIn(empIds);
            Map<Long, EmployeeJobProfile> profileMap = profiles.stream()
                    .filter(jp -> jp.getEmployeeId() != null)
                    .collect(Collectors.toMap(EmployeeJobProfile::getEmployeeId, jp -> jp, (jp1, jp2) -> jp1));
            List<EmployeePersonalDetail> personals = personalRepo.findByEmployeeIdIn(empIds);
            Map<Long, EmployeePersonalDetail> personalMap = personals.stream()
                    .filter(p -> p.getEmployeeId() != null)
                    .collect(Collectors.toMap(EmployeePersonalDetail::getEmployeeId, p -> p, (p1, p2) -> p1));
            for (EmployeeMaster emp : employees) {
                EmployeeJobProfile jp = profileMap.get(emp.getId());
                if (jp != null) {
                    emp.setOfficeMail(jp.getOfficeEmail());
                    emp.setOfficeMailPassword(jp.getOfficialPassword());
                    emp.setLeaveAllowed(jp.getLeaveAllowed());
                    emp.setOdAllowed(jp.getOdAllowed());
                    emp.setPermissionRequest(jp.getPermissionRequest());
                }
                if (emp.getOfficeMail() == null || emp.getOfficeMail().isBlank()) {
                    EmployeePersonalDetail p = personalMap.get(emp.getId());
                    if (p != null && p.getPersonalEmail() != null && !p.getPersonalEmail().isBlank()) {
                        emp.setOfficeMail(p.getPersonalEmail().trim());
                    }
                }
            }
        }
    }

    public EmployeeOfficeMailCredentials getOfficeMailCredentials(Long employeeId) {
        if (employeeId == null) {
            return new EmployeeOfficeMailCredentials(null, null, false);
        }
        return jobProfileRepo.findByEmployeeId(employeeId)
                .map(jp -> {
                    String email = jp.getOfficeEmail();
                    String pwd = jp.getOfficialPassword();
                    boolean configured = email != null && !email.trim().isEmpty() &&
                            pwd != null && !pwd.trim().isEmpty();
                    return new EmployeeOfficeMailCredentials(
                            email != null ? email.trim() : null,
                            pwd != null ? pwd.trim() : null,
                            configured);
                })
                .orElseGet(() -> new EmployeeOfficeMailCredentials(null, null, false));
    }

    private String sanitizeAndValidatePhone(String fieldName, String phoneVal) {
        if (phoneVal == null || phoneVal.trim().isEmpty()) {
            return phoneVal;
        }
        String val = phoneVal.trim();
        List<com.autonoma.erp.modules.master.geography.entity.CountryMaster> countries = countryRepo.findAll();
        
        // Remove spaces, tabs, and carriage returns
        val = val.replaceAll("[\\r\\n\\t\\s]", "");

        // Sort by country code length descending
        countries.sort((a, b) -> {
            String codeA = a.getCountryCode() != null ? a.getCountryCode() : "";
            String codeB = b.getCountryCode() != null ? b.getCountryCode() : "";
            return Integer.compare(codeB.length(), codeA.length());
        });

        // 1. Remove duplicate country code prefixes if they exist (e.g. INDIND7676667887 or +91+917676667887)
        boolean normalized = true;
        while (normalized) {
            normalized = false;
            for (com.autonoma.erp.modules.master.geography.entity.CountryMaster c : countries) {
                String code = c.getCountryCode();
                if (code != null && !code.isEmpty() && val.startsWith(code + code)) {
                    val = val.substring(code.length());
                    normalized = true;
                    break;
                }
                String isd = c.getIsd();
                if (isd != null && !isd.isEmpty()) {
                    String cleanIsd = isd.replaceAll("[^0-9+]", "");
                    if (val.startsWith(cleanIsd + cleanIsd)) {
                        val = val.substring(cleanIsd.length());
                        normalized = true;
                        break;
                    }
                }
            }
        }

        // 2. Perform the validation check
        com.autonoma.erp.modules.master.geography.entity.CountryMaster matchedCountry = null;
        String localNum = val;
        for (com.autonoma.erp.modules.master.geography.entity.CountryMaster c : countries) {
            if (c.getCountryCode() != null && !c.getCountryCode().isEmpty() && val.startsWith(c.getCountryCode())) {
                matchedCountry = c;
                localNum = val.substring(c.getCountryCode().length());
                break;
            }
        }

        if (matchedCountry == null && !countries.isEmpty()) {
            matchedCountry = countries.get(0);
        }

        if (matchedCountry != null) {
            // Strip formatting symbols (only digits should remain in the local number)
            String localDigits = localNum.replaceAll("[^0-9]", "");
            
            // Check for invalid alphabetic content in the local number
            if (localNum.matches(".*[A-Za-z].*")) {
                throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, 
                    fieldName + " contains invalid alphabetic characters."
                );
            }

            int min = matchedCountry.getPhoneMinLength() != null ? matchedCountry.getPhoneMinLength() : 8;
            int max = matchedCountry.getPhoneMaxLength() != null ? matchedCountry.getPhoneMaxLength() : 15;

            if (localDigits.length() < min || localDigits.length() > max) {
                String message = min == max 
                    ? fieldName + " must be " + min + " digits."
                    : fieldName + " must be between " + min + " and " + max + " digits.";
                throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, 
                    message
                );
            }
        }
        return val;
    }
}
