package com.autonoma.erp.service.purchase.comparison.engine;

import com.autonoma.erp.model.RfqHead;
import org.springframework.stereotype.Component;

@Component
public class QuoteComparisonValidationEngine {

    public void validateForComparison(RfqHead rfqHead) {
        if (rfqHead == null) {
            throw new IllegalArgumentException("RFQ cannot be null");
        }
        // Additional business validation
        // Example: RFQ must be closed for quoting, at least one quotation received, etc.
    }
}
