package com.autonoma.erp.modules.hr.employee.service;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeTypeMaster;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeTypeMasterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class EmployeeTypeService {

    @Autowired
    private EmployeeTypeMasterRepository repository;

    public List<EmployeeTypeMaster> getAll() {
        return repository.findAll().stream()
                .filter(et -> !"INACTIVE".equalsIgnoreCase(et.getStatus()))
                .collect(java.util.stream.Collectors.toList());
    }

    public Optional<EmployeeTypeMaster> getById(Long id) {
        if (id == null) return Optional.empty();
        return repository.findById(id);
    }

    public EmployeeTypeMaster save(EmployeeTypeMaster entity, String currentUser) {
        if (entity.getTypeName() == null || entity.getTypeName().trim().isEmpty()) {
            throw new RuntimeException("Employee Type is mandatory.");
        }
        if (entity.getDescription() == null || entity.getDescription().trim().isEmpty()) {
            throw new RuntimeException("Employee Type description is mandatory.");
        }
        if (entity.getStatus() == null || entity.getStatus().trim().isEmpty()) {
            throw new RuntimeException("Status is mandatory.");
        }

        // Check uniqueness on typeName
        Optional<EmployeeTypeMaster> existingOpt = repository.findAll().stream()
                .filter(et -> et.getTypeName() != null && et.getTypeName().equalsIgnoreCase(entity.getTypeName()) 
                        && (entity.getId() == null || !entity.getId().equals(et.getId())))
                .findFirst();
        if (existingOpt.isPresent()) {
            EmployeeTypeMaster existing = existingOpt.get();
            if ("INACTIVE".equalsIgnoreCase(existing.getStatus()) && (entity.getId() == null || entity.getId() == 0L)) {
                entity.setId(existing.getId());
            } else {
                throw new RuntimeException("Employee Type already exists.");
            }
        }

        if (entity.getId() == null || entity.getId() == 0L) {
            entity.setCreatedAt(new Date());
            entity.setCreatedBy(currentUser);
        } else {
            Long entityId = entity.getId();
            if (entityId == null) {
                throw new RuntimeException("ID is mandatory for update.");
            }
            EmployeeTypeMaster existing = repository.findById(entityId)
                    .orElseThrow(() -> new RuntimeException("Employee Type not found."));
            entity.setCreatedAt(existing.getCreatedAt());
            entity.setCreatedBy(existing.getCreatedBy());
            entity.setUpdatedAt(new Date());
            entity.setUpdatedBy(currentUser);
        }

        return repository.save(entity);
    }

    public void delete(Long id) {
        if (id == null) {
            throw new RuntimeException("ID is mandatory for delete.");
        }
        EmployeeTypeMaster existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee Type not found."));
        existing.setStatus("INACTIVE");
        repository.save(existing);
    }
}
