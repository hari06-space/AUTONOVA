package com.autonoma.erp.repository.ai;

import com.autonoma.erp.model.ai.BosAiColumnMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BosAiColumnMetadataRepository extends JpaRepository<BosAiColumnMetadata, Long> {

    List<BosAiColumnMetadata> findByTableNameIgnoreCaseAndIsActiveTrue(String tableName);
}
