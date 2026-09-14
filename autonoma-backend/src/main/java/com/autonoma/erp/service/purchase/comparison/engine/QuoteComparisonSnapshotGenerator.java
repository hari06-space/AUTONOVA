package com.autonoma.erp.service.purchase.comparison.engine;

import com.autonoma.erp.model.*;
import com.autonoma.erp.repository.QuoteComparisonMatrixRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class QuoteComparisonSnapshotGenerator {

    private final QuoteComparisonMatrixRepository matrixRepository;

    public List<QuoteComparisonMatrix> generateSnapshot(QuoteComparisonHead comparisonHead, List<QuotationHead> quotations, List<QuotationNegotiationHead> negotiations) {
        List<QuoteComparisonMatrix> snapshotMatrixList = new ArrayList<>();

        // Logic to build matrix rows based on latest quotations or negotiations
        // For each item in the RFQ and for each supplier, determine the final negotiated (or original) values
        
        return snapshotMatrixList;
    }
}
