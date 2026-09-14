package com.autonoma.erp.repository.purchase.grn;

import com.autonoma.erp.model.purchase.grn.GoodsReceiptHead;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface GoodsReceiptHeadRepository extends JpaRepository<GoodsReceiptHead, Long> {

    @Query(value = "SELECT h FROM GoodsReceiptHead h " +
           "LEFT JOIN h.supplier s " +
           "LEFT JOIN h.status st " +
           "LEFT JOIN h.gateEntryHead ge " +
           "LEFT JOIN h.poHead po " +
           "WHERE h.division.id = :divisionId " +
           "AND (:grnNo IS NULL OR :grnNo = '' OR LOWER(h.grnNo) LIKE LOWER(CONCAT('%', :grnNo, '%'))) " +
           "AND (:startDate IS NULL OR h.grnDate >= :startDate) " +
           "AND (:endDate IS NULL OR h.grnDate <= :endDate) " +
           "AND (:supplierId IS NULL OR s.id = :supplierId) " +
           "AND (:poNo IS NULL OR :poNo = '' OR LOWER(po.poNo) LIKE LOWER(CONCAT('%', :poNo, '%'))) " +
           "ORDER BY h.id DESC",
           countQuery = "SELECT COUNT(h) FROM GoodsReceiptHead h " +
           "LEFT JOIN h.supplier s " +
           "LEFT JOIN h.poHead po " +
           "WHERE h.division.id = :divisionId " +
           "AND (:grnNo IS NULL OR :grnNo = '' OR LOWER(h.grnNo) LIKE LOWER(CONCAT('%', :grnNo, '%'))) " +
           "AND (:startDate IS NULL OR h.grnDate >= :startDate) " +
           "AND (:endDate IS NULL OR h.grnDate <= :endDate) " +
           "AND (:supplierId IS NULL OR s.id = :supplierId) " +
           "AND (:poNo IS NULL OR :poNo = '' OR LOWER(po.poNo) LIKE LOWER(CONCAT('%', :poNo, '%')))")
    Page<GoodsReceiptHead> search(
            @Param("divisionId") Long divisionId,
            @Param("grnNo") String grnNo,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("supplierId") Long supplierId,
            @Param("poNo") String poNo,
            Pageable pageable);

    @Query("SELECT h FROM GoodsReceiptHead h " +
           "LEFT JOIN FETCH h.supplier " +
           "LEFT JOIN FETCH h.poHead " +
           "LEFT JOIN FETCH h.gateEntryHead " +
           "LEFT JOIN FETCH h.status " +
           "LEFT JOIN FETCH h.transactions t " +
           "LEFT JOIN FETCH t.item " +
           "LEFT JOIN FETCH t.poTrans " +
           "LEFT JOIN FETCH t.gateEntryTrans " +
           "WHERE h.id = :id")
    Optional<GoodsReceiptHead> findByIdWithDetails(@Param("id") Long id);

    @Query("SELECT h FROM GoodsReceiptHead h " +
           "LEFT JOIN FETCH h.supplier " +
           "LEFT JOIN FETCH h.poHead " +
           "LEFT JOIN FETCH h.gateEntryHead " +
           "LEFT JOIN FETCH h.status " +
           "LEFT JOIN FETCH h.transactions t " +
           "LEFT JOIN FETCH t.item " +
           "LEFT JOIN FETCH t.poTrans " +
           "LEFT JOIN FETCH t.gateEntryTrans " +
           "WHERE h.gateEntryHead.id = :gateEntryId")
    java.util.List<GoodsReceiptHead> findByGateEntryHeadIdWithDetails(@Param("gateEntryId") Long gateEntryId);

    @Query("SELECT COUNT(h.id) FROM GoodsReceiptHead h WHERE h.grnNo LIKE :pattern")
    long countByGrnNoLike(@Param("pattern") String pattern);
}
