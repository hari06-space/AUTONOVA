package com.autonoma.erp.modules.qmc.inspectionspecification.repository;

import com.autonoma.erp.modules.qmc.inspectionspecification.entity.InspectionSpecificationDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InspectionSpecificationDetailRepository extends JpaRepository<InspectionSpecificationDetail, Long> {

    @Query("SELECT d FROM InspectionSpecificationDetail d WHERE d.specification.id = :specId ORDER BY d.sequenceNo ASC")
    List<InspectionSpecificationDetail> findBySpecificationIdOrdered(@Param("specId") Long specId);

    long countBySpecificationId(Long specificationId);
}
