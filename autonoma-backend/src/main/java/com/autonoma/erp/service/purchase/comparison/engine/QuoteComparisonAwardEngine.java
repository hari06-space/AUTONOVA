package com.autonoma.erp.service.purchase.comparison.engine;

import com.autonoma.erp.enums.SelectionType;
import com.autonoma.erp.model.QuoteComparisonHead;
import com.autonoma.erp.model.QuoteComparisonTrans;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class QuoteComparisonAwardEngine {

    public void processAward(QuoteComparisonHead comparisonHead, List<QuoteComparisonTrans> transactions, SelectionType selectionType) {
        comparisonHead.setSelectionType(selectionType);

        if (selectionType == SelectionType.ENTIRE_RFQ) {
            // Apply the overall recommended/selected supplier to all items
            for (QuoteComparisonTrans trans : transactions) {
                trans.setSelectedSupplierId(comparisonHead.getOverallSelectedSupplierId());
            }
        } else if (selectionType == SelectionType.ITEM_WISE) {
            // Items must be individually selected
            // Verify that each item has a selected supplier
            boolean allSelected = transactions.stream().allMatch(t -> t.getSelectedSupplierId() != null);
            if (!allSelected) {
                // Warning or exception depending on strictness
            }
        }
    }
}
