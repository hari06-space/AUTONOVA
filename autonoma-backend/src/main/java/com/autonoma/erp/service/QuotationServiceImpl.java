package com.autonoma.erp.service;

import com.autonoma.erp.dto.purchase.QuotationHeadDTO;
import com.autonoma.erp.dto.purchase.QuotationListDTO;
import com.autonoma.erp.model.QuotationHead;
import com.autonoma.erp.repository.QuotationHeadRepository;
import com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository;
import com.autonoma.erp.modules.master.commercial.entity.AccountLedger;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class QuotationServiceImpl implements QuotationService {

    private final QuotationHeadRepository repository;
    private final StatusMasterRepository statusMasterRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;
    private final jakarta.persistence.EntityManager entityManager;
    private final com.autonoma.erp.repository.SupplierPerformanceRepository performanceRepository;

    @org.springframework.beans.factory.annotation.Autowired
    public QuotationServiceImpl(
            QuotationHeadRepository repository,
            StatusMasterRepository statusMasterRepository,
            org.springframework.jdbc.core.JdbcTemplate jdbcTemplate,
            jakarta.persistence.EntityManager entityManager,
            com.autonoma.erp.repository.SupplierPerformanceRepository performanceRepository) {
        this.repository = repository;
        this.statusMasterRepository = statusMasterRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.entityManager = entityManager;
        this.performanceRepository = performanceRepository;
    }

    @Override
    public List<QuotationListDTO> getAllQuotations(Long divisionId) {
        java.util.Map<Long, String> trackingStatusMap = new java.util.HashMap<>();
        try {
            jdbcTemplate.query(
                "SELECT q.ID AS QUOTE_ID, " +
                "CASE " +
                "WHEN EXISTS (SELECT 1 FROM PP_PURCHASE_ORDER_SOURCE pos JOIN PP_PURCHASE_ORDER_HEAD po ON pos.PO_HEAD_ID = po.ID WHERE po.ACTIVE_STATUS = 1 AND (" +
                "  (pos.SOURCE_TYPE = 'SUPPLIER_QUOTATION' AND pos.SOURCE_HEAD_ID = q.ID) OR " +
                "  (pos.SOURCE_TYPE = 'QUOTATION_COMPARISON' AND pos.SOURCE_HEAD_ID IN (SELECT qc.ID FROM PP_QUOTE_COMPARISON_HEAD qc WHERE qc.RFQ_ID = r.ID) AND po.SUPPLIER_ID = q.SUPPLIER_ID)" +
                ")) THEN 'PO Issued' " +
                "WHEN EXISTS (SELECT 1 FROM PP_QUOTE_COMPARISON_HEAD qc WHERE qc.RFQ_ID = r.ID) THEN 'Comparison Done' " +
                "WHEN EXISTS (SELECT 1 FROM PP_QUOTATION_NEGOTIATION_HEAD qn WHERE qn.RFQ_ID = r.ID) THEN 'Under Negotiation' " +
                "WHEN sm.NAME = 'Sent' THEN 'RFQ Issued' " +
                "ELSE sm.NAME END AS TRACKING_STATUS " +
                "FROM PP_QUOTATION_HEAD q " +
                "JOIN PP_RFQ_HEAD r ON q.RFQ_REF_ID = r.ID " +
                "LEFT JOIN AD_STATUS_MASTER sm ON r.STATUS_ID = sm.ID " +
                "WHERE q.DIVISION = ?",
                (rs) -> {
                    trackingStatusMap.put(rs.getLong("QUOTE_ID"), rs.getString("TRACKING_STATUS"));
                },
                divisionId);
        } catch (Exception e) {
            // Ignore
        }

        return repository.findAll().stream()
                .filter(q -> q.getDivision() != null && q.getDivision().getId().equals(divisionId))
                .map(entity -> {
                    QuotationListDTO dto = mapToListDTO(entity);
                    dto.setTrackingStatus(trackingStatusMap.getOrDefault(entity.getId(), dto.getStatusName()));
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<QuotationListDTO> getQuotationsByRfq(Long rfqId) {
        return repository.findByRfqHeadId(rfqId).stream()
                .map(this::mapToListDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public QuotationHeadDTO getQuotationById(Long id) {
        return repository.findById(id).map(this::mapToDTO).orElseThrow();
    }

    @Override
    @Transactional
    public QuotationHeadDTO saveQuotation(QuotationHeadDTO dto) {
        QuotationHead head;
        if (dto.getId() == null) {
            // ── Duplicate validation: same RFQ + same Supplier ──
            if (dto.getRfqRefId() != null && dto.getSupplierId() != null) {
                boolean isDuplicate = repository.existsByRfqHeadIdAndSupplierId(dto.getRfqRefId(), dto.getSupplierId());
                if (isDuplicate) {
                    throw new com.autonoma.erp.exception.BusinessException(
                        "A quotation already exists for this RFQ and Supplier combination. Duplicate quotations are not allowed."
                    );
                }
            }

            head = new QuotationHead();
            String quotationNo = generateQuotationNo(dto.getQuotationDate() != null ? dto.getQuotationDate() : new java.util.Date());
            head.setQuotationNo(quotationNo);
            
            // Set defaults for new entity
            com.autonoma.erp.modules.platform.common.entity.StatusMaster draftStatus = statusMasterRepository.findByNameIgnoreCase("Draft")
                .orElseGet(() -> {
                    com.autonoma.erp.modules.platform.common.entity.StatusMaster newStatus = new com.autonoma.erp.modules.platform.common.entity.StatusMaster();
                    newStatus.setName("DRAFT");
                    return statusMasterRepository.save(newStatus);
                });
            head.setStatus(draftStatus);
            String userId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
            head.setCreatedBy(userId);
            head.setCreatedDate(new java.util.Date());
            
            // Note: Division ID should ideally come from User context, but falling back to DTO if available
            Long divisionId = com.autonoma.erp.util.SecurityUtils.getCurrentDivisionId();
            if (divisionId == null) divisionId = dto.getDivisionId();
            if (divisionId != null) {
                head.setDivision(entityManager.getReference(com.autonoma.erp.modules.master.organization.entity.Division.class, divisionId));
            }
            
            head.setRfqHead(entityManager.getReference(com.autonoma.erp.model.RfqHead.class, dto.getRfqRefId()));
            head.setSupplier(entityManager.getReference(AccountLedger.class, dto.getSupplierId()));
        } else {
            head = repository.findById(dto.getId()).orElseThrow();
            if (head.getTechnicalStatus() != null && "VERIFIED".equalsIgnoreCase(head.getTechnicalStatus().getName())) {
                throw new com.autonoma.erp.exception.BusinessException("Cannot modify a quotation that has been technically verified.");
            }
            head.setUpdatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
            head.setUpdatedDate(new java.util.Date());
        }


        head.setQuotationDate(dto.getQuotationDate() != null ? dto.getQuotationDate() : new java.util.Date());
        head.setValidityDate(dto.getValidityDate() != null ? dto.getValidityDate() : new java.util.Date());
        head.setCurrency(dto.getCurrency() != null ? dto.getCurrency() : "INR");
        head.setLeadTimeDays(dto.getLeadTimeDays());
        head.setWarrantyTerms(dto.getWarrantyTerms());
        head.setPaymentTerms(dto.getPaymentTerms());
        head.setDeliveryTerms(dto.getDeliveryTerms());
        head.setTransportScope(dto.getTransportScope());
        head.setRemarks(dto.getRemarks());
        head.setSupplierReferenceNo(dto.getSupplierReferenceNo());
        head.setSupplierReferenceDate(dto.getSupplierReferenceDate());

        // Handle Details
        if (head.getDetails() == null) {
            head.setDetails(new java.util.ArrayList<>());
        }
        head.getDetails().clear(); // For simplicity, we clear and recreate details. In production, consider merging.
        
        if (dto.getDetails() != null) {
            for (com.autonoma.erp.dto.purchase.QuotationDetailDTO detailDto : dto.getDetails()) {
                com.autonoma.erp.model.QuotationDetail detail = new com.autonoma.erp.model.QuotationDetail();
                detail.setQuotationHead(head);
                detail.setRfqDetail(entityManager.getReference(com.autonoma.erp.model.RfqDetail.class, detailDto.getRfqDetailId()));
                detail.setItem(entityManager.getReference(com.autonoma.erp.modules.npd.product.entity.ProductMaster.class, detailDto.getItemId()));
                detail.setUom(detailDto.getUom());
                detail.setQty(detailDto.getQty() != null ? detailDto.getQty() : java.math.BigDecimal.ZERO);
                detail.setUnitPrice(detailDto.getUnitPrice() != null ? detailDto.getUnitPrice() : java.math.BigDecimal.ZERO);
                detail.setDiscountPercent(detailDto.getDiscountPercent() != null ? detailDto.getDiscountPercent() : java.math.BigDecimal.ZERO);
                detail.setCgstPer(detailDto.getCgstPer() != null ? detailDto.getCgstPer() : java.math.BigDecimal.ZERO);
                detail.setSgstPer(detailDto.getSgstPer() != null ? detailDto.getSgstPer() : java.math.BigDecimal.ZERO);
                detail.setIgstPer(detailDto.getIgstPer() != null ? detailDto.getIgstPer() : java.math.BigDecimal.ZERO);
                detail.setCgstValue(detailDto.getCgstValue() != null ? detailDto.getCgstValue() : java.math.BigDecimal.ZERO);
                detail.setSgstValue(detailDto.getSgstValue() != null ? detailDto.getSgstValue() : java.math.BigDecimal.ZERO);
                detail.setIgstValue(detailDto.getIgstValue() != null ? detailDto.getIgstValue() : java.math.BigDecimal.ZERO);
                detail.setFreightAmount(detailDto.getFreightAmount() != null ? detailDto.getFreightAmount() : java.math.BigDecimal.ZERO);
                detail.setTotalAmount(detailDto.getTotalAmount() != null ? detailDto.getTotalAmount() : java.math.BigDecimal.ZERO);
                detail.setRemarks(detailDto.getRemarks());
                detail.setDeliveryDate(detailDto.getDeliveryDate());
                // Set division from the current logged-in user's division
                Long detailDivisionId = com.autonoma.erp.util.SecurityUtils.getCurrentDivisionId();
                if (detailDivisionId == null && head.getDivision() != null) detailDivisionId = head.getDivision().getId();
                if (detailDivisionId != null) {
                    detail.setDivision(entityManager.getReference(com.autonoma.erp.modules.master.organization.entity.Division.class, detailDivisionId));
                }
                detail.setCreatedBy(head.getCreatedBy() != null ? head.getCreatedBy() : com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
                detail.setCreatedDate(head.getCreatedDate() != null ? head.getCreatedDate() : new java.util.Date());
                head.getDetails().add(detail);
            }
        }
        if (head.getAdditionalCharges() == null) {
            head.setAdditionalCharges(new java.util.ArrayList<>());
        }
        head.getAdditionalCharges().clear();
        if (dto.getAdditionalCharges() != null) {
            for (com.autonoma.erp.dto.purchase.QuotationChargeDTO chargeDto : dto.getAdditionalCharges()) {
                com.autonoma.erp.model.QuotationCharge charge = new com.autonoma.erp.model.QuotationCharge();
                charge.setQuotationHead(head);
                if (chargeDto.getChargesId() != null) {
                    charge.setChargeMaster(entityManager.getReference(com.autonoma.erp.modules.sm.sales.entity.SmAdditionalCharges.class, chargeDto.getChargesId()));
                }
                charge.setAmount(chargeDto.getAmount() != null ? chargeDto.getAmount() : java.math.BigDecimal.ZERO);
                charge.setTaxApplicable(chargeDto.getTaxApplicable() != null ? chargeDto.getTaxApplicable() : false);
                charge.setCgstPer(chargeDto.getCgstPer());
                charge.setCgstValue(chargeDto.getCgstValue());
                charge.setSgstPer(chargeDto.getSgstPer());
                charge.setSgstValue(chargeDto.getSgstValue());
                charge.setIgstPer(chargeDto.getIgstPer());
                charge.setIgstValue(chargeDto.getIgstValue());
                charge.setTotalValue(chargeDto.getTotalValue() != null ? chargeDto.getTotalValue() : charge.getAmount());
                
                charge.setCreatedBy(head.getCreatedBy() != null ? head.getCreatedBy() : com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
                charge.setCreatedDate(head.getCreatedDate() != null ? head.getCreatedDate() : new java.util.Date());
                head.getAdditionalCharges().add(charge);
            }
        }

        QuotationHead savedEntity = repository.saveAndFlush(head);
        return mapToDTO(savedEntity);
    }

    private String getAccountYear(java.util.Date documentDate) {
        java.util.Calendar cal = java.util.Calendar.getInstance();
        cal.setTime(documentDate != null ? documentDate : new java.util.Date());
        int year = cal.get(java.util.Calendar.YEAR);
        int month = cal.get(java.util.Calendar.MONTH);
        
        if (month < 3) {
            return (year - 1) + "-" + year;
        } else {
            return year + "-" + (year + 1);
        }
    }

    private String generateQuotationNo(java.util.Date documentDate) {
        String basePrefix = "";
        String baseSuffix = "";
        Integer digits = null;
        String accountYear = getAccountYear(documentDate);
        
        try {
            var prefixData = jdbcTemplate.queryForMap("SELECT QUOTATION_PREFIX, QUOTATION_SUFFIX, QUOTATION_DIGIT FROM AD_PREFIX_CREDENTIALS WHERE ACCOUNT_YEAR = ?", accountYear);
            if (prefixData.get("QUOTATION_PREFIX") != null) {
                basePrefix = (String) prefixData.get("QUOTATION_PREFIX");
            }
            if (prefixData.get("QUOTATION_SUFFIX") != null) {
                baseSuffix = (String) prefixData.get("QUOTATION_SUFFIX");
            }
            if (prefixData.get("QUOTATION_DIGIT") != null) {
                digits = ((Number) prefixData.get("QUOTATION_DIGIT")).intValue();
            }
        } catch(org.springframework.dao.EmptyResultDataAccessException e) {
            throw new RuntimeException("Prefix Credentials not configured for Account Year " + accountYear + ".");
        }
        
        if ((basePrefix == null || basePrefix.trim().isEmpty()) && (baseSuffix == null || baseSuffix.trim().isEmpty())) {
            throw new RuntimeException("Both Prefix and Suffix cannot be empty for Supplier Quotation.");
        }
        if (digits == null || digits <= 0) {
            throw new RuntimeException("Digit must be configured for Supplier Quotation.");
        }
        
        StringBuilder prefixBuilder = new StringBuilder();
        if (basePrefix != null && !basePrefix.trim().isEmpty()) {
            prefixBuilder.append(basePrefix.trim());
        }
        String finalPrefix = prefixBuilder.toString().replaceAll("/+", "/");
        String finalSuffix = (baseSuffix != null) ? baseSuffix.trim().replaceAll("/+", "/") : "";
        
        String searchPattern = finalPrefix + "%" + finalSuffix;
        
        String lastQt = null;
        try {
            lastQt = jdbcTemplate.queryForObject("SELECT TOP 1 QUOTATION_NO FROM PP_QUOTATION_HEAD WHERE QUOTATION_NO LIKE ? ORDER BY ID DESC", String.class, searchPattern);
        } catch(Exception e) {}
        
        int nextNum = 1;
        if (lastQt != null) {
            try {
                String numStr = lastQt;
                if (!finalPrefix.isEmpty() && numStr.startsWith(finalPrefix)) {
                    numStr = numStr.substring(finalPrefix.length());
                }
                if (!finalSuffix.isEmpty() && numStr.endsWith(finalSuffix)) {
                    numStr = numStr.substring(0, numStr.length() - finalSuffix.length());
                }
                nextNum = Integer.parseInt(numStr) + 1;
            } catch(Exception e) {}
        }
        
        return finalPrefix + String.format("%0" + digits + "d", nextNum) + finalSuffix;
    }

    @Override
    @Transactional
    public void evaluateTechnicalStatus(Long id, String statusName) {
        QuotationHead entity = repository.findById(id).orElseThrow();
        if (entity.getTechnicalStatus() != null && "VERIFIED".equalsIgnoreCase(entity.getTechnicalStatus().getName())) {
            throw new com.autonoma.erp.exception.BusinessException("Quotation is already technically verified.");
        }
        com.autonoma.erp.modules.platform.common.entity.StatusMaster status = statusMasterRepository.findByNameIgnoreCase(statusName)
            .orElseGet(() -> {
                com.autonoma.erp.modules.platform.common.entity.StatusMaster newStatus = new com.autonoma.erp.modules.platform.common.entity.StatusMaster();
                newStatus.setName(statusName.toUpperCase());
                return statusMasterRepository.save(newStatus);
            });
        entity.setTechnicalStatus(status);
        repository.save(entity);
    }

    private QuotationListDTO mapToListDTO(QuotationHead entity) {
        QuotationListDTO dto = new QuotationListDTO();
        dto.setId(entity.getId());
        dto.setQuotationNo(entity.getQuotationNo());
        dto.setRfqNo(entity.getRfqHead().getRfqNo());
        dto.setRfqId(entity.getRfqHead().getId());
        if (entity.getRfqHead().getPurchaseRequestHead() != null) {
            dto.setPrNo(entity.getRfqHead().getPurchaseRequestHead().getPrNo());
            dto.setPrId(entity.getRfqHead().getPurchaseRequestHead().getId());
        }
        dto.setSupplierId(entity.getSupplier().getId());
        dto.setSupplierName(entity.getSupplier().getLedgerName());
        dto.setQuotationDate(entity.getQuotationDate());
        if(entity.getTechnicalStatus() != null) dto.setTechnicalStatusName(entity.getTechnicalStatus().getName());
        dto.setStatusName(entity.getStatus().getName());
        return dto;
    }

    private QuotationHeadDTO mapToDTO(QuotationHead entity) {
        QuotationHeadDTO dto = new QuotationHeadDTO();
        dto.setId(entity.getId());
        dto.setQuotationNo(entity.getQuotationNo());
        if (entity.getRfqHead() != null) {
            dto.setRfqRefId(entity.getRfqHead().getId());
            dto.setRfqNo(entity.getRfqHead().getRfqNo());
        }
        if (entity.getSupplier() != null) {
            dto.setSupplierId(entity.getSupplier().getId());
            dto.setSupplierName(entity.getSupplier().getLedgerName());
        }
        dto.setQuotationDate(entity.getQuotationDate());
        dto.setValidityDate(entity.getValidityDate());
        dto.setCurrency(entity.getCurrency());
        dto.setLeadTimeDays(entity.getLeadTimeDays());
        dto.setWarrantyTerms(entity.getWarrantyTerms());
        dto.setPaymentTerms(entity.getPaymentTerms());
        dto.setDeliveryTerms(entity.getDeliveryTerms());
        dto.setRemarks(entity.getRemarks());
        dto.setSupplierReferenceNo(entity.getSupplierReferenceNo());
        dto.setSupplierReferenceDate(entity.getSupplierReferenceDate());
        if (entity.getDivision() != null) {
            dto.setDivisionId(entity.getDivision().getId());
        }
        if (entity.getTechnicalStatus() != null) {
            dto.setTechnicalStatusId(entity.getTechnicalStatus().getId());
            dto.setTechnicalStatusName(entity.getTechnicalStatus().getName());
        }
        if (entity.getStatus() != null) {
            dto.setStatusId(entity.getStatus().getId());
            dto.setStatusName(entity.getStatus().getName());
        }

        // Map real details and compute totals
        java.math.BigDecimal subtotal = java.math.BigDecimal.ZERO;
        java.math.BigDecimal taxAmount = java.math.BigDecimal.ZERO;
        java.util.List<com.autonoma.erp.dto.purchase.QuotationDetailDTO> detailDTOs = new java.util.ArrayList<>();
        if (entity.getDetails() != null) {
            for (com.autonoma.erp.model.QuotationDetail d : entity.getDetails()) {
                com.autonoma.erp.dto.purchase.QuotationDetailDTO dd = new com.autonoma.erp.dto.purchase.QuotationDetailDTO();
                dd.setId(d.getId());
                dd.setQuotationRefId(entity.getId());
                if (d.getRfqDetail() != null) dd.setRfqDetailId(d.getRfqDetail().getId());
                if (d.getItem() != null) {
                    dd.setItemId(d.getItem().getId());
                    dd.setItemCode(d.getItem().getItemCode());
                    dd.setItemName(d.getItem().getItemName());
                    dd.setHsnCode(d.getItem().getHsnCode());
                }
                dd.setUom(d.getUom());
                dd.setQty(d.getQty());
                dd.setUnitPrice(d.getUnitPrice());
                dd.setDiscountPercent(d.getDiscountPercent() != null ? d.getDiscountPercent() : java.math.BigDecimal.ZERO);
                dd.setCgstPer(d.getCgstPer() != null ? d.getCgstPer() : java.math.BigDecimal.ZERO);
                dd.setSgstPer(d.getSgstPer() != null ? d.getSgstPer() : java.math.BigDecimal.ZERO);
                dd.setIgstPer(d.getIgstPer() != null ? d.getIgstPer() : java.math.BigDecimal.ZERO);
                dd.setCgstValue(d.getCgstValue() != null ? d.getCgstValue() : java.math.BigDecimal.ZERO);
                dd.setSgstValue(d.getSgstValue() != null ? d.getSgstValue() : java.math.BigDecimal.ZERO);
                dd.setIgstValue(d.getIgstValue() != null ? d.getIgstValue() : java.math.BigDecimal.ZERO);
                dd.setFreightAmount(d.getFreightAmount() != null ? d.getFreightAmount() : java.math.BigDecimal.ZERO);
                dd.setTotalAmount(d.getTotalAmount() != null ? d.getTotalAmount() : java.math.BigDecimal.ZERO);
                dd.setRemarks(d.getRemarks());
                dd.setDeliveryDate(d.getDeliveryDate());
                detailDTOs.add(dd);

                // Accumulate totals
                java.math.BigDecimal itemQty = d.getQty() != null ? d.getQty() : java.math.BigDecimal.ZERO;
                java.math.BigDecimal itemUnitPrice = d.getUnitPrice() != null ? d.getUnitPrice() : java.math.BigDecimal.ZERO;
                java.math.BigDecimal discountPer = d.getDiscountPercent() != null ? d.getDiscountPercent() : java.math.BigDecimal.ZERO;
                
                java.math.BigDecimal gross = itemQty.multiply(itemUnitPrice);
                java.math.BigDecimal discountAmt = gross.multiply(discountPer).divide(new java.math.BigDecimal("100"), 4, java.math.RoundingMode.HALF_UP);
                java.math.BigDecimal taxable = gross.subtract(discountAmt);
                
                subtotal = subtotal.add(taxable);
                java.math.BigDecimal itemTax = (d.getCgstValue() != null ? d.getCgstValue() : java.math.BigDecimal.ZERO)
                        .add(d.getSgstValue() != null ? d.getSgstValue() : java.math.BigDecimal.ZERO)
                        .add(d.getIgstValue() != null ? d.getIgstValue() : java.math.BigDecimal.ZERO);
                taxAmount = taxAmount.add(itemTax);
            }
        }
        dto.setDetails(detailDTOs);
        dto.setSubtotal(subtotal);
        dto.setTaxAmount(taxAmount);
        
        java.math.BigDecimal otherChargesTotal = java.math.BigDecimal.ZERO;
        java.util.List<com.autonoma.erp.dto.purchase.QuotationChargeDTO> chargeDTOs = new java.util.ArrayList<>();
        if (entity.getAdditionalCharges() != null) {
            for (com.autonoma.erp.model.QuotationCharge c : entity.getAdditionalCharges()) {
                com.autonoma.erp.dto.purchase.QuotationChargeDTO cd = new com.autonoma.erp.dto.purchase.QuotationChargeDTO();
                cd.setId(c.getId());
                cd.setQuoteId(entity.getId());
                if (c.getChargeMaster() != null) {
                    cd.setChargesId(c.getChargeMaster().getId());
                    cd.setChargeName(c.getChargeMaster().getCharges());
                }
                cd.setAmount(c.getAmount());
                cd.setTaxApplicable(c.getTaxApplicable());
                cd.setCgstPer(c.getCgstPer());
                cd.setCgstValue(c.getCgstValue());
                cd.setSgstPer(c.getSgstPer());
                cd.setSgstValue(c.getSgstValue());
                cd.setIgstPer(c.getIgstPer());
                cd.setIgstValue(c.getIgstValue());
                cd.setTotalValue(c.getTotalValue());
                cd.setStatus(c.getStatus());
                chargeDTOs.add(cd);
                otherChargesTotal = otherChargesTotal.add(c.getTotalValue() != null ? c.getTotalValue() : java.math.BigDecimal.ZERO);
            }
        }
        dto.setAdditionalCharges(chargeDTOs);
        
        dto.setDiscountAmount(java.math.BigDecimal.ZERO);
        dto.setFreight(java.math.BigDecimal.ZERO);
        dto.setPacking(java.math.BigDecimal.ZERO);
        dto.setInsurance(java.math.BigDecimal.ZERO);
        dto.setOtherCharges(otherChargesTotal);
        dto.setGrandTotal(subtotal.add(taxAmount).add(otherChargesTotal));

        // Build real Supplier Insights from SupplierPerformance table (no mock data)
        if (entity.getSupplier() != null) {
            com.autonoma.erp.dto.purchase.SupplierInsightsDTO insights = new com.autonoma.erp.dto.purchase.SupplierInsightsDTO();
            insights.setSupplierName(entity.getSupplier().getLedgerName());
            insights.setSupplierCode(entity.getSupplier().getCode());
            performanceRepository.findBySupplierId(entity.getSupplier().getId()).ifPresent(perf -> {
                insights.setRating(perf.getRatingScore() != null ? perf.getRatingScore().doubleValue() : null);
                insights.setOnTimeDeliveryPercent(perf.getDeliveryPerformance() != null ? perf.getDeliveryPerformance().doubleValue() : null);
                insights.setQualityScore(perf.getQualityPerformance() != null ? perf.getQualityPerformance().doubleValue() : null);
                insights.setLastPurchaseDate(perf.getLastEvaluated());
            });
            dto.setSupplierInsights(insights);
        }

        return dto;
    }
}
