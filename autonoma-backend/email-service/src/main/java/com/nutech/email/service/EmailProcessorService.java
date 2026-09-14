package com.nutech.email.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.microsoft.graph.models.Message;
import com.microsoft.graph.models.Attachment;
import com.microsoft.graph.models.FileAttachment;
import com.nutech.email.dto.AiDto.IntentResult;
import com.nutech.email.dto.AiDto.ExtractedPart;
import com.nutech.email.integration.AiClient;
import com.nutech.email.integration.GraphMailService;
import com.nutech.email.model.*;
import com.nutech.email.model.ProcessingRequest.Intent;
import com.nutech.email.model.ProcessingRequest.ProcessingStatus;
import com.nutech.email.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import java.util.Map;
import java.util.HashMap;

import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmailProcessorService {

    private final GraphMailService graphService;
    private final OcrService ocrService;
    private final AiClient aiClient;
    private final PartResolutionService partResolutionService;
    private final DocumentService documentService;
    private final TemplateEngine templateEngine;
    private final ObjectMapper objectMapper;
    private final ProcessingRequestRepository processingRequestRepository;
    private final CustomerRepository customerRepository;
    private final EmailProcessingLogRepository logRepository;
    private final OcrConfigRepository ocrConfigRepository;
    private final OcrAttachmentPathRepository ocrAttachmentPathRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Scheduled(fixedDelayString = "${email.poll.interval-ms:60000}", initialDelay = 10000)
    public void pollMailbox() {
        try {
            autoAbandonOldRequests();
        } catch (Exception e) {
            log.error("Failed to run auto-abandon checker: {}", e.getMessage(), e);
        }

        log.info("Polling shared mailboxes for recent emails...");
        List<OcrConfig> configs = ocrConfigRepository.findAll();
        if (configs.isEmpty()) {
            log.info("No OCR configurations found to poll.");
            return;
        }

        int synced = 0;
        for (OcrConfig cfg : configs) {
            if (cfg.getOcrTenantId() == null || cfg.getOcrClientId() == null) {
                continue;
            }
            log.info("Polling mailbox: {}", cfg.getOcrSharedMailbox());
            try {
                List<Message> emails = graphService.fetchUnreadEmails(20, cfg);
                log.info("Found {} unread emails for {}", emails.size(), cfg.getOcrSharedMailbox());
                for (Message email : emails) {
                    try {
                        if (processingRequestRepository.existsByEmailMessageId(email.getId())) {
                            try {
                                if (cfg != null) {
                                    graphService.markAsRead(email.getId(), cfg);
                                } else {
                                    graphService.markAsRead(email.getId());
                                }
                            } catch (Exception ignored) {}
                            continue;
                        }
                        processEmail(email, cfg);
                        synced++;
                    } catch (Exception e) {
                        log.error("Failed to process email '{}' for {}: {}", email.getSubject(), cfg.getOcrSharedMailbox(), e.getMessage(), e);
                    }
                }
            } catch (Exception e) {
                log.error("Failed to poll mailbox {}: {}", cfg.getOcrSharedMailbox(), e.getMessage(), e);
            }
        }

        if (synced > 0) {
            log.info("Synced {} new emails to work items across all mailboxes", synced);
            notifyMainBackendOfMutation();
        }
    }

    @Scheduled(fixedDelay = 60000, initialDelay = 15000)
    @Transactional
    public void autoResolveUnmappedCustomers() {
        log.info("Running scheduled job to auto-resolve unmapped customers...");
        List<ProcessingRequest> unmappedRequests = processingRequestRepository.findByCustomerIsNull();
        if (unmappedRequests.isEmpty()) {
            return;
        }

        List<Map<String, Object>> customers = fetchCustomersFromMainBackend();
        int resolvedCount = 0;

        for (ProcessingRequest pr : unmappedRequests) {
            String senderEmail = pr.getEmailFrom();
            if (senderEmail == null || senderEmail.trim().isEmpty()) {
                continue;
            }

            Map<String, Object> matched = findMatchingCustomer(senderEmail, customers);
            if (matched != null) {
                String customerCode = (String) matched.get("ledgerCode");
                if (customerCode == null) customerCode = (String) matched.get("customerCode");
                String customerName = (String) matched.get("ledgerName");
                if (customerName == null) customerName = (String) matched.get("customerName");

                if (customerCode != null && !customerCode.trim().isEmpty()) {
                    final String custCode = customerCode;
                    final String custName = customerName;

                    com.nutech.email.model.Customer localCust = customerRepository.findByEmailIgnoreCase(custCode)
                        .map(existingCust -> {
                            if (!existingCust.getName().equals(custName)) {
                                existingCust.setName(custName);
                                return customerRepository.save(existingCust);
                            }
                            return existingCust;
                        })
                        .orElseGet(() -> {
                            com.nutech.email.model.Customer newCust = new com.nutech.email.model.Customer();
                            newCust.setEmail(custCode);
                            newCust.setName(custName);
                            return customerRepository.save(newCust);
                        });

                    syncCustomerDetailsFromMainBackend(localCust);
                    pr.setCustomer(localCust);
                    processingRequestRepository.save(pr);

                    if (pr.getIntent() == Intent.QUOTATION_REQUEST && (pr.getEnqEntryNo() == null || pr.getEnqEntryNo().isEmpty())) {
                        try {
                            createSalesEnquiryIfAbsent(pr);
                        } catch (Exception enqEx) {
                            log.error("Failed to auto-create Sales Enquiry on auto-resolve for request {}: {}", pr.getId(), enqEx.getMessage());
                        }
                    }

                    resolvedCount++;
                    log.info("Scheduled task successfully auto-resolved customer for request ID {}: Code='{}', Name='{}'", 
                             pr.getId(), custCode, custName);
                }
            }
        }

        if (resolvedCount > 0) {
            log.info("Auto-resolved {} previously unmapped requests.", resolvedCount);
            notifyMainBackendOfMutation();
        }
    }

    public void notifyMainBackendOfMutation() {
        try {
            String url = "http://localhost:8081/api/ocr/notify-mutation";
            RestTemplate restTemplate = new RestTemplate();
            java.util.Map<String, String> payload = java.util.Map.of(
                "entityName", "ProcessingRequest",
                "action", "SAVE"
            );
            restTemplate.postForEntity(url, payload, Void.class);
            log.info("Successfully notified main backend of email mutation");
        } catch (Exception e) {
            log.error("Failed to notify main backend of email mutation: {}", e.getMessage());
        }
    }

    /**
     * Manually sync all recent emails from the mailbox to work items.
     * Called from the API controller for on-demand sync.
     */
    public int syncAllRecentEmails() {
        return syncAllRecentEmails(null);
    }

    public int syncAllRecentEmails(Long companyId) {
        List<OcrConfig> configs;
        if (companyId != null) {
            configs = ocrConfigRepository.findByCompanyCredentialId(companyId)
                    .map(List::of)
                    .orElse(java.util.Collections.emptyList());
        } else {
            configs = ocrConfigRepository.findAll();
        }

        int synced = 0;
        log.info("syncAllRecentEmails: Found {} configs to poll", configs.size());
        for (OcrConfig cfg : configs) {
            if (cfg.getOcrTenantId() == null || cfg.getOcrClientId() == null) {
                log.info("syncAllRecentEmails: Skipping config for {} due to null tenant/client ID", cfg.getOcrSharedMailbox());
                continue;
            }
            try {
                log.info("syncAllRecentEmails: Fetching unread emails for {}", cfg.getOcrSharedMailbox());
                List<Message> emails = graphService.fetchUnreadEmails(50, cfg);
                log.info("syncAllRecentEmails: Fetched {} unread emails for {}", emails.size(), cfg.getOcrSharedMailbox());
                for (Message email : emails) {
                    try {
                        boolean exists = processingRequestRepository.existsByEmailMessageId(email.getId());
                        log.info("syncAllRecentEmails: Email ID={}, Subject='{}', existsInDb={}", email.getId(), email.getSubject(), exists);
                        if (exists) continue;
                        processEmail(email, cfg);
                        synced++;
                    } catch (Exception e) {
                        log.error("Failed to sync email '{}' for {}: {}", email.getSubject(), cfg.getOcrSharedMailbox(), e.getMessage(), e);
                    }
                }
            } catch (Exception e) {
                log.error("Failed to sync mailbox {}: {}", cfg.getOcrSharedMailbox(), e.getMessage(), e);
            }
        }

        if (synced > 0) {
            notifyMainBackendOfMutation();
        }
        return synced;
    }

    @Transactional
    public void processEmail(Message email) {
        List<OcrConfig> configs = ocrConfigRepository.findAll();
        OcrConfig defaultCfg = configs.isEmpty() ? null : configs.get(0);
        processEmail(email, defaultCfg);
    }

    @Transactional
    public void processEmail(Message email, OcrConfig cfg) {
        String messageId = email.getId();
        String senderEmail = (email.getFrom() != null && email.getFrom().getEmailAddress() != null) 
                             ? email.getFrom().getEmailAddress().getAddress() : "";
                             
        String toEmails = "";
        if (email.getToRecipients() != null) {
            toEmails = email.getToRecipients().stream()
                    .filter(r -> r.getEmailAddress() != null && r.getEmailAddress().getAddress() != null)
                    .map(r -> r.getEmailAddress().getAddress())
                    .collect(java.util.stream.Collectors.joining(", "));
        }

        String ccEmails = "";
        if (email.getCcRecipients() != null) {
            ccEmails = email.getCcRecipients().stream()
                    .filter(r -> r.getEmailAddress() != null && r.getEmailAddress().getAddress() != null)
                    .map(r -> r.getEmailAddress().getAddress())
                    .collect(java.util.stream.Collectors.joining(", "));
        }

        // Since we always append the virtual EML attachment representing the original email itself, start count at 1
        int initialAttachmentCount = 1;

        String rawContent = (email.getBody() != null) ? email.getBody().getContent() : "";
        String plainText;
        if (email.getBodyPreview() != null && !email.getBodyPreview().trim().isEmpty()) {
            plainText = email.getBodyPreview();
        } else if (email.getBody() != null && email.getBody().getContentType() == com.microsoft.graph.models.BodyType.Html) {
            plainText = convertHtmlToPlainText(rawContent);
        } else if (rawContent.contains("<html") || rawContent.contains("<div") || rawContent.contains("<p>")) {
            plainText = convertHtmlToPlainText(rawContent);
        } else {
            plainText = rawContent;
        }

        // Detect replies using conversation identifiers and standard email threading
        String convId = email.getConversationId();
        Long parentEnquiryId = null;
        if (convId != null && !convId.trim().isEmpty()) {
            List<ProcessingRequest> existingInThread = processingRequestRepository.findByConversationThreadId(convId);
            if (!existingInThread.isEmpty()) {
                ProcessingRequest root = null;
                for (ProcessingRequest pr : existingInThread) {
                    if (pr.getParentEnquiryId() == null) {
                        root = pr;
                        break;
                    }
                }
                if (root == null) {
                    root = existingInThread.get(0);
                }
                parentEnquiryId = root.getId();
            }
        }

        String emailBodyForPreview;
        if (email.getBody() != null && email.getBody().getContent() != null && !email.getBody().getContent().trim().isEmpty() &&
            (email.getBody().getContent().contains("<html") || email.getBody().getContent().contains("<div") || email.getBody().getContent().contains("<p>"))) {
            emailBodyForPreview = email.getBody().getContent();
        } else {
            emailBodyForPreview = plainText;
        }

        ProcessingRequest request = ProcessingRequest.builder()
                .emailMessageId(messageId)
                .emailSubject(email.getSubject())
                .emailFrom(senderEmail)
                .emailTo(toEmails)
                .emailCc(ccEmails)
                .emailBodyPreview(stripEmailReplyThread(emailBodyForPreview))
                .emailReceivedAt(LocalDateTime.now())
                .status(ProcessingStatus.RECEIVED)
                .attachmentCount(initialAttachmentCount)
                .companyId(cfg != null ? cfg.getCompanyCredentialId() : null)
                .sharedMailbox(cfg != null ? cfg.getOcrSharedMailbox() : null)
                .conversationThreadId(convId)
                .direction("INCOMING")
                .parentEnquiryId(parentEnquiryId)
                .mode("OCR")
                .build();
        
        com.nutech.email.model.Customer exactMatch = customerRepository.findByEmailIgnoreCase(senderEmail).orElse(null);
        if (exactMatch != null) {
            request.setCustomer(exactMatch);
        } else {
            autoMapCustomerByDomain(request);
        }
        request = processingRequestRepository.save(request);
        logStep(request, "RECEIVED", EmailProcessingLog.LogStatus.SUCCESS, "Email saved");

        // Save and cache attachments locally
        saveAttachmentsLocally(messageId, request, cfg);

        // Check if there is an outstanding ledger request for this email sender
        List<ProcessingRequest> pendingLedgers = processingRequestRepository.findPendingLedgerRequests(senderEmail);
        if (!pendingLedgers.isEmpty()) {
            log.info("Detected incoming email from '{}' as a reply to ledger request id: {}", senderEmail, pendingLedgers.get(0).getId());
            boolean handled = tryProcessLedgerRequestReply(request, pendingLedgers.get(0), cfg);
            if (handled) {
                return;
            }
        }

        try {
            // OCR
            request.setStatus(ProcessingStatus.OCR_IN_PROGRESS);
            processingRequestRepository.save(request);
            String emailBody = stripEmailReplyThread(plainText);
            String attachmentText = extractAttachmentText(messageId, request, cfg);
            String combinedText = emailBody + "\n\n--- Attachments ---\n" + attachmentText;
            request.setCombinedText(combinedText);

            // Classify
            request.setStatus(ProcessingStatus.CLASSIFYING);
            processingRequestRepository.save(request);
            IntentResult intentResult = aiClient.classifyIntent(request.getEmailSubject(), combinedText).get();
            Intent intent = mapIntent(intentResult.getIntent());
            request.setIntent(intent);

            if (intent == Intent.LEDGER) {
                request.setStatus(ProcessingStatus.AWAITING_REVIEW);
                request.setCreatedBy("System");
                request.setUpdatedBy("System");
                processingRequestRepository.save(request);
                if (cfg != null) {
                    graphService.markAsRead(messageId, cfg);
                } else {
                    graphService.markAsRead(messageId);
                }
                logStep(request, "AWAITING_REVIEW", EmailProcessingLog.LogStatus.SUCCESS, "Ledger request processed, awaiting review");
                return;
            }

            if (intent != Intent.QUOTATION_REQUEST && intent != Intent.INVOICE_REQUEST) {
                request.setStatus(ProcessingStatus.SKIPPED);
                processingRequestRepository.save(request);
                if (cfg != null) {
                    graphService.markAsRead(messageId, cfg);
                } else {
                    graphService.markAsRead(messageId);
                }
                return;
            }

            // Extract parts
            request.setStatus(ProcessingStatus.EXTRACTING);
            processingRequestRepository.save(request);

            String customerName = (request.getCustomer() != null) ? request.getCustomer().getName() : "Unknown";
            List<OcrAttachmentPath> savedList = ocrAttachmentPathRepository.findByProcessingRequestId(request.getId());
            List<ExtractedPart> parts = extractPartsFromAttachments(savedList, customerName);

            if (parts.isEmpty()) {
                log.info("No parts extracted via external OCR, falling back to OpenAI AI extraction");
                parts = aiClient.extractParts(combinedText).get();
            } else {
                log.info("Successfully extracted {} parts via client's external OCR", parts.size());
            }

            request.setExtractedPartsJson(objectMapper.writeValueAsString(parts));
            if (parts.isEmpty()) {
                request.setStatus(ProcessingStatus.AWAITING_REVIEW);
                request.setErrorMessage("No part codes found");
                processingRequestRepository.save(request);
                if (cfg != null) {
                    graphService.markAsRead(messageId, cfg);
                } else {
                    graphService.markAsRead(messageId);
                }
                logStep(request, "AWAITING_REVIEW", EmailProcessingLog.LogStatus.SUCCESS, "No part codes found, awaiting manual review");
                return;
            }

            // Resolve parts
            request.setStatus(ProcessingStatus.RESOLVING_PARTS);
            processingRequestRepository.save(request);
            Customer customer = request.getCustomer();
            if (customer == null) {
                customer = createOrGetCustomer(senderEmail, email);
                request.setCustomer(customer);
            }
            var resolution = partResolutionService.resolveParts(parts, customer, request);

            if (!resolution.allResolved()) {
                request.setStatus(ProcessingStatus.AWAITING_REVIEW);
                processingRequestRepository.save(request);
                if (cfg != null) {
                    graphService.markAsRead(messageId, cfg);
                } else {
                    graphService.markAsRead(messageId);
                }
                return;
            }

            generateAndSend(request, customer, resolution.resolved(), messageId, cfg);
        } catch (Exception e) {
            log.error("Pipeline failed for email {}: {}", email.getSubject(), e.getMessage(), e);
            request.setStatus(ProcessingStatus.FAILED);
            request.setErrorMessage(e.getMessage());
            processingRequestRepository.save(request);
        }
    }

    @Transactional
    public void resumeAfterReview(ProcessingRequest request,
                                   List<PartResolutionService.ResolvedPartInfo> allResolved) {
        try {
            OcrConfig cfg = null;
            if (request.getCompanyId() != null) {
                cfg = ocrConfigRepository.findByCompanyCredentialId(request.getCompanyId()).orElse(null);
            }
            generateAndSend(request, request.getCustomer(), allResolved, request.getEmailMessageId(), cfg);
        } catch (Exception e) {
            request.setStatus(ProcessingStatus.FAILED);
            request.setErrorMessage(e.getMessage());
            processingRequestRepository.save(request);
        }
    }

    private void generateAndSend(ProcessingRequest request, Customer customer,
                                  List<PartResolutionService.ResolvedPartInfo> resolvedParts, String messageId) {
        generateAndSend(request, customer, resolvedParts, messageId, null);
    }

    private void generateAndSend(ProcessingRequest request, Customer customer,
                                  List<PartResolutionService.ResolvedPartInfo> resolvedParts, String messageId, OcrConfig cfg) {
        request.setStatus(ProcessingStatus.GENERATING_DOCUMENT);
        processingRequestRepository.save(request);
        Quotation quotation = documentService.generateQuotation(customer, request, resolvedParts, null);

        request.setStatus(ProcessingStatus.SENDING_REPLY);
        processingRequestRepository.save(request);
        byte[] pdfBytes = documentService.renderQuotationPdf(quotation);
        String replyHtml = buildReplyHtml(customer, quotation);
        List<String> ccList = new ArrayList<>();
        if (request.getEmailCc() != null && !request.getEmailCc().trim().isEmpty()) {
            for (String c : request.getEmailCc().split("[,;]")) {
                if (!c.trim().isEmpty()) {
                    ccList.add(c.trim());
                }
            }
        }
        boolean hasCc = !ccList.isEmpty();

        if (cfg != null) {
            graphService.sendReplyWithAttachment(messageId, request.getEmailFrom(), ccList, request.getEmailSubject(),
                    replyHtml, pdfBytes, quotation.getQuotationNumber() + ".pdf", hasCc, cfg);
        } else {
            graphService.sendReplyWithAttachment(messageId, request.getEmailFrom(), ccList, request.getEmailSubject(),
                    replyHtml, pdfBytes, quotation.getQuotationNumber() + ".pdf");
        }

        quotation.setStatus(Quotation.QuotationStatus.SENT);
        quotation.setSentAt(LocalDateTime.now());
        String newId = (cfg != null) ? graphService.moveToProcessedFolder(messageId, cfg) : graphService.moveToProcessedFolder(messageId);
        request.setEmailMessageId(newId);
        request.setStatus(ProcessingStatus.COMPLETED);
        processingRequestRepository.save(request);

        // Save the outgoing quotation reply as a separate record in DB
        try {
            ProcessingRequest replyPr = new ProcessingRequest();
            replyPr.setEmailMessageId(request.getEmailMessageId() + "_reply_" + System.currentTimeMillis());
            replyPr.setEmailSubject("RE: " + (request.getEmailSubject() != null ? request.getEmailSubject() : ""));
            replyPr.setEmailFrom(request.getSharedMailbox() != null ? request.getSharedMailbox() : "System");
            replyPr.setEmailTo(request.getEmailFrom());
            replyPr.setEmailCc(request.getEmailCc());
            replyPr.setEmailBodyPreview(replyHtml);
            replyPr.setEmailReceivedAt(LocalDateTime.now());
            replyPr.setIntent(request.getIntent());
            replyPr.setStatus(ProcessingStatus.COMPLETED);
            replyPr.setCustomer(request.getCustomer());
            replyPr.setAttachmentCount(1);
            replyPr.setCombinedText(replyHtml + "\n\n--- Attachments ---\n" + (quotation.getPdfStoragePath() != null ? quotation.getPdfStoragePath() : ""));
            replyPr.setCreatedBy(request.getCreatedBy() != null ? request.getCreatedBy() : "System");
            replyPr.setUpdatedBy(request.getUpdatedBy() != null ? request.getUpdatedBy() : "System");
            replyPr.setCompanyId(request.getCompanyId());
            replyPr.setDivisionId(request.getDivisionId());
            replyPr.setSharedMailbox(request.getSharedMailbox());
            
            // Set tracking metadata for outgoing emails
            replyPr.setParentEnquiryId(request.getId());
            replyPr.setConversationThreadId(request.getEmailMessageId());
            replyPr.setDirection("OUTGOING");
            replyPr.setEmailType("Quotation Reply");
            replyPr.setMode("OCR");
            
            processingRequestRepository.save(replyPr);
            log.info("Saved outgoing quotation reply request row in DB for incoming request id: {}", request.getId());
        } catch (Exception ex) {
            log.error("Failed to save outgoing quotation reply row in DB: {}", ex.getMessage(), ex);
        }

        logStep(request, "COMPLETED", EmailProcessingLog.LogStatus.SUCCESS, "Done: " + quotation.getQuotationNumber());
    }

    public String extractTextFromExcel(byte[] excelBytes) {
        StringBuilder text = new StringBuilder();
        try (org.apache.poi.ss.usermodel.Workbook workbook = org.apache.poi.ss.usermodel.WorkbookFactory.create(new java.io.ByteArrayInputStream(excelBytes))) {
            for (int s = 0; s < workbook.getNumberOfSheets(); s++) {
                org.apache.poi.ss.usermodel.Sheet sheet = workbook.getSheetAt(s);
                text.append("--- Sheet: ").append(sheet.getSheetName()).append(" ---\n");
                for (org.apache.poi.ss.usermodel.Row row : sheet) {
                    for (org.apache.poi.ss.usermodel.Cell cell : row) {
                        text.append(cell.toString()).append("\t");
                    }
                    text.append("\n");
                }
            }
        } catch (Exception e) {
            log.error("Failed to extract text from Excel: {}", e.getMessage());
        }
        return text.toString();
    }

    private String extractAttachmentText(String messageId, ProcessingRequest request) {
        return extractAttachmentText(messageId, request, null);
    }

    private String extractAttachmentText(String messageId, ProcessingRequest request, OcrConfig cfg) {
        List<OcrAttachmentPath> savedList = ocrAttachmentPathRepository.findByProcessingRequestId(request.getId());
        StringBuilder text = new StringBuilder();
        for (OcrAttachmentPath attPath : savedList) {
            if ("EMAIL".equals(attPath.getAttachmentType())) {
                continue;
            }
            java.io.File file = new java.io.File(attPath.getPath());
            if (file.exists()) {
                try {
                    byte[] content = java.nio.file.Files.readAllBytes(file.toPath());
                    String name = attPath.getFileName().toLowerCase();
                    if (name.endsWith(".pdf")) {
                        CompletableFuture<String> f = ocrService.extractTextFromPdf(content);
                        text.append(f.get()).append("\n");
                    } else if (name.matches(".*\\.(jpg|jpeg|png)$")) {
                        CompletableFuture<String> f = ocrService.extractTextFromImage(content);
                        text.append(f.get()).append("\n");
                    } else if (name.endsWith(".xls") || name.endsWith(".xlsx")) {
                        String excelText = extractTextFromExcel(content);
                        text.append(excelText).append("\n");
                    }
                } catch (Exception e) {
                    log.error("Local attachment extraction failed for {}: {}", attPath.getFileName(), e.getMessage());
                }
            }
        }
        return text.toString();
    }

    private List<ExtractedPart> extractPartsFromAttachments(List<OcrAttachmentPath> attachments, String customerName) {
        List<ExtractedPart> parts = new ArrayList<>();
        if (attachments != null) {
            for (OcrAttachmentPath attPath : attachments) {
                if ("EMAIL".equals(attPath.getAttachmentType())) {
                    continue;
                }
                java.io.File file = new java.io.File(attPath.getPath());
                if (file.exists()) {
                    try {
                        byte[] content = java.nio.file.Files.readAllBytes(file.toPath());
                        String name = attPath.getFileName().toLowerCase();
                        if (name.endsWith(".pdf")) {
                            List<ExtractedPart> pdfParts = ocrService.extractPartsFromExternalOcr(content, attPath.getFileName(), customerName);
                            if (pdfParts != null) {
                                parts.addAll(pdfParts);
                            }
                        }
                    } catch (Exception e) {
                        log.error("Failed to extract parts from local attachment {}: {}", attPath.getFileName(), e.getMessage());
                    }
                }
            }
        }
        return parts;
    }

    private void saveAttachmentsLocally(String messageId, ProcessingRequest request, OcrConfig cfg) {
        java.io.File dir = new java.io.File("./generated-documents/attachments");
        if (!dir.exists()) {
            dir.mkdirs();
        }

        List<Attachment> attachments = (cfg != null) ? graphService.getAttachments(messageId, cfg) : graphService.getAttachments(messageId);
        if (attachments != null) {
            for (Attachment att : attachments) {
                if (att instanceof FileAttachment fa) {
                    // Check duplicate
                    Optional<OcrAttachmentPath> existing = ocrAttachmentPathRepository.findByProcessingRequestIdAndOriginalAttachmentId(request.getId(), fa.getId());
                    if (existing.isPresent()) {
                        continue;
                    }

                    byte[] content = fa.getContentBytes();
                    if (content == null || content.length == 0) {
                        continue;
                    }

                    String originalName = fa.getName() != null ? fa.getName() : "attachment.bin";
                    String ext = "";
                    int dotIdx = originalName.lastIndexOf('.');
                    if (dotIdx != -1) {
                        ext = originalName.substring(dotIdx + 1).toLowerCase();
                    }

                    String uuidName = java.util.UUID.randomUUID().toString() + "_" + originalName.replaceAll("[\\\\/:*?\"<>|]", "_");
                    java.io.File destFile = new java.io.File(dir, uuidName);
                    try {
                        java.nio.file.Files.write(destFile.toPath(), content);
                    } catch (Exception e) {
                        log.error("Failed to save attachment {} to local disk", originalName, e);
                        continue;
                    }

                    String attachType = "DOCUMENT";
                    if (ext.matches("jpg|jpeg|png|gif|webp|bmp|svg")) {
                        attachType = "IMAGE";
                    }

                    OcrAttachmentPath pathRecord = OcrAttachmentPath.builder()
                            .processingRequest(request)
                            .fileName(originalName)
                            .path(destFile.getAbsolutePath())
                            .docType(ext)
                            .contentType(fa.getContentType())
                            .fileSize((long) content.length)
                            .isInline(fa.getIsInline() != null ? fa.getIsInline() : false)
                            .originalAttachmentId(fa.getId())
                            .attachmentType(attachType)
                            .createdBy("admin")
                            .build();
                    ocrAttachmentPathRepository.save(pathRecord);
                }
            }
        }

        // Generate and cache EML file as a separate EMAIL attachment record
        Optional<OcrAttachmentPath> existingEml = ocrAttachmentPathRepository.findByProcessingRequestIdAndOriginalAttachmentId(request.getId(), "original_email_eml");
        if (!existingEml.isPresent()) {
            StringBuilder eml = new StringBuilder();
            eml.append("From: ").append(request.getEmailFrom() != null ? request.getEmailFrom() : "").append("\r\n");
            eml.append("To: ").append(request.getEmailTo() != null ? request.getEmailTo() : "").append("\r\n");
            if (request.getEmailCc() != null && !request.getEmailCc().trim().isEmpty()) {
                eml.append("Cc: ").append(request.getEmailCc()).append("\r\n");
            }
            eml.append("Subject: ").append(request.getEmailSubject() != null ? request.getEmailSubject() : "").append("\r\n");
            eml.append("Date: ").append(request.getEmailReceivedAt() != null ? request.getEmailReceivedAt().toString() : "").append("\r\n");
            eml.append("MIME-Version: 1.0\r\n");
            eml.append("Content-Type: text/html; charset=UTF-8\r\n");
            eml.append("\r\n");
            eml.append(request.getEmailBodyPreview() != null ? request.getEmailBodyPreview() : "");

            byte[] emlBytes = eml.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
            String safeSubject = (request.getEmailSubject() != null ? request.getEmailSubject() : "email").replaceAll("[\\\\/:*?\"<>|]", "_");
            String emlFilename = safeSubject + ".eml";
            String uuidEmlName = java.util.UUID.randomUUID().toString() + "_" + emlFilename;
            java.io.File destEmlFile = new java.io.File(dir, uuidEmlName);
            try {
                java.nio.file.Files.write(destEmlFile.toPath(), emlBytes);

                OcrAttachmentPath emlRecord = OcrAttachmentPath.builder()
                        .processingRequest(request)
                        .fileName(emlFilename)
                        .path(destEmlFile.getAbsolutePath())
                        .docType("eml")
                        .contentType("message/rfc822")
                        .fileSize((long) emlBytes.length)
                        .isInline(false)
                        .originalAttachmentId("original_email_eml")
                        .attachmentType("EMAIL")
                        .createdBy("admin")
                        .build();
                ocrAttachmentPathRepository.save(emlRecord);
            } catch (Exception e) {
                log.error("Failed to save dynamic EML file to disk", e);
            }
        }

        // Update request's attachment count in database
        List<OcrAttachmentPath> allSaved = ocrAttachmentPathRepository.findByProcessingRequestId(request.getId());
        request.setAttachmentCount(allSaved.size());
        processingRequestRepository.save(request);
    }

    private Customer createOrGetCustomer(String email, Message msg) {
        return customerRepository.findByEmailIgnoreCase(email).orElseGet(() -> {
            String name = (msg.getFrom() != null && msg.getFrom().getEmailAddress() != null)
                    ? msg.getFrom().getEmailAddress().getName() : email;
            return customerRepository.save(Customer.builder().email(email).name(name != null ? name : email).build());
        });
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> fetchCompanyProfile(Long companyId) {
        if (companyId == null) {
            companyId = 1L;
        }
        try {
            String url = "http://localhost:8081/api/company-profile/all";
            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<List> response = restTemplate.getForEntity(url, List.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<Map<String, Object>> list = (List<Map<String, Object>>) response.getBody();
                for (Map<String, Object> body : list) {
                    Object idObj = body.get("id");
                    if (idObj != null) {
                        Long id = null;
                        if (idObj instanceof Number) {
                            id = ((Number) idObj).longValue();
                        } else {
                            id = Long.parseLong(idObj.toString());
                        }
                        if (companyId.equals(id)) {
                            return body;
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to fetch company profiles from main backend: {}", e.getMessage());
        }
        return null;
    }

    public String getCompanyName(Long companyId) {
        Map<String, Object> profile = fetchCompanyProfile(companyId);
        if (profile != null && profile.containsKey("companyName") && profile.get("companyName") != null) {
            return (String) profile.get("companyName");
        }
        return "Nutech Manufacturing";
    }

    private String buildReplyHtml(Customer customer, Quotation quotation) {
        Context ctx = new Context();
        ctx.setVariable("customerName", customer.getName());
        ctx.setVariable("quotationNumber", quotation.getQuotationNumber());
        ctx.setVariable("totalAmount", quotation.getTotalAmount());
        ctx.setVariable("validUntil", quotation.getValidUntil());
        
        Long companyId = 1L;
        if (quotation.getProcessingRequest() != null && quotation.getProcessingRequest().getCompanyId() != null) {
            companyId = quotation.getProcessingRequest().getCompanyId();
        }
        ctx.setVariable("companyName", getCompanyName(companyId));
        return templateEngine.process("email-reply-template", ctx);
    }

    private Intent mapIntent(String s) {
        if (s == null) return Intent.GENERAL_INQUIRY;
        return switch (s.toLowerCase()) {
            case "quotation_request" -> Intent.QUOTATION_REQUEST;
            case "invoice_request" -> Intent.INVOICE_REQUEST;
            case "ledger" -> Intent.LEDGER;
            case "spam" -> Intent.SPAM;
            default -> Intent.GENERAL_INQUIRY;
        };
    }

    private void logStep(ProcessingRequest r, String step, EmailProcessingLog.LogStatus s, String d) {
        logRepository.save(EmailProcessingLog.builder().processingRequest(r).step(step).status(s).details(d).build());
    }

    public List<Map<String, Object>> fetchCustomersFromMainBackend() {
        try {
            String url = "http://localhost:8081/api/sm/customers";
            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<List> response = restTemplate.getForEntity(url, List.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return (List<Map<String, Object>>) response.getBody();
            }
        } catch (Exception e) {
            log.error("Failed to fetch customers from main backend for domain matching: {}", e.getMessage());
        }
        return new ArrayList<>();
    }

    public List<String> fetchPublicEmailProviders() {
        try {
            String url = "http://localhost:8081/api/sm/public-email-providers";
            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<List> response = restTemplate.getForEntity(url, List.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return (List<String>) response.getBody();
            }
        } catch (Exception e) {
            log.error("Failed to fetch public email providers: {}", e.getMessage());
        }
        // Fallback defaults
        return List.of("gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "live.com", "icloud.com", "proton.me", "protonmail.com", "aol.com");
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> findMatchingCustomer(String senderEmail, List<Map<String, Object>> customers) {
        if (senderEmail == null || senderEmail.trim().isEmpty()) {
            return null;
        }
        String cleanSenderEmail = senderEmail.trim().toLowerCase();

        // 1. Exact Email Match
        // Primary email (mailId)
        for (Map<String, Object> cust : customers) {
            String primaryEmail = (String) cust.get("mailId");
            if (primaryEmail != null && primaryEmail.trim().toLowerCase().equals(cleanSenderEmail)) {
                return cust;
            }
        }
        // CUSTOMER_EMAIL_MAPPING list
        for (Map<String, Object> cust : customers) {
            List<Map<String, Object>> emailMappings = (List<Map<String, Object>>) cust.get("emailMappings");
            if (emailMappings != null) {
                for (Map<String, Object> map : emailMappings) {
                    String mappedEmail = (String) map.get("emailAddress");
                    if (mappedEmail != null && mappedEmail.trim().toLowerCase().equals(cleanSenderEmail)) {
                        return cust;
                    }
                }
            }
        }

        // 2. Domain Match (only if private/corporate domain)
        int atIdx = cleanSenderEmail.lastIndexOf('@');
        if (atIdx == -1) {
            return null;
        }
        String senderDomainNameOnly = cleanSenderEmail.substring(atIdx + 1).trim();
        String senderDomainWithAt = "@" + senderDomainNameOnly;

        List<String> publicProviders = fetchPublicEmailProviders();
        boolean isPublicDomain = false;
        for (String pub : publicProviders) {
            if (pub.trim().toLowerCase().equals(senderDomainNameOnly)) {
                isPublicDomain = true;
                break;
            }
        }

        if (!isPublicDomain) {
            // Match primary domainName
            for (Map<String, Object> cust : customers) {
                String domainName = (String) cust.get("domainName");
                if (domainName != null) {
                    String cleanDomain = domainName.replace("@", "").trim().toLowerCase();
                    if (!cleanDomain.isEmpty() && senderDomainNameOnly.equalsIgnoreCase(cleanDomain)) {
                        return cust;
                    }
                }
            }
            // Match CUSTOMER_DOMAIN_MAPPING list
            for (Map<String, Object> cust : customers) {
                List<Map<String, Object>> domainMappings = (List<Map<String, Object>>) cust.get("domainMappings");
                if (domainMappings != null) {
                    for (Map<String, Object> map : domainMappings) {
                        String mappedDomain = (String) map.get("domainName");
                        if (mappedDomain != null) {
                            String cleanDomain = mappedDomain.replace("@", "").trim().toLowerCase();
                            if (!cleanDomain.isEmpty() && senderDomainNameOnly.equalsIgnoreCase(cleanDomain)) {
                                return cust;
                            }
                        }
                    }
                }
            }
        }

        return null;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> findExistingCustomerDuplicate(String name, String gstin, String cleanSenderDomain, String email, List<Map<String, Object>> customers) {
        String cleanGstin = gstin != null ? gstin.replaceAll("\\s+", "").toUpperCase() : "";
        String cleanEmail = email != null ? email.trim().toLowerCase() : "";
        String cleanDomain = cleanSenderDomain != null ? cleanSenderDomain.replace("@", "").trim().toLowerCase() : "";

        for (Map<String, Object> c : customers) {
            String existingName = (String) c.get("ledgerName");
            String existingGstin = (String) c.get("gstin");
            String primaryEmail = (String) c.get("mailId");
            String primaryDomain = (String) c.get("domainName");

            // Name check
            if (existingName != null && name != null && existingName.trim().equalsIgnoreCase(name.trim())) {
                return c;
            }
            // GSTIN check
            if (existingGstin != null && !cleanGstin.isEmpty()) {
                String existingCleanGstin = existingGstin.replaceAll("\\s+", "").toUpperCase();
                if (existingCleanGstin.equals(cleanGstin)) {
                    return c;
                }
            }
            // Email check (primary)
            if (primaryEmail != null && !cleanEmail.isEmpty() && primaryEmail.trim().toLowerCase().equals(cleanEmail)) {
                return c;
            }
            // Email check (mappings)
            List<Map<String, Object>> emailMappings = (List<Map<String, Object>>) c.get("emailMappings");
            if (emailMappings != null && !cleanEmail.isEmpty()) {
                for (Map<String, Object> map : emailMappings) {
                    String mappedEmail = (String) map.get("emailAddress");
                    if (mappedEmail != null && mappedEmail.trim().toLowerCase().equals(cleanEmail)) {
                        return c;
                    }
                }
            }
            // Domain check (primary)
            if (primaryDomain != null && !cleanDomain.isEmpty()) {
                String cleanExist = primaryDomain.replace("@", "").trim().toLowerCase();
                if (cleanExist.equals(cleanDomain)) {
                    return c;
                }
            }
            // Domain check (mappings)
            List<Map<String, Object>> domainMappings = (List<Map<String, Object>>) c.get("domainMappings");
            if (domainMappings != null && !cleanDomain.isEmpty()) {
                for (Map<String, Object> map : domainMappings) {
                    String mappedDomain = (String) map.get("domainName");
                    if (mappedDomain != null) {
                        String cleanExist = mappedDomain.replace("@", "").trim().toLowerCase();
                        if (cleanExist.equals(cleanDomain)) {
                            return c;
                        }
                    }
                }
            }
        }
        return null;
    }

    private void autoMapCustomerByDomain(ProcessingRequest request) {
        String senderEmail = request.getEmailFrom();
        if (senderEmail == null || senderEmail.trim().isEmpty()) {
            return;
        }

        List<Map<String, Object>> customers = fetchCustomersFromMainBackend();
        Map<String, Object> matched = findMatchingCustomer(senderEmail, customers);

        if (matched != null) {
            String customerCode = (String) matched.get("ledgerCode");
            if (customerCode == null) customerCode = (String) matched.get("customerCode");
            String customerName = (String) matched.get("ledgerName");
            if (customerName == null) customerName = (String) matched.get("customerName");

            if (customerCode != null && !customerCode.trim().isEmpty()) {
                final String custCode = customerCode;
                final String custName = customerName;

                log.info("Auto-mapped email from '{}' to customer '{}' (Code: '{}')", 
                         senderEmail, custName, custCode);

                com.nutech.email.model.Customer localCust = customerRepository.findByEmailIgnoreCase(custCode)
                    .map(existingCust -> {
                        if (!existingCust.getName().equals(custName)) {
                            existingCust.setName(custName);
                            return customerRepository.save(existingCust);
                        }
                        return existingCust;
                    })
                    .orElseGet(() -> {
                        com.nutech.email.model.Customer newCust = new com.nutech.email.model.Customer();
                        newCust.setEmail(custCode);
                        newCust.setName(custName);
                        return customerRepository.save(newCust);
                    });

                syncCustomerDetailsFromMainBackend(localCust);
                request.setCustomer(localCust);
            }
        } else {
            log.debug("No customer matched sender '{}'.", senderEmail);
        }
    }

    @Transactional
    public void syncCustomerDetailsFromMainBackend(com.nutech.email.model.Customer localCust) {
        if (localCust == null || localCust.getEmail() == null || localCust.getEmail().trim().isEmpty()) {
            return;
        }
        try {
            List<Map<String, Object>> mainCustomers = fetchCustomersFromMainBackend();
            for (Map<String, Object> c : mainCustomers) {
                String code = (String) c.get("code");
                if (localCust.getEmail().equalsIgnoreCase(code)) {
                    log.info("Syncing customer details from main backend for customer: {}", code);
                    localCust.setName((String) c.get("ledgerName"));
                    localCust.setCompanyName((String) c.get("ledgerName"));
                    localCust.setPhone((String) c.get("mobileNo"));
                    localCust.setAddressLine1((String) c.get("address"));
                    localCust.setCity((String) c.get("city"));
                    localCust.setState((String) c.get("state"));
                    localCust.setZipCode((String) c.get("pinCode"));
                    if (c.get("country") != null) {
                        localCust.setCountry((String) c.get("country"));
                    }
                    localCust.setGstNumber((String) c.get("gstin"));
                    customerRepository.save(localCust);
                    return;
                }
            }
        } catch (Exception e) {
            log.error("Failed to sync customer details from main backend for customer code '{}': {}", 
                      localCust.getEmail(), e.getMessage());
        }
    }

    @Transactional
    public void autoAbandonOldRequests() {
        LocalDateTime startOfToday = LocalDateTime.now().toLocalDate().atStartOfDay();
        List<ProcessingRequest> openRequests = processingRequestRepository.findOpenRequestsBefore(startOfToday);
        if (!openRequests.isEmpty()) {
            log.info("Found {} open requests received before today ({}) to mark as ABANDONED.", openRequests.size(), startOfToday);
            for (ProcessingRequest pr : openRequests) {
                pr.setStatus(ProcessingStatus.ABANDONED);
                pr.setUpdatedBy("System (Auto-Abandon)");
                pr.setUpdatedAt(LocalDateTime.now());
                processingRequestRepository.save(pr);
                
                EmailProcessingLog emailLog = EmailProcessingLog.builder()
                    .processingRequest(pr)
                    .step("AUTO_ABANDONED")
                    .status(EmailProcessingLog.LogStatus.SUCCESS)
                    .details("Request auto-abandoned because it remained unchanged since the previous day.")
                    .build();
                logRepository.save(emailLog);
            }
            notifyMainBackendOfMutation();
        }
    }

    private boolean tryProcessLedgerRequestReply(ProcessingRequest replyRequest, ProcessingRequest originalRequest, OcrConfig cfg) {
        String senderEmail = replyRequest.getEmailFrom();
        log.info("Processing ledger request reply for sender '{}'", senderEmail);
        try {
            // 1. Retrieve cached attachments from database
            List<OcrAttachmentPath> attachments = ocrAttachmentPathRepository.findByProcessingRequestId(replyRequest.getId());
            
            OcrAttachmentPath excelAttachment = null;
            for (OcrAttachmentPath att : attachments) {
                String name = att.getFileName();
                if (name != null && (name.toLowerCase().endsWith(".xls") || name.toLowerCase().endsWith(".xlsx"))) {
                    excelAttachment = att;
                    break;
                }
            }
            
            if (excelAttachment == null) {
                log.warn("No Excel attachment (.xls or .xlsx) found in reply email from '{}'", replyRequest.getEmailFrom());
                return false;
            }
            
            java.io.File file = new java.io.File(excelAttachment.getPath());
            if (!file.exists()) {
                replyRequest.setStatus(ProcessingStatus.FAILED);
                replyRequest.setErrorMessage("Excel attachment file not found locally.");
                processingRequestRepository.save(replyRequest);
                logStep(replyRequest, "LEDGER_REPLY_PROCESSING", EmailProcessingLog.LogStatus.FAILED, "Local Excel file not found");
                return true;
            }
            
            byte[] fileBytes = java.nio.file.Files.readAllBytes(file.toPath());
            if (fileBytes.length == 0) {
                replyRequest.setStatus(ProcessingStatus.FAILED);
                replyRequest.setErrorMessage("Excel attachment is empty.");
                processingRequestRepository.save(replyRequest);
                logStep(replyRequest, "LEDGER_REPLY_PROCESSING", EmailProcessingLog.LogStatus.FAILED, "Excel attachment is empty");
                return true;
            }
            
            // 2. Parse Excel fields
            Map<String, String> fields = parseExcelFields(fileBytes);
            
            // 3. Validate and default mandatory fields
            String name = fields.getOrDefault("name", "").trim();
            String email = fields.getOrDefault("email", "").trim();
            String mobile = fields.getOrDefault("mobile", "").trim();
            String pincode = fields.getOrDefault("pincode", "").trim();
            String gstin = fields.getOrDefault("gstin", "").trim();
            
            String excelDomain = fields.getOrDefault("domain", "").trim().toLowerCase();
            if (!excelDomain.isEmpty() && !excelDomain.startsWith("@")) {
                excelDomain = "@" + excelDomain;
            }
            String cleanSenderDomain = excelDomain;

            List<String> missingFieldsList = new ArrayList<>();
            if (name.isEmpty()) {
                missingFieldsList.add("Name");
                name = "Customer " + (cleanSenderDomain.isEmpty() ? senderEmail : cleanSenderDomain);
            }
            if (email.isEmpty()) {
                missingFieldsList.add("Email");
                email = senderEmail;
            }
            if (mobile.isEmpty()) {
                missingFieldsList.add("Mobile");
                mobile = "";
            }
            if (pincode.isEmpty()) {
                missingFieldsList.add("Pincode");
                pincode = "";
            }
            if (gstin.isEmpty()) {
                missingFieldsList.add("GSTIN");
                gstin = "URP";
            }
            
            if (!missingFieldsList.isEmpty()) {
                String missingLog = "Mandatory fields missing in Excel reply: " + missingFieldsList + ". Populated default/blank values.";
                log.info(missingLog);
                logStep(replyRequest, "LEDGER_REPLY_PROCESSING", EmailProcessingLog.LogStatus.SUCCESS, missingLog);
            }
            
            // 4. Verify customer does not already exist (deduplication check)
            List<Map<String, Object>> mainBackendCustomers = fetchCustomersFromMainBackend();
            Map<String, Object> duplicateCust = findExistingCustomerDuplicate(name, gstin, cleanSenderDomain, email, mainBackendCustomers);
            
            if (duplicateCust != null) {
                String matchedCode = (String) duplicateCust.get("ledgerCode");
                if (matchedCode == null) matchedCode = (String) duplicateCust.get("customerCode");
                String matchedName = (String) duplicateCust.get("ledgerName");
                if (matchedName == null) matchedName = (String) duplicateCust.get("customerName");
                
                log.info("Customer already exists (deduplication check matched Code: {}). Mapping to existing customer.", matchedCode);
                
                if (matchedCode != null) {
                    final String custCode = matchedCode;
                    final String custName = matchedName;
                    com.nutech.email.model.Customer localCust = customerRepository.findByEmailIgnoreCase(matchedCode)
                        .orElseGet(() -> {
                            com.nutech.email.model.Customer newCust = new com.nutech.email.model.Customer();
                            newCust.setEmail(custCode);
                            newCust.setName(custName);
                            return customerRepository.save(newCust);
                        });
                    
                    if (originalRequest != null) {
                        // Move received reply attachments to originalRequest so all files live under one master ID
                        List<OcrAttachmentPath> replyAttachments = ocrAttachmentPathRepository.findByProcessingRequestId(replyRequest.getId());
                        for (OcrAttachmentPath att : replyAttachments) {
                            att.setProcessingRequest(originalRequest);
                            String origAttId = att.getOriginalAttachmentId();
                            if (origAttId == null || "original_email_eml".equalsIgnoreCase(origAttId)) {
                                att.setOriginalAttachmentId("reply_eml_" + System.currentTimeMillis() + "_" + java.util.UUID.randomUUID().toString().substring(0, 8));
                            } else {
                                att.setOriginalAttachmentId("reply_" + System.currentTimeMillis() + "_" + origAttId);
                            }
                            ocrAttachmentPathRepository.save(att);
                        }
                        int origAttCount = originalRequest.getAttachmentCount() != null ? originalRequest.getAttachmentCount() : 0;
                        originalRequest.setAttachmentCount(origAttCount + replyAttachments.size());

                        originalRequest.setCustomer(localCust);
                        originalRequest.setIntent(ProcessingRequest.Intent.QUOTATION_REQUEST);
                        originalRequest.setStatus(ProcessingStatus.COMPLETED);
                        originalRequest.setUpdatedBy("System");
                        processingRequestRepository.save(originalRequest);
                        logStep(originalRequest, "LEDGER_REPLY_PROCESSING", EmailProcessingLog.LogStatus.SUCCESS, "Mapped to existing customer Code: " + custCode + " and enquiry completed successfully");

                        // Auto-create Sales Enquiry in SALES_ENQUIRY_HEADER & SALES_ENQUIRY_DETAIL
                        try {
                            createSalesEnquiryIfAbsent(originalRequest);
                        } catch (Exception enqEx) {
                            log.error("Failed to auto-create Sales Enquiry for request {}: {}", originalRequest.getId(), enqEx.getMessage(), enqEx);
                        }

                        // Reassign logs of replyRequest to originalRequest to prevent FK constraint failure on delete
                        List<EmailProcessingLog> replyLogs = logRepository.findByProcessingRequestIdOrderByCreatedAtAsc(replyRequest.getId());
                        for (EmailProcessingLog pl : replyLogs) {
                            pl.setProcessingRequest(originalRequest);
                            logRepository.save(pl);
                        }
                    }
                    processingRequestRepository.delete(replyRequest);
                    
                    if (!cleanSenderDomain.isEmpty()) {
                        List<ProcessingRequest> unmappedRequests = processingRequestRepository.findByCustomerIsNull();
                        for (ProcessingRequest pr : unmappedRequests) {
                            String from = pr.getEmailFrom();
                            if (from != null) {
                                int idx = from.lastIndexOf('@');
                                if (idx != -1) {
                                    String domain = from.substring(idx).trim().toLowerCase();
                                    if (!domain.startsWith("@")) domain = "@" + domain;
                                    if (domain.equalsIgnoreCase(cleanSenderDomain)) {
                                        pr.setCustomer(localCust);
                                        processingRequestRepository.save(pr);
                                    }
                                }
                            }
                        }
                    }
                    if (cfg != null) {
                        graphService.markAsRead(replyRequest.getEmailMessageId(), cfg);
                    } else {
                        graphService.markAsRead(replyRequest.getEmailMessageId());
                    }
                    notifyMainBackendOfMutation();
                    return true;
                }
            }
            
            // 5. Automatically create Customer in the main backend
            Map<String, Object> payload = new HashMap<>();
            payload.put("ledgerName", name);
            payload.put("printName", name);
            payload.put("address", (fields.getOrDefault("address1", "") + " " + fields.getOrDefault("address2", "")).trim());
            payload.put("city", fields.getOrDefault("city", ""));
            payload.put("state", fields.getOrDefault("state", ""));
            payload.put("country", fields.getOrDefault("country", "India"));
            payload.put("pinCode", pincode);
            payload.put("mobileNo", mobile);
            payload.put("mailId", email);
            payload.put("website", fields.getOrDefault("website", ""));
            payload.put("currencyCode", fields.getOrDefault("currency", "INR"));
            payload.put("panNo", fields.getOrDefault("pan", ""));
            payload.put("gstin", gstin);
            payload.put("domainName", cleanSenderDomain);
            
            String stateCodeStr = fields.get("stateCode");
            if (stateCodeStr != null && !stateCodeStr.trim().isEmpty()) {
                try {
                    payload.put("stateCode", Integer.parseInt(stateCodeStr.trim()));
                } catch (Exception e) {
                    log.warn("Failed to parse state code: {}", stateCodeStr);
                }
            }
            
            RestTemplate restTemplate = new RestTemplate();
            String createUrl = "http://localhost:8081/api/ocr/create-customer";
            log.info("Sending request to create customer in main backend: {}", createUrl);
            ResponseEntity<Map> createResponse = restTemplate.postForEntity(createUrl, payload, Map.class);
            if (!createResponse.getStatusCode().is2xxSuccessful() || createResponse.getBody() == null) {
                throw new RuntimeException("Failed to save Customer Master via main backend API: status " + createResponse.getStatusCode());
            }
            
            Map<String, Object> savedCust = createResponse.getBody();
            String customerCode = (String) savedCust.get("ledgerCode");
            String customerName = (String) savedCust.get("ledgerName");
            log.info("Successfully created Customer Master: Code='{}', Name='{}'", customerCode, customerName);
            
            // 6. Create local representative customer record in email-service database
            com.nutech.email.model.Customer localCust = customerRepository.findByEmailIgnoreCase(customerCode)
                .orElseGet(() -> {
                    com.nutech.email.model.Customer newCust = new com.nutech.email.model.Customer();
                    newCust.setEmail(customerCode);
                    newCust.setName(customerName);
                    return customerRepository.save(newCust);
                });
            syncCustomerDetailsFromMainBackend(localCust);
            
            // 7. Auto-match historical unmapped enquiries having the same domain
            if (!cleanSenderDomain.isEmpty()) {
                List<ProcessingRequest> unmappedRequests = processingRequestRepository.findByCustomerIsNull();
                log.info("Checking {} unmapped requests for matching domain '{}'", unmappedRequests.size(), cleanSenderDomain);
                int matchedCount = 0;
                for (ProcessingRequest pr : unmappedRequests) {
                    String from = pr.getEmailFrom();
                    if (from != null) {
                        int idx = from.lastIndexOf('@');
                        if (idx != -1) {
                            String domain = from.substring(idx).trim().toLowerCase();
                            if (!domain.startsWith("@")) domain = "@" + domain;
                            if (domain.equalsIgnoreCase(cleanSenderDomain)) {
                                pr.setCustomer(localCust);
                                processingRequestRepository.save(pr);
                                matchedCount++;
                            }
                        }
                    }
                }
                log.info("Auto-matched and updated {} historical enquiries with the new customer code '{}'", matchedCount, customerCode);
            }
            
            // 8. Move reply attachments to originalRequest and update originalRequest in-place
            if (originalRequest != null) {
                List<OcrAttachmentPath> replyAttachments = ocrAttachmentPathRepository.findByProcessingRequestId(replyRequest.getId());
                for (OcrAttachmentPath att : replyAttachments) {
                    att.setProcessingRequest(originalRequest);
                    String origAttId = att.getOriginalAttachmentId();
                    if (origAttId == null || "original_email_eml".equalsIgnoreCase(origAttId)) {
                        att.setOriginalAttachmentId("reply_eml_" + System.currentTimeMillis() + "_" + java.util.UUID.randomUUID().toString().substring(0, 8));
                    } else {
                        att.setOriginalAttachmentId("reply_" + System.currentTimeMillis() + "_" + origAttId);
                    }
                    ocrAttachmentPathRepository.save(att);
                }
                int origAttCount = originalRequest.getAttachmentCount() != null ? originalRequest.getAttachmentCount() : 0;
                originalRequest.setAttachmentCount(origAttCount + replyAttachments.size());

                originalRequest.setCustomer(localCust);
                originalRequest.setIntent(ProcessingRequest.Intent.QUOTATION_REQUEST);
                originalRequest.setStatus(ProcessingStatus.COMPLETED);
                originalRequest.setUpdatedBy("System");
                processingRequestRepository.save(originalRequest);
                logStep(originalRequest, "LEDGER_REPLY_PROCESSING", EmailProcessingLog.LogStatus.SUCCESS, "Customer auto-created (" + customerCode + ") and enquiry completed successfully");

                // Auto-create Sales Enquiry in SALES_ENQUIRY_HEADER & SALES_ENQUIRY_DETAIL
                try {
                    createSalesEnquiryIfAbsent(originalRequest);
                } catch (Exception enqEx) {
                    log.error("Failed to auto-create Sales Enquiry for request {}: {}", originalRequest.getId(), enqEx.getMessage(), enqEx);
                }

                // Reassign logs of replyRequest to originalRequest to prevent FK constraint failure on delete
                List<EmailProcessingLog> replyLogs = logRepository.findByProcessingRequestIdOrderByCreatedAtAsc(replyRequest.getId());
                for (EmailProcessingLog pl : replyLogs) {
                    pl.setProcessingRequest(originalRequest);
                    logRepository.save(pl);
                }
            }

            // Delete temporary replyRequest row so only single row is maintained
            processingRequestRepository.delete(replyRequest);
            
            if (cfg != null) {
                graphService.markAsRead(replyRequest.getEmailMessageId(), cfg);
            } else {
                graphService.markAsRead(replyRequest.getEmailMessageId());
            }
            
            notifyMainBackendOfMutation();
            return true;
            
        } catch (Exception e) {
            log.error("Failed to process ledger request reply from '{}': {}", replyRequest.getEmailFrom(), e.getMessage(), e);
            if (originalRequest != null) {
                logStep(originalRequest, "LEDGER_REPLY_PROCESSING", EmailProcessingLog.LogStatus.FAILED, "Error: " + e.getMessage());
            }
            return true;
        }
    }

    private Map<String, String> parseExcelFields(byte[] excelBytes) {
        Map<String, String> fields = new HashMap<>();
        try (org.apache.poi.ss.usermodel.Workbook workbook = org.apache.poi.ss.usermodel.WorkbookFactory.create(new java.io.ByteArrayInputStream(excelBytes))) {
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.getSheetAt(0);
            org.apache.poi.ss.usermodel.Row row = sheet.getRow(1);
            if (row != null) {
                fields.put("name", getCellValueAsString(row.getCell(0)));
                fields.put("address1", getCellValueAsString(row.getCell(1)));
                fields.put("address2", getCellValueAsString(row.getCell(2)));
                fields.put("city", getCellValueAsString(row.getCell(3)));
                fields.put("state", getCellValueAsString(row.getCell(4)));
                fields.put("country", getCellValueAsString(row.getCell(5)));
                fields.put("pincode", getCellValueAsString(row.getCell(6)));
                fields.put("mobile", getCellValueAsString(row.getCell(7)));
                fields.put("email", getCellValueAsString(row.getCell(8)));
                fields.put("website", getCellValueAsString(row.getCell(9)));
                fields.put("currency", getCellValueAsString(row.getCell(10)));
                fields.put("pan", getCellValueAsString(row.getCell(11)));
                fields.put("gstin", getCellValueAsString(row.getCell(12)));
                fields.put("stateCode", getCellValueAsString(row.getCell(13)));
                fields.put("domain", getCellValueAsString(row.getCell(14)));
            }
        } catch (Exception e) {
            log.error("Failed to parse Excel attachment: {}", e.getMessage(), e);
        }
        return fields;
    }

    private String getCellValueAsString(org.apache.poi.ss.usermodel.Cell cell) {
        if (cell == null) return "";
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                if (org.apache.poi.ss.usermodel.DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toString();
                }
                double numericVal = cell.getNumericCellValue();
                if (numericVal == (long) numericVal) {
                    return String.valueOf((long) numericVal);
                }
                return String.valueOf(numericVal);
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                try {
                    return cell.getStringCellValue().trim();
                } catch (Exception e) {
                    return String.valueOf(cell.getNumericCellValue());
                }
        }
        return "";
    }

    public static String convertHtmlToPlainText(String html) {
        if (html == null) return "";
        // First strip quote containers to avoid extracting text from them
        html = html.split("(?i)<div[^>]*class=['\"]gmail_quote['\"][^>]*>")[0];
        html = html.split("(?i)<blockquote")[0];
        html = html.split("(?i)<div[^>]*id=['\"]divRplyFwdMsg['\"][^>]*>")[0];

        // Replace <br> and <p> tags with newlines
        String text = html.replaceAll("(?i)<br\\s*/?>", "\n")
                          .replaceAll("(?i)</p>", "\n")
                          .replaceAll("(?i)</div>", "\n");
        // Strip all other HTML tags
        text = text.replaceAll("<[^>]*>", "");
        // Unescape HTML entities
        text = text.replace("&nbsp;", " ")
                   .replace("&amp;", "&")
                   .replace("&lt;", "<")
                   .replace("&gt;", ">")
                   .replace("&quot;", "\"")
                   .replace("&apos;", "'");
        return text;
    }

    public static String stripEmailReplyThread(String body) {
        if (body == null) {
            return "";
        }
        
        // Clean HTML blocks first
        body = body.replaceAll("(?i)<div[^>]*class=['\"]gmail_quote['\"][^>]*>[\\s\\S]*", "");
        body = body.replaceAll("(?i)<blockquote[\\s\\S]*", "");
        body = body.replaceAll("(?i)<div[^>]*id=['\"]divRplyFwdMsg['\"][^>]*>[\\s\\S]*", "");

        // 1. Match "On ... wrote:" spanning one or more lines and discard everything after it
        body = body.replaceAll("(?i)(?:^|\\r?\\n)\\s*on\\s+[\\s\\S]*?\\s+wrote:\\s*(?:\\r?\\n|$)[\\s\\S]*", "");

        // 2. Match "Original Message" headers
        body = body.replaceAll("(?i)(?:^|\\r?\\n)-+\\s*original\\s+message\\s*-+[\\s\\S]*", "");

        // 3. Match horizontal lines of underscores
        body = body.replaceAll("(?i)(?:^|\\r?\\n)_{10,}[\\s\\S]*", "");

        // 4. Match "From:" headers
        body = body.replaceAll("(?i)(?:^|\\r?\\n)from\\s*:[\\s\\S]*", "");

        // 5. Match lines starting with >
        String[] lines = body.split("\\r?\\n");
        StringBuilder cleanBody = new StringBuilder();
        
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.startsWith(">")) {
                break;
            }
            cleanBody.append(line).append("\n");
        }
        
        return cleanBody.toString().trim();
    }

    /**
     * Auto-creates an enquiry in SALES_ENQUIRY_HEADER and SALES_ENQUIRY_DETAIL with full idempotency
     * and resilient partial item matching against NPD_PRODUCT_MASTER.
     */
    @Transactional
    public String createSalesEnquiryIfAbsent(ProcessingRequest request) {
        if (request == null || request.getId() == null) {
            return null;
        }

        // 1. Idempotency Check: Check if this processing request already has ENQ_ENTRY_NO
        if (request.getEnqEntryNo() != null && !request.getEnqEntryNo().trim().isEmpty()) {
            return request.getEnqEntryNo();
        }

        // Check if an enquiry was already created for this OCR request ID, Message ID, or Conversation Thread ID
        try {
            String checkSql = "SELECT TOP 1 ID, ENQUIRY_NO FROM SALES_ENQUIRY_HEADER " +
                    "WHERE OCR_REQUEST_ID = ? " +
                    "OR (EMAIL_MESSAGE_ID IS NOT NULL AND EMAIL_MESSAGE_ID != '' AND EMAIL_MESSAGE_ID = ?) " +
                    "OR (CONVERSATION_THREAD_ID IS NOT NULL AND CONVERSATION_THREAD_ID != '' AND CONVERSATION_THREAD_ID = ?)";
            List<Map<String, Object>> existing = jdbcTemplate.queryForList(
                    checkSql,
                    request.getId(),
                    request.getEmailMessageId() != null ? request.getEmailMessageId() : "",
                    request.getConversationThreadId() != null ? request.getConversationThreadId() : ""
            );
            if (!existing.isEmpty()) {
                Map<String, Object> row = existing.get(0);
                String enqNo = (String) row.get("ENQUIRY_NO");
                Long enqId = ((Number) row.get("ID")).longValue();
                request.setEnqEntryNo(enqNo);
                request.setSmEnquiryId(enqId);
                processingRequestRepository.save(request);
                log.info("Enquiry already exists: {} (ID: {}) for ProcessingRequest {}", enqNo, enqId, request.getId());
                return enqNo;
            }
        } catch (Exception e) {
            log.warn("Idempotency check query encountered issue: {}", e.getMessage());
        }

        // 2. Resolve Customer ID (from FA_ACCOUNT_LEDGER)
        Long customerId = null;
        if (request.getCustomer() != null) {
            String custCode = request.getCustomer().getEmail(); // e.g. "C-26-00001"
            String custName = request.getCustomer().getName();
            try {
                List<Map<String, Object>> ledgerRows = jdbcTemplate.queryForList(
                        "SELECT TOP 1 ID FROM FA_ACCOUNT_LEDGER WHERE UPPER(TRIM(CODE)) = ? OR UPPER(TRIM(LEDGER_NAME)) = ? OR UPPER(TRIM(MAIL_ID)) = ?",
                        custCode != null ? custCode.trim().toUpperCase() : "",
                        custName != null ? custName.trim().toUpperCase() : "",
                        custCode != null ? custCode.trim().toUpperCase() : ""
                );
                if (!ledgerRows.isEmpty()) {
                    customerId = ((Number) ledgerRows.get(0).get("ID")).longValue();
                }
            } catch (Exception e) {
                log.warn("Failed to find customer in FA_ACCOUNT_LEDGER: {}", e.getMessage());
            }
        }

        // 3. Generate Sequential Enquiry Number (e.g. ENQ/2627/000001 or RFQ-001)
        String enquiryNo = generateNextEnquiryNo();

        // 4. Resolve Active Status ID from AD_STATUS_MASTER
        Long activeStatusId = 1L;
        try {
            List<Map<String, Object>> statusRows = jdbcTemplate.queryForList(
                    "SELECT TOP 1 ID FROM AD_STATUS_MASTER WHERE UPPER(TRIM(NAME)) IN ('ACTIVE', 'OPEN', 'PENDING')"
            );
            if (!statusRows.isEmpty()) {
                activeStatusId = ((Number) statusRows.get(0).get("ID")).longValue();
            }
        } catch (Exception e) {
            log.warn("Failed to lookup active status from AD_STATUS_MASTER: {}", e.getMessage());
        }

        // 5. Insert SALES_ENQUIRY_HEADER
        java.sql.Timestamp now = java.sql.Timestamp.valueOf(LocalDateTime.now());
        String insertHeaderSql = "INSERT INTO SALES_ENQUIRY_HEADER " +
                "(ENQUIRY_NO, ENQUIRY_DATE, RFQ_MODE, CUSTOMER_ID, SOURCE, REMARKS, STATUS, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE, OCR_REQUEST_ID, EMAIL_MESSAGE_ID, CONVERSATION_THREAD_ID) " +
                "VALUES (?, ?, 'Email', ?, 'OCR Email Automation', ?, ?, 'System', ?, 'System', ?, ?, ?, ?)";
        
        String remarks = request.getEmailSubject() != null ? request.getEmailSubject() : "Created via OCR Email Automation";
        jdbcTemplate.update(
                insertHeaderSql,
                enquiryNo,
                now,
                customerId,
                remarks,
                activeStatusId,
                now,
                now,
                request.getId(),
                request.getEmailMessageId(),
                request.getConversationThreadId()
        );

        // Fetch the generated header ID
        Long enquiryHeaderId = jdbcTemplate.queryForObject(
                "SELECT TOP 1 ID FROM SALES_ENQUIRY_HEADER WHERE ENQUIRY_NO = ? ORDER BY ID DESC",
                Long.class,
                enquiryNo
        );

        // 6. Resilient Item Parsing & NPD_PRODUCT_MASTER Matching
        int totalItems = 0;
        String partsJson = request.getExtractedPartsJson();
        if (partsJson != null && !partsJson.trim().isEmpty()) {
            try {
                com.fasterxml.jackson.databind.JsonNode rootNode = objectMapper.readTree(partsJson);
                if (rootNode.isArray()) {
                    for (com.fasterxml.jackson.databind.JsonNode item : rootNode) {
                        String partCode = item.has("partCode") && !item.get("partCode").isNull() ? item.get("partCode").asText().trim() : "";
                        String partName = item.has("partName") && !item.get("partName").isNull() ? item.get("partName").asText().trim() : "";
                        double qty = item.has("quantity") && !item.get("quantity").isNull() ? item.get("quantity").asDouble(1.0) : 1.0;
                        if (qty <= 0) qty = 1.0;
                        String special = item.has("specialInstructions") && !item.get("specialInstructions").isNull() ? item.get("specialInstructions").asText().trim() : "";

                        // Parse OEM / IPP from special instructions or item
                        String oemPartNo = "";
                        String ippPartNo = "";
                        if (special.contains("OEM:")) {
                            int oemIdx = special.indexOf("OEM:");
                            int ippIdx = special.indexOf("IPP:", oemIdx);
                            if (ippIdx != -1) {
                                oemPartNo = special.substring(oemIdx + 4, ippIdx).trim();
                                ippPartNo = special.substring(ippIdx + 4).trim();
                            } else {
                                oemPartNo = special.substring(oemIdx + 4).trim();
                            }
                        }

                        // Lookup part in NPD_PRODUCT_MASTER (Partial item matching)
                        Long partNoId = null;
                        String commFeasible = "Review Pending";
                        String techFeasible = "Review Pending";
                        if (!partCode.isEmpty()) {
                            try {
                                String lookupSql = "SELECT TOP 1 ID FROM NPD_PRODUCT_MASTER WHERE " +
                                        "UPPER(TRIM(ITEM_NO)) = ? OR UPPER(TRIM(ITEM_CODE)) = ? OR " +
                                        "(OEM_NAME_ID IS NOT NULL AND UPPER(TRIM(SUPPLIER_PART_NO)) = ?)";
                                List<Map<String, Object>> productRows = jdbcTemplate.queryForList(
                                        lookupSql,
                                        partCode.toUpperCase(),
                                        partCode.toUpperCase(),
                                        partCode.toUpperCase()
                                );
                                if (!productRows.isEmpty()) {
                                    partNoId = ((Number) productRows.get(0).get("ID")).longValue();
                                    commFeasible = "Yes";
                                    techFeasible = "Yes";
                                }
                            } catch (Exception e) {
                                log.warn("Product lookup failed for part {}: {}", partCode, e.getMessage());
                            }
                        }

                        // Insert into SALES_ENQUIRY_DETAIL
                        String insertDetailSql = "INSERT INTO SALES_ENQUIRY_DETAIL " +
                                "(ENQUIRY_ID, PART_NO_ID, REQ_QTY, COMMERCIALLY_FEASIBLE, TECHNICALLY_FEASIBLE, PART_NO, PART_NAME, OEM_PART_NO, IPP_PART_NO, REMARKS, STATUS, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) " +
                                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'System', ?, 'System', ?)";

                        jdbcTemplate.update(
                                insertDetailSql,
                                enquiryHeaderId,
                                partNoId,
                                qty,
                                commFeasible,
                                techFeasible,
                                partCode,
                                partName,
                                oemPartNo,
                                ippPartNo,
                                special,
                                now,
                                now
                        );
                        totalItems++;
                    }
                }
            } catch (Exception e) {
                log.error("Failed to parse extractedPartsJson for enquiry creation: {}", e.getMessage());
            }
        }

        // 7. Link Enquiry back to ProcessingRequest
        request.setEnqEntryNo(enquiryNo);
        request.setSmEnquiryId(enquiryHeaderId);
        processingRequestRepository.save(request);

        logStep(request, "ENQUIRY_CREATION", EmailProcessingLog.LogStatus.SUCCESS, "Sales Enquiry generated: " + enquiryNo + " with " + totalItems + " item(s)");
        log.info("Successfully created Sales Enquiry {} (ID: {}) for ProcessingRequest {}", enquiryNo, enquiryHeaderId, request.getId());
        return enquiryNo;
    }

    private String generateNextEnquiryNo() {
        int year = LocalDateTime.now().getYear();
        int month = LocalDateTime.now().getMonthValue();
        String accountYear = (month < 4) ? (year - 1) + "-" + year : year + "-" + (year + 1);

        String prefix = "RFQ-";
        int digits = 3;
        try {
            List<Map<String, Object>> prefixList = jdbcTemplate.queryForList(
                    "SELECT RFQ_PREFIX, RFQ_SUFFIX, RFQ_DIGIT FROM AD_PREFIX_CREDENTIALS WHERE ACCOUNT_YEAR = ?",
                    accountYear
            );
            if (!prefixList.isEmpty()) {
                Map<String, Object> p = prefixList.get(0);
                String pfx = (String) p.get("RFQ_PREFIX");
                String sfx = (String) p.get("RFQ_SUFFIX");
                Number dig = (Number) p.get("RFQ_DIGIT");
                StringBuilder sb = new StringBuilder();
                if (pfx != null && !pfx.trim().isEmpty()) sb.append(pfx.trim());
                if (sfx != null && !sfx.trim().isEmpty()) sb.append(sfx.trim());
                if (sb.length() > 0) prefix = sb.toString().replaceAll("/+", "/");
                if (dig != null && dig.intValue() > 0) digits = dig.intValue();
            }
        } catch (Exception ignored) {}

        String lastEnq = null;
        try {
            lastEnq = jdbcTemplate.queryForObject(
                    "SELECT TOP 1 ENQUIRY_NO FROM SALES_ENQUIRY_HEADER WHERE ENQUIRY_NO LIKE ? ORDER BY ID DESC",
                    String.class,
                    prefix + "%"
            );
        } catch (Exception ignored) {}

        int nextNum = 1;
        if (lastEnq != null && lastEnq.startsWith(prefix)) {
            try {
                String numStr = lastEnq.substring(prefix.length());
                nextNum = Integer.parseInt(numStr) + 1;
            } catch (Exception ignored) {}
        }

        return prefix + String.format("%0" + digits + "d", nextNum);
    }
}
