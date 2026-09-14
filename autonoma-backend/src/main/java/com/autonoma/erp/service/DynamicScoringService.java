package com.autonoma.erp.service;

import com.autonoma.erp.dto.purchase.QuotationComparisonDTO;

public interface DynamicScoringService {
    QuotationComparisonDTO compareQuotations(Long rfqId, Long divisionId);
}
