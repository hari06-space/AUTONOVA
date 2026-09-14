package com.autonoma.erp.service;

import com.autonoma.erp.dto.purchase.RfqHeadDTO;
import com.autonoma.erp.dto.purchase.RfqListDTO;
import com.autonoma.erp.model.RfqHead;
import com.autonoma.erp.repository.RfqHeadRepository;
import com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class RfqServiceImpl implements RfqService {

    private final RfqHeadRepository repository;
    private final StatusMasterRepository statusMasterRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;
    private final com.autonoma.erp.repository.RfqEmailHistoryRepository rfqEmailHistoryRepository;
    private final com.autonoma.erp.modules.hr.employee.repository.EmployeeContactRepository employeeContactRepository;
    private final com.autonoma.erp.repository.RfqAttachmentRepository rfqAttachmentRepository;
    private final com.autonoma.erp.modules.platform.files.service.FileService fileService;
    private final com.autonoma.erp.service.admin.EmailSendingService emailSendingService;
    private final com.autonoma.erp.modules.hr.employee.repository.EmployeeJobProfileRepository employeeJobProfileRepository;
    private final RfqEmailHistoryService rfqEmailHistoryService;
    private final com.autonoma.erp.service.admin.CompanyCredentialService companyCredentialService;

    @org.springframework.beans.factory.annotation.Autowired
    public RfqServiceImpl(
            RfqHeadRepository repository,
            StatusMasterRepository statusMasterRepository,
            org.springframework.jdbc.core.JdbcTemplate jdbcTemplate,
            com.autonoma.erp.repository.RfqEmailHistoryRepository rfqEmailHistoryRepository,
            com.autonoma.erp.modules.hr.employee.repository.EmployeeContactRepository employeeContactRepository,
            com.autonoma.erp.repository.RfqAttachmentRepository rfqAttachmentRepository,
            com.autonoma.erp.modules.platform.files.service.FileService fileService,
            com.autonoma.erp.service.admin.EmailSendingService emailSendingService,
            com.autonoma.erp.modules.hr.employee.repository.EmployeeJobProfileRepository employeeJobProfileRepository,
            RfqEmailHistoryService rfqEmailHistoryService,
            com.autonoma.erp.service.admin.CompanyCredentialService companyCredentialService) {
        this.repository = repository;
        this.statusMasterRepository = statusMasterRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.rfqEmailHistoryRepository = rfqEmailHistoryRepository;
        this.employeeContactRepository = employeeContactRepository;
        this.rfqAttachmentRepository = rfqAttachmentRepository;
        this.fileService = fileService;
        this.emailSendingService = emailSendingService;
        this.employeeJobProfileRepository = employeeJobProfileRepository;
        this.rfqEmailHistoryService = rfqEmailHistoryService;
        this.companyCredentialService = companyCredentialService;
    }

    @Override
    public List<RfqListDTO> getAllRfqs(Long divisionId) {
        java.util.Map<Long, String> rfqQuotationMap = new java.util.HashMap<>();
        java.util.Map<Long, java.util.List<com.autonoma.erp.dto.purchase.QuotationRefDTO>> rfqQuotationListMap = new java.util.HashMap<>();
        try {
            jdbcTemplate.query("SELECT ID, RFQ_REF_ID, QUOTATION_NO FROM PP_QUOTATION_HEAD WHERE DIVISION = ?",
                (rs) -> {
                    Long rfqId = rs.getLong("RFQ_REF_ID");
                    Long qId   = rs.getLong("ID");
                    String qno = rs.getString("QUOTATION_NO");
                    if (qno != null && !qno.isEmpty()) {
                        rfqQuotationMap.merge(rfqId, qno, (a, b) -> a + ", " + b);
                        rfqQuotationListMap.computeIfAbsent(rfqId, k -> new java.util.ArrayList<>())
                            .add(new com.autonoma.erp.dto.purchase.QuotationRefDTO(qId, qno));
                    }
                },
                divisionId);
        } catch (Exception e) {
            // Ignore if table doesn't exist or query fails
        }

        java.util.Map<Long, String> rfqTrackingStatusMap = new java.util.HashMap<>();
        try {
            jdbcTemplate.query(
                "SELECT r.ID AS RFQ_ID, " +
                "CASE " +
                "WHEN EXISTS (SELECT 1 FROM PP_PURCHASE_ORDER_SOURCE pos JOIN PP_PURCHASE_ORDER_HEAD po ON pos.PO_HEAD_ID = po.ID WHERE po.ACTIVE_STATUS = 1 AND (" +
                "  (pos.SOURCE_TYPE = 'SUPPLIER_QUOTATION' AND pos.SOURCE_HEAD_ID IN (SELECT q.ID FROM PP_QUOTATION_HEAD q WHERE q.RFQ_REF_ID = r.ID)) OR " +
                "  (pos.SOURCE_TYPE = 'QUOTATION_COMPARISON' AND pos.SOURCE_HEAD_ID IN (SELECT c.ID FROM PP_QUOTE_COMPARISON_HEAD c WHERE c.RFQ_ID = r.ID))" +
                ")) THEN 'PO Issued' " +
                "WHEN EXISTS (SELECT 1 FROM PP_QUOTE_COMPARISON_HEAD qc WHERE qc.RFQ_ID = r.ID) THEN 'Comparison Done' " +
                "WHEN EXISTS (SELECT 1 FROM PP_QUOTATION_NEGOTIATION_HEAD qn WHERE qn.RFQ_ID = r.ID) THEN 'Under Negotiation' " +
                "WHEN EXISTS (SELECT 1 FROM PP_QUOTATION_HEAD q WHERE q.RFQ_REF_ID = r.ID) THEN 'Quotations Received' " +
                "WHEN sm.NAME = 'Sent' THEN 'RFQ Issued' " +
                "ELSE sm.NAME END AS TRACKING_STATUS " +
                "FROM PP_RFQ_HEAD r LEFT JOIN AD_STATUS_MASTER sm ON r.STATUS_ID = sm.ID WHERE r.DIVISION = ?",
                (rs) -> {
                    rfqTrackingStatusMap.put(rs.getLong("RFQ_ID"), rs.getString("TRACKING_STATUS"));
                },
                divisionId);
        } catch (Exception e) {
            // Ignore
        }

        return repository.findAll().stream()
                .filter(r -> r.getDivision() != null && r.getDivision().getId().equals(divisionId))
                .map(entity -> {
                    RfqListDTO dto = mapToListDTO(entity);
                    dto.setQuotationNos(rfqQuotationMap.get(entity.getId()));
                    
                    java.util.List<com.autonoma.erp.dto.purchase.QuotationRefDTO> quotes = rfqQuotationListMap.get(entity.getId());
                    dto.setQuotationList(quotes);
                    
                    int supplierCount = entity.getSuppliers() != null ? entity.getSuppliers().size() : 0;
                    int quoteCount = quotes != null ? quotes.size() : 0;
                    dto.setAllQuotationsReceived(supplierCount > 0 && quoteCount >= supplierCount);
                    dto.setInvitedSuppliersCount(supplierCount);
                    dto.setReceivedQuotationsCount(quoteCount);
                    
                    String tStatus = rfqTrackingStatusMap.getOrDefault(entity.getId(), "Pending");
                    dto.setTrackingStatus(tStatus);
                    
                    if ("Quotations Received".equals(tStatus) && supplierCount > 0 && quoteCount >= supplierCount) {
                        dto.setStatusName("Closed");
                    }
                    
                    return dto;
                })
                .collect(Collectors.toList());
    }


    @Override
    @Transactional(readOnly = true)
    public RfqHeadDTO getRfqById(Long id) {
        return repository.findById(id).map(this::mapToDTO).orElseThrow();
    }

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    @Transactional
    public RfqHeadDTO createRfq(RfqHeadDTO dto) {
        String username = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();

        RfqHead entity = new RfqHead();
        entity.setRfqDate(dto.getRfqDate() != null ? dto.getRfqDate() : new java.util.Date());
        entity.setRfqNo(generateRfqNo(entity.getRfqDate()));
        entity.setClosingDate(dto.getClosingDate() != null ? dto.getClosingDate() : new java.util.Date());
        entity.setCommercialTerms(dto.getCommercialTerms());
        entity.setInternalNotes(dto.getInternalNotes());

        if (dto.getDepartmentId() != null) {
            entity.setDepartment(entityManager.getReference(
                    com.autonoma.erp.modules.hr.orgstructure.entity.Department.class, dto.getDepartmentId()));
        }
        if (dto.getBuyerId() != null) {
            entity.setBuyer(entityManager.getReference(com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster.class,
                    dto.getBuyerId()));
        }
        if (dto.getPrRefId() != null) {
            entity.setPurchaseRequestHead(
                    entityManager.getReference(com.autonoma.erp.model.PurchaseRequestHead.class, dto.getPrRefId()));
        }

        entity.setDivision(
                entityManager.getReference(com.autonoma.erp.modules.master.organization.entity.Division.class,
                        dto.getDivisionId() != null ? dto.getDivisionId()
                                : com.autonoma.erp.util.SecurityUtils.getCurrentDivisionId()));

        // Status defaults to Draft (Status ID 1, assuming 1 is Draft or lookup by name)
        com.autonoma.erp.modules.platform.common.entity.StatusMaster status = statusMasterRepository.findByName("Draft")
                .orElseGet(() -> entityManager
                        .getReference(com.autonoma.erp.modules.platform.common.entity.StatusMaster.class, 1L));
        entity.setStatus(status);

        entity.setCreatedBy(username);
        entity.setCreatedDate(new java.util.Date());

        if (dto.getDetails() != null) {
            List<com.autonoma.erp.model.RfqDetail> details = dto.getDetails().stream().map(d -> {
                com.autonoma.erp.model.RfqDetail detail = new com.autonoma.erp.model.RfqDetail();
                detail.setRfqHead(entity);
                detail.setDivision(entity.getDivision());
                detail.setItem(entityManager
                        .getReference(com.autonoma.erp.modules.npd.product.entity.ProductMaster.class, d.getItemId()));
                detail.setUom(d.getUom());
                detail.setReqQty(d.getReqQty());
                detail.setExpectedDeliveryDate(d.getExpectedDeliveryDate());
                detail.setRemarks(d.getRemarks());
                detail.setPrTransId(d.getPrTransId());
                detail.setCreatedBy(username);
                detail.setCreatedDate(new java.util.Date());
                return detail;
            }).collect(Collectors.toList());
            entity.setDetails(details);
        }

        if (dto.getSuppliers() != null) {
            List<com.autonoma.erp.model.RfqSupplier> suppliers = dto.getSuppliers().stream().map(s -> {
                com.autonoma.erp.model.RfqSupplier supplier = new com.autonoma.erp.model.RfqSupplier();
                supplier.setRfqHead(entity);
                supplier.setSupplier(entityManager.getReference(
                        com.autonoma.erp.modules.master.commercial.entity.AccountLedger.class, s.getSupplierId()));
                supplier.setEmailSent(false);
                supplier.setCreatedBy(username);
                supplier.setCreatedDate(new java.util.Date());
                return supplier;
            }).collect(Collectors.toList());
            entity.setSuppliers(suppliers);
        }

        repository.save(entity);
        return mapToDTO(entity);
    }

    @Override
    @Transactional
    public RfqHeadDTO updateRfq(Long id, RfqHeadDTO dto) {
        String username = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        RfqHead entity = repository.findById(id).orElseThrow(() -> new RuntimeException("RFQ not found"));

        if (entity.getStatus() != null && !"Draft".equalsIgnoreCase(entity.getStatus().getName())) {
            throw new RuntimeException("Cannot update RFQ. It is no longer in Draft status.");
        }

        entity.setClosingDate(dto.getClosingDate());
        entity.setCommercialTerms(dto.getCommercialTerms());
        entity.setInternalNotes(dto.getInternalNotes());

        if (dto.getDepartmentId() != null) {
            entity.setDepartment(entityManager.getReference(
                    com.autonoma.erp.modules.hr.orgstructure.entity.Department.class, dto.getDepartmentId()));
        }
        if (dto.getBuyerId() != null) {
            entity.setBuyer(entityManager.getReference(com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster.class,
                    dto.getBuyerId()));
        }

        entity.setUpdatedBy(username);
        entity.setUpdatedDate(new java.util.Date());

        // Update Details
        if (entity.getDetails() != null) {
            entity.getDetails().clear();
        } else {
            entity.setDetails(new java.util.ArrayList<>());
        }

        if (dto.getDetails() != null) {
            List<com.autonoma.erp.model.RfqDetail> newDetails = dto.getDetails().stream().map(d -> {
                com.autonoma.erp.model.RfqDetail detail = new com.autonoma.erp.model.RfqDetail();
                detail.setRfqHead(entity);
                detail.setDivision(entity.getDivision());
                detail.setItem(entityManager
                        .getReference(com.autonoma.erp.modules.npd.product.entity.ProductMaster.class, d.getItemId()));
                detail.setUom(d.getUom());
                detail.setReqQty(d.getReqQty());
                detail.setExpectedDeliveryDate(d.getExpectedDeliveryDate());
                detail.setRemarks(d.getRemarks());
                detail.setPrTransId(d.getPrTransId());
                detail.setCreatedBy(username);
                detail.setCreatedDate(new java.util.Date());
                return detail;
            }).collect(Collectors.toList());
            entity.getDetails().addAll(newDetails);
        }

        // Update Suppliers
        if (entity.getSuppliers() != null) {
            entity.getSuppliers().clear();
        } else {
            entity.setSuppliers(new java.util.ArrayList<>());
        }

        if (dto.getSuppliers() != null) {
            List<com.autonoma.erp.model.RfqSupplier> newSuppliers = dto.getSuppliers().stream().map(s -> {
                com.autonoma.erp.model.RfqSupplier supplier = new com.autonoma.erp.model.RfqSupplier();
                supplier.setRfqHead(entity);
                supplier.setSupplier(entityManager.getReference(
                        com.autonoma.erp.modules.master.commercial.entity.AccountLedger.class, s.getSupplierId()));
                supplier.setEmailSent(false);
                supplier.setCreatedBy(username);
                supplier.setCreatedDate(new java.util.Date());
                return supplier;
            }).collect(Collectors.toList());
            entity.getSuppliers().addAll(newSuppliers);
        }

        repository.saveAndFlush(entity);
        return mapToDTO(entity);
    }

    @Override
    @Transactional
    public void sendRfqEmails(Long rfqId, com.autonoma.erp.dto.purchase.SendRfqEmailDTO dto) {
        String username = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        RfqHead rfq = repository.findById(rfqId).orElseThrow(() -> new RuntimeException("RFQ not found"));

        if (dto.getSubject() == null || dto.getSubject().trim().isEmpty() ||
                dto.getContent() == null || dto.getContent().trim().isEmpty()) {
            throw new RuntimeException("Subject and Content cannot be empty.");
        }

        // Fetch Requester Details
        String buyerName = rfq.getBuyer() != null ? rfq.getBuyer().getEmployeeName() : "";
        String deptName = rfq.getDepartment() != null ? rfq.getDepartment().getDepartmentName() : "";
        String buyerMobile = "";
        String fromEmail = "";

        if (dto.getFromEmail() != null && !dto.getFromEmail().trim().isEmpty()) {
            fromEmail = dto.getFromEmail().trim();
        }
        
        if (fromEmail.isEmpty() && rfq.getBuyer() != null) {
             java.util.Optional<com.autonoma.erp.modules.hr.employee.entity.EmployeeContact> contactOpt = 
                 employeeContactRepository.findByEmployeeId(rfq.getBuyer().getId());
             if (contactOpt.isPresent() && contactOpt.get().getMobile() != null) {
                 buyerMobile = contactOpt.get().getMobile();
             }
             java.util.Optional<com.autonoma.erp.modules.hr.employee.entity.EmployeeJobProfile> jpOpt = 
                 employeeJobProfileRepository.findByEmployeeId(rfq.getBuyer().getId());
             if (jpOpt.isPresent() && jpOpt.get().getOfficeEmail() != null && !jpOpt.get().getOfficeEmail().trim().isEmpty()) {
                 fromEmail = jpOpt.get().getOfficeEmail().trim();
             }
        }

        if (fromEmail.isEmpty()) {
            java.util.Optional<com.autonoma.erp.model.admin.CompanyCredential> comp = companyCredentialService.getCompanyProfileForCurrentTenant();
            if (comp.isPresent()) {
                if (comp.get().getSmtpUsername() != null && !comp.get().getSmtpUsername().trim().isEmpty()) {
                    fromEmail = comp.get().getSmtpUsername().trim();
                } else if (comp.get().getEmailId() != null && !comp.get().getEmailId().trim().isEmpty()) {
                    fromEmail = comp.get().getEmailId().trim();
                }
            }
        }

        if (fromEmail.isEmpty()) {
            fromEmail = "noreply@autonoma.com";
        }

        // Base content with static replacements
        String baseContent = dto.getContent()
                .replace("{Requester Name}", buyerName)
                .replace("{Department Name}", deptName)
                .replace("{Requester Mobile}", buyerMobile);

        // Load RFQ Attachments to send with email
        List<com.autonoma.erp.model.RfqAttachment> rfqAttachments = rfqAttachmentRepository.findByRfqHeadId(rfqId);
        List<java.util.Map<String, Object>> emailAttachments = new java.util.ArrayList<>();
        
        for (com.autonoma.erp.model.RfqAttachment att : rfqAttachments) {
            try {
                org.springframework.core.io.Resource resource = fileService.loadFile(att.getFilePath());
                if (resource.exists() && resource.isReadable()) {
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("fileName", att.getFileName());
                    byte[] fileBytes = org.springframework.util.StreamUtils.copyToByteArray(resource.getInputStream());
                    map.put("content", fileBytes);
                    emailAttachments.add(map);
                } else {
                    throw new RuntimeException("RFQ PDF attachment cannot be read: " + att.getFileName());
                }
            } catch (Exception e) {
                System.err.println("[RFQ_EMAIL_ATTACHMENT_ERROR] Failed to load RFQ attachment " + att.getFilePath() + ": " + e.getMessage());
                throw new RuntimeException("Failed to attach required RFQ document: " + att.getFileName() + ". Email sending aborted.");
            }
        }

        // Determine target emails from DTO or fallback to all suppliers
        java.util.List<String> targetEmails = new java.util.ArrayList<>();
        if (dto.getToEmail() != null && !dto.getToEmail().trim().isEmpty()) {
            targetEmails = java.util.Arrays.asList(dto.getToEmail().split("\\s*,\\s*"));
        } else if (rfq.getSuppliers() != null) {
            for (com.autonoma.erp.model.RfqSupplier supplierLink : rfq.getSuppliers()) {
                if (supplierLink.getSupplier() != null && supplierLink.getSupplier().getMailId() != null) {
                    targetEmails.add(supplierLink.getSupplier().getMailId().trim());
                }
            }
        }

        List<String> failedRecipients = new java.util.ArrayList<>();

        // Send individual emails to each target email
        for (String targetEmail : targetEmails) {
            if (targetEmail == null || targetEmail.trim().isEmpty()) continue;
            targetEmail = targetEmail.trim();

            String supplierName = "Supplier";
            Long supplierId = null;
            // Try to match email with RFQ suppliers to get the specific name and ID for personalization and history
            if (rfq.getSuppliers() != null) {
                for (com.autonoma.erp.model.RfqSupplier supplierLink : rfq.getSuppliers()) {
                    if (supplierLink.getSupplier() != null) {
                        String sMail = supplierLink.getSupplier().getMailId();
                        if (targetEmail.equalsIgnoreCase(sMail)) {
                            supplierName = supplierLink.getSupplier().getLedgerName();
                            supplierId = supplierLink.getSupplier().getId();
                            supplierLink.setEmailSent(true);
                            break;
                        }
                    }
                }
            }

            String ccEmail = dto.getCcEmail() != null ? dto.getCcEmail() : "";
            String personalizedContent = baseContent.replace("{Supplier Name}", supplierName);
            String htmlContent = personalizedContent.replace("\n", "<br>");
            
            boolean sent = false;
            String failureReason = null;
            try {
                sent = emailSendingService.sendEmailWithAttachments(targetEmail, ccEmail, null, dto.getSubject(), htmlContent, emailAttachments, false, "RFQ");
                if (!sent) {
                    failureReason = "SMTP service rejected or could not deliver email to " + targetEmail;
                    failedRecipients.add(targetEmail);
                }
            } catch (Exception ex) {
                sent = false;
                failureReason = "Email delivery error: " + ex.getMessage();
                failedRecipients.add(targetEmail);
            }

            // Immediately record this attempt in an independent transaction (Propagation.REQUIRES_NEW)
            rfqEmailHistoryService.logAttempt(
                    rfqId, 
                    supplierId, 
                    targetEmail, 
                    dto.getSubject(), 
                    dto.getContent(), 
                    ccEmail, 
                    sent, 
                    failureReason, 
                    username
            );
        }

        if (!failedRecipients.isEmpty()) {
            throw new RuntimeException("Email delivery failed for: " + String.join(", ", failedRecipients));
        }

        // Update RFQ Status to Sent if all succeeded
        statusMasterRepository.findByName("Sent").ifPresent(rfq::setStatus);
        repository.save(rfq);
    }

    @Override
    @Transactional(readOnly = true)
    public com.autonoma.erp.dto.purchase.RfqEmailHistoryDTO getLatestEmail(Long rfqId) {
        return rfqEmailHistoryRepository.findFirstByRfqHeadIdOrderBySentDateDesc(rfqId)
                .map(history -> {
                    com.autonoma.erp.dto.purchase.RfqEmailHistoryDTO dto = new com.autonoma.erp.dto.purchase.RfqEmailHistoryDTO();
                    dto.setId(history.getId());
                    dto.setRfqId(history.getRfqHead() != null ? history.getRfqHead().getId() : null);
                    dto.setSubject(history.getEmailSubject());
                    dto.setContent(history.getEmailContent());
                    dto.setToEmail(history.getEmailTo());
                    dto.setCcEmail(history.getEmailCc());
                    dto.setSentBy(history.getSentBy());
                    dto.setSentDate(history.getSentDate());
                    dto.setRecipientEmail(history.getRecipientEmail() != null ? history.getRecipientEmail() : history.getEmailTo());
                    if (history.getStatus() != null) {
                        dto.setStatusId(history.getStatus().getId());
                        dto.setStatusName(history.getStatus().getName());
                        dto.setStatus(history.getStatus().getName());
                    } else if (history.getLegacyStatus() != null) {
                        dto.setStatus(history.getLegacyStatus());
                        dto.setStatusName(history.getLegacyStatus());
                    }
                    dto.setAttempt(history.getAttempt() != null ? history.getAttempt() : 1);
                    dto.setFailureReason(history.getFailureReason());
                    return dto;
                })
                .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<com.autonoma.erp.dto.purchase.RfqEmailHistoryDTO> getEmailHistory(Long rfqId) {
        return rfqEmailHistoryService.getHistoryByRfqId(rfqId);
    }

    @Override
    @Transactional
    public void updateStatus(Long rfqId, String statusName) {
        RfqHead entity = repository.findById(rfqId).orElseThrow();
        entity.setStatus(statusMasterRepository.findByName(statusName).orElseThrow());
        repository.save(entity);
    }

    @Override
    @Transactional
    public void generatePoFromRfq(Long rfqId) {
        // Implement PO generation from awarded RFQ
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

    private String generateRfqNo(java.util.Date documentDate) {
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
            throw new RuntimeException("Both Prefix and Suffix cannot be empty for RFQ.");
        }
        if (digits == null || digits <= 0) {
            throw new RuntimeException("Digit must be configured for RFQ.");
        }

        StringBuilder prefixBuilder = new StringBuilder();
        if (basePrefix != null && !basePrefix.trim().isEmpty()) {
            prefixBuilder.append(basePrefix.trim());
        }
        String finalPrefix = prefixBuilder.toString().replaceAll("/+", "/");
        String finalSuffix = (baseSuffix != null) ? baseSuffix.trim().replaceAll("/+", "/") : "";
        
        String searchPattern = finalPrefix + "%" + finalSuffix;

        String lastRfq = null;
        try {
            lastRfq = jdbcTemplate.queryForObject(
                    "SELECT TOP 1 RFQ_NO FROM PP_RFQ_HEAD WHERE RFQ_NO LIKE ? ORDER BY ID DESC", String.class,
                    searchPattern);
        } catch (Exception e) {
        }

        int nextNum = 1;
        if (lastRfq != null) {
            try {
                String numStr = lastRfq;
                if (!finalPrefix.isEmpty() && numStr.startsWith(finalPrefix)) {
                    numStr = numStr.substring(finalPrefix.length());
                }
                if (!finalSuffix.isEmpty() && numStr.endsWith(finalSuffix)) {
                    numStr = numStr.substring(0, numStr.length() - finalSuffix.length());
                }
                nextNum = Integer.parseInt(numStr) + 1;
            } catch (Exception e) {
            }
        }

        return finalPrefix + String.format("%0" + digits + "d", nextNum) + finalSuffix;
    }

    private RfqListDTO mapToListDTO(RfqHead entity) {
        RfqListDTO dto = new RfqListDTO();
        dto.setId(entity.getId());
        dto.setRfqNo(entity.getRfqNo());
        dto.setRfqDate(entity.getRfqDate());
        if (entity.getPurchaseRequestHead() != null) {
            dto.setPrNo(entity.getPurchaseRequestHead().getPrNo());
            dto.setPrId(entity.getPurchaseRequestHead().getId());
        }
        dto.setDepartmentName(entity.getDepartment().getDepartmentName());
        dto.setBuyerName(entity.getBuyer().getEmployeeName());
        dto.setClosingDate(entity.getClosingDate());
        dto.setStatusId(entity.getStatus().getId());
        dto.setStatusName(entity.getStatus().getName());
        return dto;
    }

    @Override
    @Transactional
    public void deleteRfq(Long id) {
        RfqHead rfq = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("RFQ not found"));

        if (rfq.getStatus() != null && !"Draft".equalsIgnoreCase(rfq.getStatus().getName())) {
            throw new RuntimeException("Cannot delete RFQ. It has already been processed or sent to suppliers.");
        }

        repository.delete(rfq);
    }

    @Override
    @Transactional(readOnly = true)
    public List<com.autonoma.erp.dto.purchase.RfqAttachmentDTO> getAttachments(Long rfqId) {
        return rfqAttachmentRepository.findByRfqHeadId(rfqId).stream().map(a -> {
            com.autonoma.erp.dto.purchase.RfqAttachmentDTO dto = new com.autonoma.erp.dto.purchase.RfqAttachmentDTO();
            dto.setId(a.getId());
            dto.setRfqRefId(a.getRfqHead().getId());
            dto.setFileName(a.getFileName());
            dto.setFilePath(a.getFilePath());
            dto.setFileType(a.getFileType());
            return dto;
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public List<com.autonoma.erp.dto.purchase.RfqAttachmentDTO> uploadAttachments(Long rfqId, org.springframework.web.multipart.MultipartFile[] files, String username) {
        RfqHead rfq = repository.findById(rfqId).orElseThrow(() -> new RuntimeException("RFQ not found"));
        List<com.autonoma.erp.model.RfqAttachment> savedAttachments = new java.util.ArrayList<>();
        
        for (org.springframework.web.multipart.MultipartFile file : files) {
            try {
                String originalFilename = file.getOriginalFilename();
                if (originalFilename != null && (originalFilename.toLowerCase().startsWith("rfq_") || originalFilename.equalsIgnoreCase("auto.pdf"))) {
                    List<com.autonoma.erp.model.RfqAttachment> existing = rfqAttachmentRepository.findByRfqHeadId(rfqId);
                    for (com.autonoma.erp.model.RfqAttachment oldAtt : existing) {
                        if (oldAtt.getFileName() != null && 
                            (oldAtt.getFileName().equalsIgnoreCase(originalFilename) || 
                             oldAtt.getFileName().equalsIgnoreCase("auto.pdf") || 
                             oldAtt.getFileName().toLowerCase().startsWith("rfq_"))) {
                            try {
                                if (oldAtt.getFilePath() != null) fileService.deleteFile(oldAtt.getFilePath());
                            } catch (Exception ignore) {}
                            rfqAttachmentRepository.delete(oldAtt);
                        }
                    }
                }
                String path = fileService.saveFile(file, "rfq");
                com.autonoma.erp.model.RfqAttachment attachment = new com.autonoma.erp.model.RfqAttachment();
                attachment.setRfqHead(rfq);
                attachment.setFileName(file.getOriginalFilename());
                attachment.setFilePath(path);
                attachment.setFileType(file.getContentType());
                attachment.setCreatedBy(username);
                attachment.setCreatedDate(new java.util.Date());
                savedAttachments.add(rfqAttachmentRepository.save(attachment));
            } catch (java.io.IOException e) {
                throw new RuntimeException("Failed to upload file: " + file.getOriginalFilename(), e);
            }
        }
        
        return savedAttachments.stream().map(a -> {
            com.autonoma.erp.dto.purchase.RfqAttachmentDTO dto = new com.autonoma.erp.dto.purchase.RfqAttachmentDTO();
            dto.setId(a.getId());
            dto.setRfqRefId(a.getRfqHead().getId());
            dto.setFileName(a.getFileName());
            dto.setFilePath(a.getFilePath());
            dto.setFileType(a.getFileType());
            return dto;
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteAttachment(Long attachmentId) {
        com.autonoma.erp.model.RfqAttachment attachment = rfqAttachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new RuntimeException("Attachment not found"));
        
        // Delete physical file
        if (attachment.getFilePath() != null) {
            fileService.deleteFile(attachment.getFilePath());
        }
        
        rfqAttachmentRepository.delete(attachment);
    }

    private RfqHeadDTO mapToDTO(RfqHead entity) {
        RfqHeadDTO dto = new RfqHeadDTO();
        dto.setId(entity.getId());
        dto.setRfqNo(entity.getRfqNo());
        dto.setRfqDate(entity.getRfqDate());
        if (entity.getPurchaseRequestHead() != null) {
            dto.setPrRefId(entity.getPurchaseRequestHead().getId());
            dto.setPrNo(entity.getPurchaseRequestHead().getPrNo());
        }
        if (entity.getDepartment() != null) {
            dto.setDepartmentId(entity.getDepartment().getId());
            dto.setDepartmentName(entity.getDepartment().getDepartmentName());
        }
        if (entity.getBuyer() != null) {
            dto.setBuyerId(entity.getBuyer().getId());
            dto.setBuyerName(entity.getBuyer().getEmployeeName());
        }
        dto.setClosingDate(entity.getClosingDate());
        dto.setCommercialTerms(entity.getCommercialTerms());
        dto.setInternalNotes(entity.getInternalNotes());
        if (entity.getStatus() != null) {
            dto.setStatusId(entity.getStatus().getId());
            dto.setStatusName(entity.getStatus().getName());
        }
        if (entity.getDivision() != null) {
            dto.setDivisionId(entity.getDivision().getId());
        }

        if (entity.getDetails() != null) {
            dto.setDetails(entity.getDetails().stream().map(d -> {
                com.autonoma.erp.dto.purchase.RfqDetailDTO ddto = new com.autonoma.erp.dto.purchase.RfqDetailDTO();
                ddto.setId(d.getId());
                if (d.getItem() != null) {
                    ddto.setItemId(d.getItem().getId());
                    ddto.setItemCode(d.getItem().getItemCode());
                    ddto.setItemName(d.getItem().getItemName());
                    if (d.getItem().getAttachments() != null) {
                        String imgPath = d.getItem().getAttachments().stream()
                                .map(com.autonoma.erp.modules.npd.product.entity.NpdAttachmentPath::getPath)
                                .filter(p -> p != null && (p.toLowerCase().endsWith(".jpg")
                                        || p.toLowerCase().endsWith(".jpeg") || p.toLowerCase().endsWith(".png")
                                        || p.toLowerCase().endsWith(".gif")))
                                .findFirst()
                                .orElse(null);
                        ddto.setProductImage(imgPath);
                    }
                }
                ddto.setUom(d.getUom());
                ddto.setReqQty(d.getReqQty());
                ddto.setExpectedDeliveryDate(d.getExpectedDeliveryDate());
                ddto.setRemarks(d.getRemarks());
                if (d.getPrTransId() != null) {
                    ddto.setPrTransId(d.getPrTransId());
                }
                return ddto;
            }).collect(Collectors.toList()));
        }

        if (entity.getSuppliers() != null) {
            dto.setSuppliers(entity.getSuppliers().stream().map(s -> {
                com.autonoma.erp.dto.purchase.RfqSupplierDTO sdto = new com.autonoma.erp.dto.purchase.RfqSupplierDTO();
                sdto.setId(s.getId());
                if (s.getSupplier() != null) {
                    sdto.setSupplierId(s.getSupplier().getId());
                    sdto.setSupplierName(s.getSupplier().getLedgerName());
                    sdto.setSupplierCode(s.getSupplier().getLedgerCode());
                    sdto.setEmail(s.getSupplier().getMailId());
                }
                if (s.getSupplierStatus() != null) {
                    sdto.setSupplierStatusId(s.getSupplierStatus().getId());
                    sdto.setSupplierStatusName(s.getSupplierStatus().getName());
                }
                sdto.setEmailSent(s.getEmailSent());
                sdto.setThreadMessageId(s.getThreadMessageId());
                return sdto;
            }).collect(Collectors.toList()));
        }
        return dto;
    }
}
