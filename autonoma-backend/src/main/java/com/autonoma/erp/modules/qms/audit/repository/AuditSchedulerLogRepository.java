package com.autonoma.erp.modules.qms.audit.repository;

import com.autonoma.erp.modules.qms.audit.entity.AuditSchedulerLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditSchedulerLogRepository extends JpaRepository<AuditSchedulerLog, Long> {
    List<AuditSchedulerLog> findByConfigIdOrderByTriggerTimeDesc(Long configId);
}
