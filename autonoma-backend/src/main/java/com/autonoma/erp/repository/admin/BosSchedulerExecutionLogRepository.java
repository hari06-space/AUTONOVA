package com.autonoma.erp.repository.admin;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.autonoma.erp.model.admin.BosSchedulerExecutionLog;
import java.util.List;

@Repository
public interface BosSchedulerExecutionLogRepository extends JpaRepository<BosSchedulerExecutionLog, Long> {
    List<BosSchedulerExecutionLog> findByConfigIdOrderByTriggerTimeDesc(Long configId);
    List<BosSchedulerExecutionLog> findTop100ByOrderByTriggerTimeDesc();
}
