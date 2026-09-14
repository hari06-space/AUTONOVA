package com.autonoma.erp.service;

import com.autonoma.erp.dto.purchase.QuoteNegotiationHeadDTO;
import com.autonoma.erp.dto.purchase.QuoteNegotiationListDTO;

import java.util.List;

public interface QuoteNegotiationService {
    
    List<QuoteNegotiationListDTO> getAllNegotiations(Long divisionId);
    
    QuoteNegotiationHeadDTO getNegotiationById(Long id);
    
    QuoteNegotiationHeadDTO getNegotiationByQuotationId(Long quotationId);
    
    QuoteNegotiationHeadDTO initializeNegotiation(Long quotationId, Long buyerId);
    
    QuoteNegotiationHeadDTO saveNegotiation(QuoteNegotiationHeadDTO dto, String userId);
    
    QuoteNegotiationHeadDTO updateNegotiationStatus(Long id, Long statusId, String remarks, String userId);
    
    void deleteNegotiation(Long id);
}
