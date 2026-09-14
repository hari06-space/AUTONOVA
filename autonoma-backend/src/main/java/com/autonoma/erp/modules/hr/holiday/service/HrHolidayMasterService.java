package com.autonoma.erp.modules.hr.holiday.service;

import com.autonoma.erp.repository.admin.UserRepository;
import com.autonoma.erp.util.SecurityUtils;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.attendance.entity.HrDailyAttendance;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.hr.attendance.repository.HrDailyAttendanceRepository;
import com.autonoma.erp.modules.qms.checklist.service.ChecklistAutoAssignmentService;

import com.autonoma.erp.modules.hr.holiday.entity.HrHolidayMaster;
import com.autonoma.erp.modules.hr.holiday.repository.HrHolidayMasterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class HrHolidayMasterService {

    @Autowired
    private HrHolidayMasterRepository repository;

    @Autowired
    private com.autonoma.erp.repository.admin.UserRepository userRepository;

    @Autowired
    private com.autonoma.erp.service.admin.BosUserPageAuthService authService;

    @Autowired
    private com.autonoma.erp.modules.hr.attendance.repository.HrDailyAttendanceRepository hrDailyAttendanceRepository;

    @Autowired
    private com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository employeeRepository;

    @Autowired
    @org.springframework.context.annotation.Lazy
    private ChecklistAutoAssignmentService checklistAutoAssignmentService;

    public List<HrHolidayMaster> findAll() {
        return repository.findAll();
    }

    public HrHolidayMaster findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Holiday not found: " + id));
    }

    public List<HrHolidayMaster> findByYear(Integer year) {
        return repository.findByHolidayYear(String.valueOf(year));
    }

    public List<HrHolidayMaster> findActiveBetween(LocalDate from, LocalDate to) {
        return repository.findByHolidayDateBetween(from, to);
    }

    public List<HrHolidayMaster> findOptionalActive() {
        return repository.findByIsOptionalTrueAndIsActiveTrue();
    }

    @Transactional
    public HrHolidayMaster create(HrHolidayMaster holiday) {
        if (!isHrOrAdmin()) {
            throw new RuntimeException("Only HR/Admin can maintain Holiday Master.");
        }
        LocalDate targetDate = holiday.getFromDate() != null ? holiday.getFromDate() : holiday.getHolidayDate();
        if (targetDate != null) {
            boolean exists = repository.existsByFromDateOrHolidayDate(targetDate, targetDate);
            if (exists) {
                throw new RuntimeException("A holiday already exists on date " + targetDate + ". Duplicate holiday dates are not allowed.");
            }
            if (holiday.getHolidayDate() == null) {
                holiday.setHolidayDate(targetDate);
            }
            if (holiday.getFromDate() == null) {
                holiday.setFromDate(targetDate);
            }
        }
        HrHolidayMaster saved = repository.save(holiday);
        
        updateHolidayAttendance(saved);

        try {
            checklistAutoAssignmentService.runReassignmentCheckForOpenAssignments();
        } catch (Exception e) {
            System.err.println("Failed to trigger checklist auto-reassignment on holiday creation: " + e.getMessage());
        }
        return saved;
    }

    @Transactional
    public HrHolidayMaster update(Long id, HrHolidayMaster details) {
        if (!isHrOrAdmin()) {
            throw new RuntimeException("Only HR/Admin can maintain Holiday Master.");
        }
        HrHolidayMaster existing = findById(id);

        LocalDate targetDate = details.getFromDate() != null ? details.getFromDate() : details.getHolidayDate();
        if (targetDate != null) {
            List<HrHolidayMaster> duplicates = repository.findByFromDateOrHolidayDate(targetDate, targetDate);
            boolean hasDuplicateOtherThanSelf = duplicates.stream().anyMatch(h -> !h.getHolidayId().equals(id));
            if (hasDuplicateOtherThanSelf) {
                throw new RuntimeException("A holiday already exists on date " + targetDate + ". Duplicate holiday dates are not allowed.");
            }
        }

        existing.setHolidayName(details.getHolidayName());
        existing.setFromDate(details.getFromDate());
        if (details.getFromDate() != null) {
            existing.setHolidayDate(details.getFromDate());
        } else {
            existing.setHolidayDate(details.getHolidayDate());
        }
        existing.setHolidayType(details.getHolidayType());
        existing.setApplicableTo(details.getApplicableTo());
        existing.setApplicableRefs(details.getApplicableRefs());
        existing.setDescription(details.getDescription());
        existing.setIsOptional(details.getIsOptional() != null ? details.getIsOptional() : false);
        existing.setIsActive(details.getIsActive() != null ? details.getIsActive() : true);
        HrHolidayMaster saved = repository.save(existing);

        updateHolidayAttendance(saved);

        try {
            checklistAutoAssignmentService.runReassignmentCheckForOpenAssignments();
        } catch (Exception e) {
            System.err.println("Failed to trigger checklist auto-reassignment on holiday update: " + e.getMessage());
        }
        return saved;
    }

    @Transactional
    public void delete(Long id) {
        if (!isHrOrAdmin()) {
            throw new RuntimeException("Only HR/Admin can maintain Holiday Master.");
        }
        HrHolidayMaster existing = findById(id);
        repository.delete(existing);
    }

    private boolean isHrOrAdmin() {
        String userId = null;
        try {
            userId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {}
        if (userId == null || userId.isBlank()) return false;
        if ("SYSTEM".equalsIgnoreCase(userId)) return true;
        if ("admin".equalsIgnoreCase(userId)) return true;
        return authService.hasPermission(userId, "HA1320", "write") || authService.hasPermission(userId, "M2310", "write");
    }

    private void updateHolidayAttendance(HrHolidayMaster holiday) {
        try {
            LocalDate start = holiday.getFromDate() != null ? holiday.getFromDate() : holiday.getHolidayDate();
            if (start == null) return;
            
            List<com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster> employees = employeeRepository.findAll();
            for (com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster emp : employees) {
                if (emp.getIsActive() == Boolean.TRUE || (emp.getStatus() != null && "active".equalsIgnoreCase(emp.getStatus().getName()))) {
                    com.autonoma.erp.modules.hr.attendance.entity.HrDailyAttendance att = hrDailyAttendanceRepository
                            .findByEmpIdAndAttendanceDate(emp.getId(), start)
                            .orElse(new com.autonoma.erp.modules.hr.attendance.entity.HrDailyAttendance());
                    att.setEmpId(emp.getId());
                    att.setAttendanceDate(start);
                    att.setStatus("HOLIDAY");
                    att.setRemarks("Company Holiday: " + holiday.getHolidayName());
                    hrDailyAttendanceRepository.save(att);
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to automatically update daily attendance for holiday: " + e.getMessage());
        }
    }
}
