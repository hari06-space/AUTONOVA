package com.autonoma.erp.modules.qms.audit.repository;

import com.autonoma.erp.modules.qms.audit.entity.AuditSchedulerConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AuditSchedulerConfigRepository extends JpaRepository<AuditSchedulerConfig, Long> {
    Optional<AuditSchedulerConfig> findByConfigCodeIgnoreCase(String configCode);
    Optional<AuditSchedulerConfig> findByParentAuditScheduleId(Long parentAuditScheduleId);
}
