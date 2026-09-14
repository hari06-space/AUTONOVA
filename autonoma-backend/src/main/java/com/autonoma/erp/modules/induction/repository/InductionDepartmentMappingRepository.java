package com.autonoma.erp.modules.induction.repository;

import com.autonoma.erp.modules.induction.entity.InductionDepartmentMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InductionDepartmentMappingRepository extends JpaRepository<InductionDepartmentMapping, Long> {
    List<InductionDepartmentMapping> findByInductionId(Long inductionId);
    List<InductionDepartmentMapping> findByInductionIdIn(List<Long> inductionIds);
    void deleteByInductionId(Long inductionId);
}
