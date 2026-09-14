package com.autonoma.erp.repository;

import com.autonoma.erp.model.PurchaseOrderHead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PurchaseOrderHeadRepository extends JpaRepository<PurchaseOrderHead, Long> {

    @Query("SELECT h FROM PurchaseOrderHead h WHERE h.division.id = :divisionId AND h.activeStatus = 1 ORDER BY h.id DESC")
    List<PurchaseOrderHead> findByDivisionId(@Param("divisionId") Long divisionId);

    @Query("SELECT COUNT(h) > 0 FROM PurchaseOrderHead h WHERE h.division.id = :divisionId AND h.activeStatus = 1")
    boolean existsByDivisionId(@Param("divisionId") Long divisionId);

    @Query("SELECT DISTINCT h FROM PurchaseOrderHead h " +
           "LEFT JOIN FETCH h.supplier " +
           "LEFT JOIN FETCH h.status " +
           "LEFT JOIN FETCH h.items t " +
           "LEFT JOIN FETCH t.item " +
           "WHERE h.id = :id")
    java.util.Optional<PurchaseOrderHead> findByIdWithDetails(@Param("id") Long id);
}
