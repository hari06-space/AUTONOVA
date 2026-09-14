package com.autonoma.erp.service.purchase.po;

import com.autonoma.erp.dto.purchase.po.PurchaseOrderHeadDTO;
import com.autonoma.erp.dto.purchase.po.PurchaseOrderSourceRequestDTO;
import com.autonoma.erp.enums.PoSourceType;
import com.autonoma.erp.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Central facade that routes source resolution to the appropriate strategy.
 * This is the PurchaseOrderSourceResolver.
 */
@Service
@RequiredArgsConstructor
public class PurchaseOrderSourceResolverFacade {

    private final List<PurchaseOrderSourceStrategy> strategies;

    public PurchaseOrderHeadDTO resolve(PurchaseOrderSourceRequestDTO request) {
        PoSourceType sourceType;
        try {
            sourceType = PoSourceType.valueOf(request.getSourceType());
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Unknown PO source type: " + request.getSourceType());
        }

        return strategies.stream()
                .filter(s -> s.supports(sourceType))
                .findFirst()
                .orElseThrow(() -> new BusinessException("No strategy found for source type: " + sourceType))
                .resolve(request.getSourceDocId(), request.getDivisionId());
    }
}
