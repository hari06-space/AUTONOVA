package com.autonoma.erp.modules.notebook.repository;

import com.autonoma.erp.modules.notebook.entity.BosAiMetadataAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface BosAiMetadataAuditRepository extends JpaRepository<BosAiMetadataAudit, Long> {
    List<BosAiMetadataAudit> findByMetadataTableAndRecordId(String metadataTable, Long recordId);

    @Modifying
    @Transactional
    @Query(value = "INSERT INTO BOS_AI_METADATA_AUDIT (METADATA_TABLE, RECORD_ID, ACTION_TYPE, NEW_VALUE_JSON, CHANGED_BY, CHANGED_DATE, VERSION_NO) " +
                   "VALUES (:metadataTable, :recordId, :actionType, :newValueJson, :changedBy, CURRENT_TIMESTAMP, 1)", nativeQuery = true)
    void logAuditNative(@Param("metadataTable") String metadataTable,
                        @Param("recordId") Long recordId,
                        @Param("actionType") String actionType,
                        @Param("newValueJson") String newValueJson,
                        @Param("changedBy") String changedBy);
}
