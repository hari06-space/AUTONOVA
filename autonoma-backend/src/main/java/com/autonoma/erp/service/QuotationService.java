package com.autonoma.erp.service;

import com.autonoma.erp.dto.purchase.QuotationHeadDTO;
import com.autonoma.erp.dto.purchase.QuotationListDTO;

import java.util.List;

public interface QuotationService {
    List<QuotationListDTO> getAllQuotations(Long divisionId);
    List<QuotationListDTO> getQuotationsByRfq(Long rfqId);
    QuotationHeadDTO getQuotationById(Long id);
    QuotationHeadDTO saveQuotation(QuotationHeadDTO dto);
    void evaluateTechnicalStatus(Long id, String status); // Approved / Rejected
}
