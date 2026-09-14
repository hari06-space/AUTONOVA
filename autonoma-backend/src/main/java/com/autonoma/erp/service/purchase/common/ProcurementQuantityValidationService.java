package com.autonoma.erp.service.purchase.common;

import com.autonoma.erp.dto.purchase.common.TransactionLineDTO;
import com.autonoma.erp.enums.SourceDocType;
import com.autonoma.erp.enums.TargetDocType;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public interface ProcurementQuantityValidationService {

    /**
     * Bulk fetch the remaining eligible quantity for a set of source lines.
     * Returned Map keys are the source line IDs.
     */
    Map<Long, BigDecimal> getRemainingQuantities(SourceDocType source, TargetDocType target, List<Long> sourceLineIds);
    Map<Long, BigDecimal> getRemainingQuantities(SourceDocType source, TargetDocType target, List<Long> sourceLineIds, String subType);

    /**
     * Bulk fetch the previously processed quantity for a set of source lines.
     */
    Map<Long, BigDecimal> getProcessedQuantities(SourceDocType source, TargetDocType target, List<Long> sourceLineIds);
    Map<Long, BigDecimal> getProcessedQuantities(SourceDocType source, TargetDocType target, List<Long> sourceLineIds, String subType);

    /**
     * Validates that the requested quantities do not exceed the remaining eligible quantities.
     * Throws a RuntimeException if any quantity is invalid.
     */
    void validateQuantities(SourceDocType source, TargetDocType target, List<TransactionLineDTO> requestedLines);

    void validateQuantities(SourceDocType source, TargetDocType target, List<TransactionLineDTO> requestedLines, String subType);

    /**
     * Recalculates and updates the status of the source document lines and header.
     */
    void resolveAndSynchronizeStatus(SourceDocType source, Long sourceHeadId);
}
