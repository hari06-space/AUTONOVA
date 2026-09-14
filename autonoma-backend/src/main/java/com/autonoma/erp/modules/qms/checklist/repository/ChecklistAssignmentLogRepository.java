package com.autonoma.erp.modules.qms.checklist.repository;

import com.autonoma.erp.modules.qms.checklist.entity.ChecklistAssignmentLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChecklistAssignmentLogRepository extends JpaRepository<ChecklistAssignmentLog, Long> {
    List<ChecklistAssignmentLog> findByChecklistIdOrderByAssignedDateDesc(Long checklistId);
}
