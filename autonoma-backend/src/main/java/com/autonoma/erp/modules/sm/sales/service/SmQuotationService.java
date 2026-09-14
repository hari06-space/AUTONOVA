package com.autonoma.erp.modules.sm.sales.service;

import com.autonoma.erp.util.SecurityUtils;

import com.autonoma.erp.modules.sm.sales.entity.SmQuotation;
import com.autonoma.erp.modules.sm.sales.entity.SmQuotationDetail;
import com.autonoma.erp.modules.sm.sales.repository.SmQuotationRepository;
import com.autonoma.erp.modules.npd.product.entity.ProductMaster;
import com.autonoma.erp.modules.npd.product.repository.ProductMasterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class SmQuotationService {

    @Autowired
    private SmQuotationRepository quotationRepository;
    
    @Autowired
    private com.autonoma.erp.modules.sm.sales.repository.SalesAttachmentPathRepository attachmentRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Autowired
    private ProductMasterRepository productMasterRepository;

    @Autowired
    private com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository statusMasterRepository;

    public List<SmQuotation> getAllQuotations() {
        List<SmQuotation> list = quotationRepository.findAll();
        java.util.Map<Long, String> statusMap = new java.util.HashMap<>();
        statusMasterRepository.findAll().forEach(s -> statusMap.put(s.getId(), s.getName()));
        for (SmQuotation q : list) {
            if (q.getQuotationStatus() != null) {
                q.setQuotationStatusName(statusMap.get(q.getQuotationStatus()));
            }
        }
        return list;
    }

    public Optional<SmQuotation> getQuotationById(Long id) {
        Optional<SmQuotation> opt = quotationRepository.findById(id);
        if (opt.isPresent()) {
            SmQuotation quotation = opt.get();
            if (quotation.getQuotationStatus() != null) {
                statusMasterRepository.findById(quotation.getQuotationStatus())
                    .ifPresent(s -> quotation.setQuotationStatusName(s.getName()));
            }
            quotation.setAttachments(attachmentRepository.findByPageCodeAndRefId("SM1140", quotation.getId()));
            if (quotation.getParts() != null) {
                for (SmQuotationDetail part : quotation.getParts()) {
                    if (part.getPartNoId() != null) {
                        Optional<ProductMaster> prodOpt = productMasterRepository.findById(part.getPartNoId());
                        if (prodOpt.isPresent()) {
                            ProductMaster prod = prodOpt.get();
                            part.setPartNo(prod.getItemNo());
                            part.setName(prod.getItemName());
                            part.setHsnCode(prod.getHsnCode());
                            part.setUom(prod.getUom());
                        }
                    }
                }
                
                // Fetch currency and exchange rate from Sales Price Master based on the first part
                if (!quotation.getParts().isEmpty()) {
                    Long partId = quotation.getParts().get(0).getPartNoId();
                    if (partId != null && quotation.getCustomerId() != null) {
                        try {
                            String sql = "SELECT TOP 1 p.EXCHANGE_RATE, pd.CURRENCY " +
                                         "FROM SALES_PRICE_LIST_TRANS pd " +
                                         "JOIN SALES_PRICE_LIST_MASTER p ON p.ID = pd.PRICE_MASTER_ID " +
                                         "WHERE p.CUSTOMER_ID = ? AND pd.PRODUCT_ID = ? AND p.STATUS = 'ACTIVE' " +
                                         "ORDER BY p.EFFECTIVE_FROM DESC";
                            java.util.List<java.util.Map<String, Object>> rows = jdbcTemplate.queryForList(sql, quotation.getCustomerId(), partId);
                            if (!rows.isEmpty()) {
                                java.util.Map<String, Object> row = rows.get(0);
                                if (row.get("CURRENCY") != null) quotation.setCurrency(row.get("CURRENCY").toString());
                                if (row.get("EXCHANGE_RATE") != null) {
                                    quotation.setExchangeRate(Double.valueOf(row.get("EXCHANGE_RATE").toString()));
                                }
                            }
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                    }
                }
            }
            return Optional.of(quotation);
        }
        return opt;
    }

    public List<SmQuotation> getQuotationsByCustomerAndProduct(Long customerId, Long productId, String productName, String partNo) {
        List<SmQuotation> list = quotationRepository.findAll();
        java.util.Map<Long, String> statusMap = new java.util.HashMap<>();
        statusMasterRepository.findAll().forEach(s -> statusMap.put(s.getId(), s.getName()));

        java.util.Map<Long, ProductMaster> prodMap = new java.util.HashMap<>();
        productMasterRepository.findAll().forEach(p -> prodMap.put(p.getId(), p));

        return list.stream()
                .filter(q -> {
                    String sName = q.getQuotationStatus() != null ? statusMap.get(q.getQuotationStatus()) : "";
                    boolean isVerified = "VERIFIED".equalsIgnoreCase(sName) || Long.valueOf(24L).equals(q.getQuotationStatus());
                    if (!isVerified) return false;

                    if (customerId != null && !customerId.equals(q.getCustomerId())) {
                        return false;
                    }

                    if (q.getParts() == null) return false;
                    return q.getParts().stream().anyMatch(part -> {
                        if (part.getPartNoId() != null) {
                            ProductMaster prod = prodMap.get(part.getPartNoId());
                            if (prod != null) {
                                part.setPartNo(prod.getItemNo());
                                part.setName(prod.getItemName());
                                part.setHsnCode(prod.getHsnCode());
                                part.setUom(prod.getUom());
                            }
                        }
                        if (productId != null && productId.equals(part.getPartNoId())) return true;
                        if (partNo != null && !partNo.trim().isEmpty() && partNo.equalsIgnoreCase(part.getPartNo())) return true;
                        if (productName != null && !productName.trim().isEmpty() && 
                            (productName.equalsIgnoreCase(part.getPartNo()) || (part.getName() != null && part.getName().equalsIgnoreCase(productName)))) return true;
                        return false;
                    });
                })
                .peek(q -> {
                    if (q.getQuotationStatus() != null) {
                        q.setQuotationStatusName(statusMap.get(q.getQuotationStatus()));
                    }
                })
                .toList();
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

    public String generateQuotationNo(java.util.Date documentDate) {
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
            // Ignore if not found, use defaults
        }
        
        if ((basePrefix == null || basePrefix.trim().isEmpty()) && (baseSuffix == null || baseSuffix.trim().isEmpty())) {
            basePrefix = "QTN-";
        }
        if (digits == null || digits <= 0) {
            digits = 5;
        }
        
        StringBuilder prefixBuilder = new StringBuilder();
        if (basePrefix != null && !basePrefix.trim().isEmpty()) {
            prefixBuilder.append(basePrefix.trim());
        }
        if (baseSuffix != null && !baseSuffix.trim().isEmpty()) {
            prefixBuilder.append(baseSuffix.trim());
        }
        
        String prefix = prefixBuilder.toString().replaceAll("/+", "/");
        
        String lastCode = null;
        try {
            lastCode = jdbcTemplate.queryForObject("SELECT TOP 1 QUOTATION_NO FROM SALES_QUOTATION_HEADER WHERE QUOTATION_NO LIKE ? ORDER BY ID DESC", String.class, prefix + "%");
        } catch (org.springframework.dao.EmptyResultDataAccessException e) {
            lastCode = null;
        }
        
        if (lastCode != null && lastCode.startsWith(prefix)) {
            String numStr = lastCode.substring(prefix.length());
            try {
                int nextNum = Integer.parseInt(numStr) + 1;
                return prefix + String.format("%0" + digits + "d", nextNum);
            } catch (NumberFormatException e) {
                return prefix + String.format("%0" + digits + "d", 1);
            }
        } else {
            return prefix + String.format("%0" + digits + "d", 1);
        }
    }

    public String generateQuotationNo() {
        return generateQuotationNo(new java.util.Date());
    }

    @org.springframework.transaction.annotation.Transactional
    public SmQuotation saveQuotation(SmQuotation quotation) {
        if (quotation.getCreatedBy() == null) {
            quotation.setCreatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
        }
        if (quotation.getQuotationNo() == null || quotation.getQuotationNo().isEmpty()) {
            quotation.setQuotationNo(generateQuotationNo(quotation.getQuotationDate() != null ? quotation.getQuotationDate() : new java.util.Date()));
        }
        
        // Update Product Master with HSN code if provided (Do this BEFORE save so Transient fields are not lost by Hibernate merge)
        if (quotation.getParts() != null) {
            System.out.println("Processing " + quotation.getParts().size() + " parts for Product Master update");
            for (SmQuotationDetail part : quotation.getParts()) {
                System.out.println("PartNoId: " + part.getPartNoId() + ", HSNCode: '" + part.getHsnCode() + "'");
                if (part.getPartNoId() != null && part.getHsnCode() != null && !part.getHsnCode().trim().isEmpty()) {
                    Optional<ProductMaster> prodOpt = productMasterRepository.findById(part.getPartNoId());
                    System.out.println("Product found: " + prodOpt.isPresent());
                    if (prodOpt.isPresent()) {
                        ProductMaster prod = prodOpt.get();
                        System.out.println("Old HSN: " + prod.getHsnCode() + ", New HSN: " + part.getHsnCode());
                        if (prod.getHsnCode() == null || !prod.getHsnCode().equals(part.getHsnCode())) {
                            prod.setHsnCode(part.getHsnCode());
                            productMasterRepository.save(prod);
                            System.out.println("Saved new HSN to Product Master!");
                        }
                    }
                }
            }
        }

        List<com.autonoma.erp.modules.sm.sales.entity.SalesAttachmentPath> attachments = quotation.getAttachments();

        SmQuotation savedQuotation = quotationRepository.save(quotation);
        
        // Manage Attachments
        if (attachments != null) {
            attachmentRepository.deleteByPageCodeAndRefId("SM1140", savedQuotation.getId());
            for (com.autonoma.erp.modules.sm.sales.entity.SalesAttachmentPath att : attachments) {
                att.setId(null);
                att.setPageCode("SM1140");
                att.setRefId(savedQuotation.getId());
                attachmentRepository.save(att);
            }
            savedQuotation.setAttachments(attachments);
        }

        return savedQuotation;
    }

    public void deleteQuotation(Long id) {
        quotationRepository.deleteById(id);
    }
    
    @org.springframework.transaction.annotation.Transactional
    public SmQuotation verifyQuotation(Long id, String action, String remarks, String updatedBy) {
        SmQuotation quotation = quotationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Quotation not found with id: " + id));

        String statusName = action.equalsIgnoreCase("verify") ? "Verified" : "Rejected";
        com.autonoma.erp.modules.platform.common.entity.StatusMaster status = statusMasterRepository.findByName(statusName)
                .orElseThrow(() -> new RuntimeException("Status '" + statusName + "' not found in AD_STATUS_MASTER"));

        quotation.setQuotationStatus(status.getId());
        quotation.setVerifyRejComments(remarks);
        quotation.setUpdatedBy(updatedBy);
        
        return quotationRepository.save(quotation);
    }

    public long countAll() {
        return quotationRepository.count();
    }

    public long countByStatus(Boolean status) {
        return quotationRepository.findByStatus(status).size();
    }
}
