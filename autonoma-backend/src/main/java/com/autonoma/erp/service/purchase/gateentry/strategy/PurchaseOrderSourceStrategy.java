package com.autonoma.erp.service.purchase.gateentry.strategy;

import com.autonoma.erp.dto.purchase.gateentry.GateEntryHeadDTO;
import com.autonoma.erp.dto.purchase.gateentry.GateEntrySourceDTO;
import com.autonoma.erp.dto.purchase.gateentry.GateEntryTransDTO;
import com.autonoma.erp.model.purchase.gateentry.GateEntrySource;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.util.List;

@Component
public class PurchaseOrderSourceStrategy implements GateEntrySourceStrategy {

    @Override
    public String getSourceType() {
        return "PURCHASE_ORDER";
    }

    @Override
    public void validateSource(GateEntrySourceDTO sourceDto, GateEntryHeadDTO headDto) {
        if (sourceDto.getSourceHeadId() == null) {
            throw new IllegalArgumentException("Purchase Order reference is missing for source: " + sourceDto.getSourceDocumentNo());
        }
        // Additional PO validation: Validate Supplier matches, Check open status etc.
    }

    @Override
    public void validateTransaction(GateEntryTransDTO transDto, GateEntrySource source) {
        if (transDto.getPoTransId() == null) {
            throw new IllegalArgumentException("Purchase Order Line ID is missing for item: " + transDto.getItemCode());
        }
        if (transDto.getDeliveredQty() == null || transDto.getDeliveredQty().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Delivered Quantity must be greater than zero for item: " + transDto.getItemCode());
        }
        // Further validation for preventing over delivery based on config can go here.
    }

    @Override
    public void populateItemsFromSource(GateEntrySourceDTO sourceDto, List<GateEntryTransDTO> targetList) {
        // Logic to fetch PO items and add them to targetList
    }
}
