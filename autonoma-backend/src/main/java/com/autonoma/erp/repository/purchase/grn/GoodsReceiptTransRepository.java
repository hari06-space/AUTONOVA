package com.autonoma.erp.repository.purchase.grn;

import com.autonoma.erp.model.purchase.grn.GoodsReceiptTrans;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.util.List;

@Repository
public interface GoodsReceiptTransRepository extends JpaRepository<GoodsReceiptTrans, Long> {
    List<GoodsReceiptTrans> findByHeadId(Long headId);

    @Query("SELECT COALESCE(SUM(t.grnQty), 0) FROM GoodsReceiptTrans t WHERE t.poTrans.id = :poTransId AND t.head.status.name != 'CANCELLED'")
    BigDecimal sumGrnQtyByPoTransId(@Param("poTransId") Long poTransId);

    @Query("SELECT COALESCE(SUM(t.grnQty), 0) FROM GoodsReceiptTrans t WHERE t.gateEntryTrans.id = :geTransId AND t.head.status.name != 'CANCELLED'")
    BigDecimal sumGrnQtyByGateEntryTransId(@Param("geTransId") Long geTransId);

    @Query("SELECT COALESCE(SUM(t.grnQty), 0) FROM GoodsReceiptTrans t WHERE t.purchaseSchedule.id = :purchaseScheduleId AND t.head.status.name != 'CANCELLED'")
    BigDecimal sumGrnQtyByPurchaseScheduleId(@Param("purchaseScheduleId") Long purchaseScheduleId);
}
