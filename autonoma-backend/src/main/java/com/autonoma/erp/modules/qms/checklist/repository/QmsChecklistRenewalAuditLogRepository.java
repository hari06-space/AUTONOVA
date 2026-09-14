package com.autonoma.erp.modules.qms.checklist.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.autonoma.erp.modules.qms.checklist.entity.QmsChecklistRenewalAuditLog;
import java.util.List;

@Repository
public interface QmsChecklistRenewalAuditLogRepository extends JpaRepository<QmsChecklistRenewalAuditLog, Long> {

    @Query("SELECT r FROM QmsChecklistRenewalAuditLog r WHERE r.status = 'Success' AND r.masterChecklistId IN :masterChecklistIds")
    List<QmsChecklistRenewalAuditLog> findSuccessLogsByMasterChecklistIds(@Param("masterChecklistIds") List<Long> masterChecklistIds);
}
