package com.autonoma.erp.service.purchase.po;

import com.autonoma.erp.dto.purchase.po.PurchaseOrderHeadDTO;
import com.autonoma.erp.enums.PoSourceType;

/**
 * Strategy contract for all PO source types.
 * Each implementation resolves one source type into a unified PurchaseOrderHeadDTO.
 */
public interface PurchaseOrderSourceStrategy {
    boolean supports(PoSourceType sourceType);
    PurchaseOrderHeadDTO resolve(Long sourceDocId, Long divisionId);
}
