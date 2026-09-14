package com.autonoma.erp.repository.purchase.gateentry;

import com.autonoma.erp.model.purchase.gateentry.GateEntryHead;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface GateEntryHeadRepository extends JpaRepository<GateEntryHead, Long> {

    @Query("SELECT g FROM GateEntryHead g " +
           "LEFT JOIN FETCH g.supplier " +
           "LEFT JOIN FETCH g.transporter " +
           "LEFT JOIN FETCH g.status " +
           "LEFT JOIN FETCH g.department " +
           "LEFT JOIN FETCH g.securityOfficer " +
           "WHERE g.id = :id AND g.activeStatus = 1")
    Optional<GateEntryHead> findByIdWithDetails(@Param("id") Long id);

    @Query(value = "SELECT g FROM GateEntryHead g " +
           "LEFT JOIN FETCH g.supplier " +
           "LEFT JOIN FETCH g.transporter " +
           "LEFT JOIN FETCH g.status " +
           "WHERE g.division.id = :divisionId AND g.activeStatus = 1",
           countQuery = "SELECT count(g) FROM GateEntryHead g WHERE g.division.id = :divisionId AND g.activeStatus = 1")
    Page<GateEntryHead> findAllByDivision(@Param("divisionId") Long divisionId, Pageable pageable);

    @Query("SELECT CASE WHEN COUNT(g) > 0 THEN true ELSE false END FROM GateEntryHead g " +
           "WHERE g.gateEntryNo = :gateEntryNo AND g.division.id = :divisionId AND g.activeStatus = 1")
    boolean existsByGateEntryNoAndDivisionId(@Param("gateEntryNo") String gateEntryNo, @Param("divisionId") Long divisionId);

    @Query("SELECT COUNT(g.id) FROM GateEntryHead g WHERE g.gateEntryNo LIKE :prefix%")
    long countByGateEntryNoStartingWith(@Param("prefix") String prefix);
}
