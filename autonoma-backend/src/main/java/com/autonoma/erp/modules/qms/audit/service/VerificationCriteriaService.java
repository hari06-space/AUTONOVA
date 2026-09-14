package com.autonoma.erp.modules.qms.audit.service;

import com.autonoma.erp.util.SecurityUtils;

import com.autonoma.erp.modules.qms.audit.entity.VerificationCriteria;
import com.autonoma.erp.modules.qms.audit.repository.VerificationCriteriaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class VerificationCriteriaService {

    @Autowired
    private VerificationCriteriaRepository repository;

    public List<VerificationCriteria> getAll() {
        return repository.findAll();
    }

    public Optional<VerificationCriteria> getById(Long id) {
        if (id == null) return Optional.empty();
        return repository.findById(id);
    }

    @Transactional
    public VerificationCriteria save(VerificationCriteria entity, String currentUser) {
        // Validation
        if (entity.getType() == null || entity.getType().trim().isEmpty()) {
            throw new RuntimeException("Type is mandatory.");
        }
        if (entity.getDescription() == null || entity.getDescription().trim().isEmpty()) {
            throw new RuntimeException("Description is mandatory.");
        }


        String trimmedDesc = entity.getDescription().trim();
        entity.setDescription(trimmedDesc);

        Optional<VerificationCriteria> existingDesc = repository.findByDescriptionIgnoreCase(trimmedDesc);
        if (existingDesc.isPresent()) {
            if (entity.getId() == null || !existingDesc.get().getId().equals(entity.getId())) {
                throw new RuntimeException("Verification Criteria with this description already exists.");
            }
        }

        String resolvedUser = com.autonoma.erp.util.SecurityUtils.getCurrentUserEmployeeName();
        if (resolvedUser == null || resolvedUser.trim().isEmpty()) {
            resolvedUser = currentUser;
        }


        if (entity.getId() == null) {
            entity.setCreatedAt(new Date());
            entity.setCreatedBy(resolvedUser);
            entity.setCreatedUser(resolvedUser);
        } else {
            Long entityId = entity.getId();
            if (entityId == null) {
                throw new RuntimeException("ID is mandatory for update.");
            }
            VerificationCriteria existing = repository.findById(entityId)
                    .orElseThrow(() -> new RuntimeException("Verification Criteria not found."));
            entity.setCreatedAt(existing.getCreatedAt());
            entity.setCreatedBy(existing.getCreatedBy());
            entity.setCreatedUser(existing.getCreatedUser());
            entity.setUpdatedAt(new Date());
            entity.setUpdatedBy(resolvedUser);
            entity.setUpdatedUser(resolvedUser);
        }

        return repository.save(entity);
    }

    public Long getNextSequence() {
        Long maxId = repository.findMaxId();
        return (maxId == null ? 0L : maxId) + 1;
    }

    @Transactional
    public void delete(Long id) {
        if (id == null) {
            throw new RuntimeException("ID is mandatory for delete.");
        }
        repository.deleteById(id);
    }
}
