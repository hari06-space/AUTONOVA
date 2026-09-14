package com.autonoma.erp.service;

import com.autonoma.erp.dto.purchase.QuoteNegotiationHeadDTO;
import com.autonoma.erp.dto.purchase.QuoteNegotiationTransDTO;
import com.autonoma.erp.model.QuotationHead;
import com.autonoma.erp.model.QuotationDetail;
import com.autonoma.erp.model.QuotationNegotiationHead;
import com.autonoma.erp.model.QuotationNegotiationTrans;
import com.autonoma.erp.repository.QuotationHeadRepository;
import com.autonoma.erp.repository.purchase.QuotationNegotiationRepository;
import com.autonoma.erp.exception.BusinessException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class ProcurementQuoteResolverServiceImpl implements ProcurementQuoteResolverService {

    @Autowired
    private QuotationHeadRepository quotationRepository;

    @Autowired
    private QuotationNegotiationRepository negotiationRepository;

    @Override
    public QuoteNegotiationHeadDTO getEffectiveQuotation(Long quotationId) {
        QuotationHead quotation = quotationRepository.findById(quotationId)
            .orElseThrow(() -> new BusinessException("Quotation not found: " + quotationId));

        // Find all negotiations for this quotation
        List<QuotationNegotiationHead> negotiations = negotiationRepository.findByQuotationHeadId(quotationId);

        // Check for an 'AGREED' negotiation
        QuotationNegotiationHead agreedNegotiation = null;
        if (negotiations != null) {
            for (QuotationNegotiationHead neg : negotiations) {
                if (neg.getStatus() != null && "AGREED".equalsIgnoreCase(neg.getStatus().getName())) {
                    // Assuming only one can be agreed, or we take the latest agreed one
                    if (agreedNegotiation == null || neg.getNegotiationRound() > agreedNegotiation.getNegotiationRound()) {
                        agreedNegotiation = neg;
                    }
                }
            }
        }

        if (agreedNegotiation != null) {
            return mapNegotiationToDTO(agreedNegotiation);
        } else {
            return mapOriginalQuotationToDTO(quotation);
        }
    }

    private QuoteNegotiationHeadDTO mapNegotiationToDTO(QuotationNegotiationHead entity) {
        QuoteNegotiationHeadDTO dto = new QuoteNegotiationHeadDTO();
        dto.setId(entity.getId()); // Note: this is the Negotiation ID
        dto.setNegotiationNo(entity.getNegotiationNo());
        dto.setQuotationId(entity.getQuotationHead().getId());
        dto.setQuotationNo(entity.getQuotationHead().getQuotationNo());
        dto.setRfqId(entity.getRfqHead().getId());
        dto.setSupplierId(entity.getSupplier().getId());
        dto.setSupplierName(entity.getSupplier().getLedgerName());
        dto.setOriginalTotal(entity.getOriginalTotal());
        dto.setNegotiatedTotal(entity.getNegotiatedTotal());
        
        List<QuoteNegotiationTransDTO> transDTOs = new ArrayList<>();
        if (entity.getTransactions() != null) {
            for (QuotationNegotiationTrans t : entity.getTransactions()) {
                QuoteNegotiationTransDTO td = new QuoteNegotiationTransDTO();
                td.setQuotationDetailId(t.getQuotationDetail().getId());
                td.setItemId(t.getItem().getId());
                td.setItemName(t.getItem().getItemName());
                td.setQty(t.getQty());
                td.setOriginalPrice(t.getOriginalPrice());
                td.setNegotiatedPrice(t.getNegotiatedPrice()); // Effective price
                td.setNegotiatedDeliveryDays(t.getNegotiatedDeliveryDays()); // Effective delivery
                td.setNegotiatedWarranty(t.getNegotiatedWarranty()); // Effective warranty
                transDTOs.add(td);
            }
        }
        dto.setTransactions(transDTOs);
        return dto;
    }

    private QuoteNegotiationHeadDTO mapOriginalQuotationToDTO(QuotationHead quotation) {
        QuoteNegotiationHeadDTO dto = new QuoteNegotiationHeadDTO();
        // ID remains null because there's no negotiation
        dto.setQuotationId(quotation.getId());
        dto.setQuotationNo(quotation.getQuotationNo());
        dto.setRfqId(quotation.getRfqHead().getId());
        dto.setSupplierId(quotation.getSupplier().getId());
        dto.setSupplierName(quotation.getSupplier().getLedgerName());
        
        BigDecimal total = BigDecimal.ZERO;
        List<QuoteNegotiationTransDTO> transDTOs = new ArrayList<>();
        
        if (quotation.getDetails() != null) {
            for (QuotationDetail qd : quotation.getDetails()) {
                QuoteNegotiationTransDTO td = new QuoteNegotiationTransDTO();
                td.setQuotationDetailId(qd.getId());
                td.setItemId(qd.getItem().getId());
                td.setItemName(qd.getItem().getItemName());
                td.setQty(qd.getQty());
                
                BigDecimal price = qd.getUnitPrice();
                td.setOriginalPrice(price);
                td.setNegotiatedPrice(price); // Fallback to original
                
                td.setOriginalDeliveryDays(quotation.getLeadTimeDays());
                td.setNegotiatedDeliveryDays(quotation.getLeadTimeDays());
                
                td.setOriginalWarranty(quotation.getWarrantyTerms());
                td.setNegotiatedWarranty(quotation.getWarrantyTerms());
                
                if (price != null && qd.getQty() != null) {
                    total = total.add(price.multiply(qd.getQty()));
                }
                
                transDTOs.add(td);
            }
        }
        
        dto.setOriginalTotal(total);
        dto.setNegotiatedTotal(total);
        dto.setTransactions(transDTOs);
        
        return dto;
    }
}
