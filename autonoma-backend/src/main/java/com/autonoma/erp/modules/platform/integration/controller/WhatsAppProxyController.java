package com.autonoma.erp.modules.platform.integration.controller;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;

@RestController
@RequestMapping("/api/whatsapp")
@CrossOrigin(origins = "*")
public class WhatsAppProxyController {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping("/chats")
    public ResponseEntity<String> getChats(
            @RequestParam String instanceId,
            @RequestParam String token) {
        String url = String.format("https://api.ultramsg.com/%s/chats?token=%s", instanceId, token);
        return forwardGet(url);
    }

    @GetMapping("/messages")
    public ResponseEntity<String> getMessages(
            @RequestParam String instanceId,
            @RequestParam String token,
            @RequestParam String chatId,
            @RequestParam(defaultValue = "100") int limit) {
        String url = String.format("https://api.ultramsg.com/%s/chats/messages?token=%s&chatId=%s&limit=%d", 
                instanceId, token, chatId, limit);
        ResponseEntity<String> response = forwardGet(url);
        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            try {
                JsonNode root = objectMapper.readTree(response.getBody());
                if (root.isArray()) {
                    ArrayNode filteredArray = objectMapper.createArrayNode();
                    for (JsonNode msg : root) {
                        String type = msg.has("type") ? msg.get("type").asText() : "";
                        boolean isDeleted = msg.has("isDeleted") && msg.get("isDeleted").asBoolean();
                        String body = msg.has("body") ? msg.get("body").asText() : "";
                        
                        if (!"revoked".equalsIgnoreCase(type) && 
                            !"deleted".equalsIgnoreCase(type) && 
                            !isDeleted && 
                            !body.contains("deleted this message")) {
                            filteredArray.add(msg);
                        }
                    }
                    return ResponseEntity.ok(filteredArray.toString());
                }
            } catch (Exception e) {
                return response;
            }
        }
        return response;
    }

    @PostMapping("/send")
    public ResponseEntity<String> sendMessage(
            @RequestParam String instanceId,
            @RequestParam String token,
            @RequestParam String to,
            @RequestParam String body) {
        String url = String.format("https://api.ultramsg.com/%s/messages/chat", instanceId);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        
        String requestBody = String.format("token=%s&to=%s&body=%s", token, to, body);
        HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);
        
        try {
            return restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    @PostMapping("/delete")
    public ResponseEntity<String> deleteMessage(
            @RequestParam String instanceId,
            @RequestParam String token,
            @RequestParam String msgId) {
        String url = String.format("https://api.ultramsg.com/%s/messages/delete", instanceId);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        
        String requestBody = String.format("token=%s&msgId=%s", token, msgId);
        HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);
        
        try {
            return restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    private ResponseEntity<String> forwardGet(String url) {
        try {
            return restTemplate.exchange(url, HttpMethod.GET, null, String.class);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }
}
