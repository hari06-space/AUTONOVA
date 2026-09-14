package com.autonoma.erp.service.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

/**
 * Service for communicating with a self-hosted open-source LLM running inside
 * the server via Ollama REST API.
 * Automatically checks and pulls/downloads the requested model if missing.
 */
@Service
public class OllamaService {

    private static final Logger log = LoggerFactory.getLogger(OllamaService.class);

    @Value("${ollama.enabled:true}")
    private boolean enabled;

    @Value("${ollama.url:http://localhost:11434}")
    private String ollamaUrl;

    @Value("${ollama.model:llama3}")
    private String model;

    @Value("${ollama.auto-pull:true}")
    private boolean autoPullEnabled;

    @Value("${ollama.timeout.seconds:30}")
    private int timeoutSeconds;

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private boolean modelPulledOrChecked = false;

    public OllamaService() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    public boolean isEnabled() {
        return enabled;
    }

    /**
     * Check if the local Ollama instance is active and reachable.
     */
    public boolean isAvailable() {
        if (!enabled) {
            return false;
        }
        try {
            String baseUrl = getBaseUrl();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/api/tags"))
                    .timeout(Duration.ofSeconds(3))
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() == 200;
        } catch (Exception e) {
            log.debug("Ollama local service ping failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Automatically pulls/downloads the model if it doesn't exist locally in Ollama.
     */
    public synchronized void ensureModelExists() {
        if (!enabled || modelPulledOrChecked) {
            return;
        }

        try {
            String baseUrl = getBaseUrl();
            // 1. Check existing models via GET /api/tags
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/api/tags"))
                    .timeout(Duration.ofSeconds(5))
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            boolean exists = false;
            if (response.statusCode() == 200) {
                @SuppressWarnings("unchecked")
                Map<String, Object> tagsMap = objectMapper.readValue(response.body(), Map.class);
                if (tagsMap != null && tagsMap.containsKey("models")) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> modelsList = (List<Map<String, Object>>) tagsMap.get("models");
                    if (modelsList != null) {
                        for (Map<String, Object> m : modelsList) {
                            String name = (String) m.get("name");
                            if (name != null && (name.equalsIgnoreCase(model) || name.startsWith(model + ":"))) {
                                exists = true;
                                break;
                            }
                        }
                    }
                }
            }

            if (!exists) {
                if (autoPullEnabled) {
                    log.info("Model '{}' not found locally in Ollama. Triggering automatic model pull...", model);
                    pullModel(model);
                } else {
                    log.warn("Model '{}' not found in Ollama and auto-pull is disabled (ollama.auto-pull=false).", model);
                }
            }
            modelPulledOrChecked = true;
        } catch (Exception e) {
            log.warn("Failed to check or auto-pull model '{}': {}", model, e.getMessage());
        }
    }

    /**
     * Call Ollama /api/pull to download and install model.
     */
    public boolean pullModel(String modelName) {
        try {
            String baseUrl = getBaseUrl();
            Map<String, Object> body = Map.of(
                    "name", modelName,
                    "stream", false
            );
            String bodyJson = objectMapper.writeValueAsString(body);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/api/pull"))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofMinutes(10)) // pulling model takes time
                    .POST(HttpRequest.BodyPublishers.ofString(bodyJson))
                    .build();

            log.info("Downloading local model '{}' via Ollama API...", modelName);
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                log.info("Successfully pulled model '{}' locally into Ollama!", modelName);
                return true;
            } else {
                log.error("Failed to pull model '{}'. HTTP status: {}", modelName, response.statusCode());
            }
        } catch (Exception e) {
            log.error("Error pulling model '{}': {}", modelName, e.getMessage());
        }
        return false;
    }

    /**
     * Single-turn response generation using local LLM.
     */
    public String generateResponse(String prompt, String systemContext) {
        List<Map<String, String>> messages = new ArrayList<>();
        if (systemContext != null && !systemContext.isBlank()) {
            messages.add(Map.of("role", "system", "content", systemContext));
        }
        messages.add(Map.of("role", "user", "content", prompt));
        return callOllama(messages, 0.7, 2048);
    }

    /**
     * Multi-turn conversation generation with history.
     */
    public String generateResponseWithHistory(
            String systemPrompt,
            List<Map<String, String>> history,
            String userMessage,
            double temperature,
            int maxTokens) {

        List<Map<String, String>> messages = new ArrayList<>();

        if (systemPrompt != null && !systemPrompt.isBlank()) {
            messages.add(Map.of("role", "system", "content", systemPrompt));
        }

        if (history != null && !history.isEmpty()) {
            int startIdx = Math.max(0, history.size() - 10);
            messages.addAll(history.subList(startIdx, history.size()));
        }

        messages.add(Map.of("role", "user", "content", userMessage));

        return callOllama(messages, temperature, maxTokens);
    }

    /**
     * Structured JSON response generation.
     */
    public String generateStructuredResponse(String systemPrompt, String userMessage) {
        String enhancedSystem = systemPrompt +
                "\n\nCRITICAL: Respond with ONLY valid JSON. No markdown, no explanation, no code fences. " +
                "Your entire response must be parseable as JSON.";

        List<Map<String, String>> messages = List.of(
                Map.of("role", "system", "content", enhancedSystem),
                Map.of("role", "user", "content", userMessage)
        );

        return callOllama(messages, 0.1, 1024);
    }

    private String callOllama(List<Map<String, String>> messages, double temperature, int maxTokens) {
        if (!enabled) {
            throw new IllegalStateException("Ollama local LLM service is disabled.");
        }

        ensureModelExists();

        try {
            String baseUrl = getBaseUrl();
            String endpoint = baseUrl + "/api/chat";

            Map<String, Object> body = new HashMap<>();
            body.put("model", model);
            body.put("messages", messages);
            body.put("stream", false);

            Map<String, Object> options = new HashMap<>();
            options.put("temperature", temperature);
            options.put("num_predict", maxTokens);
            body.put("options", options);

            String requestJson = objectMapper.writeValueAsString(body);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(timeoutSeconds))
                    .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 404) {
                log.warn("Model '{}' not found on Ollama server. Attempting automatic pull...", model);
                if (pullModel(model)) {
                    response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                }
            }

            if (response.statusCode() != 200) {
                log.warn("Ollama API call failed with HTTP status: {}", response.statusCode());
                throw new RuntimeException("Ollama returned status code " + response.statusCode());
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> responseMap = objectMapper.readValue(response.body(), Map.class);
            if (responseMap != null && responseMap.containsKey("message")) {
                @SuppressWarnings("unchecked")
                Map<String, Object> messageObj = (Map<String, Object>) responseMap.get("message");
                if (messageObj != null && messageObj.containsKey("content")) {
                    return (String) messageObj.get("content");
                }
            }

            throw new RuntimeException("Unexpected response payload structure from Ollama.");

        } catch (Exception e) {
            log.error("Error communicating with local Ollama LLM: {}", e.getMessage());
            throw new RuntimeException("Local Ollama execution failed: " + e.getMessage(), e);
        }
    }

    private String getBaseUrl() {
        return ollamaUrl.endsWith("/") ? ollamaUrl.substring(0, ollamaUrl.length() - 1) : ollamaUrl;
    }
}
