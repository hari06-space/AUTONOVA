package com.autonoma.erp.repository.purchase.report;

import com.autonoma.erp.dto.purchase.report.BatchTraceabilityDTO;
import com.autonoma.erp.model.purchase.grn.GoodsReceiptTrans;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PurchaseReportRepository extends JpaRepository<GoodsReceiptTrans, Long> {

    @Query(nativeQuery = true, value = """
        SELECT 
            grn_t.BATCH_NO as batchNo,
            item.ITEM_NO as itemCode, 
            item.ITEM_NAME as itemName,
            vend.LEDGER_NAME as supplierName,
            po_h.SOURCE_TYPE as poType,
            pr_h.PR_NO as prNo,
            CASE WHEN pr_h.ID IS NULL THEN NULL WHEN pr_h.STATUS = 1 THEN 'Active' ELSE 'Inactive' END as prStatus,
            po_h.PO_NO as poNo,
            po_t.QTY as poQty,
            COALESCE(po_t.EXPECTED_DELIVERY_DATE, po_h.EXPECTED_DELIVERY_DATE) as expectedDate,
            po_sm.NAME as poStatus,
            ge_h.GATE_ENTRY_NO as gateEntryNo,
            ge_h.GATE_ENTRY_DATE as gateEntryDate,
            ge_h.GATE_ENTRY_DATE as receivedDate,
            ge_sm.NAME as gateEntryStatus,
            grn_h.GRN_NO as grnNo,
            grn_t.GRN_QTY as grnQty,
            grn_sm.NAME as grnStatus,
            qi.ACCEPTED_QTY as accQty,
            qi.REJECTED_QTY as rejQty,
            qi.REMARKS as rejComments,
            qi.NC_QTY as ncQty,
            qi.NC_REMARKS as ncComments,
            qi_sm.NAME as inspectionStatus
        FROM PP_GOODS_RECEIPT_TRANS grn_t
        INNER JOIN PP_GOODS_RECEIPT_HEAD grn_h ON grn_t.GRN_HEAD_ID = grn_h.ID
        LEFT JOIN AD_STATUS_MASTER grn_sm ON grn_h.STATUS_ID = grn_sm.ID
        LEFT JOIN PP_PURCHASE_ORDER_TRANS po_t ON grn_t.PO_TRANS_ID = po_t.ID
        LEFT JOIN PP_PURCHASE_ORDER_HEAD po_h ON po_t.PO_HEAD_ID = po_h.ID
        LEFT JOIN AD_STATUS_MASTER po_sm ON po_h.STATUS_ID = po_sm.ID
        LEFT JOIN PP_PURCHASE_ORDER_SOURCE po_s ON (po_t.ID = po_s.PO_TRANS_ID OR (po_s.PO_TRANS_ID IS NULL AND po_h.ID = po_s.PO_HEAD_ID)) AND po_s.SOURCE_TYPE = 'PURCHASE_REQUEST'
        LEFT JOIN PP_PURCHASE_REQUEST_TRANS pr_t ON po_s.SOURCE_TRANS_ID = pr_t.ID
        LEFT JOIN PP_PURCHASE_REQUEST_HEAD pr_h ON (pr_t.PR_REF_ID = pr_h.ID) OR (po_s.SOURCE_TRANS_ID IS NULL AND po_s.SOURCE_HEAD_ID = pr_h.ID)
        LEFT JOIN PP_GATE_ENTRY_TRANS ge_t ON grn_t.GATE_ENTRY_TRANS_ID = ge_t.ID
        LEFT JOIN PP_GATE_ENTRY_HEAD ge_h ON ge_t.GATE_ENTRY_HEAD_ID = ge_h.ID
        LEFT JOIN AD_STATUS_MASTER ge_sm ON ge_h.STATUS_ID = ge_sm.ID
        LEFT JOIN QMC_QUALITY_INSPECTION qi ON qi.GRN_TRANS_ID = grn_t.ID
        LEFT JOIN AD_STATUS_MASTER qi_sm ON qi.STATUS = qi_sm.ID
        LEFT JOIN NPD_PRODUCT_MASTER item ON grn_t.ITEM_ID = item.ID
        LEFT JOIN FA_ACCOUNT_LEDGER vend ON po_h.SUPPLIER_ID = vend.ID
        WHERE grn_t.BATCH_NO IS NOT NULL
        ORDER BY grn_h.ID DESC
    """)
    List<BatchTraceabilityDTO> getBatchTraceabilityReport();

}
