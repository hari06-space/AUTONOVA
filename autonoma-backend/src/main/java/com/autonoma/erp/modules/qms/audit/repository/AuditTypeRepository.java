package com.autonoma.erp.modules.qms.audit.repository;

import com.autonoma.erp.modules.qms.audit.entity.AuditType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditTypeRepository extends JpaRepository<AuditType, Long> {
    boolean existsByAuditTypeIgnoreCase(String auditType);
    boolean existsByAuditTypeIgnoreCaseAndIdNot(String auditType, Long id);
    boolean existsByDescriptionIgnoreCase(String description);
    boolean existsByDescriptionIgnoreCaseAndIdNot(String description, Long id);
    java.util.Optional<AuditType> findByAuditTypeIgnoreCase(String auditType);
}
