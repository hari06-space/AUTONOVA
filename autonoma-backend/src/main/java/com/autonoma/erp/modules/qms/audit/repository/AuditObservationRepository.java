package com.autonoma.erp.modules.qms.audit.repository;

import com.autonoma.erp.modules.qms.audit.entity.AuditObservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface AuditObservationRepository extends JpaRepository<AuditObservation, Long> {
    @Query("SELECT MAX(CAST(o.observationNo AS int)) FROM AuditObservation o WHERE o.observationNo LIKE '[0-9]%'")
    Optional<Integer> findMaxObservationNo();

    java.util.Optional<AuditObservation> findFirstByOrderByObservationNoDesc();

    @Query("SELECT o FROM AuditObservation o WHERE o.observationNo LIKE CONCAT(:prefix, '%') ORDER BY CAST(SUBSTRING(o.observationNo, :startIndex) as integer) DESC")
    java.util.List<AuditObservation> findLatestObservationNo(
        @org.springframework.data.repository.query.Param("prefix") String prefix,
        @org.springframework.data.repository.query.Param("startIndex") int startIndex,
        org.springframework.data.domain.Pageable pageable
    );

    boolean existsByAuditScheduleNoIgnoreCase(String auditScheduleNo);
    java.util.Optional<AuditObservation> findByAuditScheduleNoIgnoreCase(String auditScheduleNo);

    java.util.List<AuditObservation> findAllByOrderByIdDesc();

    @Query("SELECT DISTINCT o FROM AuditObservation o LEFT JOIN FETCH o.details ORDER BY o.id DESC")
    java.util.List<AuditObservation> findAllWithDetails();
}
