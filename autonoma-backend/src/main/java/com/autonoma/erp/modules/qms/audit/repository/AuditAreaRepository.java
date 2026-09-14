package com.autonoma.erp.modules.qms.audit.repository;

import com.autonoma.erp.modules.qms.audit.entity.AuditArea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditAreaRepository extends JpaRepository<AuditArea, Long> {
    boolean existsByDescriptionIgnoreCase(String description);
    boolean existsByDescriptionIgnoreCaseAndIdNot(String description, Long id);
    boolean existsByTypeIgnoreCaseAndDescriptionIgnoreCase(String type, String description);
    boolean existsByTypeIgnoreCaseAndDescriptionIgnoreCaseAndIdNot(String type, String description, Long id);
    java.util.Optional<AuditArea> findByDescriptionIgnoreCase(String description);
    java.util.Optional<AuditArea> findFirstByDescriptionIgnoreCase(String description);
}

