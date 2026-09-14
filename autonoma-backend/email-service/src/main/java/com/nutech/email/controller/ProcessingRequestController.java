package com.nutech.email.controller;

import com.nutech.email.model.EmailProcessingLog;
import com.nutech.email.model.OcrConfig;
import com.nutech.email.model.ProcessingRequest;
import com.nutech.email.repository.EmailProcessingLogRepository;
import com.nutech.email.repository.InvoiceRepository;
import com.nutech.email.repository.ProcessingRequestRepository;
import com.nutech.email.repository.QuotationRepository;
import com.nutech.email.service.EmailProcessorService;
import com.nutech.email.integration.GraphMailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.stream.Collectors;
import java.util.Comparator;

@RestController
@RequestMapping("/api/processing-requests")
@RequiredArgsConstructor
@Slf4j
public class ProcessingRequestController {

    private final ProcessingRequestRepository prRepository;
    private final EmailProcessingLogRepository logRepository;
    private final QuotationRepository quotationRepository;
    private final InvoiceRepository invoiceRepository;
    private final EmailProcessorService emailProcessorService;
    private final com.nutech.email.repository.CustomerRepository customerRepository;
    private final GraphMailService graphMailService;
    private final com.nutech.email.repository.OcrConfigRepository ocrConfigRepository;
    private final com.nutech.email.repository.OcrAttachmentPathRepository ocrAttachmentPathRepository;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAll(
            @RequestHeader(value = "X-Company-ID", required = false) Long companyId,
            @RequestHeader(value = "X-Tenant-ID", required = false) Long tenantId,
            @RequestHeader(value = "X-Division-ID", required = false) Long divisionId,
            @RequestParam(value = "ocrStatusFilter", required = false, defaultValue = "ALL") String ocrStatusFilter) {
        Long activeCompanyId = (companyId != null) ? companyId : tenantId;
        if (activeCompanyId == null) {
            activeCompanyId = 1L;
        }
        final Long finalCompanyId = activeCompanyId;
        
        java.util.Optional<com.nutech.email.model.OcrConfig> activeConfig = ocrConfigRepository.findByCompanyCredentialId(finalCompanyId);
        final String activeMailbox = activeConfig.map(com.nutech.email.model.OcrConfig::getOcrSharedMailbox).orElse(null);

        List<Map<String, Object>> list = prRepository.findAll().stream()
                .filter(pr -> {
                    if ("OUTGOING".equalsIgnoreCase(pr.getDirection())) {
                        return false;
                    }
                    if (pr.getCompanyId() == null) {
                        if (!finalCompanyId.equals(1L)) {
                            return false;
                        }
                    } else if (!pr.getCompanyId().equals(finalCompanyId)) {
                        return false;
                    }
                    if (divisionId != null && pr.getDivisionId() != null && !pr.getDivisionId().equals(divisionId)) {
                        return false;
                    }
                    if (activeMailbox != null && !activeMailbox.trim().isEmpty()) {
                        if (pr.getSharedMailbox() == null) {
                            String toField = pr.getEmailTo();
                            if (toField == null || !toField.toLowerCase().contains(activeMailbox.toLowerCase())) {
                                return false;
                            }
                        } else if (!pr.getSharedMailbox().equalsIgnoreCase(activeMailbox)) {
                            return false;
                        }
                    }

                    // Enforce category and status filter logic at the API level
                    if ("OCR PENDING".equalsIgnoreCase(ocrStatusFilter)) {
                        boolean isOpen = pr.getStatus() == ProcessingRequest.ProcessingStatus.AWAITING_REVIEW ||
                                         pr.getStatus() == ProcessingRequest.ProcessingStatus.RECEIVED ||
                                         pr.getStatus() == ProcessingRequest.ProcessingStatus.OCR_IN_PROGRESS ||
                                         pr.getStatus() == ProcessingRequest.ProcessingStatus.SKIPPED ||
                                         pr.getStatus() == null;
                        if (!isOpen) {
                            return false;
                        }
                        
                        boolean isLedgerOrOrder = pr.getIntent() == ProcessingRequest.Intent.LEDGER ||
                                                  pr.getIntent() == ProcessingRequest.Intent.QUOTATION_REQUEST;
                        if (isLedgerOrOrder) {
                            return false;
                        }
                    } else if ("ENQUIRY PENDING".equalsIgnoreCase(ocrStatusFilter)) {
                        boolean isCustFilled = pr.getCustomer() != null;
                        boolean hasQuotation = quotationRepository.findByProcessingRequestId(pr.getId()).isPresent();
                        if (!isCustFilled || hasQuotation) {
                            return false;
                        }
                    }

                    return true;
                })
                .map(this::toMap).collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getById(@PathVariable Long id) {
        return prRepository.findById(id)
                .map(pr -> ResponseEntity.ok(toDetailMap(pr)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        ProcessingRequest pr = new ProcessingRequest();
        pr.setMode("MANUAL");
        if (!body.containsKey("emailMessageId") || body.get("emailMessageId") == null || ((String) body.get("emailMessageId")).trim().isEmpty()) {
            pr.setEmailMessageId("MANUAL_" + java.util.UUID.randomUUID().toString());
        }
        updateFromMap(pr, body);
        String creator = (userId != null && !userId.trim().isEmpty()) ? userId : "System";
        pr.setCreatedBy(creator);
        pr.setUpdatedBy(creator);
        pr = prRepository.save(pr);
        return ResponseEntity.ok(toDetailMap(pr));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> update(
            @PathVariable Long id, 
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return prRepository.findById(id)
                .map(pr -> {
                    ProcessingRequest.ProcessingStatus oldStatus = pr.getStatus();
                    updateFromMap(pr, body);
                    ProcessingRequest.ProcessingStatus newStatus = pr.getStatus();
                    
                    String updater = (userId != null && !userId.trim().isEmpty()) ? userId : "System";
                    pr.setUpdatedBy(updater);
                    
                    if (newStatus != oldStatus && (newStatus == ProcessingRequest.ProcessingStatus.LEDGER_REQUEST_MAIL || 
                        newStatus == ProcessingRequest.ProcessingStatus.LEDGER_REQUEST_MAIL_WITH_CC)) {
                        sendLedgerRequestEmail(pr, newStatus, updater);
                    }
                    
                    pr = prRepository.save(pr);
                    
                    return ResponseEntity.ok(toDetailMap(pr));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/preview-reply")
    public ResponseEntity<Map<String, Object>> previewReply(
            @PathVariable Long id,
            @RequestParam("status") String statusStr) {
        return prRepository.findById(id)
                .map(pr -> {
                    String customerName = (pr.getCustomer() != null) ? pr.getCustomer().getName() : "Client";
                    String recipient = pr.getEmailFrom();
                    String subject = "RE: " + (pr.getEmailSubject() != null ? pr.getEmailSubject() : "Customer Ledger");
                    String companyName = emailProcessorService.getCompanyName(pr.getCompanyId());
                    
                    String htmlBody = "<!DOCTYPE html>" +
                            "<html>" +
                            "<head>" +
                            "<style>" +
                            "body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }" +
                            ".container { max-width: 600px; margin: 0 auto; padding: 20px; }" +
                            ".header { border-bottom: 2px solid #0056b3; padding-bottom: 10px; margin-bottom: 20px; }" +
                            ".footer { margin-top: 30px; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 10px; }" +
                            "</style>" +
                            "</head>" +
                            "<body>" +
                            "<div class='container'>" +
                            "<div class='header'>" +
                            "<h2 style='color: #0056b3; margin: 0;'>" + companyName + "</h2>" +
                            "</div>" +
                            "<p>Dear " + customerName + ",</p>" +
                            "<p>Please find attached the Customer Ledger / Master Configuration Template pre-populated with your details on record.</p>" +
                            "<p>Kindly review the details in the attached template, complete any missing fields, and reply directly to this email with the completed file so that we can update your customer record.</p>" +
                            "<p>Thank you,</p>" +
                            "<p>Best regards,<br/>" +
                            "<strong>Accounts Team</strong><br/>" +
                            companyName + "</p>" +
                            "<div class='footer'>" +
                            "<p>This email and any attachments are confidential. If you are not the intended recipient, please notify the sender immediately.</p>" +
                            "</div>" +
                            "</div>" +
                            "</body>" +
                            "</html>";

                    Map<String, Object> result = new HashMap<>();
                    String dynamicFrom = getDynamicSharedMailbox(pr.getCompanyId());
                    result.put("from", dynamicFrom != null ? dynamicFrom : "shared-mailbox@company.com");
                    result.put("to", recipient != null ? recipient : "");
                    
                    String ccEmails = "";
                    if ("LEDGER_REQUEST_MAIL_WITH_CC".equalsIgnoreCase(statusStr) || "Ledger Request Mail with CC".equalsIgnoreCase(statusStr)) {
                        ccEmails = pr.getEmailCc() != null ? pr.getEmailCc() : "";
                    }
                    result.put("cc", ccEmails);
                    result.put("subject", subject);
                    result.put("bodyHtml", htmlBody);
                    
                    List<Map<String, Object>> attachments = new ArrayList<>();
                    Map<String, Object> attachment = new HashMap<>();
                    attachment.put("name", "Customer Ledger Template( OCR ).xls");
                    attachments.add(attachment);
                    result.put("attachments", attachments);

                    return ResponseEntity.ok(result);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @Value("${document.storage-path:./generated-documents}")
    private String storagePath;

    @Value("${msgraph.shared-mailbox}")
    private String sharedMailbox;

    private String getDynamicSharedMailbox() {
        return getDynamicSharedMailbox(null);
    }

    private String getDynamicSharedMailbox(Long companyId) {
        try {
            if (companyId != null) {
                java.util.Optional<com.nutech.email.model.OcrConfig> cfg = ocrConfigRepository.findByCompanyCredentialId(companyId);
                if (cfg.isPresent() && cfg.get().getOcrSharedMailbox() != null) {
                    return cfg.get().getOcrSharedMailbox();
                }
            }
            List<com.nutech.email.model.OcrConfig> configs = ocrConfigRepository.findAll();
            if (!configs.isEmpty() && configs.get(0).getOcrSharedMailbox() != null) {
                return configs.get(0).getOcrSharedMailbox();
            }
        } catch (Exception e) {
            log.error("Failed to fetch shared mailbox from DB config for companyId {}: {}", companyId, e.getMessage());
        }
        return sharedMailbox;
    }

    private byte[] populateLedgerTemplate(byte[] templateBytes, com.nutech.email.model.Customer localCust) {
        try {
            Map<String, Object> matchedCust = null;
            if (localCust != null && localCust.getEmail() != null) {
                List<Map<String, Object>> customers = emailProcessorService.fetchCustomersFromMainBackend();
                log.info("populateLedgerTemplate: localCustEmail={}, mainBackendCustomersCount={}", localCust.getEmail(), customers.size());
                for (Map<String, Object> c : customers) {
                    if (localCust.getEmail().equalsIgnoreCase((String) c.get("customerCode"))) {
                        matchedCust = c;
                        break;
                    }
                }
            }
            log.info("populateLedgerTemplate matched result: {}", matchedCust);

            org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.hssf.usermodel.HSSFWorkbook(new java.io.ByteArrayInputStream(templateBytes));
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.getSheetAt(0);
            
            org.apache.poi.ss.usermodel.Row row = sheet.getRow(1);
            if (row == null) {
                row = sheet.createRow(1);
            }
            
            String name = "";
            String address1 = "";
            String address2 = "";
            String city = "";
            String state = "";
            String country = "India";
            String pincode = "";
            String mobile = "";
            String email = "";
            String website = "";
            String currency = "INR";
            String pan = "";
            String gstin = "";
            String stateCode = "";
            String domain = "";
            
            if (matchedCust != null) {
                name = (String) matchedCust.getOrDefault("customerName", "");
                String fullAddress = (String) matchedCust.getOrDefault("address", "");
                if (fullAddress != null) {
                    if (fullAddress.length() > 50) {
                        address1 = fullAddress.substring(0, 50);
                        address2 = fullAddress.substring(50);
                    } else {
                        address1 = fullAddress;
                    }
                }
                city = (String) matchedCust.getOrDefault("city", "");
                state = (String) matchedCust.getOrDefault("state", "");
                country = (String) matchedCust.getOrDefault("country", "India");
                pincode = (String) matchedCust.getOrDefault("pincode", "");
                currency = (String) matchedCust.getOrDefault("currency", "INR");
                gstin = (String) matchedCust.getOrDefault("gstin", "");
                stateCode = (String) matchedCust.getOrDefault("stateCode", "");
                domain = (String) matchedCust.getOrDefault("domainName", "");
                email = localCust.getEmail();
            } else if (localCust != null) {
                name = localCust.getName();
                email = localCust.getEmail();
                address1 = localCust.getAddressLine1() != null ? localCust.getAddressLine1() : "";
                address2 = localCust.getAddressLine2() != null ? localCust.getAddressLine2() : "";
                city = localCust.getCity() != null ? localCust.getCity() : "";
                state = localCust.getState() != null ? localCust.getState() : "";
                pincode = localCust.getZipCode() != null ? localCust.getZipCode() : "";
                country = localCust.getCountry() != null ? localCust.getCountry() : "India";
                mobile = localCust.getPhone() != null ? localCust.getPhone() : "";
                gstin = localCust.getGstNumber() != null ? localCust.getGstNumber() : "";
            }
            
            setCellValue(row, 0, name);
            setCellValue(row, 1, address1);
            setCellValue(row, 2, address2);
            setCellValue(row, 3, city);
            setCellValue(row, 4, state);
            setCellValue(row, 5, country);
            setCellValue(row, 6, pincode);
            setCellValue(row, 7, mobile);
            setCellValue(row, 8, email);
            setCellValue(row, 9, website);
            setCellValue(row, 10, currency);
            setCellValue(row, 11, pan);
            setCellValue(row, 12, gstin);
            setCellValue(row, 13, stateCode);
            setCellValue(row, 14, domain);
            
            java.io.ByteArrayOutputStream bos = new java.io.ByteArrayOutputStream();
            workbook.write(bos);
            workbook.close();
            return bos.toByteArray();
        } catch (Exception e) {
            log.error("Failed to populate customer details in excel template: {}", e.getMessage(), e);
            return templateBytes;
        }
    }

    private void setCellValue(org.apache.poi.ss.usermodel.Row row, int colIndex, String val) {
        org.apache.poi.ss.usermodel.Cell cell = row.getCell(colIndex);
        if (cell == null) {
            cell = row.createCell(colIndex);
        }
        cell.setCellValue(val != null ? val : "");
    }

    private void sendLedgerRequestEmail(ProcessingRequest pr, ProcessingRequest.ProcessingStatus status, String userId) {
        if (pr.getEmailMessageId() == null || pr.getEmailMessageId().trim().isEmpty()) {
            log.warn("Cannot send reply email because original emailMessageId is not present for request id: {}", pr.getId());
            throw new RuntimeException("Original email Message ID is missing.");
        }
        
        String recipient = pr.getEmailFrom();
        String subject = "RE: " + (pr.getEmailSubject() != null ? pr.getEmailSubject() : "Customer Ledger");
        
        String customerName = (pr.getCustomer() != null) ? pr.getCustomer().getName() : "Client";
        String companyName = emailProcessorService.getCompanyName(pr.getCompanyId());
        
        String htmlBody = "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "<style>" +
                "body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }" +
                ".container { max-width: 600px; margin: 0 auto; padding: 20px; }" +
                ".header { border-bottom: 2px solid #0056b3; padding-bottom: 10px; margin-bottom: 20px; }" +
                ".footer { margin-top: 30px; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 10px; }" +
                "</style>" +
                "</head>" +
                "<body>" +
                "<div class='container'>" +
                "<div class='header'>" +
                "<h2 style='color: #0056b3; margin: 0;'>" + companyName + "</h2>" +
                "</div>" +
                "<p>Dear " + customerName + ",</p>" +
                "<p>Please find attached the Customer Ledger / Master Configuration Template pre-populated with your details on record.</p>" +
                "<p>Kindly review the details in the attached template, complete any missing fields, and reply directly to this email with the completed file so that we can update your customer record.</p>" +
                "<p>Thank you,</p>" +
                "<p>Best regards,<br/>" +
                "<strong>Accounts Team</strong><br/>" +
                companyName + "</p>" +
                "<div class='footer'>" +
                "<p>This email and any attachments are confidential. If you are not the intended recipient, please notify the sender immediately.</p>" +
                "</div>" +
                "</div>" +
                "</body>" +
                "</html>";
        
        boolean replyAll = status == ProcessingRequest.ProcessingStatus.LEDGER_REQUEST_MAIL_WITH_CC;
        byte[] fileBytes = new byte[0];
        String attachmentName = "Customer Ledger Template( OCR ).xls";
        String savedAttachmentPath = "";

        try {
            // 1. Load Excel Template from Classpath
            byte[] templateBytes;
            try (java.io.InputStream is = new org.springframework.core.io.ClassPathResource("templates/Customer Ledger Template( OCR ).xls").getInputStream()) {
                templateBytes = is.readAllBytes();
            } catch (Exception e) {
                log.error("Ledger template file not found in classpath templates/Customer Ledger Template( OCR ).xls: {}", e.getMessage());
                throw new java.io.FileNotFoundException("Excel template file not found in classpath.");
            }
            fileBytes = populateLedgerTemplate(templateBytes, pr.getCustomer());

            // 2. Save the Excel file to the configured storage path
            try {
                java.nio.file.Path dir = java.nio.file.Paths.get(storagePath);
                java.nio.file.Files.createDirectories(dir);
                String uniqueFileName = java.util.UUID.randomUUID().toString() + "_" + attachmentName;
                java.nio.file.Path filePath = dir.resolve(uniqueFileName);
                java.nio.file.Files.write(filePath, fileBytes);
                savedAttachmentPath = filePath.toAbsolutePath().toString();
                log.info("Saved ledger request attachment at: {}", savedAttachmentPath);
            } catch (Exception e) {
                log.error("Failed to save attachment to storage path: {}", e.getMessage());
            }

            // 3. Send reply email via MS Graph
            boolean emailSent = false;
            String errorMsg = null;
            try {
                List<String> ccList = new ArrayList<>();
                if (replyAll && pr.getEmailCc() != null && !pr.getEmailCc().trim().isEmpty()) {
                    for (String c : pr.getEmailCc().split("[,;]")) {
                        if (!c.trim().isEmpty()) {
                            ccList.add(c.trim());
                        }
                    }
                }

                OcrConfig cfg = null;
                if (pr.getCompanyId() != null) {
                    cfg = ocrConfigRepository.findByCompanyCredentialId(pr.getCompanyId()).orElse(null);
                }

                if (cfg != null) {
                    graphMailService.sendReplyWithAttachment(
                        pr.getEmailMessageId(),
                        recipient,
                        ccList,
                        pr.getEmailSubject() != null ? pr.getEmailSubject() : "Customer Ledger",
                        htmlBody,
                        fileBytes,
                        attachmentName,
                        replyAll,
                        cfg
                    );
                } else {
                    graphMailService.sendReplyWithAttachment(
                        pr.getEmailMessageId(),
                        recipient,
                        ccList,
                        pr.getEmailSubject() != null ? pr.getEmailSubject() : "Customer Ledger",
                        htmlBody,
                        fileBytes,
                        attachmentName,
                        replyAll
                    );
                }
                emailSent = true;
                log.info("Successfully sent ledger template reply email (replyAll={}) for request id: {}", replyAll, pr.getId());
            } catch (Exception e) {
                log.error("Failed to send reply email via Microsoft Graph: {}", e.getMessage(), e);
                errorMsg = e.getMessage();
            }

            String dynamicFrom = getDynamicSharedMailbox(pr.getCompanyId());

            // 4. Update the MASTER enquiry row in-place (single unified row)
            pr.setIntent(ProcessingRequest.Intent.LEDGER);
            pr.setStatus(emailSent ? status : ProcessingRequest.ProcessingStatus.FAILED);
            pr.setUpdatedBy(userId);

            // Save the sent attachment template directly linked to this master request
            if (!savedAttachmentPath.isEmpty()) {
                com.nutech.email.model.OcrAttachmentPath attPath = new com.nutech.email.model.OcrAttachmentPath();
                attPath.setProcessingRequest(pr);
                attPath.setPath(savedAttachmentPath);
                attPath.setFileName(attachmentName);
                attPath.setDocType("EXCEL");
                attPath.setAttachmentType("DOCUMENT");
                attPath.setContentType("application/vnd.ms-excel");
                attPath.setIsInline(false);
                attPath.setOriginalAttachmentId(java.util.UUID.randomUUID().toString());
                attPath.setFileSize((long) fileBytes.length);
                attPath.setCreatedBy(userId != null ? userId : "System");
                ocrAttachmentPathRepository.save(attPath);

                int currentCount = pr.getAttachmentCount() != null ? pr.getAttachmentCount() : 0;
                pr.setAttachmentCount(currentCount + 1);
            }
            prRepository.save(pr);

            // 5. Record the email transaction in the email processing log / audit log
            EmailProcessingLog emailLog = EmailProcessingLog.builder()
                .processingRequest(pr)
                .step("LEDGER_REQUEST_EMAIL_SENT")
                .status(emailSent ? EmailProcessingLog.LogStatus.SUCCESS : EmailProcessingLog.LogStatus.FAILED)
                .details(String.format("Sender: %s | Recipient: %s | Subject: %s | Attachment: %s | Path: %s | Email Status: %s", 
                    dynamicFrom, recipient, subject, attachmentName, savedAttachmentPath, emailSent ? "SENT" : "FAILED (Mail server error: " + errorMsg + ")"))
                .build();
            logRepository.save(emailLog);

            emailProcessorService.notifyMainBackendOfMutation();

            if (!emailSent) {
                throw new RuntimeException("Email delivery failed: " + errorMsg);
            }

        } catch (Exception e) {
            log.error("Failed to complete ledger request workflow for request id: {}", pr.getId(), e);
            
            // Log failure in audit log
            try {
                EmailProcessingLog failureLog = EmailProcessingLog.builder()
                    .processingRequest(pr)
                    .step("LEDGER_REQUEST_EMAIL_SENT")
                    .status(EmailProcessingLog.LogStatus.FAILED)
                    .details("Workflow execution failed: " + e.getMessage())
                    .build();
                logRepository.save(failureLog);
            } catch (Exception ex) {
                log.error("Failed to log workflow exception to database: {}", ex.getMessage());
            }

            throw new RuntimeException("Failed to process Ledger Request: " + e.getMessage(), e);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (prRepository.existsById(id)) {
            prRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    private void updateFromMap(ProcessingRequest pr, Map<String, Object> body) {
        if (body.containsKey("emailMessageId")) pr.setEmailMessageId((String) body.get("emailMessageId"));
        if (body.containsKey("emailSubject")) pr.setEmailSubject((String) body.get("emailSubject"));
        if (body.containsKey("emailFrom")) pr.setEmailFrom((String) body.get("emailFrom"));
        if (body.containsKey("emailTo")) pr.setEmailTo((String) body.get("emailTo"));
        if (body.containsKey("emailCc")) pr.setEmailCc((String) body.get("emailCc"));
        if (body.containsKey("emailBodyPreview")) pr.setEmailBodyPreview((String) body.get("emailBodyPreview"));
        
        if (body.containsKey("category")) {
            String cat = (String) body.get("category");
            if ("Enquiry".equalsIgnoreCase(cat)) pr.setIntent(ProcessingRequest.Intent.QUOTATION_REQUEST);
            else if ("Order".equalsIgnoreCase(cat)) pr.setIntent(ProcessingRequest.Intent.INVOICE_REQUEST);
            else if ("Others".equalsIgnoreCase(cat)) pr.setIntent(ProcessingRequest.Intent.GENERAL_INQUIRY);
            else if ("Ledger".equalsIgnoreCase(cat)) pr.setIntent(ProcessingRequest.Intent.LEDGER);
        }
        
        if (body.containsKey("status")) {
            String stat = (String) body.get("status");
            if ("Open".equalsIgnoreCase(stat)) pr.setStatus(ProcessingRequest.ProcessingStatus.AWAITING_REVIEW);
            else if ("Completed".equalsIgnoreCase(stat)) pr.setStatus(ProcessingRequest.ProcessingStatus.COMPLETED);
            else if ("Abandoned".equalsIgnoreCase(stat)) pr.setStatus(ProcessingRequest.ProcessingStatus.ABANDONED);
            else if ("Not Relevant".equalsIgnoreCase(stat)) pr.setStatus(ProcessingRequest.ProcessingStatus.NOT_RELEVANT);
            else if ("Hold".equalsIgnoreCase(stat)) pr.setStatus(ProcessingRequest.ProcessingStatus.HOLD);
            else if ("Ledger Request Mail".equalsIgnoreCase(stat)) {
                pr.setStatus(ProcessingRequest.ProcessingStatus.LEDGER_REQUEST_MAIL);
            }
            else if ("Ledger Request Mail with CC".equalsIgnoreCase(stat)) {
                pr.setStatus(ProcessingRequest.ProcessingStatus.LEDGER_REQUEST_MAIL_WITH_CC);
            }
        }

        if (body.containsKey("mode")) {
            String m = (String) body.get("mode");
            if (m != null && !m.trim().isEmpty()) {
                pr.setMode(m.trim().toUpperCase());
            }
        }
        
        String code = "";
        String name = "";
        
        if (body.containsKey("customerCode")) {
            code = (String) body.get("customerCode");
        }
        
        if (body.containsKey("customerName")) {
            String fullCustName = (String) body.get("customerName");
            if (fullCustName != null) {
                if (code == null || code.trim().isEmpty()) {
                    if (fullCustName.contains("/")) {
                        String[] parts = fullCustName.split("/");
                        code = parts[0].trim();
                        name = parts[1].trim();
                    } else if (fullCustName.contains("-")) {
                        String[] parts = fullCustName.split("-");
                        code = parts[0].trim();
                        name = parts[1].trim();
                    } else {
                        code = fullCustName.trim();
                        name = fullCustName.trim();
                    }
                } else {
                    name = fullCustName.trim();
                }
            }
        }
        
        if (code != null && !code.trim().isEmpty() && !"-Select-".equals(code.trim())) {
            final String finalCode = code.trim();
            final String finalName = (name != null && !name.trim().isEmpty()) ? name.trim() : finalCode;
            com.nutech.email.model.Customer cust = customerRepository.findByEmailIgnoreCase(finalCode)
                .map(existingCust -> {
                    if (!existingCust.getName().equals(finalName)) {
                        existingCust.setName(finalName);
                        return customerRepository.save(existingCust);
                    }
                    return existingCust;
                })
                .orElseGet(() -> {
                    com.nutech.email.model.Customer newCust = new com.nutech.email.model.Customer();
                    newCust.setEmail(finalCode);
                    newCust.setName(finalName);
                    return customerRepository.save(newCust);
                });
            emailProcessorService.syncCustomerDetailsFromMainBackend(cust);
            pr.setCustomer(cust);
        } else if (body.containsKey("customerCode") || body.containsKey("customerName")) {
            pr.setCustomer(null);
        }
    }

    @GetMapping("/{id}/logs")
    public ResponseEntity<List<Map<String, Object>>> getLogs(@PathVariable Long id) {
        List<Map<String, Object>> logs = logRepository.findByProcessingRequestIdOrderByCreatedAtAsc(id)
                .stream().map(log -> Map.<String, Object>of(
                        "id", log.getId(),
                        "step", log.getStep(),
                        "status", log.getStatus().name(),
                        "details", log.getDetails() != null ? log.getDetails() : "",
                        "createdAt", log.getCreatedAt().toString()
                )).collect(Collectors.toList());
        return ResponseEntity.ok(logs);
    }

    @PostMapping("/sync")
    public ResponseEntity<Map<String, Object>> syncEmails(
            @RequestHeader(value = "X-Company-ID", required = false) Long companyId) {
        int synced = emailProcessorService.syncAllRecentEmails(companyId);
        return ResponseEntity.ok(Map.of("synced", synced, "message", synced + " new emails synced to work items"));
    }

    private int calculateNoOfItems(String extractedPartsJson) {
        if (extractedPartsJson == null || extractedPartsJson.trim().isEmpty()) {
            return 0;
        }
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode rootNode = mapper.readTree(extractedPartsJson);
            if (rootNode.isArray()) {
                int sum = 0;
                for (com.fasterxml.jackson.databind.JsonNode node : rootNode) {
                    if (node.has("quantity")) {
                        sum += node.get("quantity").asInt();
                    } else {
                        sum += 1;
                    }
                }
                return sum;
            }
        } catch (Exception e) {
            log.error("Failed to parse extractedPartsJson for noOfItems: {}", e.getMessage());
        }
        return 0;
    }

    private Map<String, Object> toMap(ProcessingRequest pr) {
        String quotationNo = quotationRepository.findByProcessingRequestId(pr.getId())
                .map(q -> q.getQuotationNumber()).orElse("");
        String invoiceNo = invoiceRepository.findByProcessingRequestId(pr.getId())
                .map(i -> i.getInvoiceNumber()).orElse("");

        Map<String, Object> map = new HashMap<>();
        map.put("id", pr.getId());
        map.put("emailSubject", pr.getEmailSubject() != null ? pr.getEmailSubject() : "");
        map.put("emailFrom", pr.getEmailFrom() != null ? pr.getEmailFrom() : "");
        map.put("emailTo", pr.getEmailTo() != null ? pr.getEmailTo() : "");
        map.put("emailCc", pr.getEmailCc() != null ? pr.getEmailCc() : "");
        map.put("intent", pr.getIntent() != null ? pr.getIntent().name() : "UNKNOWN");
        map.put("status", pr.getStatus().name());
        map.put("emailReceivedAt", pr.getEmailReceivedAt() != null ? pr.getEmailReceivedAt().toString() : "");
        map.put("createdAt", pr.getCreatedAt() != null ? pr.getCreatedAt().toString() : "");
        map.put("updatedAt", pr.getUpdatedAt() != null ? pr.getUpdatedAt().toString() : "");
        map.put("customerName", pr.getCustomer() != null ? pr.getCustomer().getName() : "");
        map.put("customerCode", pr.getCustomer() != null ? pr.getCustomer().getEmail() : "");
        map.put("quotationNo", quotationNo);
        map.put("invoiceNo", invoiceNo);
        map.put("enqEntry", pr.getEnqEntryNo() != null ? pr.getEnqEntryNo() : "");
        map.put("quoteEntry", pr.getQuoteEntryNo() != null ? pr.getQuoteEntryNo() : "");
        map.put("saleOrderEntr", pr.getSaleOrderEntryNo() != null ? pr.getSaleOrderEntryNo() : "");
        map.put("mode", pr.getMode() != null && !pr.getMode().trim().isEmpty() ? pr.getMode().toUpperCase() : "OCR");
        map.put("attachmentCount", pr.getAttachmentCount() != null ? pr.getAttachmentCount() : 0);
        map.put("companyId", pr.getCompanyId() != null ? pr.getCompanyId() : 0L);
        map.put("divisionId", pr.getDivisionId() != null ? pr.getDivisionId() : 0L);
        map.put("createdBy", pr.getCreatedBy() != null ? pr.getCreatedBy() : "System");
        map.put("updatedBy", pr.getUpdatedBy() != null ? pr.getUpdatedBy() : "-");
        map.put("parentEnquiryId", pr.getParentEnquiryId() != null ? pr.getParentEnquiryId() : 0L);
        map.put("conversationThreadId", pr.getConversationThreadId() != null ? pr.getConversationThreadId() : "");
        map.put("direction", pr.getDirection() != null ? pr.getDirection() : "INCOMING");
        map.put("emailType", pr.getEmailType() != null ? pr.getEmailType() : "");
        map.put("emailMessageId", pr.getEmailMessageId() != null ? pr.getEmailMessageId() : "");
        map.put("noOfItems", calculateNoOfItems(pr.getExtractedPartsJson()));
        return map;
    }

    private Map<String, Object> toDetailMap(ProcessingRequest pr) {
        String quotationNo = quotationRepository.findByProcessingRequestId(pr.getId())
                .map(q -> q.getQuotationNumber()).orElse("");
        String invoiceNo = invoiceRepository.findByProcessingRequestId(pr.getId())
                .map(i -> i.getInvoiceNumber()).orElse("");

        // Build thread messages list
        List<Map<String, Object>> threadList = new ArrayList<>();

        // 1. Initial Customer Message
        Map<String, Object> initialMsg = new HashMap<>();
        initialMsg.put("id", pr.getId());
        initialMsg.put("emailSubject", pr.getEmailSubject() != null ? pr.getEmailSubject() : "");
        initialMsg.put("emailFrom", pr.getEmailFrom() != null ? pr.getEmailFrom() : "");
        initialMsg.put("emailTo", pr.getEmailTo() != null ? pr.getEmailTo() : "");
        initialMsg.put("emailCc", pr.getEmailCc() != null ? pr.getEmailCc() : "");
        initialMsg.put("emailBodyPreview", pr.getEmailBodyPreview() != null ? pr.getEmailBodyPreview() : "");
        initialMsg.put("emailReceivedAt", pr.getEmailReceivedAt() != null ? pr.getEmailReceivedAt().toString() : (pr.getCreatedAt() != null ? pr.getCreatedAt().toString() : ""));
        initialMsg.put("direction", "INCOMING");
        initialMsg.put("emailType", "Initial Customer Enquiry");
        initialMsg.put("status", "RECEIVED");
        initialMsg.put("attachmentCount", pr.getAttachmentCount() != null ? pr.getAttachmentCount() : 0);
        threadList.add(initialMsg);

        // 2. Add audit / communication thread steps from logs
        List<EmailProcessingLog> logs = logRepository.findByProcessingRequestIdOrderByCreatedAtAsc(pr.getId());
        boolean hasSentAdded = false;
        boolean hasReplyAdded = false;
        for (EmailProcessingLog l : logs) {
            if ("LEDGER_REQUEST_EMAIL_SENT".equalsIgnoreCase(l.getStep()) && !hasSentAdded) {
                hasSentAdded = true;
                Map<String, Object> sentMsg = new HashMap<>();
                sentMsg.put("id", pr.getId() + 100000L);
                sentMsg.put("emailSubject", "RE: " + (pr.getEmailSubject() != null ? pr.getEmailSubject() : "Customer Ledger"));
                sentMsg.put("emailFrom", pr.getSharedMailbox() != null ? pr.getSharedMailbox() : getDynamicSharedMailbox(pr.getCompanyId()));
                sentMsg.put("emailTo", pr.getEmailFrom() != null ? pr.getEmailFrom() : "");
                sentMsg.put("emailCc", pr.getEmailCc() != null ? pr.getEmailCc() : "");
                sentMsg.put("emailBodyPreview", "Pre-populated Customer Ledger Template sent to " + pr.getEmailFrom());
                sentMsg.put("emailReceivedAt", l.getCreatedAt() != null ? l.getCreatedAt().toString() : "");
                sentMsg.put("direction", "OUTGOING");
                sentMsg.put("emailType", "Ledger Request Mail");
                sentMsg.put("status", l.getStatus() != null ? l.getStatus().name() : "SENT");
                sentMsg.put("attachmentCount", 1);
                threadList.add(sentMsg);
            } else if ("LEDGER_REPLY_PROCESSING".equalsIgnoreCase(l.getStep()) && l.getStatus() == EmailProcessingLog.LogStatus.SUCCESS && !hasReplyAdded) {
                hasReplyAdded = true;
                Map<String, Object> replyMsg = new HashMap<>();
                replyMsg.put("id", pr.getId() + 200000L);
                replyMsg.put("emailSubject", "Re: " + (pr.getEmailSubject() != null ? pr.getEmailSubject() : "Customer Ledger"));
                replyMsg.put("emailFrom", pr.getEmailFrom() != null ? pr.getEmailFrom() : "");
                replyMsg.put("emailTo", pr.getSharedMailbox() != null ? pr.getSharedMailbox() : getDynamicSharedMailbox(pr.getCompanyId()));
                replyMsg.put("emailCc", pr.getEmailCc() != null ? pr.getEmailCc() : "");
                replyMsg.put("emailBodyPreview", "Customer completed template received with filled details.");
                replyMsg.put("emailReceivedAt", l.getCreatedAt() != null ? l.getCreatedAt().toString() : "");
                replyMsg.put("direction", "INCOMING");
                replyMsg.put("emailType", "Customer Reply");
                replyMsg.put("status", "COMPLETED");
                replyMsg.put("attachmentCount", 1);
                threadList.add(replyMsg);
            }
        }

        // 3. Include historical child requests if present
        Long rootId = pr.getParentEnquiryId() != null ? pr.getParentEnquiryId() : pr.getId();
        List<ProcessingRequest> threadChildren = prRepository.findByParentEnquiryId(rootId);
        for (ProcessingRequest child : threadChildren) {
            if (!child.getId().equals(pr.getId())) {
                Map<String, Object> cm = new HashMap<>();
                cm.put("id", child.getId());
                cm.put("emailSubject", child.getEmailSubject() != null ? child.getEmailSubject() : "");
                cm.put("emailFrom", child.getEmailFrom() != null ? child.getEmailFrom() : "");
                cm.put("emailTo", child.getEmailTo() != null ? child.getEmailTo() : "");
                cm.put("emailCc", child.getEmailCc() != null ? child.getEmailCc() : "");
                cm.put("emailBodyPreview", child.getEmailBodyPreview() != null ? child.getEmailBodyPreview() : "");
                cm.put("emailReceivedAt", child.getEmailReceivedAt() != null ? child.getEmailReceivedAt().toString() : "");
                cm.put("direction", child.getDirection() != null ? child.getDirection() : "INCOMING");
                cm.put("emailType", child.getEmailType() != null ? child.getEmailType() : "");
                cm.put("status", child.getStatus().name());
                cm.put("attachmentCount", child.getAttachmentCount() != null ? child.getAttachmentCount() : 0);
                threadList.add(cm);
            }
        }

        // Use HashMap to allow putting nullable values and our custom list safely
        Map<String, Object> details = new HashMap<>();
        details.put("id", pr.getId());
        details.put("emailMessageId", pr.getEmailMessageId() != null ? pr.getEmailMessageId() : "");
        details.put("emailSubject", pr.getEmailSubject() != null ? pr.getEmailSubject() : "");
        details.put("emailFrom", pr.getEmailFrom() != null ? pr.getEmailFrom() : "");
        details.put("emailTo", pr.getEmailTo() != null ? pr.getEmailTo() : "");
        details.put("emailCc", pr.getEmailCc() != null ? pr.getEmailCc() : "");
        details.put("emailBodyPreview", pr.getEmailBodyPreview() != null ? pr.getEmailBodyPreview() : "");
        details.put("combinedText", pr.getCombinedText() != null ? pr.getCombinedText() : "");
        details.put("extractedPartsJson", pr.getExtractedPartsJson() != null ? pr.getExtractedPartsJson() : "");
        details.put("intent", pr.getIntent() != null ? pr.getIntent().name() : "UNKNOWN");
        details.put("status", pr.getStatus().name());
        details.put("errorMessage", pr.getErrorMessage() != null ? pr.getErrorMessage() : "");
        details.put("emailReceivedAt", pr.getEmailReceivedAt() != null ? pr.getEmailReceivedAt().toString() : "");
        details.put("createdAt", pr.getCreatedAt() != null ? pr.getCreatedAt().toString() : "");
        details.put("updatedAt", pr.getUpdatedAt() != null ? pr.getUpdatedAt().toString() : "");
        details.put("customerName", pr.getCustomer() != null ? pr.getCustomer().getName() : "");
        details.put("customerCode", pr.getCustomer() != null ? pr.getCustomer().getEmail() : "");
        details.put("quotationNo", quotationNo);
        details.put("invoiceNo", invoiceNo);
        details.put("enqEntry", pr.getEnqEntryNo() != null ? pr.getEnqEntryNo() : "");
        details.put("quoteEntry", pr.getQuoteEntryNo() != null ? pr.getQuoteEntryNo() : "");
        details.put("saleOrderEntr", pr.getSaleOrderEntryNo() != null ? pr.getSaleOrderEntryNo() : "");
        details.put("mode", pr.getMode() != null && !pr.getMode().trim().isEmpty() ? pr.getMode().toUpperCase() : "OCR");
        details.put("smEnquiryId", pr.getSmEnquiryId());
        details.put("attachmentCount", pr.getAttachmentCount() != null ? pr.getAttachmentCount() : 0);
        details.put("companyId", pr.getCompanyId() != null ? pr.getCompanyId() : 0L);
        details.put("divisionId", pr.getDivisionId() != null ? pr.getDivisionId() : 0L);
        details.put("createdBy", pr.getCreatedBy() != null ? pr.getCreatedBy() : "System");
        details.put("updatedBy", pr.getUpdatedBy() != null ? pr.getUpdatedBy() : "-");
        details.put("parentEnquiryId", pr.getParentEnquiryId() != null ? pr.getParentEnquiryId() : 0L);
        details.put("conversationThreadId", pr.getConversationThreadId() != null ? pr.getConversationThreadId() : "");
        details.put("direction", pr.getDirection() != null ? pr.getDirection() : "INCOMING");
        details.put("emailType", pr.getEmailType() != null ? pr.getEmailType() : "");
        details.put("noOfItems", calculateNoOfItems(pr.getExtractedPartsJson()));
        details.put("thread", threadList);
        
        return details;
    }
}
