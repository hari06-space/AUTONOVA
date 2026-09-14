package com.autonoma.erp.modules.qms.checklist.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.autonoma.erp.modules.qms.checklist.entity.QmsChecklistEodAuditLog;
import java.util.Date;
import java.util.Set;

@Repository
public interface QmsChecklistEodAuditLogRepository extends JpaRepository<QmsChecklistEodAuditLog, Long> {

    @Query("SELECT a.checklistClosedId FROM QmsChecklistEodAuditLog a WHERE a.processingDate = :processingDate AND a.status = :status")
    Set<Long> findChecklistClosedIdsByProcessingDateAndStatus(@Param("processingDate") Date processingDate, @Param("status") String status);
}
