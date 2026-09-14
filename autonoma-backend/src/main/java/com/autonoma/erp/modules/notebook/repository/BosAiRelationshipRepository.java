package com.autonoma.erp.modules.notebook.repository;

import com.autonoma.erp.modules.notebook.entity.BosAiRelationship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BosAiRelationshipRepository extends JpaRepository<BosAiRelationship, Long> {
    List<BosAiRelationship> findByFromEntityAndActiveStatus(String fromEntity, String activeStatus);
}
