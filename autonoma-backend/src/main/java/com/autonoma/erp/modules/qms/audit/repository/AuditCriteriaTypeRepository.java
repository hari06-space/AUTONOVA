package com.autonoma.erp.modules.qms.audit.repository;

import com.autonoma.erp.modules.qms.audit.entity.AuditCriteriaType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditCriteriaTypeRepository extends JpaRepository<AuditCriteriaType, Long> {
}
