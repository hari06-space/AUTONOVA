package com.autonoma.erp.modules.platform.integration.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import java.util.Map;
import java.util.HashMap;
import com.autonoma.erp.modules.master.commercial.entity.AccountLedger;
import com.autonoma.erp.modules.master.commercial.repository.AccountLedgerRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * OCR Proxy Controller
 * ─────────────────────────────────────────────────────────────
 * Proxies requests to the standalone OCR service (port 9090).
 * This eliminates hardcoded localhost URLs in the frontend,
 * routing all OCR traffic through the main Spring Boot API
 * so auth interceptors and CORS policies apply uniformly.
 *
 * When the OCR service is not running, all endpoints return
 * HTTP 503 Service Unavailable instead of crashing with 500.
 *
 * Configure via: ocr.service.url in application.properties
 */
@RestController
@RequestMapping("/api/ocr")
@CrossOrigin(origins = "*")
public class OcrProxyController {
    @Autowired
    private com.autonoma.erp.modules.sm.customer.service.CustomerMasterService customerMasterService;

    @Autowired
    private com.autonoma.erp.service.admin.EmailSendingService emailSendingService;

    @Autowired
    private AccountLedgerRepository AccountLedgerRepository;

    @Autowired
    private com.autonoma.erp.service.realtime.RealtimeDataSyncPublisher realtimeDataSyncPublisher;

    @Autowired
    private com.autonoma.erp.repository.admin.CompanyCredentialRepository companyCredentialRepository;

    @Autowired
    private jakarta.servlet.http.HttpServletRequest request;

    @Value("${ocr.service.url:http://localhost:9090}")
    private String ocrServiceUrl;

    @Value("${python.email.service.url:http://localhost:8000}")
    private String pythonEmailServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @PostMapping("/notify-mutation")
    public ResponseEntity<Void> notifyMutation(@RequestBody Map<String, String> payload) {
        String entityName = payload.get("entityName");
        String action = payload.get("action");
        if (entityName != null) {
            realtimeDataSyncPublisher.publishMutation(entityName, action != null ? action : "MUTATED");
        }
        return ResponseEntity.ok().build();
    }

    @PostMapping("/create-customer")
    public ResponseEntity<AccountLedger> createCustomer(@RequestBody AccountLedger customer) {
        customer.setCreatedBy("SYSTEM");
        customer.setCreatedDate(java.time.LocalDateTime.now());
        if (customer.getIsCustomer() == null) {
            customer.setIsCustomer(true);
        }
        if (customer.getIsActive() == null) {
            customer.setIsActive(true);
        }
        
        // Save using CustomerMasterService (which generates next Customer Code)
        AccountLedger saved = customerMasterService.saveCustomer(customer);
        
        // Publish real-time mutation sync update so the UI updates automatically
        realtimeDataSyncPublisher.publishMutation("Customer", "SAVE");
        
        return ResponseEntity.ok(saved);
    }

    // ─── OAuth Proxy Endpoints ──────────────────────────────────────

    @GetMapping("/auth/url")
    public ResponseEntity<String> getAuthUrl() {
        String url = pythonEmailServiceUrl + "/api/v1/auth/url";
        return forwardGet(url);
    }

    @PostMapping("/auth/callback")
    public ResponseEntity<String> authCallback(@RequestBody String body) {
        String url = pythonEmailServiceUrl + "/api/v1/auth/callback";
        return forwardPost(url, body);
    }

    // ─── Inbox Endpoints ────────────────────────────────────────────

    @GetMapping("/inbox")
    public ResponseEntity<String> getInbox(@RequestParam(defaultValue = "50") int limit) {
        String url = ocrServiceUrl + "/api/inbox?limit=" + limit;
        return forwardGet(url);
    }

    @PostMapping("/inbox/{id}/mark-read")
    public ResponseEntity<String> markRead(@PathVariable Long id) {
        String url = ocrServiceUrl + "/api/inbox/" + id + "/mark-read";
        return forwardPost(url, null);
    }

    @GetMapping("/inbox/{emailId}/attachments")
    public ResponseEntity<String> getAttachments(@PathVariable String emailId) {
        String url = ocrServiceUrl + "/api/inbox/" + emailId + "/attachments";
        return forwardGet(url);
    }

    @GetMapping("/inbox/{emailId}/attachments/{attachmentId}")
    public ResponseEntity<byte[]> getAttachmentFile(@PathVariable String emailId, @PathVariable String attachmentId) {
        String url = ocrServiceUrl + "/api/inbox/" + emailId + "/attachments/" + attachmentId;
        try {
            ResponseEntity<byte[]> response = restTemplate.exchange(url, HttpMethod.GET, null, byte[].class);
            HttpHeaders cleanHeaders = new HttpHeaders();
            cleanHeaders.putAll(response.getHeaders());
            cleanHeaders.remove(HttpHeaders.TRANSFER_ENCODING);
            return ResponseEntity.status(response.getStatusCode())
                    .headers(cleanHeaders)
                    .body(response.getBody());
        } catch (ResourceAccessException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/processing-requests/{processingRequestId}/attachments")
    public ResponseEntity<String> getRequestAttachments(@PathVariable Long processingRequestId) {
        String url = ocrServiceUrl + "/api/inbox/processing-requests/" + processingRequestId + "/attachments";
        return forwardGet(url);
    }

    @GetMapping("/processing-requests/{processingRequestId}/attachments/{attachmentId}")
    public ResponseEntity<byte[]> getRequestAttachmentFile(@PathVariable Long processingRequestId, @PathVariable String attachmentId) {
        String url = ocrServiceUrl + "/api/inbox/processing-requests/" + processingRequestId + "/attachments/" + attachmentId;
        try {
            ResponseEntity<byte[]> response = restTemplate.exchange(url, HttpMethod.GET, null, byte[].class);
            HttpHeaders cleanHeaders = new HttpHeaders();
            cleanHeaders.putAll(response.getHeaders());
            cleanHeaders.remove(HttpHeaders.TRANSFER_ENCODING);
            return ResponseEntity.status(response.getStatusCode())
                    .headers(cleanHeaders)
                    .body(response.getBody());
        } catch (ResourceAccessException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    // ─── Processing Request Endpoints ───────────────────────────────

    @GetMapping("/processing-requests")
    public ResponseEntity<String> getProcessingRequests() {
        String url = ocrServiceUrl + "/api/processing-requests";
        return enrichResponse(forwardGet(url));
    }

    @GetMapping("/processing-requests/{id}")
    public ResponseEntity<String> getProcessingRequestById(@PathVariable Long id) {
        String url = ocrServiceUrl + "/api/processing-requests/" + id;
        return enrichResponse(forwardGet(url));
    }

    @PostMapping("/processing-requests")
    public ResponseEntity<String> createRequest(@RequestBody String body) {
        String url = ocrServiceUrl + "/api/processing-requests";
        return enrichResponse(forwardPost(url, body));
    }

    @PutMapping("/processing-requests/{id}")
    public ResponseEntity<String> updateRequest(@PathVariable Long id, @RequestBody String body) {
        String url = ocrServiceUrl + "/api/processing-requests/" + id;
        return enrichResponse(forwardPut(url, body));
    }

    @GetMapping("/processing-requests/{id}/preview-reply")
    public ResponseEntity<String> previewReply(@PathVariable Long id, @RequestParam("status") String status) {
        String url = ocrServiceUrl + "/api/processing-requests/" + id + "/preview-reply?status=" + status;
        return forwardGet(url);
    }

    @DeleteMapping("/processing-requests/{id}")
    public ResponseEntity<String> deleteRequest(@PathVariable Long id) {
        String url = ocrServiceUrl + "/api/processing-requests/" + id;
        try {
            restTemplate.delete(url);
            return ResponseEntity.ok().build();
        } catch (ResourceAccessException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body("{\"error\":\"OCR service is not available\"}");
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body("{\"error\":\"Failed to delete request\"}");
        }
    }

    @PostMapping("/processing-requests/sync")
    public ResponseEntity<String> syncRequests(@RequestParam(value = "companyId", required = false) Long companyId) {
        Long activeCompanyId = companyId != null ? companyId : 1L;
        String url = ocrServiceUrl + "/api/processing-requests/sync?companyId=" + activeCompanyId;
        return enrichResponse(forwardPost(url, ""));
    }

    // ─── Internal Forwarding Helpers ────────────────────────────────

    private HttpHeaders buildForwardHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        String currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        if (currentUserId != null) {
            headers.set("X-User-Id", currentUserId);
        }
        
        if (request != null) {
            String tenantId = request.getHeader("X-Tenant-ID");
            if (tenantId != null) {
                if (tenantId.equalsIgnoreCase("AUTONOMA")) {
                    headers.set("X-Company-ID", "1");
                } else {
                    java.util.Optional<com.autonoma.erp.model.admin.CompanyCredential> comp = companyCredentialRepository.findFirstByClientCodeIgnoreCaseOrderByIdAsc(tenantId);
                    if (comp.isPresent()) {
                        headers.set("X-Company-ID", String.valueOf(comp.get().getId()));
                    } else {
                        headers.set("X-Company-ID", "1");
                    }
                }
            }
            String divisionId = request.getHeader("X-Division-ID");
            if (divisionId != null && !divisionId.trim().isEmpty()) {
                headers.set("X-Division-ID", divisionId);
            }
        }
        return headers;
    }

    private ResponseEntity<String> forwardGet(String url) {
        try {
            HttpHeaders headers = buildForwardHeaders();
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
            HttpHeaders cleanHeaders = new HttpHeaders();
            cleanHeaders.putAll(response.getHeaders());
            cleanHeaders.remove(HttpHeaders.TRANSFER_ENCODING);
            cleanHeaders.remove(HttpHeaders.CONTENT_LENGTH);
            return ResponseEntity.status(response.getStatusCode())
                    .headers(cleanHeaders)
                    .body(response.getBody());
        } catch (ResourceAccessException e) {
            // OCR service is down — return 503 instead of crashing with Connection refused
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"error\":\"OCR service is not available\",\"message\":\"Connection refused to OCR service\"}");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    private ResponseEntity<String> forwardPost(String url, String body) {
        try {
            HttpHeaders headers = buildForwardHeaders();
            HttpEntity<String> entity = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
            HttpHeaders cleanHeaders = new HttpHeaders();
            cleanHeaders.putAll(response.getHeaders());
            cleanHeaders.remove(HttpHeaders.TRANSFER_ENCODING);
            cleanHeaders.remove(HttpHeaders.CONTENT_LENGTH);
            return ResponseEntity.status(response.getStatusCode())
                    .headers(cleanHeaders)
                    .body(response.getBody());
        } catch (ResourceAccessException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"error\":\"OCR service is not available\"}");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    private ResponseEntity<String> forwardPut(String url, String body) {
        try {
            HttpHeaders headers = buildForwardHeaders();
            HttpEntity<String> entity = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.PUT, entity, String.class);
            HttpHeaders cleanHeaders = new HttpHeaders();
            cleanHeaders.putAll(response.getHeaders());
            cleanHeaders.remove(HttpHeaders.TRANSFER_ENCODING);
            cleanHeaders.remove(HttpHeaders.CONTENT_LENGTH);
            return ResponseEntity.status(response.getStatusCode())
                    .headers(cleanHeaders)
                    .body(response.getBody());
        } catch (ResourceAccessException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"error\":\"OCR service is not available\"}");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    @PostMapping("/processing-requests/{id}/forward")
    public ResponseEntity<Map<String, Object>> forwardProcessingRequest(
            @PathVariable Long id, 
            @RequestBody Map<String, String> body) {
        
        Map<String, Object> result = new HashMap<>();
        try {
            String toEmail = body.get("to");
            String ccEmail = body.get("cc");
            if (toEmail == null || toEmail.trim().isEmpty()) {
                result.put("success", false);
                result.put("message", "Recipient 'to' email is required");
                return ResponseEntity.badRequest().body(result);
            }
            
            // Get original processing request details
            String requestUrl = ocrServiceUrl + "/api/processing-requests/" + id;
            ResponseEntity<Map> response = restTemplate.getForEntity(requestUrl, Map.class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                result.put("success", false);
                result.put("message", "Failed to retrieve processing request detail");
                return ResponseEntity.status(503).body(result);
            }
            
            Map prDetail = response.getBody();
            String originalSubject = (String) prDetail.getOrDefault("emailSubject", "");
            String originalFrom = (String) prDetail.getOrDefault("emailFrom", "");
            String originalContent = (String) prDetail.getOrDefault("emailBodyPreview", "");
            
            // Construct the email body
            String emailSubject = "Forwarded Enquiry: " + originalSubject;
            String htmlBody = "<p>I have received this mail, please check it.</p>" +
                    "<br/>" +
                    "<hr/>" +
                    "<p><strong>From:</strong> " + originalFrom + "</p>" +
                    "<p><strong>Subject:</strong> " + originalSubject + "</p>" +
                    "<p><strong>Message Preview:</strong></p>" +
                    "<blockquote style='border-left: 2px solid #ccc; padding-left: 10px; margin-left: 0; color: #555;'>" + 
                    originalContent + "</blockquote>";
            
            boolean sent = emailSendingService.sendEmailWithAttachments(toEmail, ccEmail, "", emailSubject, htmlBody, null);
            if (sent) {
                result.put("success", true);
                result.put("message", "Email forwarded successfully to " + toEmail);
                return ResponseEntity.ok(result);
            } else {
                result.put("success", false);
                result.put("message", "Failed to send email via SMTP");
                return ResponseEntity.status(500).body(result);
            }
        } catch (ResourceAccessException e) {
            result.put("success", false);
            result.put("message", "OCR service is not available");
            return ResponseEntity.status(503).body(result);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Error forwarding email: " + e.getMessage());
            return ResponseEntity.status(500).body(result);
        }
    }

    private ResponseEntity<String> enrichResponse(ResponseEntity<String> response) {
        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            try {
                String body = response.getBody();
                String enrichedBody = enrichJson(body);
                
                HttpHeaders headers = new HttpHeaders();
                headers.putAll(response.getHeaders());
                headers.remove(HttpHeaders.TRANSFER_ENCODING);
                headers.remove(HttpHeaders.CONTENT_LENGTH);
                
                return ResponseEntity.status(response.getStatusCode())
                        .headers(headers)
                        .body(enrichedBody);
            } catch (Exception e) {
                System.err.println("Failed to enrich OCR response: " + e.getMessage());
            }
        }
        return response;
    }

    private String enrichJson(String json) throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        JsonNode rootNode = mapper.readTree(json);
        
        if (rootNode.isArray()) {
            ArrayNode arrayNode = (ArrayNode) rootNode;
            for (int i = 0; i < arrayNode.size(); i++) {
                JsonNode element = arrayNode.get(i);
                if (element.isObject()) {
                    enrichSingleObject((ObjectNode) element);
                }
            }
            return mapper.writeValueAsString(arrayNode);
        } else if (rootNode.isObject()) {
            ObjectNode objectNode = (ObjectNode) rootNode;
            enrichSingleObject(objectNode);
            return mapper.writeValueAsString(objectNode);
        }
        return json;
    }

    private void enrichSingleObject(ObjectNode node) {
        if (node.has("customerCode")) {
            String customerCode = node.get("customerCode").asText();
            if (customerCode != null && !customerCode.trim().isEmpty() && !customerCode.equalsIgnoreCase("null")) {
                java.util.Optional<AccountLedger> customerOpt = AccountLedgerRepository.findByCode(customerCode.trim());
                if (customerOpt.isPresent()) {
                    AccountLedger cm = customerOpt.get();
                    node.put("customerCode", cm.getCustomerCode());
                    node.put("customerName", cm.getCustomerName());
                }
            }
        }
    }
}
