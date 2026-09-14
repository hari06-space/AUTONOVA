package com.autonoma.erp.repository;

import com.autonoma.erp.model.PurchaseOrderTrans;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface PurchaseOrderTransRepository extends JpaRepository<PurchaseOrderTrans, Long> {

    @Query("SELECT t FROM PurchaseOrderTrans t " +
           "JOIN FETCH t.item " +
           "JOIN FETCH t.purchaseOrderHead h " +
           "WHERE h.supplier.id = :supplierId " +
           "AND UPPER(h.status.name) IN ('VERIFIED', 'APPROVED', 'PARTIALLY RECEIVED') " +
           "AND t.pendingQty > :minQty")
    List<PurchaseOrderTrans> findPendingItemsBySupplier(@Param("supplierId") Long supplierId, @Param("minQty") BigDecimal minQty);

    List<PurchaseOrderTrans> findByPurchaseOrderHeadId(Long purchaseOrderHeadId);
}
