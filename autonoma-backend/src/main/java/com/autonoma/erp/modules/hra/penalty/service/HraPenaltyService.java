package com.autonoma.erp.modules.hra.penalty.service;

import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.hra.penalty.entity.HraPenalty;
import com.autonoma.erp.modules.hra.penalty.repository.HraPenaltyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Slf4j
@Service
public class HraPenaltyService {
    private final HraPenaltyRepository repository;
    private final EmployeeMasterRepository employeeRepository;

    @org.springframework.beans.factory.annotation.Autowired
    public HraPenaltyService(HraPenaltyRepository repository, EmployeeMasterRepository employeeRepository) {
        this.repository = repository;
        this.employeeRepository = employeeRepository;
    }

    @Transactional(readOnly = true)
    public List<HraPenalty> getAll() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public List<HraPenalty> getByEmployeeId(Long employeeId) {
        return repository.findByEmployeeId(employeeId);
    }

    @Transactional(readOnly = true)
    public HraPenalty getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Penalty not found with id: " + id));
    }

    @Transactional
    public HraPenalty save(HraPenalty penalty) {
        // Copy oldEmpCode from employee on creation
        if (penalty.getEmployee() != null && penalty.getEmployee().getId() != null) {
            com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster emp = employeeRepository.findById(penalty.getEmployee().getId())
                    .orElseThrow(() -> new RuntimeException("Employee not found with id: " + penalty.getEmployee().getId()));
            penalty.setEmployee(emp);
            if (penalty.getId() == null) {
                penalty.setOldEmpCode(emp.getOldEmpCode());
            }
        }
        // New penalties always start as OPEN
        if (penalty.getId() == null) {
            penalty.setStatus("OPEN");
        }
        return repository.save(penalty);
    }

    @Transactional
    public HraPenalty update(Long id, HraPenalty penalty) {
        HraPenalty existing = getById(id);
        if ("CLOSED".equals(existing.getStatus())) {
            throw new RuntimeException("Cannot edit a CLOSED penalty record.");
        }
        
        // Copy editable fields from incoming penalty to existing
        if (penalty.getEmployee() != null && penalty.getEmployee().getId() != null) {
            com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster emp = employeeRepository.findById(penalty.getEmployee().getId())
                    .orElseThrow(() -> new RuntimeException("Employee not found with id: " + penalty.getEmployee().getId()));
            existing.setEmployee(emp);
            existing.setOldEmpCode(emp.getOldEmpCode());
        } else {
            existing.setEmployee(null);
            existing.setOldEmpCode(null);
        }
        existing.setMonth(penalty.getMonth());
        existing.setYear(penalty.getYear());
        existing.setPenaltyReason(penalty.getPenaltyReason());
        existing.setPenaltyAmount(penalty.getPenaltyAmount());
        
        return repository.save(existing);
    }

    @Transactional
    public HraPenalty shortClose(Long id, String remarks) {
        HraPenalty existing = getById(id);
        if (!"OPEN".equals(existing.getStatus())) {
            throw new RuntimeException("Only OPEN penalties can be short closed. Current status: " + existing.getStatus());
        }
        if (remarks == null || remarks.trim().isEmpty()) {
            throw new RuntimeException("Short close remarks are mandatory.");
        }
        existing.setStatus("SHORT_CLOSED");
        existing.setShortCloseRemarks(remarks.trim());
        return repository.save(existing);
    }
}
