package com.autonoma.erp.service.purchase.po;

import com.autonoma.erp.dto.purchase.po.PurchaseOrderHeadDTO;
import com.autonoma.erp.dto.purchase.po.PurchaseOrderTransDTO;
import com.autonoma.erp.enums.PoSourceType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * DIRECT strategy: no source document — blank DTO for manual PO creation.
 */
@Component
public class DirectPoStrategy implements PurchaseOrderSourceStrategy {

    @Override
    public boolean supports(PoSourceType sourceType) {
        return PoSourceType.DIRECT == sourceType;
    }

    @Override
    public PurchaseOrderHeadDTO resolve(Long sourceDocId, Long divisionId) {
        PurchaseOrderHeadDTO dto = new PurchaseOrderHeadDTO();
        dto.setSourceType(PoSourceType.DIRECT.name());
        dto.setDivisionId(divisionId);
        dto.setCurrency("INR");
        dto.setExchangeRate(BigDecimal.ONE);
        dto.setItems(new ArrayList<>());
        dto.setSources(new ArrayList<>());
        return dto;
    }
}
