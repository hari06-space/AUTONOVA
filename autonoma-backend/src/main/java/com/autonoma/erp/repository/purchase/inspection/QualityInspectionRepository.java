package com.autonoma.erp.repository.purchase.inspection;

import com.autonoma.erp.model.purchase.inspection.QualityInspection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface QualityInspectionRepository extends JpaRepository<QualityInspection, Long> {
    List<QualityInspection> findByGrnId(Long grnId);
    
    @Query(value = "SELECT CAST(q.grnId AS string) as grnId, q.inspectionDate as qiDate, h.grnNo as grnNo, sm.name as status, " +
           "q.grnQty as totalGrnQty, q.acceptedQty as totalAcceptedQty, q.rejectedQty as totalRejectedQty, " +
           "s.ledgerName as supplierName, p.poNo as poNo, " +
           "i.itemCode as itemCode, i.itemName as itemName, CAST(q.id AS string) as qiId " +
           "FROM QualityInspection q " +
           "LEFT JOIN q.status sm " +
           "LEFT JOIN q.grnTrans gt " +
           "LEFT JOIN gt.head h " +
           "LEFT JOIN h.supplier s " +
           "LEFT JOIN h.poHead p " +
           "LEFT JOIN gt.item i " +
           "WHERE (:grnId IS NULL OR CAST(q.grnId AS string) LIKE %:grnId%)",
           countQuery = "SELECT COUNT(q.id) " +
           "FROM QualityInspection q " +
           "WHERE (:grnId IS NULL OR CAST(q.grnId AS string) LIKE %:grnId%)")
    Page<Object[]> searchIndividualInspections(
        @Param("grnId") String grnId,
        Pageable pageable
    );
}
