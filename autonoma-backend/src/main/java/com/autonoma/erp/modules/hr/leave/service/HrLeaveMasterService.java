package com.autonoma.erp.modules.hr.leave.service;

import com.autonoma.erp.modules.hr.leave.entity.HrLeaveMaster;
import com.autonoma.erp.modules.hr.leave.repository.HrLeaveMasterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HrLeaveMasterService {

    @Autowired
    private HrLeaveMasterRepository repository;

    public List<HrLeaveMaster> findAll() {
        return repository.findAll();
    }

    public List<HrLeaveMaster> findAllActive() {
        return repository.findAll().stream()
                .filter(l -> Boolean.TRUE.equals(l.getIsActive()))
                .toList();
    }

    public HrLeaveMaster findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Leave type not found with id: " + id));
    }

    public HrLeaveMaster findByCode(String code) {
        return repository.findByLeaveCode(code)
                .orElseThrow(() -> new RuntimeException("Leave type not found with code: " + code));
    }

    public HrLeaveMaster create(HrLeaveMaster leaveMaster) {
        if (repository.findByLeaveCode(leaveMaster.getLeaveCode()).isPresent()) {
            throw new RuntimeException("Leave type with code '" + leaveMaster.getLeaveCode() + "' already exists");
        }
        return repository.save(leaveMaster);
    }

    public HrLeaveMaster update(Long id, HrLeaveMaster updated) {
        HrLeaveMaster existing = findById(id);
        existing.setLeaveName(updated.getLeaveName());
        existing.setDescription(updated.getDescription());
        existing.setIsActive(updated.getIsActive());
        return repository.save(existing);
    }

    public void delete(Long id) {
        HrLeaveMaster existing = findById(id);
        repository.delete(existing);
    }
}
