package com.autonoma.erp.modules.sm.sales.service;

import com.autonoma.erp.modules.sm.sales.entity.SmEnquiry;
import com.autonoma.erp.modules.sm.sales.entity.SmEnquiryPart;
import com.autonoma.erp.modules.sm.sales.repository.SmEnquiryRepository;
import com.autonoma.erp.modules.sm.sales.repository.SmEnquiryPartRepository;
import com.autonoma.erp.modules.master.contact.repository.ContactMasterRepository;
import com.autonoma.erp.modules.master.contact.entity.ContactMaster;
import com.autonoma.erp.modules.npd.product.repository.ProductMasterRepository;
import com.autonoma.erp.modules.npd.product.entity.ProductMaster;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.jdbc.core.JdbcTemplate;


import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class SmEnquiryService {

    @Autowired
    private SmEnquiryRepository enquiryRepository;

    @Autowired
    private SmEnquiryPartRepository enquiryPartRepository;

    @Autowired
    private ContactMasterRepository contactRepository;

    @Autowired
    private ProductMasterRepository productMasterRepository;

    @Autowired
    private com.autonoma.erp.service.admin.EmailSendingService emailSendingService;

    @Autowired
    private com.autonoma.erp.modules.sm.sales.repository.SalesAttachmentPathRepository attachmentRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

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

    public String generateEnquiryNo(java.util.Date documentDate) {
        String basePrefix = "";
        String baseSuffix = "";
        Integer digits = null;
        String accountYear = getAccountYear(documentDate);

        try {
            var prefixData = jdbcTemplate.queryForMap(
                    "SELECT RFQ_PREFIX, RFQ_SUFFIX, RFQ_DIGIT FROM AD_PREFIX_CREDENTIALS WHERE ACCOUNT_YEAR = ?",
                    accountYear);
            if (prefixData.get("RFQ_PREFIX") != null) {
                basePrefix = (String) prefixData.get("RFQ_PREFIX");
            }
            if (prefixData.get("RFQ_SUFFIX") != null) {
                baseSuffix = (String) prefixData.get("RFQ_SUFFIX");
            }
            if (prefixData.get("RFQ_DIGIT") != null) {
                digits = ((Number) prefixData.get("RFQ_DIGIT")).intValue();
            }
        } catch (org.springframework.dao.EmptyResultDataAccessException e) {
            throw new RuntimeException("Prefix Credentials not configured for Account Year " + accountYear + ".");
        }

        if ((basePrefix == null || basePrefix.trim().isEmpty())
                && (baseSuffix == null || baseSuffix.trim().isEmpty())) {
            basePrefix = "RFQ-";
        }
        if (digits == null || digits <= 0) {
            digits = 3;
        }

        StringBuilder prefixBuilder = new StringBuilder();
        if (basePrefix != null && !basePrefix.trim().isEmpty()) {
            prefixBuilder.append(basePrefix.trim());
        }
        if (baseSuffix != null && !baseSuffix.trim().isEmpty()) {
            prefixBuilder.append(baseSuffix.trim());
        }

        String prefix = prefixBuilder.toString().replaceAll("/+", "/");

        String lastEnq = null;
        try {
            lastEnq = jdbcTemplate.queryForObject(
                    "SELECT TOP 1 ENQUIRY_NO FROM SM_ENQUIRY WHERE ENQUIRY_NO LIKE ? ORDER BY ID DESC", String.class,
                    prefix + "%");
        } catch (Exception e) {
        }

        int nextNum = 1;
        if (lastEnq != null) {
            try {
                String numStr = lastEnq.replace(prefix, "");
                nextNum = Integer.parseInt(numStr) + 1;
            } catch (Exception e) {
            }
        }

        return prefix + String.format("%0" + digits + "d", nextNum);
    }


    public List<SmEnquiry> getAllEnquiries() {
        List<SmEnquiry> list = enquiryRepository.findAll();
        // Skip fetching attachments for all enquiries to optimize list view
        return list;
    }

    public Optional<SmEnquiry> getEnquiryById(Long id) {
        Optional<SmEnquiry> opt = enquiryRepository.findById(id);
        opt.ifPresent(enq -> {
            enq.setAttachments(attachmentRepository.findByPageCodeAndRefId("SM1120", enq.getId()));
        });
        return opt;
    }

    public SmEnquiry saveEnquiry(SmEnquiry enquiry) {
        if (enquiry.getCreatedBy() == null) {
            enquiry.setCreatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
        }

        if (enquiry.getEnquiryNo() == null || enquiry.getEnquiryNo().isEmpty()
                || "Pending Configuration".equals(enquiry.getEnquiryNo())) {
            enquiry.setEnquiryNo(generateEnquiryNo(
                    enquiry.getCreatedDate() != null ? enquiry.getCreatedDate() : new java.util.Date()));
        }

        List<SmEnquiryPart> parts = enquiry.getParts();
        enquiry.setParts(null); // Detach to save header first and get ID

        List<com.autonoma.erp.modules.sm.sales.entity.SalesAttachmentPath> attachments = enquiry.getAttachments();

        SmEnquiry savedEnquiry = enquiryRepository.save(enquiry);

        // Manage Attachments
        if (attachments != null) {
            attachmentRepository.deleteByPageCodeAndRefId("SM1120", savedEnquiry.getId());
            for (com.autonoma.erp.modules.sm.sales.entity.SalesAttachmentPath att : attachments) {
                att.setId(null);
                att.setPageCode("SM1120");
                att.setRefId(savedEnquiry.getId());
                attachmentRepository.save(att);
            }
            savedEnquiry.setAttachments(attachments);
        }

        if (parts != null && !parts.isEmpty()) {
            for (SmEnquiryPart part : parts) {
                part.setEnquiryId(savedEnquiry.getId());

                // Auto-create new ProductMaster if it's a new part number (from Transient fields)
                if (part.getPartNoId() == null && part.getPartNo() != null && !part.getPartNo().trim().isEmpty()) {
                    Optional<ProductMaster> existingProdOpt = productMasterRepository.findByItemNo(part.getPartNo());
                    if (existingProdOpt.isEmpty()) {
                        ProductMaster newProd = new ProductMaster();
                        newProd.setItemNo(part.getPartNo());
                        newProd.setItemName(part.getName() != null && !part.getName().trim().isEmpty() ? part.getName()
                                : part.getPartNo());
                        newProd.setOemPrefix(part.getOemPartNo());
                        newProd.setItemCode(part.getIppPartNo());
                        newProd.setUom(part.getUom());
                        newProd.setStatus("RFQ");
                        productMasterRepository.save(newProd);
                        part.setPartNoId(newProd.getId());
                    } else {
                        part.setPartNoId(existingProdOpt.get().getId());
                    }
                } else if (part.getPartNoId() == null && part.getPartNo() != null) {
                    // Fallback
                    Optional<ProductMaster> existingProdOpt = productMasterRepository.findByItemNo(part.getPartNo());
                    existingProdOpt.ifPresent(productMaster -> part.setPartNoId(productMaster.getId()));
                }

                enquiryPartRepository.save(part);
            }
            savedEnquiry.setParts(parts);
        }

        return savedEnquiry;
    }

    public void deleteEnquiry(Long id) {
        enquiryRepository.deleteById(id);
    }

    public List<SmEnquiry> getEnquiriesByStatus(Long status) {
        return enquiryRepository.findByStatus(status);
    }

    public long countAll() {
        return enquiryRepository.count();
    }

    public long countByStatus(Long status) {
        return enquiryRepository.findByStatus(status).size();
    }

    public void bulkAssignParts(List<Long> partIds, String employeeId, String department, java.util.Date targetDate) {
        for (Long partId : partIds) {
            Optional<SmEnquiryPart> partOpt = enquiryPartRepository.findById(partId);
            if (partOpt.isPresent()) {
                SmEnquiryPart part = partOpt.get();
                part.setAssignTo(employeeId);
                part.setStatus(true);
                enquiryPartRepository.save(part);
            }
        }
    }

    public void bulkUpdatePartsFeasibility(List<Long> partIds, String commercialFeasible, String technicalFeasible) {
        for (Long partId : partIds) {
            Optional<SmEnquiryPart> partOpt = enquiryPartRepository.findById(partId);
            if (partOpt.isPresent()) {
                SmEnquiryPart part = partOpt.get();
                part.setCommerciallyFeasible(commercialFeasible);
                part.setTechnicallyFeasible(technicalFeasible);
                part.setStatus(true);
                enquiryPartRepository.save(part);
            }
        }
    }

    public boolean sendEnquiryEmail(String to, String cc, String subject, String body) {
        try {
            return emailSendingService.sendEmailWithAttachments(to, cc, "", subject, body, null);
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public List<SmEnquiryPart> parseExcelFile(MultipartFile file) {
        List<SmEnquiryPart> parts = new ArrayList<>();
        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null)
                    continue;

                SmEnquiryPart part = new SmEnquiryPart();
                // Assuming Excel parsing now only extracts partNoId or ignores string fields
                // since they are removed from entity
                part.setStatus(true);
                parts.add(part);
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Excel file: " + e.getMessage(), e);
        }
        return parts;
    }
}
