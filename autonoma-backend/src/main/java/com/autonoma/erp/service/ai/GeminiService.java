package com.autonoma.erp.service.ai;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

/**
 * Enterprise Gemini Service utilizing the Interactions API.
 */
@Service
public class GeminiService {

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private OllamaService ollamaService;

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.model:gemini-3.5-flash}")
    private String model;

    @Value("${groq.api.key:}")
    private String groqApiKey;

    @Value("${groq.timeout.seconds:20}")
    private int timeoutSeconds;

    private static final String GROQ_WHISPER_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
    private static final int MAX_RETRIES = 2;

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public GeminiService() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Simple single-turn response.
     */
    public String generateResponse(String prompt, String context) {
        if (ollamaService != null && ollamaService.isEnabled() && ollamaService.isAvailable()) {
            try {
                return ollamaService.generateResponse(prompt, context);
            } catch (Exception e) {
                // Log and fallback to Gemini
            }
        }
        List<Map<String, String>> messages = new ArrayList<>();
        if (context != null && !context.isBlank()) {
            messages.add(Map.of("role", "system", "content", context));
        }
        messages.add(Map.of("role", "user", "content", prompt));
        return callGemini(messages, 0.7, 2048);
    }

    /**
     * Multi-turn response with full conversation history.
     */
    public String generateResponseWithHistory(
            String systemPrompt,
            List<Map<String, String>> history,
            String userMessage,
            double temperature,
            int maxTokens) {

        if (ollamaService != null && ollamaService.isEnabled() && ollamaService.isAvailable()) {
            try {
                return ollamaService.generateResponseWithHistory(systemPrompt, history, userMessage, temperature, maxTokens);
            } catch (Exception e) {
                // Log and fallback to Gemini
            }
        }

        List<Map<String, String>> messages = new ArrayList<>();

        if (systemPrompt != null && !systemPrompt.isBlank()) {
            messages.add(Map.of("role", "system", "content", systemPrompt));
        }

        if (history != null) {
            int startIdx = Math.max(0, history.size() - 20);
            messages.addAll(history.subList(startIdx, history.size()));
        }

        messages.add(Map.of("role", "user", "content", userMessage));

        return callGemini(messages, temperature, maxTokens);
    }

    /**
     * Structured JSON response – instructs the model to return only valid JSON.
     */
    public String generateStructuredResponse(String systemPrompt, String userMessage) {
        if (ollamaService != null && ollamaService.isEnabled() && ollamaService.isAvailable()) {
            try {
                return ollamaService.generateStructuredResponse(systemPrompt, userMessage);
            } catch (Exception e) {
                // Log and fallback to Gemini
            }
        }

        String enhancedSystem = systemPrompt +
            "\n\nCRITICAL: Respond with ONLY valid JSON. No markdown, no explanation, no code fences. " +
            "Your entire response must be parseable as JSON.";

        List<Map<String, String>> messages = List.of(
            Map.of("role", "system", "content", enhancedSystem),
            Map.of("role", "user", "content", userMessage)
        );

        return callGemini(messages, 0.1, 2048);
    }

    /**
     * Transcribes audio using Groq Whisper API (maintained for backward compatibility).
     */
    public String transcribeAudio(byte[] audioData, String filename, String language) {
        if (groqApiKey == null || groqApiKey.isEmpty()) {
            return "Groq API Key is not configured for Whisper transcription.";
        }
        try {
            String boundary = "---GroqBoundary" + System.currentTimeMillis();
            
            StringBuilder headerBuilder = new StringBuilder();
            headerBuilder.append("--").append(boundary).append("\r\n");
            headerBuilder.append("Content-Disposition: form-data; name=\"model\"\r\n\r\n");
            headerBuilder.append("whisper-large-v3\r\n");
            
            if (language != null && !language.trim().isEmpty()) {
                headerBuilder.append("--").append(boundary).append("\r\n");
                headerBuilder.append("Content-Disposition: form-data; name=\"language\"\r\n\r\n");
                headerBuilder.append(language).append("\r\n");
            }
            
            headerBuilder.append("--").append(boundary).append("\r\n");
            headerBuilder.append("Content-Disposition: form-data; name=\"file\"; filename=\"").append(filename).append("\"\r\n");
            headerBuilder.append("Content-Type: application/octet-stream\r\n\r\n");
            
            byte[] headerBytes = headerBuilder.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
            byte[] footerBytes = ("\r\n--" + boundary + "--\r\n").getBytes(java.nio.charset.StandardCharsets.UTF_8);
            
            byte[] fullBody = new byte[headerBytes.length + audioData.length + footerBytes.length];
            System.arraycopy(headerBytes, 0, fullBody, 0, headerBytes.length);
            System.arraycopy(audioData, 0, fullBody, headerBytes.length, audioData.length);
            System.arraycopy(footerBytes, 0, fullBody, headerBytes.length + audioData.length, footerBytes.length);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(GROQ_WHISPER_URL))
                    .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                    .header("Authorization", "Bearer " + groqApiKey)
                    .timeout(Duration.ofSeconds(60))
                    .POST(HttpRequest.BodyPublishers.ofByteArray(fullBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                return "Error from Whisper API (Status " + response.statusCode() + ")";
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> responseMap = objectMapper.readValue(response.body(), Map.class);
            if (responseMap != null && responseMap.containsKey("text")) {
                return (String) responseMap.get("text");
            }
            return "Sorry, I could not transcribe the audio.";
            
        } catch (Exception e) {
            return "Error transcribing audio: " + e.getMessage();
        }
    }

    private String callGemini(List<Map<String, String>> messages, double temperature, int maxTokens) {
        if (geminiApiKey == null || geminiApiKey.isEmpty() || geminiApiKey.contains("placeholder")) {
            return "Gemini API Key is not configured. Please add gemini.api.key to application.properties.";
        }

        Exception lastException = null;

        StringBuilder promptBuilder = new StringBuilder();
        for (Map<String, String> msg : messages) {
            String role = msg.get("role");
            String content = msg.get("content");
            if ("system".equalsIgnoreCase(role)) {
                promptBuilder.append("System Instructions:\n").append(content).append("\n\n");
            } else if ("user".equalsIgnoreCase(role)) {
                promptBuilder.append("User: ").append(content).append("\n");
            } else if ("assistant".equalsIgnoreCase(role) || "system_response".equalsIgnoreCase(role)) {
                promptBuilder.append("AI: ").append(content).append("\n");
            }
        }
        String prompt = promptBuilder.toString().trim();

        for (int attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                if (attempt > 0) {
                    Thread.sleep((long) Math.pow(2, attempt) * 1000L);
                }

                // Standard Gemini generateContent payload
                Map<String, Object> part = new HashMap<>();
                part.put("text", prompt);
                
                Map<String, Object> contentMap = new HashMap<>();
                contentMap.put("parts", List.of(part));
                
                Map<String, Object> body = new HashMap<>();
                body.put("contents", List.of(contentMap));

                String bodyStr = objectMapper.writeValueAsString(body);
                String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + geminiApiKey;

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .header("Content-Type", "application/json")
                        .timeout(Duration.ofSeconds(timeoutSeconds))
                        .POST(HttpRequest.BodyPublishers.ofString(bodyStr))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() == 429 && attempt < MAX_RETRIES) {
                    lastException = new RuntimeException("Gemini Rate limited (429)");
                    continue;
                }

                if (response.statusCode() != 200) {
                    return "Error from Gemini model (Status " + response.statusCode() + "): " + response.body();
                }

                @SuppressWarnings("unchecked")
                Map<String, Object> responseMap = objectMapper.readValue(response.body(), Map.class);
                
                if (responseMap.containsKey("candidates")) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseMap.get("candidates");
                    if (!candidates.isEmpty()) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> contentObj = (Map<String, Object>) candidates.get(0).get("content");
                        if (contentObj != null && contentObj.containsKey("parts")) {
                            @SuppressWarnings("unchecked")
                            List<Map<String, Object>> parts = (List<Map<String, Object>>) contentObj.get("parts");
                            if (!parts.isEmpty() && parts.get(0).containsKey("text")) {
                                return (String) parts.get(0).get("text");
                            }
                        }
                    }
                }
                return "Error: Could not parse Gemini response.";

            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                return "Request interrupted.";
            } catch (Exception e) {
                lastException = e;
            }
        }

        String errMsg = lastException != null ? lastException.getMessage() : "Unknown error";
        return "Error calling Gemini model after " + MAX_RETRIES + " retries: " + errMsg;
    }
}
