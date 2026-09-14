package com.autonoma.erp.repository.purchase;

import com.autonoma.erp.model.purchase.inspection.MaterialInspection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MaterialInspectionRepository extends JpaRepository<MaterialInspection, Long> {
    java.util.List<MaterialInspection> findByQualityInspectionId(Long qualityInspectionId);
}
