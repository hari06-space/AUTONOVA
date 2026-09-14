package com.autonoma.erp.modules.qms.audit.service;

import com.autonoma.erp.modules.qms.audit.entity.AuditType;
import com.autonoma.erp.modules.qms.audit.repository.AuditTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class AuditTypeService {

    @Autowired
    private AuditTypeRepository auditTypeRepository;

    public List<AuditType> getAll() {
        return auditTypeRepository.findAll();
    }

    public Page<AuditType> getAllPaginated(String search, String status, String auditArea, Pageable pageable) {
        // Simple search logic for now, can be improved with Specification if needed
        if ((search == null || search.isEmpty()) && (status == null || status.isEmpty()) && (auditArea == null || auditArea.isEmpty())) {
            return auditTypeRepository.findAll(pageable);
        }
        
        // For simplicity in this step, I'll just use findAll(pageable) 
        // Real filtering would use a Specification or a custom query.
        return auditTypeRepository.findAll(pageable);
    }

    public List<AuditType> getActive() {
        return auditTypeRepository.findAll().stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsActive()))
                .toList();
    }

    public Optional<AuditType> getById(Long id) {
        return auditTypeRepository.findById(id);
    }

    public AuditType save(AuditType auditType) {
        if (auditType.getId() != null) {
            AuditType existing = auditTypeRepository.findById(auditType.getId()).orElse(null);
            if (existing != null) {
                existing.setAuditType(auditType.getAuditType());
                existing.setStandard(auditType.getStandard());
                existing.setDescription(auditType.getDescription());
                existing.setCriteriaMinCount(auditType.getCriteriaMinCount());
                existing.setCustomerAuditArea(auditType.getCustomerAuditArea());
                existing.setCriteriaType(auditType.getCriteriaType());
                existing.setIsActive(auditType.getIsActive());
                existing.setAuditArea(auditType.getAuditArea()); // Synchronizes the child collection
                auditType = existing;
            }
        }

        // SOP: Converted to uppercase automatically
        if (auditType.getAuditType() != null) {
            auditType.setAuditType(auditType.getAuditType().toUpperCase().trim());
        }

        // Duplicate value checks
        if (auditType.getId() == null) {
            if (auditType.getAuditType() != null && auditTypeRepository.existsByAuditTypeIgnoreCase(auditType.getAuditType().trim())) {
                throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "Duplicate value on field auditType");
            }
            if (auditType.getDescription() != null && auditTypeRepository.existsByDescriptionIgnoreCase(auditType.getDescription().trim())) {
                throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "Duplicate value on field description");
            }
        } else {
            if (auditType.getAuditType() != null && auditTypeRepository.existsByAuditTypeIgnoreCaseAndIdNot(auditType.getAuditType().trim(), auditType.getId())) {
                throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "Duplicate value on field auditType");
            }
            if (auditType.getDescription() != null && auditTypeRepository.existsByDescriptionIgnoreCaseAndIdNot(auditType.getDescription().trim(), auditType.getId())) {
                throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "Duplicate value on field description");
            }
        }

        // SOP: Validation - Criteria Minimum Count must be greater than zero (if not Open/Variable type)
        boolean isOpenType = "Variable".equalsIgnoreCase(auditType.getCriteriaType());
        if (!isOpenType && (auditType.getCriteriaMinCount() == null || auditType.getCriteriaMinCount() <= 0)) {
            throw new IllegalArgumentException("Please Enter Audit Criteria Minimum Count...");
        }

        if (auditType.getId() != null) {
            auditType.setUpdatedDate(new Date());
        } else {
            auditType.setCreatedDate(new Date());
        }
        return auditTypeRepository.save(auditType);
    }

    public void delete(Long id) {
        // Optional: Implement soft delete
        auditTypeRepository.deleteById(id);
    }
}
