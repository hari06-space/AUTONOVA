package com.autonoma.erp.modules.qmc.inspectionspecification.repository;

import com.autonoma.erp.modules.qmc.inspectionspecification.entity.InspectionSpecification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface InspectionSpecificationRepository extends JpaRepository<InspectionSpecification, Long> {

    Optional<InspectionSpecification> findBySpecificationCode(String specificationCode);

    Optional<InspectionSpecification> findByItemId(Long itemId);

    boolean existsBySpecificationCode(String specificationCode);

    @Query("SELECT MAX(s.id) FROM InspectionSpecification s")
    Long findMaxId();

    @Query("""
        SELECT s FROM InspectionSpecification s
        WHERE (:search IS NULL OR :search = ''
               OR UPPER(s.specificationCode) LIKE UPPER(CONCAT('%', :search, '%'))
               OR UPPER(s.specificationName) LIKE UPPER(CONCAT('%', :search, '%')))
        AND (:itemId IS NULL OR s.itemId = :itemId)
        AND (:statusId IS NULL OR s.status = :statusId)
    """)
    Page<InspectionSpecification> searchAll(
        @Param("search") String search,
        @Param("itemId") Long itemId,
        @Param("statusId") Long statusId,
        Pageable pageable
    );

    /**
     * Find overlapping specifications for a given item, version, and effective date range.
     * Used for date-overlap validation.
     */
    @Query("""
        SELECT s FROM InspectionSpecification s
        WHERE s.itemId = :itemId
          AND (:excludeId IS NULL OR s.id <> :excludeId)
          AND s.status = (SELECT sm.id FROM com.autonoma.erp.modules.platform.common.entity.StatusMaster sm WHERE UPPER(TRIM(sm.name)) = 'ACTIVE')
          AND (
            :effectiveTo IS NULL
            OR s.effectiveFrom IS NULL
            OR s.effectiveFrom <= :effectiveTo
          )
          AND (
            s.effectiveTo IS NULL
            OR :effectiveFrom IS NULL
            OR s.effectiveTo >= :effectiveFrom
          )
    """)
    List<InspectionSpecification> findOverlappingSpecifications(
        @Param("itemId") Long itemId,
        @Param("effectiveFrom") LocalDate effectiveFrom,
        @Param("effectiveTo") LocalDate effectiveTo,
        @Param("excludeId") Long excludeId
    );

    /**
     * Incoming Inspection: find the active specification for an item on a given date.
     */
    @Query("""
        SELECT s FROM InspectionSpecification s
        WHERE s.itemId = :itemId
          AND s.status = (SELECT sm.id FROM com.autonoma.erp.modules.platform.common.entity.StatusMaster sm WHERE UPPER(TRIM(sm.name)) = 'ACTIVE')
          AND (s.effectiveFrom IS NULL OR s.effectiveFrom <= :inspectionDate)
          AND (s.effectiveTo IS NULL OR s.effectiveTo >= :inspectionDate)
        ORDER BY s.versionNo DESC
    """)
    List<InspectionSpecification> findActiveSpecificationForItem(
        @Param("itemId") Long itemId,
        @Param("inspectionDate") LocalDate inspectionDate
    );
}
