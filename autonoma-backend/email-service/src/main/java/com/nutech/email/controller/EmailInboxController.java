package com.nutech.email.controller;

import com.microsoft.graph.models.Message;
import com.microsoft.graph.models.Recipient;
import com.nutech.email.integration.GraphMailService;
import com.nutech.email.service.EmailProcessorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;
import java.time.LocalDateTime;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import com.microsoft.graph.models.Attachment;
import com.microsoft.graph.models.FileAttachment;

@RestController
@RequestMapping("/api/inbox")
@RequiredArgsConstructor
@lombok.extern.slf4j.Slf4j
public class EmailInboxController {

    private final GraphMailService graphMailService;
    private final EmailProcessorService emailProcessorService;
    private final com.nutech.email.repository.ProcessingRequestRepository processingRequestRepository;
    private final com.nutech.email.repository.OcrAttachmentPathRepository ocrAttachmentPathRepository;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getInbox(@RequestParam(defaultValue = "20") int limit) {
        List<Message> messages = graphMailService.fetchRecentEmails(limit);
        
        List<Map<String, Object>> result = messages.stream().map(msg -> {
            String from = (msg.getFrom() != null && msg.getFrom().getEmailAddress() != null)
                    ? msg.getFrom().getEmailAddress().getAddress() : "Unknown";
            String fromName = (msg.getFrom() != null && msg.getFrom().getEmailAddress() != null)
                    ? msg.getFrom().getEmailAddress().getName() : "Unknown";
                    
            // Extract TO recipients
            String to = "";
            String toName = "";
            if (msg.getToRecipients() != null && !msg.getToRecipients().isEmpty()) {
                to = msg.getToRecipients().stream()
                        .filter(r -> r.getEmailAddress() != null && r.getEmailAddress().getAddress() != null)
                        .map(r -> r.getEmailAddress().getAddress())
                        .collect(Collectors.joining(", "));
                toName = msg.getToRecipients().stream()
                        .filter(r -> r.getEmailAddress() != null && r.getEmailAddress().getName() != null)
                        .map(r -> r.getEmailAddress().getName())
                        .collect(Collectors.joining(", "));
            }
                    
            String bodyContent = (msg.getBody() != null && msg.getBody().getContent() != null)
                    ? msg.getBody().getContent() : "";

            // Keyword based classification
            String subjectAndBody = (msg.getSubject() + " " + msg.getBodyPreview()).toLowerCase();
            String category = "Others";
            if (subjectAndBody.contains("ledger") || subjectAndBody.contains("statement") || subjectAndBody.contains("balance") || subjectAndBody.contains("account")) {
                category = "Ledger";
            } else if (subjectAndBody.contains("po") || subjectAndBody.contains("order") || subjectAndBody.contains("purchase")) {
                category = "Order";
            } else if (subjectAndBody.contains("quote") || subjectAndBody.contains("quotation") || subjectAndBody.contains("price") || subjectAndBody.contains("enquiry") || subjectAndBody.contains("inquiry")) {
                category = "Enquiry";
            }
            
            // Use HashMap to allow more than 10 entries (Map.of limit)
            Map<String, Object> emailMap = new HashMap<>();
            emailMap.put("id", msg.getId());
            emailMap.put("subject", msg.getSubject() != null ? msg.getSubject() : "(No Subject)");
            emailMap.put("from", from);
            emailMap.put("fromName", fromName);
            emailMap.put("to", to);
            emailMap.put("toName", toName);
            emailMap.put("receivedAt", msg.getReceivedDateTime() != null ? msg.getReceivedDateTime().toString() : "");
            emailMap.put("preview", msg.getBodyPreview() != null ? msg.getBodyPreview() : "");
            emailMap.put("body", bodyContent);
            emailMap.put("category", category);
            emailMap.put("isRead", msg.getIsRead() != null ? msg.getIsRead() : true);
            emailMap.put("hasAttachments", msg.getHasAttachments() != null ? msg.getHasAttachments() : false);
            return emailMap;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/mark-read")
    public ResponseEntity<Void> markAsRead(@PathVariable String id) {
        graphMailService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/sync-to-workitems")
    public ResponseEntity<Map<String, Object>> syncToWorkItems() {
        int synced = emailProcessorService.syncAllRecentEmails();
        return ResponseEntity.ok(Map.of("synced", synced, "message", synced + " emails synced to work items"));
    }

    @GetMapping("/{id}/attachments")
    public ResponseEntity<List<Map<String, Object>>> getAttachments(@PathVariable String id) {
        Optional<com.nutech.email.model.ProcessingRequest> localPr = processingRequestRepository.findByEmailMessageId(id);
        List<Map<String, Object>> result = new ArrayList<>();

        if (localPr.isPresent() && "OUTGOING".equalsIgnoreCase(localPr.get().getDirection())) {
            String combinedText = localPr.get().getCombinedText();
            String localPath = extractLocalAttachmentPath(combinedText);
            if (localPath != null) {
                java.io.File file = new java.io.File(localPath);
                if (file.exists()) {
                    String cleanName = file.getName();
                    if (cleanName.contains("_")) {
                        cleanName = cleanName.substring(cleanName.indexOf('_') + 1);
                    }
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", "local_attachment");
                    map.put("name", cleanName);
                    map.put("size", file.length());
                    map.put("contentType", "application/vnd.ms-excel");
                    map.put("isInline", false);
                    result.add(map);
                }
            }
        } else {
            try {
                List<Attachment> attachments = graphMailService.getAttachments(id);
                if (attachments != null) {
                    for (Attachment att : attachments) {
                        Map<String, Object> map = new HashMap<>();
                        map.put("id", att.getId());
                        map.put("name", att.getName());
                        map.put("size", att.getSize());
                        map.put("contentType", att.getContentType());
                        map.put("isInline", att.getIsInline());
                        result.add(map);
                    }
                }
            } catch (Exception e) {
                log.error("Failed to fetch attachments from Microsoft Graph for ID: {}. Error: {}", id, e.getMessage());
            }
        }

        // Always append the virtual EML attachment representing the original email itself
        String cleanSubject = "Email_Content";
        if (localPr.isPresent() && localPr.get().getEmailSubject() != null && !localPr.get().getEmailSubject().trim().isEmpty()) {
            cleanSubject = localPr.get().getEmailSubject().replaceAll("[\\\\/:*?\"<>|]", "_");
        }
        Map<String, Object> emlMap = new HashMap<>();
        emlMap.put("id", "original_email_eml");
        emlMap.put("name", cleanSubject + ".eml");
        emlMap.put("size", 1024L);
        emlMap.put("contentType", "message/rfc822");
        emlMap.put("isInline", false);
        result.add(emlMap);

        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}/attachments/{attachmentId}")
    public ResponseEntity<byte[]> downloadAttachment(@PathVariable String id, @PathVariable String attachmentId) {
        if ("original_email_eml".equals(attachmentId)) {
            Optional<com.nutech.email.model.ProcessingRequest> localPr = processingRequestRepository.findByEmailMessageId(id);
            String from = "unknown@domain.com";
            String to = "unknown@domain.com";
            String cc = "";
            String subject = "No Subject";
            String date = LocalDateTime.now().toString();
            String body = "";
            
            if (localPr.isPresent()) {
                com.nutech.email.model.ProcessingRequest pr = localPr.get();
                if (pr.getEmailFrom() != null) from = pr.getEmailFrom();
                if (pr.getEmailTo() != null) to = pr.getEmailTo();
                if (pr.getEmailCc() != null) cc = pr.getEmailCc();
                if (pr.getEmailSubject() != null) subject = pr.getEmailSubject();
                if (pr.getEmailReceivedAt() != null) date = pr.getEmailReceivedAt().toString();
                if (pr.getEmailBodyPreview() != null) body = pr.getEmailBodyPreview();
            } else {
                // Try fetching the actual unread/recent message from Graph if not in local DB
                try {
                    List<Message> recent = graphMailService.fetchRecentEmails(50);
                    Optional<Message> found = recent.stream().filter(m -> id.equals(m.getId())).findFirst();
                    if (found.isPresent()) {
                        Message m = found.get();
                        if (m.getFrom() != null && m.getFrom().getEmailAddress() != null) from = m.getFrom().getEmailAddress().getAddress();
                        if (m.getToRecipients() != null && !m.getToRecipients().isEmpty()) {
                            to = m.getToRecipients().stream()
                                    .filter(r -> r.getEmailAddress() != null && r.getEmailAddress().getAddress() != null)
                                    .map(r -> r.getEmailAddress().getAddress())
                                    .collect(Collectors.joining(", "));
                        }
                        if (m.getCcRecipients() != null && !m.getCcRecipients().isEmpty()) {
                            cc = m.getCcRecipients().stream()
                                    .filter(r -> r.getEmailAddress() != null && r.getEmailAddress().getAddress() != null)
                                    .map(r -> r.getEmailAddress().getAddress())
                                    .collect(Collectors.joining(", "));
                        }
                        if (m.getSubject() != null) subject = m.getSubject();
                        if (m.getReceivedDateTime() != null) date = m.getReceivedDateTime().toString();
                        body = (m.getBody() != null && m.getBody().getContent() != null) ? m.getBody().getContent() : m.getBodyPreview();
                    }
                } catch (Exception e) {
                    log.error("Failed to fetch email fallback from Graph for EML generation: {}", e.getMessage());
                }
            }
            
            StringBuilder eml = new StringBuilder();
            eml.append("From: ").append(from).append("\r\n");
            eml.append("To: ").append(to).append("\r\n");
            if (cc != null && !cc.trim().isEmpty()) {
                eml.append("Cc: ").append(cc).append("\r\n");
            }
            eml.append("Subject: ").append(subject).append("\r\n");
            eml.append("Date: ").append(date).append("\r\n");
            eml.append("MIME-Version: 1.0\r\n");
            eml.append("Content-Type: text/html; charset=UTF-8\r\n");
            eml.append("\r\n");
            eml.append(body);
            
            byte[] content = eml.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
            String cleanSubject = subject.replaceAll("[\\\\/:*?\"<>|]", "_");
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + cleanSubject + ".eml\"")
                    .contentType(MediaType.parseMediaType("message/rfc822"))
                    .body(content);
        }

        if ("local_attachment".equals(attachmentId)) {
            Optional<com.nutech.email.model.ProcessingRequest> localPr = processingRequestRepository.findByEmailMessageId(id);
            if (localPr.isPresent()) {
                String combinedText = localPr.get().getCombinedText();
                String localPath = extractLocalAttachmentPath(combinedText);
                if (localPath != null) {
                    java.io.File file = new java.io.File(localPath);
                    if (file.exists()) {
                        try {
                            byte[] content = java.nio.file.Files.readAllBytes(file.toPath());
                            String cleanName = file.getName();
                            if (cleanName.contains("_")) {
                                cleanName = cleanName.substring(cleanName.indexOf('_') + 1);
                            }
                            return ResponseEntity.ok()
                                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + cleanName + "\"")
                                    .contentType(MediaType.parseMediaType("application/vnd.ms-excel"))
                                    .body(content);
                        } catch (Exception e) {
                            log.error("Failed to read local attachment file: {}", localPath, e);
                        }
                    }
                }
            }
        }

        try {
            List<Attachment> attachments = graphMailService.getAttachments(id);
            Optional<Attachment> attachment = attachments.stream()
                    .filter(a -> attachmentId.equals(a.getId()))
                    .findFirst();

            if (attachment.isPresent() && attachment.get() instanceof FileAttachment) {
                FileAttachment fileAtt = (FileAttachment) attachment.get();
                byte[] content = fileAtt.getContentBytes();
                
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileAtt.getName() + "\"")
                        .contentType(MediaType.parseMediaType(fileAtt.getContentType()))
                        .body(content);
            }
        } catch (Exception e) {
            log.error("Failed to download attachment for message ID: {} and attachment ID: {}", id, attachmentId, e);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/processing-requests/{processingRequestId}/attachments")
    public ResponseEntity<List<Map<String, Object>>> getRequestAttachments(@PathVariable Long processingRequestId) {
        List<com.nutech.email.model.OcrAttachmentPath> attachments = ocrAttachmentPathRepository.findByProcessingRequestId(processingRequestId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (com.nutech.email.model.OcrAttachmentPath att : attachments) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", att.getOriginalAttachmentId());
            map.put("name", att.getFileName());
            map.put("size", att.getFileSize());
            map.put("contentType", att.getContentType());
            map.put("isInline", att.getIsInline());
            map.put("attachmentType", att.getAttachmentType());
            result.add(map);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/processing-requests/{processingRequestId}/attachments/{attachmentId}")
    public ResponseEntity<byte[]> getRequestAttachmentFile(@PathVariable Long processingRequestId, @PathVariable String attachmentId) {
        Optional<com.nutech.email.model.OcrAttachmentPath> attOpt = ocrAttachmentPathRepository.findByProcessingRequestIdAndOriginalAttachmentId(processingRequestId, attachmentId);
        if (attOpt.isPresent()) {
            com.nutech.email.model.OcrAttachmentPath att = attOpt.get();
            java.io.File file = new java.io.File(att.getPath());
            if (file.exists()) {
                try {
                    byte[] content = java.nio.file.Files.readAllBytes(file.toPath());
                    return ResponseEntity.ok()
                            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + att.getFileName() + "\"")
                            .contentType(MediaType.parseMediaType(att.getContentType()))
                            .body(content);
                } catch (Exception e) {
                    log.error("Failed to read local attachment file: {}", att.getPath(), e);
                }
            }
        }
        return ResponseEntity.notFound().build();
    }

    private String extractLocalAttachmentPath(String combinedText) {
        if (combinedText == null) return null;
        int idx = combinedText.lastIndexOf("--- Attachments ---");
        if (idx != -1) {
            String pathPart = combinedText.substring(idx + "--- Attachments ---".length()).trim();
            if (!pathPart.isEmpty()) {
                String[] lines = pathPart.split("\\r?\\n");
                if (lines.length > 0) {
                    return lines[0].trim();
                }
            }
        }
        return null;
    }
}
