package com.autonoma.erp.modules.qms.meeting.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.autonoma.erp.modules.qms.meeting.entity.MeetingExecutionLog;
import java.util.List;

@Repository
public interface MeetingExecutionLogRepository extends JpaRepository<MeetingExecutionLog, Long> {
    List<MeetingExecutionLog> findByConfigIdOrderByTriggerTimeDesc(Long configId);
    List<MeetingExecutionLog> findTop100ByOrderByTriggerTimeDesc();
}
