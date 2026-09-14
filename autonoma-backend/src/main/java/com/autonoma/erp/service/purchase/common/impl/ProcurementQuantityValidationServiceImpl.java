package com.autonoma.erp.service.purchase.common.impl;

import com.autonoma.erp.dto.purchase.common.TransactionLineDTO;
import com.autonoma.erp.enums.SourceDocType;
import com.autonoma.erp.enums.TargetDocType;
import com.autonoma.erp.service.purchase.common.ProcurementQuantityValidationService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ProcurementQuantityValidationServiceImpl implements ProcurementQuantityValidationService {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public Map<Long, BigDecimal> getRemainingQuantities(SourceDocType source, TargetDocType target,
            List<Long> sourceLineIds) {
        return getRemainingQuantities(source, target, sourceLineIds, null);
    }

    public Map<Long, BigDecimal> getRemainingQuantities(SourceDocType source, TargetDocType target,
            List<Long> sourceLineIds, String subType) {
        if (sourceLineIds == null || sourceLineIds.isEmpty()) {
            return new HashMap<>();
        }

        Map<Long, BigDecimal> sourceQuantities = getSourceQuantities(source, sourceLineIds, subType);
        Map<Long, BigDecimal> processedQuantities = getProcessedQuantities(source, target, sourceLineIds, subType);

        Map<Long, BigDecimal> remainingQuantities = new HashMap<>();
        for (Long id : sourceLineIds) {
            BigDecimal sourceQty = sourceQuantities.getOrDefault(id, BigDecimal.ZERO);
            BigDecimal processedQty = processedQuantities.getOrDefault(id, BigDecimal.ZERO);
            remainingQuantities.put(id, sourceQty.subtract(processedQty));
        }

        return remainingQuantities;
    }

    private Map<Long, BigDecimal> getSourceQuantities(SourceDocType source, List<Long> sourceLineIds, String subType) {
        Map<Long, BigDecimal> result = new HashMap<>();

        if (source == SourceDocType.INCOMING_INSPECTION) {
            List<Object[]> rows = entityManager.createQuery(
                    "SELECT r.transaction.id, SUM(r.acceptedQty) FROM IncomingInspectionResult r " +
                            "WHERE r.transaction.id IN :ids " +
                            "GROUP BY r.transaction.id",
                    Object[].class)
                    .setParameter("ids", sourceLineIds)
                    .getResultList();

            for (Object[] row : rows) {
                result.put((Long) row[0], (BigDecimal) row[1]);
            }
        } else if (source == SourceDocType.PURCHASE_ORDER) {
            List<Object[]> rows = entityManager.createQuery(
                    "SELECT t.id, t.qty FROM PurchaseOrderTrans t " +
                            "WHERE t.id IN :ids",
                    Object[].class)
                    .setParameter("ids", sourceLineIds)
                    .getResultList();

            for (Object[] row : rows) {
                result.put((Long) row[0], (BigDecimal) row[1]);
            }
        } else if (source == SourceDocType.GOODS_RECEIPT_NOTE) {
            List<Object[]> rows = entityManager.createQuery(
                    "SELECT t.id, t.grnQty FROM GoodsReceiptTrans t " +
                            "WHERE t.id IN :ids",
                    Object[].class)
                    .setParameter("ids", sourceLineIds)
                    .getResultList();

            for (Object[] row : rows) {
                result.put((Long) row[0], (BigDecimal) row[1]);
            }
        } else if (source == SourceDocType.QUALITY_INSPECTION) {
            String qtyField = "ACCEPTED_STOCK".equals(subType) ? "t.acceptedQty" : "t.rejectedQty";
            List<Object[]> rows = entityManager.createQuery(
                    "SELECT t.id, " + qtyField + " FROM QualityInspection t " +
                            "WHERE t.id IN :ids",
                    Object[].class)
                    .setParameter("ids", sourceLineIds)
                    .getResultList();

            for (Object[] row : rows) {
                result.put((Long) row[0], (BigDecimal) row[1]);
            }
        }
        // Add others as needed
        return result;
    }

    @Override
    public Map<Long, BigDecimal> getProcessedQuantities(SourceDocType source, TargetDocType target,
            List<Long> sourceLineIds) {
        return getProcessedQuantities(source, target, sourceLineIds, null);
    }

    public Map<Long, BigDecimal> getProcessedQuantities(SourceDocType source, TargetDocType target,
            List<Long> sourceLineIds, String subType) {
        Map<Long, BigDecimal> result = new HashMap<>();
        if (sourceLineIds == null || sourceLineIds.isEmpty())
            return result;
        if (source == SourceDocType.GOODS_RECEIPT_NOTE && target == TargetDocType.QUALITY_INSPECTION) {
            List<Object[]> rows = entityManager.createQuery(
                    "SELECT t.grnTrans.id, SUM(COALESCE(t.acceptedQty, 0) + COALESCE(t.rejectedQty, 0) + COALESCE(t.ncQty, 0)) FROM QualityInspection t " +
                            "WHERE t.grnTrans.id IN :ids " +
                            "AND t.status.name IN ('PENDING', 'COMPLETED', 'POSTED') " +
                            "GROUP BY t.grnTrans.id",
                    Object[].class)
                    .setParameter("ids", sourceLineIds)
                    .getResultList();

            for (Object[] row : rows) {
                result.put((Long) row[0], (BigDecimal) row[1]);
            }
        } else if (source == SourceDocType.QUALITY_INSPECTION && target == TargetDocType.SUPPLIER_RETURN) {
            List<Object[]> rows = entityManager.createQuery(
                    "SELECT t.qiTrans.id, SUM(t.returnQty) FROM PurchaseReturnTrans t " +
                            "JOIN t.head h " +
                            "JOIN h.status s " +
                            "WHERE t.qiTrans.id IN :ids " +
                            "AND h.returnType = :subType " +
                            "AND s.name NOT IN ('DRAFT', 'CANCELLED', 'REJECTED') " +
                            "GROUP BY t.qiTrans.id",
                    Object[].class)
                    .setParameter("ids", sourceLineIds)
                    .setParameter("subType", subType)
                    .getResultList();

            for (Object[] row : rows) {
                result.put((Long) row[0], (BigDecimal) row[1]);
            }
        }
        // Add others as needed

        return result;
    }

    @Override
    public void validateQuantities(SourceDocType source, TargetDocType target,
            List<TransactionLineDTO> requestedLines) {
        validateQuantities(source, target, requestedLines, null);
    }

    public void validateQuantities(SourceDocType source, TargetDocType target, List<TransactionLineDTO> requestedLines,
            String subType) {
        if (requestedLines == null || requestedLines.isEmpty())
            return;

        List<Long> sourceIds = requestedLines.stream()
                .map(TransactionLineDTO::getSourceLineId)
                .toList();

        Map<Long, BigDecimal> remainingQuantities = getRemainingQuantities(source, target, sourceIds, subType);

        for (TransactionLineDTO req : requestedLines) {
            BigDecimal remaining = remainingQuantities.getOrDefault(req.getSourceLineId(), BigDecimal.ZERO);
            BigDecimal requested = req.getRequestedQty() != null ? req.getRequestedQty() : BigDecimal.ZERO;

            if (requested.compareTo(BigDecimal.ZERO) < 0) {
                throw new RuntimeException("Quantity cannot be negative for source line: " + req.getSourceLineId());
            }

            // Allow 0 tolerance for now
            if (requested.compareTo(remaining) > 0) {
                throw new RuntimeException(
                        "Requested quantity (" + requested + ") exceeds eligible remaining quantity (" + remaining +
                                ") for source line: " + req.getSourceLineId());
            }
        }
    }

    @Override
    public void resolveAndSynchronizeStatus(SourceDocType source, Long sourceHeadId) {
        // To be implemented: automatically close PO/PR when fully processed
        // For now, this is a placeholder where the status sync logic will reside.
    }
}
