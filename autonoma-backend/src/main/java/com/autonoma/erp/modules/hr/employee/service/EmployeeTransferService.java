package com.autonoma.erp.modules.hr.employee.service;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeOrganization;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeTransfer;
import com.autonoma.erp.modules.hr.orgstructure.repository.DepartmentRepository;
import com.autonoma.erp.modules.hr.orgstructure.repository.DesignationRepository;
import com.autonoma.erp.modules.master.organization.repository.DivisionRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeTransferRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeTypeMasterRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.context.event.EventListener;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import java.util.*;

@Service
public class EmployeeTransferService {

    @Autowired
    private EmployeeTransferRepository transferRepo;

    @Autowired
    private EmployeeMasterRepository employeeRepo;

    @Autowired
    private EmployeeTypeMasterRepository employeeTypeRepo;

    @Autowired
    private DepartmentRepository departmentRepo;

    @Autowired
    private DesignationRepository designationRepo;

    @Autowired
    private DivisionRepository divisionRepo;

    public List<EmployeeTransfer> getAllTransfers() {
        return transferRepo.findAllByOrderByCreatedDateDesc();
    }

    public Map<String, Object> getLatestInfo(Long employeeId) {
        EmployeeMaster emp = employeeRepo.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + employeeId));

        Optional<EmployeeTransfer> latestOpt = transferRepo.findLatestByEmployeeId(employeeId);
        
        Map<String, Object> result = new HashMap<>();
        result.put("employeeId", employeeId);
        result.put("empCode", emp.getEmpCode());
        result.put("employeeName", emp.getEmployeeName());
        
        // Populate standard current details
        populateDetails(result, emp);

        if (latestOpt.isPresent()) {
            EmployeeTransfer latest = latestOpt.get();
            // Expect Rev Date of previous transfer is the expectRevDate stored in the latest record
            result.put("expectRevDate", latest.getExpectRevDate());
        } else {
            // No previous transfers. Default expectRevDate to dateOfJoining or createdDate
            result.put("expectRevDate", emp.getDateOfJoining() != null ? emp.getDateOfJoining() : emp.getCreatedAt());
        }
        return result;
    }

    private void populateDetails(Map<String, Object> result, EmployeeMaster emp) {
        EmployeeOrganization org = emp.getOrganization();

        Long empTypeId = org != null && org.getEmployeeTypeId() != null ? org.getEmployeeTypeId() : emp.getEmployeeTypeId();
        result.put("employeeTypeId", empTypeId);
        result.put("employeeTypeName", "");
        if (empTypeId != null) {
            employeeTypeRepo.findById(empTypeId)
                .ifPresent(et -> result.put("employeeTypeName", et.getTypeName()));
        }
        
        Long deptId = org != null && org.getDepartmentId() != null ? org.getDepartmentId() : emp.getDepartmentId();
        result.put("departmentId", deptId);
        result.put("departmentName", "");
        if (org != null && org.getDepartment() != null) {
            result.put("departmentName", org.getDepartment().getDepartmentName());
        } else if (emp.getDepartment() != null) {
            result.put("departmentName", emp.getDepartment().getDepartmentName());
        } else if (deptId != null) {
            departmentRepo.findById(deptId)
                .ifPresent(d -> result.put("departmentName", d.getDepartmentName()));
        }
        
        Long desigId = org != null && org.getDesignationId() != null ? org.getDesignationId() : emp.getDesignationId();
        result.put("designationId", desigId);
        result.put("designationName", "");
        if (org != null && org.getDesignation() != null) {
            result.put("designationName", org.getDesignation().getDesignationName());
        } else if (emp.getDesignation() != null) {
            result.put("designationName", emp.getDesignation().getDesignationName());
        } else if (desigId != null) {
            designationRepo.findById(desigId)
                .ifPresent(dg -> result.put("designationName", dg.getDesignationName()));
        }
        
        result.put("oldEmpCode", emp.getOldEmpCode() != null && !emp.getOldEmpCode().trim().isEmpty() ? emp.getOldEmpCode() : (emp.getEmpCode() != null ? emp.getEmpCode() : ""));
        
        Long unitId = org != null && org.getUnitId() != null ? org.getUnitId() : emp.getUnitId();
        result.put("unitId", unitId);
        result.put("unitName", "");
        if (unitId != null) {
            divisionRepo.findById(unitId)
                .ifPresent(d -> result.put("unitName", d.getDivisionName()));
        }
    }

    @Transactional
    public EmployeeTransfer saveTransfer(EmployeeTransfer transfer) {
        Long employeeId = transfer.getEmployeeId();
        EmployeeMaster emp = employeeRepo.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + employeeId));

        // Point #5: Duplicate Scheduled Transfer Guard
        List<EmployeeTransfer> pendingList = transferRepo.findByEmployeeIdAndStatusAndIsActiveTrue(employeeId, "SCHEDULED");
        if (!pendingList.isEmpty()) {
            throw new RuntimeException("There is already a SCHEDULED transfer pending for " + emp.getEmployeeName() + ".");
        }

        // Point #2: New Employee Code Uniqueness Guard
        if (transfer.getTransOldEmpCode() != null && !transfer.getTransOldEmpCode().trim().isEmpty()) {
            String newCode = transfer.getTransOldEmpCode().trim();
            Optional<EmployeeMaster> existingByOld = employeeRepo.findByOldEmpCode(newCode);
            if (existingByOld.isPresent() && !existingByOld.get().getId().equals(employeeId)) {
                throw new RuntimeException("Employee Code '" + newCode + "' is already assigned to employee: " + existingByOld.get().getEmployeeName() + ".");
            }
            Optional<EmployeeMaster> existingByEmp = employeeRepo.findByEmpCode(newCode);
            if (existingByEmp.isPresent() && !existingByEmp.get().getId().equals(employeeId)) {
                throw new RuntimeException("Employee Code '" + newCode + "' is already assigned to employee: " + existingByEmp.get().getEmployeeName() + ".");
            }
        }

        // 1. Determine fromDate: latest transfer's expectRevDate or employee's dateOfJoining
        Optional<EmployeeTransfer> latestOpt = transferRepo.findLatestByEmployeeId(employeeId);
        Date fromDate;
        if (latestOpt.isPresent()) {
            fromDate = latestOpt.get().getExpectRevDate();
        } else {
            fromDate = emp.getDateOfJoining() != null ? emp.getDateOfJoining() : emp.getCreatedAt();
        }
        transfer.setFromDate(fromDate);

        // 2. Set toDate and expectRevDate
        Date today = new Date();
        transfer.setToDate(today);
        if (transfer.getExpectRevDate() == null) {
            transfer.setExpectRevDate(today);
        }

        // 3. Set left-hand side (old) values from the employee master's current state
        EmployeeOrganization org = emp.getOrganization();
        Long curEmpTypeId = org != null && org.getEmployeeTypeId() != null ? org.getEmployeeTypeId() : emp.getEmployeeTypeId();
        Long curDeptId = org != null && org.getDepartmentId() != null ? org.getDepartmentId() : emp.getDepartmentId();
        Long curDesigId = org != null && org.getDesignationId() != null ? org.getDesignationId() : emp.getDesignationId();
        Long curUnitId = org != null && org.getUnitId() != null ? org.getUnitId() : emp.getUnitId();
        String curOldEmpCode = emp.getOldEmpCode() != null && !emp.getOldEmpCode().trim().isEmpty() ? emp.getOldEmpCode() : (emp.getEmpCode() != null ? emp.getEmpCode() : "");

        transfer.setOldEmployeeTypeId(curEmpTypeId);
        transfer.setOldDepartmentId(curDeptId);
        transfer.setOldDesignationId(curDesigId);
        transfer.setOldUnitId(curUnitId);
        transfer.setOldEmpCode(curOldEmpCode);

        // 4. Update the employee master record with the right-hand side (transfer/new) values.
        if (transfer.getTransferEmployeeTypeId() == null) {
            transfer.setTransferEmployeeTypeId(curEmpTypeId);
        }
        if (transfer.getTransferDepartmentId() == null) {
            transfer.setTransferDepartmentId(curDeptId);
        }
        if (transfer.getTransferDesignationId() == null) {
            transfer.setTransferDesignationId(curDesigId);
        }
        if (transfer.getTransferUnitId() == null) {
            transfer.setTransferUnitId(curUnitId);
        }
        if (transfer.getTransOldEmpCode() == null || transfer.getTransOldEmpCode().trim().isEmpty()) {
            transfer.setTransOldEmpCode(curOldEmpCode);
        }

        // Point #1: Effective Date Evaluation (Immediate vs Scheduled)
        Calendar cal = Calendar.getInstance();
        cal.set(Calendar.HOUR_OF_DAY, 0);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        Date todayMidnight = cal.getTime();

        Date revDate = transfer.getExpectRevDate() != null ? transfer.getExpectRevDate() : today;
        Calendar revCal = Calendar.getInstance();
        revCal.setTime(revDate);
        revCal.set(Calendar.HOUR_OF_DAY, 0);
        revCal.set(Calendar.MINUTE, 0);
        revCal.set(Calendar.SECOND, 0);
        revCal.set(Calendar.MILLISECOND, 0);
        Date revMidnight = revCal.getTime();

        boolean isFutureDate = revMidnight.after(todayMidnight);

        if (isFutureDate) {
            transfer.setStatus("SCHEDULED");
        } else {
            transfer.setStatus("EXECUTED");
            applyTransferToEmployeeMaster(emp, org, transfer);
        }

        return transferRepo.save(transfer);
    }

    private void applyTransferToEmployeeMaster(EmployeeMaster emp, EmployeeOrganization org, EmployeeTransfer transfer) {
        emp.setEmployeeTypeId(transfer.getTransferEmployeeTypeId());
        emp.setDepartmentId(transfer.getTransferDepartmentId());
        emp.setDesignationId(transfer.getTransferDesignationId());
        emp.setUnitId(transfer.getTransferUnitId());
        if (transfer.getTransOldEmpCode() != null && !transfer.getTransOldEmpCode().trim().isEmpty()) {
            emp.setOldEmpCode(transfer.getTransOldEmpCode());
        }

        if (org != null) {
            org.setEmployeeTypeId(transfer.getTransferEmployeeTypeId());
            org.setDepartmentId(transfer.getTransferDepartmentId());
            org.setDesignationId(transfer.getTransferDesignationId());
            org.setUnitId(transfer.getTransferUnitId());
        }

        employeeRepo.save(emp);
    }

    /**
     * Point #1: Automated Daily Background Processor for Scheduled Transfers
     */
    @EventListener(ApplicationReadyEvent.class)
    @Scheduled(cron = "0 0 1 * * ?")
    @Transactional
    public void processScheduledTransfers() {
        Calendar cal = Calendar.getInstance();
        cal.set(Calendar.HOUR_OF_DAY, 23);
        cal.set(Calendar.MINUTE, 59);
        cal.set(Calendar.SECOND, 59);
        Date endOfToday = cal.getTime();

        List<EmployeeTransfer> scheduledList = transferRepo.findByStatusAndExpectRevDateLessThanEqualAndIsActiveTrue("SCHEDULED", endOfToday);
        for (EmployeeTransfer t : scheduledList) {
            EmployeeMaster emp = employeeRepo.findById(t.getEmployeeId()).orElse(null);
            if (emp != null) {
                EmployeeOrganization org = emp.getOrganization();
                applyTransferToEmployeeMaster(emp, org, t);
                t.setStatus("EXECUTED");
                transferRepo.save(t);
            }
        }
    }
}
