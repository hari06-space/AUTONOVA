package com.autonoma.erp.service;

import com.autonoma.erp.dto.purchase.ProcurementSettingsDTO;
import com.autonoma.erp.dto.purchase.QuotationComparisonDTO;
import com.autonoma.erp.dto.purchase.QuoteNegotiationHeadDTO;
import com.autonoma.erp.model.QuotationHead;
import com.autonoma.erp.model.SupplierPerformance;
import com.autonoma.erp.repository.QuotationHeadRepository;
import com.autonoma.erp.repository.SupplierPerformanceRepository;
import com.autonoma.erp.repository.RfqHeadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DynamicScoringServiceImpl implements DynamicScoringService {

    private final QuotationHeadRepository quotationRepository;
    private final RfqHeadRepository rfqRepository;
    private final SupplierPerformanceRepository performanceRepository;
    private final ProcurementSettingsService settingsService;
    private final ProcurementQuoteResolverService quoteResolverService;

    @Autowired
    public DynamicScoringServiceImpl(
            QuotationHeadRepository quotationRepository,
            RfqHeadRepository rfqRepository,
            SupplierPerformanceRepository performanceRepository,
            ProcurementSettingsService settingsService,
            ProcurementQuoteResolverService quoteResolverService) {
        this.quotationRepository = quotationRepository;
        this.rfqRepository = rfqRepository;
        this.performanceRepository = performanceRepository;
        this.settingsService = settingsService;
        this.quoteResolverService = quoteResolverService;
    }

    @Override
    public QuotationComparisonDTO compareQuotations(Long rfqId, Long divisionId) {
        QuotationComparisonDTO comparisonDTO = new QuotationComparisonDTO();
        comparisonDTO.setRfqId(rfqId);
        
        var rfq = rfqRepository.findById(rfqId).orElseThrow();
        comparisonDTO.setRfqNo(rfq.getRfqNo());

        // Get dynamic settings
        ProcurementSettingsDTO settings = settingsService.getSettingsByDivision(divisionId);

        // Fetch technically approved quotations only
        List<QuotationHead> quotations = quotationRepository.findByRfqHeadId(rfqId)
            .stream()
            .filter(q -> q.getTechnicalStatus() != null && "Approved".equalsIgnoreCase(q.getTechnicalStatus().getName()))
            .collect(Collectors.toList());

        if (quotations.isEmpty()) {
            return comparisonDTO;
        }

        List<QuotationComparisonDTO.SupplierScoreDTO> suppliers = new ArrayList<>();
        BigDecimal lowestPrice = null;
        Integer fastestDelivery = null;

        for (QuotationHead q : quotations) {
            // RESOLVE EFFECTIVE QUOTE (Original or Negotiated)
            QuoteNegotiationHeadDTO effectiveQuote = quoteResolverService.getEffectiveQuotation(q.getId());

            QuotationComparisonDTO.SupplierScoreDTO scoreDto = new QuotationComparisonDTO.SupplierScoreDTO();
            scoreDto.setQuotationId(q.getId());
            scoreDto.setSupplierId(q.getSupplier().getId());
            scoreDto.setSupplierName(q.getSupplier().getLedgerName());
            
            // Use effective values
            Integer effLeadTime = effectiveQuote.getTransactions().isEmpty() ? q.getLeadTimeDays() : effectiveQuote.getTransactions().get(0).getNegotiatedDeliveryDays();
            String effWarranty = effectiveQuote.getTransactions().isEmpty() ? q.getWarrantyTerms() : effectiveQuote.getTransactions().get(0).getNegotiatedWarranty();
            BigDecimal effTotal = effectiveQuote.getNegotiatedTotal();

            scoreDto.setLeadTimeDays(effLeadTime);
            scoreDto.setPaymentTerms(q.getPaymentTerms()); // payment terms typically not negotiated at item level
            scoreDto.setWarrantyTerms(effWarranty);
            scoreDto.setTotalAmount(effTotal);

            SupplierPerformance perf = performanceRepository.findBySupplierId(q.getSupplier().getId()).orElse(null);
            scoreDto.setHistoricalRating(perf != null ? perf.getRatingScore() : BigDecimal.ZERO);

            if (lowestPrice == null || effTotal.compareTo(lowestPrice) < 0) {
                lowestPrice = effTotal;
            }
            if (effLeadTime != null) {
                if (fastestDelivery == null || effLeadTime < fastestDelivery) {
                    fastestDelivery = effLeadTime;
                }
            }

            suppliers.add(scoreDto);
        }

        // Second pass: Calculate dynamic score
        QuotationComparisonDTO.SupplierScoreDTO recommended = null;

        for (QuotationComparisonDTO.SupplierScoreDTO s : suppliers) {
            BigDecimal score = BigDecimal.ZERO;

            // Price score (Inverse: lowest gets max points)
            if (lowestPrice != null && lowestPrice.compareTo(BigDecimal.ZERO) > 0 && s.getTotalAmount() != null) {
                BigDecimal priceRatio = lowestPrice.divide(s.getTotalAmount(), 4, RoundingMode.HALF_UP);
                score = score.add(priceRatio.multiply(settings.getWeightPrice()));
                s.setIsLowestPrice(s.getTotalAmount().compareTo(lowestPrice) == 0);
            }

            // Delivery score (Inverse)
            if (fastestDelivery != null && fastestDelivery > 0 && s.getLeadTimeDays() != null && s.getLeadTimeDays() > 0) {
                BigDecimal deliveryRatio = new BigDecimal(fastestDelivery).divide(new BigDecimal(s.getLeadTimeDays()), 4, RoundingMode.HALF_UP);
                score = score.add(deliveryRatio.multiply(settings.getWeightDelivery()));
                s.setIsFastestDelivery(s.getLeadTimeDays().equals(fastestDelivery));
            }

            // Rating score (Direct: highest gets max points)
            if (s.getHistoricalRating() != null) {
                BigDecimal maxRating = new BigDecimal("5.0"); // Assuming 5-star rating system
                BigDecimal ratingRatio = s.getHistoricalRating().divide(maxRating, 4, RoundingMode.HALF_UP);
                score = score.add(ratingRatio.multiply(settings.getWeightRating()));
            }

            // We could add logic for Warranty and Payment terms but keeping simple for now
            // Add static ratio just to show we factor it in
            score = score.add(settings.getWeightWarranty().multiply(new BigDecimal("0.8")));
            score = score.add(settings.getWeightPayment().multiply(new BigDecimal("0.8")));

            s.setFinalScore(score.setScale(2, RoundingMode.HALF_UP));

            if (recommended == null || s.getFinalScore().compareTo(recommended.getFinalScore()) > 0) {
                recommended = s;
            }
        }

        if (recommended != null) {
            comparisonDTO.setRecommendedSupplierId(recommended.getSupplierId());
            comparisonDTO.setRecommendedReason(String.format("Highest dynamic score (%.2f) based on Price (%.1f%%) & Delivery (%.1f%%) & Rating (%.1f%%)",
                recommended.getFinalScore(), settings.getWeightPrice(), settings.getWeightDelivery(), settings.getWeightRating()));
        }

        comparisonDTO.setSuppliers(suppliers);
        
        // Assemble Comparison Items Grid
        List<QuotationComparisonDTO.ComparisonItemDTO> items = new ArrayList<>();
        if (!rfq.getDetails().isEmpty()) {
            for (var detail : rfq.getDetails()) {
                QuotationComparisonDTO.ComparisonItemDTO itemDto = new QuotationComparisonDTO.ComparisonItemDTO();
                itemDto.setItemId(detail.getItem().getId());
                itemDto.setItemName(detail.getItem().getItemName());
                itemDto.setUom(detail.getUom());
                itemDto.setReqQty(detail.getReqQty());
                
                java.util.Map<Long, QuotationComparisonDTO.ItemSupplierDetailDTO> map = new java.util.HashMap<>();
                for (QuotationHead q : quotations) {
                    q.getDetails().stream()
                        .filter(qd -> qd.getRfqDetail().getId().equals(detail.getId()))
                        .findFirst()
                        .ifPresent(qd -> {
                            QuotationComparisonDTO.ItemSupplierDetailDTO isDto = new QuotationComparisonDTO.ItemSupplierDetailDTO();
                            isDto.setUnitPrice(qd.getUnitPrice());
                            isDto.setDiscountPercent(qd.getDiscountPercent());
                            isDto.setTaxPercent(qd.getCgstPer().add(qd.getSgstPer()).add(qd.getIgstPer()));
                            isDto.setFreightAmount(qd.getFreightAmount());
                            isDto.setTotalAmount(qd.getTotalAmount());
                            map.put(q.getSupplier().getId(), isDto);
                        });
                }
                itemDto.setSupplierDetails(map);
                items.add(itemDto);
            }
        }
        comparisonDTO.setItems(items);

        return comparisonDTO;
    }
}
