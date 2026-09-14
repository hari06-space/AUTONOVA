package com.autonoma.erp.modules.aigateway.repository;

import com.autonoma.erp.modules.aigateway.entity.BOSAiAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BOSAiAuditLogRepository extends JpaRepository<BOSAiAuditLog, Long> {
}
