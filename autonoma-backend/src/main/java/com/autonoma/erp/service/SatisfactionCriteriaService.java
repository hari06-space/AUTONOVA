package com.autonoma.erp.service;

import com.autonoma.erp.model.SatisfactionCriteria;
import com.autonoma.erp.repository.SatisfactionCriteriaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class SatisfactionCriteriaService {

    @Autowired
    private SatisfactionCriteriaRepository repository;

    public List<SatisfactionCriteria> getAll() {
        return repository.findAll();
    }

    public Optional<SatisfactionCriteria> getById(Long id) {
        if (id == null) return Optional.empty();
        return repository.findById(id);
    }

    public SatisfactionCriteria save(SatisfactionCriteria entity, String currentUser) {
        if (entity.getSatisfactionType() == null || entity.getSatisfactionType().trim().isEmpty()) {
            throw new RuntimeException("Satisfaction Type is mandatory.");
        }
        if (entity.getSatisfactionCriteria() == null || entity.getSatisfactionCriteria().trim().isEmpty()) {
            throw new RuntimeException("Satisfaction Criteria text is mandatory.");
        }
        if (entity.getStatus() == null) {
            throw new RuntimeException("Status is mandatory.");
        }

        String resolvedUser = com.autonoma.erp.util.SecurityUtils.getCurrentUserEmployeeName();
        if (resolvedUser == null || resolvedUser.trim().isEmpty()) {
            resolvedUser = currentUser;
        }

        if (entity.getId() == null) {
            entity.setCreatedDate(new Date());
            entity.setCreatedUser(resolvedUser);
        } else {
            Long entityId = entity.getId();
            SatisfactionCriteria existing = repository.findById(entityId)
                    .orElseThrow(() -> new RuntimeException("Satisfaction Criteria not found."));
            entity.setCreatedDate(existing.getCreatedDate());
            entity.setCreatedUser(existing.getCreatedUser());
            entity.setUpdatedDate(new Date());
            entity.setUpdatedUser(resolvedUser);
        }

        return repository.save(entity);
    }

    public void delete(Long id) {
        if (id == null) {
            throw new RuntimeException("ID is mandatory for delete.");
        }
        repository.deleteById(id);
    }
}
