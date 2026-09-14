package com.autonoma.erp.modules.induction.repository;

import com.autonoma.erp.modules.induction.entity.InductionLevelMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InductionLevelMappingRepository extends JpaRepository<InductionLevelMapping, Long> {
    List<InductionLevelMapping> findByInductionId(Long inductionId);
    List<InductionLevelMapping> findByInductionIdIn(List<Long> inductionIds);
    void deleteByInductionId(Long inductionId);
}
