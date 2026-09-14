package com.autonoma.erp.modules.hr.leave.service;

import com.autonoma.erp.modules.hr.leave.entity.LeaveEncashmentEntry;
import com.autonoma.erp.modules.hr.leave.repository.LeaveEncashmentEntryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.Map;
import java.util.Optional;

@Service
public class LeaveEncashmentEntryService {

    @Autowired
    private LeaveEncashmentEntryRepository repository;

    public Page<LeaveEncashmentEntry> searchLeaveEncashment(String status, String employeeName, String employeeCode, Date fromDate, Date toDate, Pageable pageable) {
        return repository.searchLeaveEncashment(status, employeeName, employeeCode, fromDate, toDate, pageable);
    }

    @Transactional
    public LeaveEncashmentEntry saveLeaveEncashment(LeaveEncashmentEntry entry) {
        // Simple default calculations if not fully provided
        if (entry.getTotalEl() == null || entry.getTotalEl() == 0.0) {
            entry.setTotalEl((entry.getEl() != null ? entry.getEl() : 0.0) + (entry.getPrevYrsEl() != null ? entry.getPrevYrsEl() : 0.0));
        }
        if (entry.getTotalCl() == null || entry.getTotalCl() == 0.0) {
            entry.setTotalCl((entry.getCl() != null ? entry.getCl() : 0.0) + (entry.getPrevYrsCl() != null ? entry.getPrevYrsCl() : 0.0));
        }
        if (entry.getTotalLeaveEncash() == null || entry.getTotalLeaveEncash() == 0.0) {
            entry.setTotalLeaveEncash((entry.getEncashEl() != null ? entry.getEncashEl() : 0.0) + (entry.getEncashCl() != null ? entry.getEncashCl() : 0.0));
        }
        return repository.save(entry);
    }

    @Transactional
    public LeaveEncashmentEntry submitForApproval(Long id) {
        Optional<LeaveEncashmentEntry> optional = repository.findById(id);
        if (optional.isPresent()) {
            LeaveEncashmentEntry entry = optional.get();
            entry.setStatus("Pending Approval");
            return repository.save(entry);
        }
        throw new RuntimeException("Leave Encashment Entry not found for ID: " + id);
    }

    @Transactional
    public void deleteLeaveEncashment(Long id) {
        Optional<LeaveEncashmentEntry> optional = repository.findById(id);
        if (optional.isPresent()) {
            LeaveEncashmentEntry entry = optional.get();
            entry.setIsActive(false);
            repository.save(entry);
        }
    }
}
