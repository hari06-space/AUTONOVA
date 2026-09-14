package com.autonoma.erp.repository.admin;

import com.autonoma.erp.model.admin.BosSchedulerAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BosSchedulerAuditLogRepository extends JpaRepository<BosSchedulerAuditLog, Long> {
    List<BosSchedulerAuditLog> findByConfigIdOrderByChangedDateDesc(Long configId);
}
