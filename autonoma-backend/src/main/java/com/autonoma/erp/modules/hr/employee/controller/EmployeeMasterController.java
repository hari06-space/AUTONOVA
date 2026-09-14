package com.autonoma.erp.modules.hr.employee.controller;

import com.autonoma.erp.repository.admin.UserRepository;
import com.autonoma.erp.util.SecurityUtils;

import com.autonoma.erp.modules.hr.orgstructure.entity.DesignationLevel;
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
import com.autonoma.erp.modules.hr.employee.entity.EmployeeManagerMapping;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.employee.entity.EmployeePassport;
import com.autonoma.erp.modules.hr.employee.entity.EmployeePersonalDetail;
import com.autonoma.erp.modules.hr.orgstructure.repository.DesignationLevelRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeManagerMappingRepository;

import com.autonoma.erp.modules.hr.employee.service.EmployeeMasterService;
import com.autonoma.erp.model.payroll.HrPayrollComponent;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeSalaryComponentLog;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import com.autonoma.erp.security.RequirePagePermission;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/master/hr/employees")
@CrossOrigin(origins = "*", maxAge = 3600)
@Tag(name = "HRM - Employee Master", description = "Full Employee Master CRUD with sub-resources")
public class EmployeeMasterController {

    @Autowired
    private EmployeeMasterService service;

    @Autowired
    private com.autonoma.erp.modules.hr.employee.repository.EmployeeManagerMappingRepository managerMappingRepository;

    @Autowired
    private com.autonoma.erp.repository.admin.UserRepository userRepository;

    @Autowired
    private com.autonoma.erp.modules.hr.orgstructure.repository.DesignationLevelRepository designationLevelRepository;

    // ======================== EMPLOYEE MASTER ========================

    @GetMapping
    @Operation(summary = "List all employees")
    public List<EmployeeMaster> getAllEmployees() {
        return service.getAllEmployees();
    }

    @GetMapping("/list")
    @Operation(summary = "List all employees (lightweight projection for UI list view)")
    public List<com.autonoma.erp.modules.hr.employee.dto.EmployeeMasterListDto> getEmployeeList() {
        return service.getAllEmployeesProjected();
    }

    @GetMapping("/filter/active")
    @Operation(summary = "List only active employees")
    public List<EmployeeMaster> getActiveEmployees() {
        return service.getActiveEmployees();
    }

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @GetMapping("/active-office-mails")
    @Operation(summary = "List office mails for employees with status = 12 in HR_EMPLOYEE")
    public List<Map<String, Object>> getActiveEmployeeOfficeMails() {
        return jdbcTemplate.queryForList(
            "SELECT DISTINCT " +
            "e.id as id, " +
            "COALESCE(NULLIF(e.old_emp_code, ''), e.emp_code) as empCode, " +
            "COALESCE(NULLIF(TRIM(e.employee_name), ''), NULLIF(TRIM(CONCAT(e.first_name, ' ', e.last_name)), ''), NULLIF(TRIM(e.first_name), ''), '') as employeeName, " +
            "e.profile_upload as photoPath, " +
            "COALESCE(" +
            "  NULLIF(TRIM(jp.office_email), ''), " +
            "  NULLIF(TRIM(o.office_mail), '')" +
            ") as officeMail " +
            "FROM HR_EMPLOYEE e " +
            "LEFT JOIN HR_EMPLOYEE_JOB_PROFILE jp ON e.id = jp.employee_id " +
            "LEFT JOIN HR_EMPLOYEE_ORGANIZATION o ON e.id = o.employee_id " +
            "WHERE (e.status = 12 OR CAST(e.status AS NVARCHAR(50)) = '12') " +
            "AND (" +
            "  (jp.office_email IS NOT NULL AND TRIM(jp.office_email) <> '') " +
            "  OR (o.office_mail IS NOT NULL AND TRIM(o.office_mail) <> '') " +
            ")"
        );
    }

    @GetMapping("/filter/active-with-salary")
    @Operation(summary = "List active employees who have a configured salary structure")
    public List<EmployeeMaster> getActiveEmployeesWithSalary() {
        return service.getActiveEmployeesWithSalary();
    }

    @GetMapping("/next-no")
    @Operation(summary = "Get next autogenerated employee code")
    public ResponseEntity<String> getNextEmpCode() {
        return ResponseEntity.ok(service.getNextEmpCode());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get employee by ID")
    public ResponseEntity<EmployeeMaster> getEmployeeById(@PathVariable Long id) {
        EmployeeMaster emp = service.getEmployeeById(id);
        return emp != null ? ResponseEntity.ok(emp) : ResponseEntity.notFound().build();
    }

    @GetMapping("/{id}/full")
    @Operation(summary = "Get employee with ALL sub-resources (full form load)")
    public ResponseEntity<Map<String, Object>> getEmployeeFull(@PathVariable Long id) {
        Map<String, Object> data = service.getEmployeeFull(id);
        return data != null ? ResponseEntity.ok(data) : ResponseEntity.notFound().build();
    }

    @GetMapping("/edit/{id}")
    @Operation(summary = "Get lightweight employee edit data")
    public ResponseEntity<com.autonoma.erp.modules.hr.employee.dto.EmployeeEditDto> getEmployeeEdit(@PathVariable Long id) {
        EmployeeMaster emp = service.getEmployeeById(id);
        if (emp == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(new com.autonoma.erp.modules.hr.employee.dto.EmployeeEditDto(
            emp.getId(), emp.getEmpCode(), emp.getEmployeeName(), emp.getDepartmentId(), emp.getDesignationId()
        ));
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M2210", action = "write")
    @Operation(summary = "Create new employee")
    @Caching(evict = {
        @CacheEvict(value = "masterCache", key = "'EMPLOYEES'"),
        @CacheEvict(value = "masterCache", key = "'hr'")
    })
    public EmployeeMaster createEmployee(@RequestBody EmployeeMaster employee) {
        return service.createEmployee(employee);
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "M2210", action = "write")
    @Operation(summary = "Update employee")
    @Caching(evict = {
        @CacheEvict(value = "masterCache", key = "'EMPLOYEES'"),
        @CacheEvict(value = "masterCache", key = "'hr'")
    })
    public ResponseEntity<EmployeeMaster> updateEmployee(@PathVariable Long id, @RequestBody EmployeeMaster details) {
        EmployeeMaster updated = service.updateEmployee(id, details);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "M2210", action = "delete")
    @Operation(summary = "Delete employee and all sub-resources")
    @Caching(evict = {
        @CacheEvict(value = "masterCache", key = "'EMPLOYEES'"),
        @CacheEvict(value = "masterCache", key = "'hr'")
    })
    public ResponseEntity<Void> deleteEmployee(@PathVariable Long id) {
        service.deleteEmployee(id);
        return ResponseEntity.ok().build();
    }

    // ======================== SELF ASSESSMENT ========================

    @GetMapping("/{id}/self-assessment")
    @Operation(summary = "Get employee self-assessment details")
    public ResponseEntity<com.autonoma.erp.modules.hr.employee.entity.EmployeeSelfAssessment> getSelfAssessment(@PathVariable Long id) {
        EmployeeMaster emp = service.getEmployeeById(id);
        if (emp == null) return ResponseEntity.notFound().build();
        com.autonoma.erp.modules.hr.employee.entity.EmployeeSelfAssessment sa = emp.getSelfAssessment();
        if (sa == null) {
            sa = new com.autonoma.erp.modules.hr.employee.entity.EmployeeSelfAssessment();
            sa.setEmployee(emp);
        }
        return ResponseEntity.ok(sa);
    }

    @PostMapping("/{id}/self-assessment")
    @RequirePagePermission(pageCode = "M2210", action = "write")
    @Operation(summary = "Save/update employee self-assessment details")
    public ResponseEntity<com.autonoma.erp.modules.hr.employee.entity.EmployeeSelfAssessment> saveSelfAssessment(@PathVariable Long id, @RequestBody EmployeeMaster details) {
        EmployeeMaster emp = service.getEmployeeById(id);
        if (emp == null) return ResponseEntity.notFound().build();

        emp.setQ1_native(details.getQ1_native());
        emp.setQ2_presentAddress(details.getQ2_presentAddress());
        emp.setQ3_permanentAddress(details.getQ3_permanentAddress());
        emp.setQ4_fatherOccupation(details.getQ4_fatherOccupation());
        emp.setQ5_motherOccupation(details.getQ5_motherOccupation());
        emp.setQ6_maritalStatus(details.getQ6_maritalStatus());
        emp.setQ7_spouseOccupation(details.getQ7_spouseOccupation());
        emp.setQ8_children(details.getQ8_children());
        emp.setQ9_hasRelativesInCompany(details.getQ9_hasRelativesInCompany());
        emp.setQ10_relativesDetails(details.getQ10_relativesDetails());
        emp.setQ11_siblingsOccupations(details.getQ11_siblingsOccupations());
        emp.setQ12_hasTwoWheeler(details.getQ12_hasTwoWheeler());
        emp.setQ13_hasAndroidPhone(details.getQ13_hasAndroidPhone());
        emp.setQ14_knowsCarDriving(details.getQ14_knowsCarDriving());
        emp.setQ15_willingToTravel(details.getQ15_willingToTravel());
        emp.setQ16_covidVaccination(details.getQ16_covidVaccination());
        emp.setQ17_positivePoints(details.getQ17_positivePoints());
        emp.setQ18_negativePoints(details.getQ18_negativePoints());
        emp.setQ19_lifeGoals(details.getQ19_lifeGoals());
        emp.setQ20_improvementSuggestions(details.getQ20_improvementSuggestions());
        emp.setQ20_willingRotationalShifts(details.getQ20_willingRotationalShifts());
        emp.setQ21_isExperienced(details.getQ21_isExperienced());
        emp.setQ22_totalExperience(details.getQ22_totalExperience());
        emp.setQ23_coreExperience(details.getQ23_coreExperience());
        emp.setQ24_prevNetSalary(details.getQ24_prevNetSalary());
        emp.setQ25_prevGrossSalary(details.getQ25_prevGrossSalary());
        emp.setQ26_expectedNetSalary(details.getQ26_expectedNetSalary());
        emp.setQ27_expectedGrossSalary(details.getQ27_expectedGrossSalary());
        emp.setQ28_pfHigherPension(details.getQ28_pfHigherPension());
        emp.setQ29_pfDeductionAmount(details.getQ29_pfDeductionAmount());
        emp.setQ30_alternativeDepartment(details.getQ30_alternativeDepartment());
        emp.setQ31_prevLocation(details.getQ31_prevLocation());
        emp.setQ32_prevShift(details.getQ32_prevShift());
        emp.setQ33_reasonForLeaving(details.getQ33_reasonForLeaving());
        emp.setQ34_noticePeriod(details.getQ34_noticePeriod());
        emp.setQ35_prevDeptPosition(details.getQ35_prevDeptPosition());
        emp.setQ36_prevDeptCount(details.getQ36_prevDeptCount());
        emp.setQ38_handleMistake(details.getQ38_handleMistake());
        emp.setQ39_handleOpinionDifference(details.getQ39_handleOpinionDifference());
        emp.setQ40_computerSelfRating(details.getQ40_computerSelfRating());
        emp.setQ41_hrMgrName(details.getQ41_hrMgrName());
        emp.setQ42_hrMgrEmail(details.getQ42_hrMgrEmail());
        emp.setQ43_hrMgrPhone(details.getQ43_hrMgrPhone());
        emp.setQ44_vertHeadName(details.getQ44_vertHeadName());
        emp.setQ45_vertHeadEmail(details.getQ45_vertHeadEmail());
        emp.setQ46_vertHeadPhone(details.getQ46_vertHeadPhone());
        emp.setPayslipPath(details.getPayslipPath());

        EmployeeMaster updated = service.updateEmployee(id, emp);
        com.autonoma.erp.modules.hr.employee.entity.EmployeeSelfAssessment sa = updated.getSelfAssessment();
        if (sa == null) {
            sa = new com.autonoma.erp.modules.hr.employee.entity.EmployeeSelfAssessment();
            sa.setEmployee(updated);
        }
        return ResponseEntity.ok(sa);
    }

    // ======================== PERSONAL DETAIL ========================

    @GetMapping("/{id}/personal")
    @Operation(summary = "Get personal details")
    public ResponseEntity<?> getPersonalDetail(@PathVariable Long id) {
        EmployeePersonalDetail detail = service.getPersonalDetail(id);
        return detail != null ? ResponseEntity.ok(detail) : ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/personal")
    @RequirePagePermission(pageCode = "M2210", action = "write")
    @Operation(summary = "Save/update personal details")
    public EmployeePersonalDetail savePersonalDetail(@PathVariable Long id, @RequestBody EmployeePersonalDetail detail) {
        return service.savePersonalDetail(id, detail);
    }

    // ======================== CONTACT ========================

    @GetMapping("/{id}/contact")
    @Operation(summary = "Get contact details")
    public ResponseEntity<?> getContact(@PathVariable Long id) {
        EmployeeContact contact = service.getContact(id);
        return contact != null ? ResponseEntity.ok(contact) : ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/contact")
    @RequirePagePermission(pageCode = "M2210", action = "write")
    @Operation(summary = "Save/update contact details")
    public EmployeeContact saveContact(@PathVariable Long id, @RequestBody EmployeeContact contact) {
        return service.saveContact(id, contact);
    }

    // ======================== JOB PROFILE ========================

    @GetMapping("/{id}/job-profile")
    @Operation(summary = "Get job profile")
    public ResponseEntity<?> getJobProfile(@PathVariable Long id) {
        EmployeeJobProfile profile = service.getJobProfile(id);
        return profile != null ? ResponseEntity.ok(profile) : ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/job-profile")
    @RequirePagePermission(pageCode = "M2210", action = "write")
    @Operation(summary = "Save/update job profile")
    public EmployeeJobProfile saveJobProfile(@PathVariable Long id, @RequestBody EmployeeJobProfile profile) {
        return service.saveJobProfile(id, profile);
    }

    @GetMapping("/{id}/payroll-components")
    @Operation(summary = "Get payroll components including active and inactive saved ones")
    public List<HrPayrollComponent> getPayrollComponents(
            @PathVariable Long id,
            @RequestParam(required = false) String employeeType) {
        return service.getPayrollComponentsForEmployee(id, employeeType);
    }

    @GetMapping("/{id}/salary-history")
    @Operation(summary = "Get salary component modification history logs")
    public List<EmployeeSalaryComponentLog> getSalaryHistory(@PathVariable Long id) {
        return service.getSalaryHistory(id);
    }

    // ======================== EDUCATION (1:N) ========================

    @GetMapping("/{id}/education")
    @Operation(summary = "Get all education records")
    public List<EmployeeEducation> getEducation(@PathVariable Long id) {
        return service.getEducation(id);
    }

    @PostMapping("/{id}/education")
    @RequirePagePermission(pageCode = "M2210", action = "write")
    @Operation(summary = "Add/update education record")
    public EmployeeEducation saveEducation(@PathVariable Long id, @RequestBody EmployeeEducation edu) {
        return service.saveEducation(id, edu);
    }

    @DeleteMapping("/education/{eduId}")
    @RequirePagePermission(pageCode = "M2210", action = "delete")
    @Operation(summary = "Delete education record")
    public ResponseEntity<Void> deleteEducation(@PathVariable Long eduId) {
        service.deleteEducation(eduId);
        return ResponseEntity.ok().build();
    }

    // ======================== EXPERIENCE (1:N) ========================

    @GetMapping("/{id}/experience")
    @Operation(summary = "Get all experience records")
    public List<EmployeeExperience> getExperience(@PathVariable Long id) {
        return service.getExperience(id);
    }

    @PostMapping("/{id}/experience")
    @RequirePagePermission(pageCode = "M2210", action = "write")
    @Operation(summary = "Add/update experience record")
    public EmployeeExperience saveExperience(@PathVariable Long id, @RequestBody EmployeeExperience exp) {
        return service.saveExperience(id, exp);
    }

    @DeleteMapping("/experience/{expId}")
    @RequirePagePermission(pageCode = "M2210", action = "delete")
    @Operation(summary = "Delete experience record")
    public ResponseEntity<Void> deleteExperience(@PathVariable Long expId) {
        service.deleteExperience(expId);
        return ResponseEntity.ok().build();
    }

    // ======================== EMERGENCY CONTACT (1:N) ========================

    @GetMapping("/{id}/emergency-contact")
    @Operation(summary = "Get all emergency contacts")
    public List<EmployeeEmergencyContact> getEmergencyContacts(@PathVariable Long id) {
        return service.getEmergencyContacts(id);
    }

    @PostMapping("/{id}/emergency-contact")
    @RequirePagePermission(pageCode = "M2210", action = "write")
    @Operation(summary = "Add/update emergency contact")
    public EmployeeEmergencyContact saveEmergencyContact(@PathVariable Long id, @RequestBody EmployeeEmergencyContact ec) {
        return service.saveEmergencyContact(id, ec);
    }

    @DeleteMapping("/emergency-contact/{ecId}")
    @RequirePagePermission(pageCode = "M2210", action = "delete")
    @Operation(summary = "Delete emergency contact")
    public ResponseEntity<Void> deleteEmergencyContact(@PathVariable Long ecId) {
        service.deleteEmergencyContact(ecId);
        return ResponseEntity.ok().build();
    }

    // ======================== PASSPORT ========================

    @GetMapping("/{id}/passport")
    @Operation(summary = "Get passport details")
    public ResponseEntity<?> getPassport(@PathVariable Long id) {
        EmployeePassport passport = service.getPassport(id);
        return passport != null ? ResponseEntity.ok(passport) : ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/passport")
    @RequirePagePermission(pageCode = "M2210", action = "write")
    @Operation(summary = "Save/update passport details")
    public EmployeePassport savePassport(@PathVariable Long id, @RequestBody EmployeePassport passport) {
        return service.savePassport(id, passport);
    }

    // ======================== DEPENDENT (1:N) ========================

    @GetMapping("/{id}/dependent")
    @Operation(summary = "Get all dependents")
    public List<EmployeeDependent> getDependents(@PathVariable Long id) {
        return service.getDependents(id);
    }

    @PostMapping("/{id}/dependent")
    @RequirePagePermission(pageCode = "M2210", action = "write")
    @Operation(summary = "Add/update dependent")
    public EmployeeDependent saveDependent(@PathVariable Long id, @RequestBody EmployeeDependent dep) {
        return service.saveDependent(id, dep);
    }

    @DeleteMapping("/dependent/{depId}")
    @RequirePagePermission(pageCode = "M2210", action = "delete")
    @Operation(summary = "Delete dependent")
    public ResponseEntity<Void> deleteDependent(@PathVariable Long depId) {
        service.deleteDependent(depId);
        return ResponseEntity.ok().build();
    }

    // ======================== ASSET (1:N) ========================

    @GetMapping("/{id}/asset")
    @Operation(summary = "Get all assets")
    public List<EmployeeAsset> getAssets(@PathVariable Long id) {
        return service.getAssets(id);
    }

    @PostMapping("/{id}/asset")
    @RequirePagePermission(pageCode = "M2210", action = "write")
    @Operation(summary = "Add/update asset")
    public EmployeeAsset saveAsset(@PathVariable Long id, @RequestBody EmployeeAsset asset) {
        return service.saveAsset(id, asset);
    }

    @DeleteMapping("/asset/{assetId}")
    @RequirePagePermission(pageCode = "M2210", action = "delete")
    @Operation(summary = "Delete asset")
    public ResponseEntity<Void> deleteAsset(@PathVariable Long assetId) {
        service.deleteAsset(assetId);
        return ResponseEntity.ok().build();
    }

    // ======================== KYC ========================

    @GetMapping("/{id}/kyc")
    @Operation(summary = "Get KYC details")
    public ResponseEntity<?> getKyc(@PathVariable Long id) {
        EmployeeKyc kyc = service.getKyc(id);
        return kyc != null ? ResponseEntity.ok(kyc) : ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/kyc")
    @RequirePagePermission(pageCode = "M2210", action = "write")
    @Operation(summary = "Save/update KYC details")
    public EmployeeKyc saveKyc(@PathVariable Long id, @RequestBody EmployeeKyc kyc) {
        return service.saveKyc(id, kyc);
    }

    // ======================== KYC DOCUMENT (1:N) ========================

    @GetMapping("/{id}/kyc-document")
    @Operation(summary = "Get all KYC documents")
    public List<EmployeeKycDocument> getKycDocuments(@PathVariable Long id) {
        return service.getKycDocuments(id);
    }

    @PostMapping("/{id}/kyc-document")
    @RequirePagePermission(pageCode = "M2210", action = "write")
    @Operation(summary = "Add/update KYC document")
    public EmployeeKycDocument saveKycDocument(@PathVariable Long id, @RequestBody EmployeeKycDocument doc) {
        if (doc.getAttachment() != null) {
            String[] files = doc.getAttachment().split(",");
            int count = 0;
            for (String file : files) {
                if (file != null && !file.trim().isEmpty()) {
                    count++;
                }
            }
            if (count > 5) {
                throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST,
                    "KYC document cannot have more than 5 uploaded files."
                );
            }
        }
        return service.saveKycDocument(id, doc);
    }

    @DeleteMapping("/kyc-document/{docId}")
    @RequirePagePermission(pageCode = "M2210", action = "delete")
    @Operation(summary = "Delete KYC document")
    public ResponseEntity<Void> deleteKycDocument(@PathVariable Long docId) {
        service.deleteKycDocument(docId);
        return ResponseEntity.ok().build();
    }

    // ======================== ACTIVITY (1:N) ========================

    @GetMapping("/{id}/activity")
    @Operation(summary = "Get all activities")
    public List<EmployeeActivity> getActivities(@PathVariable Long id) {
        return service.getActivities(id);
    }

    @PostMapping("/{id}/activity")
    @RequirePagePermission(pageCode = "M2210", action = "write")
    @Operation(summary = "Add/update activity")
    public EmployeeActivity saveActivity(@PathVariable Long id, @RequestBody EmployeeActivity activity) {
        return service.saveActivity(id, activity);
    }

    @DeleteMapping("/activity/{actId}")
    @RequirePagePermission(pageCode = "M2210", action = "delete")
    @Operation(summary = "Delete activity")
    public ResponseEntity<Void> deleteActivity(@PathVariable Long actId) {
        service.deleteActivity(actId);
        return ResponseEntity.ok().build();
    }

    // ======================== EMPLOYEE MANAGER MAPPING ========================

    @GetMapping("/manager-mapping")
    @Operation(summary = "Get all employee manager mappings")
    public ResponseEntity<List<EmployeeManagerMapping>> getAllManagerMappings() {
        return ResponseEntity.ok(managerMappingRepository.findAll());
    }

    @GetMapping("/manager-mapping/{empId}")
    @Operation(summary = "Get employee manager mapping")
    public ResponseEntity<EmployeeManagerMapping> getManagerMapping(@PathVariable Long empId) {
        return ResponseEntity.ok(managerMappingRepository.findByEmpId(empId)
                .orElse(new EmployeeManagerMapping(null, empId, null, null, null, null, null, null, null, null, "Active")));
    }

    @PostMapping("/manager-mapping")
    @RequirePagePermission(pageCode = "M2210", action = "write")
    @Operation(summary = "Create or update employee manager mapping")
    public ResponseEntity<EmployeeManagerMapping> saveManagerMapping(@RequestBody EmployeeManagerMapping mapping) {
        if (mapping.getVerticalHeadId() == null) {
            throw new IllegalArgumentException("Vertical Head is not mapped.");
        }
        EmployeeManagerMapping existing = managerMappingRepository.findByEmpId(mapping.getEmpId()).orElse(null);
        if (existing != null) {
            existing.setHomeManagerId(mapping.getHomeManagerId());
            existing.setBusinessManagerId(mapping.getBusinessManagerId());
            existing.setVerticalHeadId(mapping.getVerticalHeadId());
            existing.setHrId(mapping.getHrId());
            existing.setUpdatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
            existing.setUpdatedAt(new java.util.Date());
            return ResponseEntity.ok(managerMappingRepository.save(existing));
        } else {
            mapping.setCreatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
            mapping.setCreatedAt(new java.util.Date());
            return ResponseEntity.ok(managerMappingRepository.save(mapping));
        }
    }

    @GetMapping("/manager-mapping/eligible-managers")
    @Operation(summary = "Get eligible managers based on designation level criteria")
    public ResponseEntity<List<EmployeeMaster>> getEligibleManagers(@RequestParam(required = false) Long empId) {
        int empLevelVal = 0;
        if (empId != null) {
            EmployeeMaster emp = service.getEmployeeById(empId);
            if (emp != null && emp.getEmpLevelId() != null) {
                DesignationLevel dl = designationLevelRepository.findById(emp.getEmpLevelId()).orElse(null);
                if (dl != null) {
                    empLevelVal = parseLevelNumber(dl.getLevel());
                }
            }
        }

        java.util.List<EmployeeMaster> eligible = service.getActiveEligibleManagers(empId, empLevelVal);
        return ResponseEntity.ok(eligible);
    }

    private int parseLevelNumber(String levelName) {
        if (levelName == null || levelName.isEmpty()) return 0;
        try {
            return Integer.parseInt(levelName.replaceAll("[^0-9]", ""));
        } catch (Exception e) {
            return 0;
        }
    }
}
