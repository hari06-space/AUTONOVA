package com.autonoma.erp.service;

import com.autonoma.erp.dto.purchase.QuoteNegotiationHeadDTO;

public interface ProcurementQuoteResolverService {
    
    /**
     * Given a quotation ID, this service resolves whether to use the original
     * Supplier Quotation or the latest "Agreed" Quote Negotiation.
     * 
     * @param quotationId The ID of the original Supplier Quotation
     * @return QuoteNegotiationHeadDTO containing either the negotiated values (if agreed)
     *         or the original quotation values (if no agreed negotiation exists).
     */
    QuoteNegotiationHeadDTO getEffectiveQuotation(Long quotationId);
}
