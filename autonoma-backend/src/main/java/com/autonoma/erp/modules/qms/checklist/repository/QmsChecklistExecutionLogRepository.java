package com.autonoma.erp.modules.qms.checklist.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.autonoma.erp.modules.qms.checklist.entity.QmsChecklistExecutionLog;
import java.util.List;

@Repository
public interface QmsChecklistExecutionLogRepository extends JpaRepository<QmsChecklistExecutionLog, Long> {
    List<QmsChecklistExecutionLog> findByConfigIdOrderByTriggerTimeDesc(Long configId);
    List<QmsChecklistExecutionLog> findTop100ByOrderByTriggerTimeDesc();
}
