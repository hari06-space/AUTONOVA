package com.autonoma.erp.modules.qms.audit.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.autonoma.erp.modules.qms.audit.entity.AuditExecutionLog;
import java.util.List;

@Repository
public interface AuditExecutionLogRepository extends JpaRepository<AuditExecutionLog, Long> {
    List<AuditExecutionLog> findByConfigIdOrderByTriggerTimeDesc(Long configId);
    List<AuditExecutionLog> findTop100ByOrderByTriggerTimeDesc();
}
