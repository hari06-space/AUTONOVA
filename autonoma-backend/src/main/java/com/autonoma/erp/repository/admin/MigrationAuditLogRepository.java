package com.autonoma.erp.repository.admin;

import com.autonoma.erp.model.admin.MigrationAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MigrationAuditLogRepository extends JpaRepository<MigrationAuditLog, Long> {
    List<MigrationAuditLog> findAllByOrderByMigratedAtDesc();
}
