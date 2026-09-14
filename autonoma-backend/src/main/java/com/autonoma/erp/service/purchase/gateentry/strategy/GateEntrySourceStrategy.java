package com.autonoma.erp.service.purchase.gateentry.strategy;

import com.autonoma.erp.dto.purchase.gateentry.GateEntryHeadDTO;
import com.autonoma.erp.dto.purchase.gateentry.GateEntrySourceDTO;
import com.autonoma.erp.dto.purchase.gateentry.GateEntryTransDTO;
import com.autonoma.erp.model.purchase.gateentry.GateEntrySource;

import java.util.List;

public interface GateEntrySourceStrategy {

    /**
     * Identifies the source type this strategy handles (e.g. "PURCHASE_ORDER", "CHALLAN")
     */
    String getSourceType();

    /**
     * Validate the source document details before saving.
     */
    void validateSource(GateEntrySourceDTO sourceDto, GateEntryHeadDTO headDto);

    /**
     * Validate a specific line item associated with this source type.
     */
    void validateTransaction(GateEntryTransDTO transDto, GateEntrySource source);
    
    /**
     * Populate additional details (like fetching PO items) if necessary.
     */
    void populateItemsFromSource(GateEntrySourceDTO sourceDto, List<GateEntryTransDTO> targetList);
}
