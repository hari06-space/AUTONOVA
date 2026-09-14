package com.autonoma.erp.modules.notebook.repository;

import com.autonoma.erp.modules.notebook.entity.BosAiEntityField;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BosAiEntityFieldRepository extends JpaRepository<BosAiEntityField, Long> {
    List<BosAiEntityField> findByEntityCodeAndActiveStatus(String entityCode, String activeStatus);
    List<BosAiEntityField> findByEntityCodeAndVisibleAndActiveStatus(String entityCode, String visible, String activeStatus);
}
