package com.autonoma.erp.modules.notebook.repository;

import com.autonoma.erp.modules.notebook.entity.BosAiBusinessGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BosAiBusinessGraphRepository extends JpaRepository<BosAiBusinessGraph, Long> {
    List<BosAiBusinessGraph> findByFromEntityAndActiveStatus(String fromEntity, String activeStatus);
    List<BosAiBusinessGraph> findByActiveStatus(String activeStatus);
}
