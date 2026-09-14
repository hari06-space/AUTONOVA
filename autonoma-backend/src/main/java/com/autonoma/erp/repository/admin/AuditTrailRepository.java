package com.autonoma.erp.repository.admin;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.autonoma.erp.model.admin.AuditTrail;

import java.util.List;
import java.util.Collection;

@Repository
public interface AuditTrailRepository extends JpaRepository<AuditTrail, Long> {
    List<AuditTrail> findAllByOrderByCreatedAtDesc();
    List<AuditTrail> findByTableNameAndRecordIdOrderByCreatedAtDesc(String tableName, String recordId);
    List<AuditTrail> findByTableNameInAndRecordIdInOrderByCreatedAtDesc(Collection<String> tableNames, Collection<String> recordIds);
}
