package com.autonoma.erp.modules.notebook.repository;

import com.autonoma.erp.modules.notebook.entity.AiAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiAuditLogRepository extends JpaRepository<AiAuditLog, Long> {
    List<AiAuditLog> findByUserIdOrderByCreatedDateDesc(String userId);
    List<AiAuditLog> findByNotebookIdOrderByCreatedDateDesc(Long notebookId);
    List<AiAuditLog> findByInjectionDetectedTrueOrderByCreatedDateDesc();
    List<AiAuditLog> findByCompanyIdOrderByCreatedDateDesc(Long companyId);
}
