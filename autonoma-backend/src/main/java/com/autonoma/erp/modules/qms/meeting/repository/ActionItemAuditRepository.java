package com.autonoma.erp.modules.qms.meeting.repository;

import com.autonoma.erp.modules.qms.meeting.entity.ActionItemAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ActionItemAuditRepository extends JpaRepository<ActionItemAudit, Long> {
    List<ActionItemAudit> findByActionItemId(Long actionItemId);
}
