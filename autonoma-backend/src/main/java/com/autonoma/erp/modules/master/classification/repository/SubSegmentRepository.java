package com.autonoma.erp.modules.master.classification.repository;

import com.autonoma.erp.modules.master.classification.entity.SubSegment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SubSegmentRepository extends JpaRepository<SubSegment, Long> {
    boolean existsBySubSegmentCodeIgnoreCase(String subSegmentCode);
    boolean existsBySubSegmentNameIgnoreCase(String subSegmentName);
}
