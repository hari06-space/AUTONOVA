package com.nutech.email.integration;

import com.microsoft.graph.models.Message;
import com.microsoft.graph.models.Attachment;
import com.microsoft.graph.models.FileAttachment;
import com.microsoft.graph.models.BodyType;
import com.microsoft.graph.models.ItemBody;
import com.microsoft.graph.models.Recipient;
import com.microsoft.graph.models.EmailAddress;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.HttpMethod;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import com.nutech.email.repository.OcrConfigRepository;
import com.nutech.email.model.OcrConfig;

@Service
@Slf4j
@RequiredArgsConstructor
public class PythonMailServiceBridge {

    @Value("${python.email.service.url:http://localhost:8000}")
    private String pythonServiceUrl;

    @Value("${python.email.service.enabled:false}")
    private boolean pythonServiceEnabled;

    private final OcrConfigRepository ocrConfigRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    public boolean isEnabled() {
        return pythonServiceEnabled;
    }

    private HttpEntity<Void> createHttpEntityWithHeaders() {
        try {
            List<OcrConfig> configs = ocrConfigRepository.findAll();
            if (!configs.isEmpty()) {
                return createHttpEntityWithHeaders(configs.get(0));
            }
        } catch (Exception e) {
            log.error("Failed to retrieve default OCR config for headers: {}", e.getMessage());
        }
        return new HttpEntity<>(new HttpHeaders());
    }

    private String decryptSecretIfNeeded(String secret) {
        if (secret == null || !secret.startsWith("ENC:")) {
            return secret;
        }
        try {
            String rawKey = "placeholder_key_must_be_32_chars_long";
            byte[] keyBytes = java.security.MessageDigest.getInstance("SHA-256")
                    .digest(rawKey.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            javax.crypto.spec.SecretKeySpec secretKey = new javax.crypto.spec.SecretKeySpec(keyBytes, "AES");
            
            String b64Ciphertext = secret.substring(4);
            byte[] combined = java.util.Base64.getDecoder().decode(b64Ciphertext);
            
            byte[] iv = new byte[12];
            System.arraycopy(combined, 0, iv, 0, 12);
            
            byte[] ciphertext = new byte[combined.length - 12];
            System.arraycopy(combined, 12, ciphertext, 0, ciphertext.length);
            
            javax.crypto.Cipher cipher = javax.crypto.Cipher.getInstance("AES/GCM/NoPadding");
            javax.crypto.spec.GCMParameterSpec spec = new javax.crypto.spec.GCMParameterSpec(128, iv);
            cipher.init(javax.crypto.Cipher.DECRYPT_MODE, secretKey, spec);
            
            byte[] decryptedBytes = cipher.doFinal(ciphertext);
            return new String(decryptedBytes, java.nio.charset.StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("Failed to decrypt client secret: {}", e.getMessage(), e);
            return secret;
        }
    }

    private HttpEntity<Void> createHttpEntityWithHeaders(OcrConfig cfg) {
        HttpHeaders headers = new HttpHeaders();
        if (cfg != null) {
            if (cfg.getOcrTenantId() != null) headers.add("X-Outlook-Tenant-ID", cfg.getOcrTenantId());
            if (cfg.getOcrClientId() != null) headers.add("X-Outlook-Client-ID", cfg.getOcrClientId());
            if (cfg.getOcrClientSecret() != null) headers.add("X-Outlook-Client-Secret", decryptSecretIfNeeded(cfg.getOcrClientSecret()));
            if (cfg.getOcrSharedMailbox() != null) headers.add("X-Outlook-Shared-Mailbox", cfg.getOcrSharedMailbox());
            if (cfg.getOcrProcessedFolder() != null) headers.add("X-Outlook-Processed-Folder", cfg.getOcrProcessedFolder());
            if (cfg.getAccessToken() != null) headers.add("X-Outlook-Access-Token", cfg.getAccessToken());
            if (cfg.getRefreshToken() != null) headers.add("X-Outlook-Refresh-Token", cfg.getRefreshToken());
            if (cfg.getActiveEmailProvider() != null) headers.add("X-Email-Provider", cfg.getActiveEmailProvider());
        }
        return new HttpEntity<>(headers);
    }

    private void updateTokensIfPresent(ResponseEntity<?> response, OcrConfig cfg) {
        if (response == null || cfg == null) return;
        HttpHeaders headers = response.getHeaders();
        String newAccess = headers.getFirst("X-Outlook-New-Access-Token");
        String newRefresh = headers.getFirst("X-Outlook-New-Refresh-Token");
        if (newAccess != null || newRefresh != null) {
            boolean updated = false;
            if (newAccess != null && !newAccess.equals(cfg.getAccessToken())) {
                cfg.setAccessToken(newAccess);
                updated = true;
            }
            if (newRefresh != null && !newRefresh.equals(cfg.getRefreshToken())) {
                cfg.setRefreshToken(newRefresh);
                updated = true;
            }
            if (updated) {
                log.info("Updating rotated OAuth tokens in DB for shared mailbox: {}", cfg.getOcrSharedMailbox());
                ocrConfigRepository.save(cfg);
            }
        }
    }

    private void updateTokensIfPresent(ResponseEntity<?> response) {
        try {
            List<OcrConfig> configs = ocrConfigRepository.findAll();
            if (!configs.isEmpty()) {
                updateTokensIfPresent(response, configs.get(0));
            }
        } catch (Exception e) {
            log.error("Failed to update tokens for default config: {}", e.getMessage());
        }
    }

    public List<Message> fetchUnreadEmails(int maxCount) {
        try {
            String url = pythonServiceUrl + "/api/v1/emails/unread?max_count=" + maxCount;
            HttpEntity<Void> entity = createHttpEntityWithHeaders();
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            updateTokensIfPresent(response);
            return mapResponseToMessages(response.getBody());
        } catch (Exception e) {
            log.error("Failed to fetch unread emails via Python service: {}", e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    public List<Message> fetchRecentEmails(int maxCount) {
        try {
            String url = pythonServiceUrl + "/api/v1/emails/recent?max_count=" + maxCount;
            HttpEntity<Void> entity = createHttpEntityWithHeaders();
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            updateTokensIfPresent(response);
            return mapResponseToMessages(response.getBody());
        } catch (Exception e) {
            log.error("Failed to fetch recent emails via Python service: {}", e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    public List<Attachment> getAttachments(String messageId) {
        try {
            String url = pythonServiceUrl + "/api/v1/emails/" + messageId + "/attachments";
            HttpEntity<Void> entity = createHttpEntityWithHeaders();
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            updateTokensIfPresent(response);
            return mapResponseToAttachments(response.getBody());
        } catch (Exception e) {
            log.error("Failed to fetch attachments for message {} via Python service: {}", messageId, e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    public void markAsRead(String messageId) {
        try {
            String url = pythonServiceUrl + "/api/v1/emails/" + messageId + "/read";
            HttpEntity<Void> entity = createHttpEntityWithHeaders();
            ResponseEntity<Void> response = restTemplate.exchange(url, HttpMethod.POST, entity, Void.class);
            updateTokensIfPresent(response);
            log.debug("Marked message {} as read via Python service", messageId);
        } catch (Exception e) {
            log.error("Failed to mark message {} as read via Python service: {}", messageId, e.getMessage(), e);
        }
    }

    public String moveToProcessedFolder(String messageId) {
        try {
            String url = pythonServiceUrl + "/api/v1/emails/" + messageId + "/move";
            HttpEntity<Void> entity = createHttpEntityWithHeaders();
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);
            updateTokensIfPresent(response);
            Map body = response.getBody();
            return body != null && body.containsKey("moved_to") ? messageId : messageId;
        } catch (Exception e) {
            log.error("Failed to move message {} via Python service: {}", messageId, e.getMessage(), e);
            return messageId;
        }
    }

    public void sendReplyWithAttachment(String originalMessageId, String toEmail, List<String> ccEmails, String subject, String htmlBody,
                                         byte[] fileBytes, String fileName, boolean replyAll) {
        try {
            String url = pythonServiceUrl + "/api/v1/emails/reply";
            Map<String, Object> body = new HashMap<>();
            body.put("original_message_id", originalMessageId);
            body.put("to_email", toEmail);
            body.put("subject", subject);
            body.put("html_body", htmlBody);
            body.put("file_name", fileName);
            body.put("reply_all", replyAll);

            if (ccEmails != null && !ccEmails.isEmpty()) {
                body.put("cc_emails", ccEmails);
            }

            if (fileBytes != null && fileBytes.length > 0) {
                body.put("file_bytes_b64", Base64.getEncoder().encodeToString(fileBytes));
            }

            HttpEntity<Void> headerEntity = createHttpEntityWithHeaders();
            HttpHeaders headers = new HttpHeaders();
            headers.putAll(headerEntity.getHeaders());
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, requestEntity, Map.class);
            updateTokensIfPresent(response);
            log.info("Sent reply for message {} via Python service to {} with CC {}", originalMessageId, toEmail, ccEmails);
        } catch (Exception e) {
            log.error("Failed to send reply for message {} via Python service: {}", originalMessageId, e.getMessage(), e);
            throw new RuntimeException("Failed to send reply email via Python service: " + e.getMessage(), e);
        }
    }

    private Recipient parseRecipientString(String rawStr) {
        if (rawStr == null || rawStr.trim().isEmpty()) return null;
        Recipient recipient = new Recipient();
        EmailAddress emailAddress = new EmailAddress();
        
        String address = rawStr.trim();
        String name = rawStr.trim();
        
        if (rawStr.contains("<") && rawStr.contains(">")) {
            int start = rawStr.indexOf('<');
            int end = rawStr.indexOf('>');
            if (start < end) {
                address = rawStr.substring(start + 1, end).trim();
                name = rawStr.substring(0, start).trim();
                if (name.startsWith("\"") && name.endsWith("\"")) {
                    name = name.substring(1, name.length() - 1).trim();
                }
            }
        }
        
        emailAddress.setAddress(address);
        emailAddress.setName(name);
        recipient.setEmailAddress(emailAddress);
        return recipient;
    }

    @SuppressWarnings("unchecked")
    private List<Message> mapResponseToMessages(Map response) {
        if (response == null || !response.containsKey("emails")) return Collections.emptyList();
        List<Map<String, Object>> emailList = (List<Map<String, Object>>) response.get("emails");
        List<Message> result = new ArrayList<>();

        for (Map<String, Object> item : emailList) {
            Message msg = new Message();
            msg.setId((String) item.get("uid"));
            msg.setSubject((String) item.get("subject"));

            ItemBody body = new ItemBody();
            body.setContentType(BodyType.Html);
            body.setContent((String) item.get("body_html"));
            msg.setBody(body);

            msg.setBodyPreview((String) item.get("body_text"));
            msg.setHasAttachments((Boolean) item.get("has_attachments"));
            
            if (item.containsKey("conversation_id")) {
                msg.setConversationId((String) item.get("conversation_id"));
            }
            if (item.containsKey("id")) {
                msg.setInternetMessageId((String) item.get("id"));
            }

            if (item.containsKey("from")) {
                msg.setFrom(parseRecipientString((String) item.get("from")));
            }

            if (item.containsKey("to")) {
                String toStr = (String) item.get("to");
                if (toStr != null && !toStr.trim().isEmpty()) {
                    List<Recipient> toList = new ArrayList<>();
                    String[] parts = toStr.split("[,;]");
                    for (String part : parts) {
                        Recipient r = parseRecipientString(part);
                        if (r != null) {
                            toList.add(r);
                        }
                    }
                    msg.setToRecipients(toList);
                }
            }

            if (item.containsKey("cc")) {
                String ccStr = (String) item.get("cc");
                if (ccStr != null && !ccStr.trim().isEmpty()) {
                    List<Recipient> ccList = new ArrayList<>();
                    String[] parts = ccStr.split("[,;]");
                    for (String part : parts) {
                        Recipient r = parseRecipientString(part);
                        if (r != null) {
                            ccList.add(r);
                        }
                    }
                    msg.setCcRecipients(ccList);
                }
            }

            result.add(msg);
        }
        return result;
    }

    @SuppressWarnings("unchecked")
    private List<Attachment> mapResponseToAttachments(Map response) {
        if (response == null || !response.containsKey("attachments")) return Collections.emptyList();
        List<Map<String, Object>> attachList = (List<Map<String, Object>>) response.get("attachments");
        List<Attachment> result = new ArrayList<>();

        for (Map<String, Object> item : attachList) {
            FileAttachment att = new FileAttachment();
            String itemId = (String) item.get("id");
            if (itemId == null) {
                itemId = (String) item.get("filename");
            }
            att.setId(itemId);
            
            String name = (String) item.get("filename");
            if (name == null) {
                name = (String) item.get("name");
            }
            att.setName(name);
            
            String contentType = (String) item.get("content_type");
            if (contentType == null) {
                contentType = (String) item.get("contentType");
            }
            att.setContentType(contentType);
            
            if (item.containsKey("size") && item.get("size") != null) {
                Object sizeObj = item.get("size");
                if (sizeObj instanceof Number) {
                    att.setSize(((Number) sizeObj).intValue());
                }
            }
            
            if (item.containsKey("isInline") && item.get("isInline") != null) {
                att.setIsInline((Boolean) item.get("isInline"));
            }
            
            String base64Data = (String) item.get("base64_data");
            if (base64Data == null) {
                base64Data = (String) item.get("contentBytes");
            }
            if (base64Data != null) {
                att.setContentBytes(Base64.getDecoder().decode(base64Data));
            }
            result.add(att);
        }
        return result;
    }

    public Message parseEmlFile(byte[] emlBytes, String filename) {
        try {
            String url = pythonServiceUrl + "/api/v1/emails/parse-eml";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            ByteArrayResource resource = new ByteArrayResource(emlBytes) {
                @Override
                public String getFilename() {
                    return filename;
                }
            };
            body.add("file", resource);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            Map response = restTemplate.postForObject(url, requestEntity, Map.class);

            if (response != null) {
                Message msg = new Message();
                msg.setId((String) response.get("uid"));
                msg.setSubject((String) response.get("subject"));

                ItemBody itemBody = new ItemBody();
                itemBody.setContentType(BodyType.Html);
                itemBody.setContent((String) response.get("body_html"));
                msg.setBody(itemBody);

                msg.setBodyPreview((String) response.get("body_text"));
                msg.setHasAttachments((Boolean) response.get("has_attachments"));

                if (response.containsKey("from")) {
                    msg.setFrom(parseRecipientString((String) response.get("from")));
                }

                if (response.containsKey("to")) {
                    String toStr = (String) response.get("to");
                    if (toStr != null && !toStr.trim().isEmpty()) {
                        List<Recipient> toList = new ArrayList<>();
                        String[] parts = toStr.split("[,;]");
                        for (String part : parts) {
                            Recipient r = parseRecipientString(part);
                            if (r != null) {
                                toList.add(r);
                            }
                        }
                        msg.setToRecipients(toList);
                    }
                }

                if (response.containsKey("cc")) {
                    String ccStr = (String) response.get("cc");
                    if (ccStr != null && !ccStr.trim().isEmpty()) {
                        List<Recipient> ccList = new ArrayList<>();
                        String[] parts = ccStr.split("[,;]");
                        for (String part : parts) {
                            Recipient r = parseRecipientString(part);
                            if (r != null) {
                                ccList.add(r);
                            }
                        }
                        msg.setCcRecipients(ccList);
                    }
                }
                
                return msg;
            }
            return null;
        } catch (Exception e) {
            log.error("Failed to parse EML file via Python service: {}", e.getMessage(), e);
            return null;
        }
    }
    public List<Message> fetchUnreadEmails(int maxCount, OcrConfig cfg) {
        try {
            String url = pythonServiceUrl + "/api/v1/emails/unread?max_count=" + maxCount;
            HttpEntity<Void> entity = createHttpEntityWithHeaders(cfg);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            updateTokensIfPresent(response, cfg);
            return mapResponseToMessages(response.getBody());
        } catch (Exception e) {
            log.error("Failed to fetch unread emails via Python service: {}", e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    public List<Message> fetchRecentEmails(int maxCount, OcrConfig cfg) {
        try {
            String url = pythonServiceUrl + "/api/v1/emails/recent?max_count=" + maxCount;
            HttpEntity<Void> entity = createHttpEntityWithHeaders(cfg);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            updateTokensIfPresent(response, cfg);
            return mapResponseToMessages(response.getBody());
        } catch (Exception e) {
            log.error("Failed to fetch recent emails via Python service: {}", e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    public List<Attachment> getAttachments(String messageId, OcrConfig cfg) {
        try {
            String url = pythonServiceUrl + "/api/v1/emails/" + messageId + "/attachments";
            HttpEntity<Void> entity = createHttpEntityWithHeaders(cfg);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            updateTokensIfPresent(response, cfg);
            return mapResponseToAttachments(response.getBody());
        } catch (Exception e) {
            log.error("Failed to fetch attachments for message {} via Python service: {}", messageId, e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    public void markAsRead(String messageId, OcrConfig cfg) {
        try {
            String url = pythonServiceUrl + "/api/v1/emails/" + messageId + "/read";
            HttpEntity<Void> entity = createHttpEntityWithHeaders(cfg);
            ResponseEntity<Void> response = restTemplate.exchange(url, HttpMethod.POST, entity, Void.class);
            updateTokensIfPresent(response, cfg);
        } catch (Exception e) {
            log.error("Failed to mark message {} as read via Python service: {}", messageId, e.getMessage(), e);
        }
    }

    public String moveToProcessedFolder(String messageId, OcrConfig cfg) {
        try {
            String url = pythonServiceUrl + "/api/v1/emails/" + messageId + "/move";
            HttpEntity<Void> entity = createHttpEntityWithHeaders(cfg);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);
            updateTokensIfPresent(response, cfg);
            return messageId;
        } catch (Exception e) {
            log.error("Failed to move message {} to processed folder via Python service: {}", messageId, e.getMessage(), e);
            return messageId;
        }
    }

    public void sendReplyWithAttachment(String originalMessageId, String toEmail, List<String> ccEmails, String subject, String htmlBody,
                                         byte[] fileBytes, String fileName, boolean replyAll, OcrConfig cfg) {
        try {
            String url = pythonServiceUrl + "/api/v1/emails/reply";
            Map<String, Object> body = new HashMap<>();
            body.put("original_message_id", originalMessageId);
            body.put("to_email", toEmail);
            body.put("subject", subject);
            body.put("html_body", htmlBody);
            body.put("file_name", fileName);
            body.put("reply_all", replyAll);

            if (ccEmails != null && !ccEmails.isEmpty()) {
                body.put("cc_emails", ccEmails);
            }

            if (fileBytes != null && fileBytes.length > 0) {
                body.put("file_bytes_b64", Base64.getEncoder().encodeToString(fileBytes));
            }

            HttpEntity<Void> headerEntity = createHttpEntityWithHeaders(cfg);
            HttpHeaders headers = new HttpHeaders();
            headers.putAll(headerEntity.getHeaders());
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, requestEntity, Map.class);
            updateTokensIfPresent(response, cfg);
            log.info("Sent reply for message {} via Python service to {} with CC {} for cfg {}", originalMessageId, toEmail, ccEmails, cfg.getOcrSharedMailbox());
        } catch (Exception e) {
            log.error("Failed to send reply for message {} via Python service: {}", originalMessageId, e.getMessage(), e);
            throw new RuntimeException("Failed to send reply email via Python service: " + e.getMessage(), e);
        }
    }
}
