package com.autonoma.erp.service;

import com.autonoma.erp.dto.purchase.ComparisonDecisionDTO;

public interface ComparisonDecisionService {
    ComparisonDecisionDTO getDecisionByRfq(Long rfqId);
    ComparisonDecisionDTO saveDecision(ComparisonDecisionDTO dto);
    void approveDecision(Long id);
}
