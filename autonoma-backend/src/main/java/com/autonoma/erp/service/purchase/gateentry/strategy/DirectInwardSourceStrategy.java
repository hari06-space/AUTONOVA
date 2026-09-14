package com.autonoma.erp.service.purchase.gateentry.strategy;

import com.autonoma.erp.dto.purchase.gateentry.GateEntryHeadDTO;
import com.autonoma.erp.dto.purchase.gateentry.GateEntrySourceDTO;
import com.autonoma.erp.dto.purchase.gateentry.GateEntryTransDTO;
import com.autonoma.erp.model.purchase.gateentry.GateEntrySource;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.util.List;

@Component
public class DirectInwardSourceStrategy implements GateEntrySourceStrategy {

    @Override
    public String getSourceType() {
        return "DIRECT_INWARD";
    }

    @Override
    public void validateSource(GateEntrySourceDTO sourceDto, GateEntryHeadDTO headDto) {
        // Validation: Reason mandatory if Procurement Settings dictate. 
        // For Direct Inward, document number might not be mandatory.
    }

    @Override
    public void validateTransaction(GateEntryTransDTO transDto, GateEntrySource source) {
        if (transDto.getDeliveredQty() == null || transDto.getDeliveredQty().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Delivered Quantity must be greater than zero for item: " + transDto.getItemCode());
        }
    }

    @Override
    public void populateItemsFromSource(GateEntrySourceDTO sourceDto, List<GateEntryTransDTO> targetList) {
        // Direct Inwards do not auto-populate items
    }
}
