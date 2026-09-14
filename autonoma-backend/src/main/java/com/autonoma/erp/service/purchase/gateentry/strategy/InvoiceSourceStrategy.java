package com.autonoma.erp.service.purchase.gateentry.strategy;

import com.autonoma.erp.dto.purchase.gateentry.GateEntryHeadDTO;
import com.autonoma.erp.dto.purchase.gateentry.GateEntrySourceDTO;
import com.autonoma.erp.dto.purchase.gateentry.GateEntryTransDTO;
import com.autonoma.erp.model.purchase.gateentry.GateEntrySource;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.util.List;

@Component
public class InvoiceSourceStrategy implements GateEntrySourceStrategy {

    @Override
    public String getSourceType() {
        return "INVOICE";
    }

    @Override
    public void validateSource(GateEntrySourceDTO sourceDto, GateEntryHeadDTO headDto) {
        if (sourceDto.getSourceDocumentNo() == null || sourceDto.getSourceDocumentNo().isEmpty()) {
            throw new IllegalArgumentException("Invoice Number is mandatory for Tax Invoice source.");
        }
        // Validation: Prevent duplicate invoice
    }

    @Override
    public void validateTransaction(GateEntryTransDTO transDto, GateEntrySource source) {
        if (transDto.getDeliveredQty() == null || transDto.getDeliveredQty().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Delivered Quantity must be greater than zero for item: " + transDto.getItemCode());
        }
    }

    @Override
    public void populateItemsFromSource(GateEntrySourceDTO sourceDto, List<GateEntryTransDTO> targetList) {
        // Not applicable for Invoice unless fetched from an external ASN
    }
}
