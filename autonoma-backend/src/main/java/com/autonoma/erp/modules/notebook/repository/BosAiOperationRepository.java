package com.autonoma.erp.modules.notebook.repository;

import com.autonoma.erp.modules.notebook.entity.BosAiOperation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BosAiOperationRepository extends JpaRepository<BosAiOperation, Long> {
    List<BosAiOperation> findByEntityCodeAndActiveStatus(String entityCode, String activeStatus);
    List<BosAiOperation> findByActiveStatus(String activeStatus);
}
