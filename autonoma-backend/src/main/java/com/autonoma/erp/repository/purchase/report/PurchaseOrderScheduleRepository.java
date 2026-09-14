package com.autonoma.erp.repository.purchase.report;

import com.autonoma.erp.dto.purchase.report.PurchaseOrderScheduleDTO;
import com.autonoma.erp.model.PurchaseOrderTrans;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PurchaseOrderScheduleRepository extends JpaRepository<PurchaseOrderTrans, Long> {

    @Query(nativeQuery = true, value = """
        SELECT 
            sch.ID as id,
            sch.PO_ID as poId,
            po_h.PO_NO as poNo,
            po_h.PO_DATE as poDate,
            vend.LEDGER_NAME as supplierName,
            item.ITEM_NO as itemCode, 
            item.ITEM_NAME as itemName,
            po_t.UOM as uom,
            sch.SCHEDULE_QTY as poQty,
            sch.SCHEDULE_DATE as expectedDeliveryDate,
            sm.NAME as status
        FROM PP_PURCHASE_SCHEDULE sch
        INNER JOIN PP_PURCHASE_ORDER_HEAD po_h ON sch.PO_ID = po_h.ID
        INNER JOIN PP_PURCHASE_ORDER_TRANS po_t ON sch.PO_ITEM_ID = po_t.ID
        LEFT JOIN NPD_PRODUCT_MASTER item ON po_t.ITEM_ID = item.ID
        LEFT JOIN FA_ACCOUNT_LEDGER vend ON sch.SUPPLIER_ID = vend.ID
        LEFT JOIN AD_STATUS_MASTER sm ON sch.STATUS = sm.ID
        WHERE ISNULL(po_h.ACTIVE_STATUS, 1) = 1 AND ISNULL(po_t.ACTIVE_STATUS, 1) = 1
        ORDER BY sch.ID DESC
    """)
    List<PurchaseOrderScheduleDTO> getPurchaseOrderSchedule();
}
