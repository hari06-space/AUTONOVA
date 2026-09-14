package com.autonoma.erp.modules.master.classification.repository;

import com.autonoma.erp.modules.master.classification.entity.Segment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SegmentRepository extends JpaRepository<Segment, Long> {
    boolean existsBySegmentCodeIgnoreCase(String segmentCode);
    boolean existsBySegmentNameIgnoreCase(String segmentName);
}
