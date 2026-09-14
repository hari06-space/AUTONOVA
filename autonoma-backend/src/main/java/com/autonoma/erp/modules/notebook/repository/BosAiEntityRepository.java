package com.autonoma.erp.modules.notebook.repository;

import com.autonoma.erp.modules.notebook.entity.BosAiEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BosAiEntityRepository extends JpaRepository<BosAiEntity, Long> {
    Optional<BosAiEntity> findByEntityCode(String entityCode);
    Optional<BosAiEntity> findByEntityCodeAndActiveStatus(String entityCode, String activeStatus);
    List<BosAiEntity> findByActiveStatus(String activeStatus);
}
