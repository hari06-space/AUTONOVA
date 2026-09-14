package com.nutech.email.integration;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nutech.email.dto.AiDto.*;
import com.nutech.email.model.MasterPart;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import jakarta.annotation.PostConstruct;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Service
@Slf4j
public class AiClient {

    @Value("${openai.api-key}")
    private String apiKey;

    @Value("${openai.model:gpt-4o-mini}")
    private String model;

    @Value("${openai.base-url:https://api.openai.com/v1}")
    private String baseUrl;

    @Value("${openai.max-tokens:4096}")
    private int maxTokens;

    @Value("${openai.temperature:0.1}")
    private double temperature;

    @Value("${python.email.service.url:http://localhost:8000}")
    private String pythonServiceUrl;

    private WebClient webClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostConstruct
    public void init() {
        webClient = WebClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .defaultHeader("Content-Type", "application/json")
                .build();
    }

    // ─── INTENT CLASSIFICATION ───
    @Async("taskExecutor")
    public CompletableFuture<IntentResult> classifyIntent(String emailSubject, String emailText) {
        try {
            String url = pythonServiceUrl + "/api/v1/emails/classify";
            Map<String, String> request = new HashMap<>();
            request.put("subject", emailSubject != null ? emailSubject : "");
            request.put("text", emailText != null ? emailText : "");

            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            IntentResult result = restTemplate.postForObject(url, request, IntentResult.class);

            if (result != null) {
                log.info("Intent classified via Python keyword mapping: {} (confidence: {})", result.getIntent(), result.getConfidence());
                return CompletableFuture.completedFuture(result);
            } else {
                throw new RuntimeException("Empty response from Python classification service");
            }
        } catch (Exception e) {
            log.error("Intent classification via Python keyword mapping failed: {}", e.getMessage(), e);
            return CompletableFuture.completedFuture(
                    IntentResult.builder().intent("general_inquiry").confidence(0.0).reasoning("Python call failed: " + e.getMessage()).build()
            );
        }
    }

    // ─── PART CODE EXTRACTION ───
    @Async("taskExecutor")
    public CompletableFuture<List<ExtractedPart>> extractParts(String combinedText) {
        String systemPrompt = """
            You are a part-code extractor for a manufacturing company. From the given text (email body + OCR/Excel text), extract all part codes, quantities, and related info.
            
            Pay special attention to tables or lists with headers like "Part No", "OEM", "IPP", and "Qty" (case-insensitive).
            For each row/item in the list:
            - Identify the part code from the "Part No" column. If "Part No" is empty or missing, check "OEM" or "IPP" columns and use those values as the partCode.
            - Identify the quantity from the "Qty" or "Quantity" column.
            
            Return a JSON array of objects. Each object must have:
            - "partCode": the part code string (e.g. from Part No, OEM, or IPP)
            - "quantity": integer (default 1 if not specified; match the Qty column value)
            - "deliveryDate": requested delivery date if mentioned, else null
            - "specialInstructions": any special notes for this part (e.g. mention if it was mapped from OEM or IPP), else null
            - "surroundingContext": the sentence or phrase or table row where this part code was found
            
            Examples:
            Input: "Please quote for 50 nos of ABC-1234 and 100 pcs BRG-6205. Need by 15th March."
            Output: [
              {"partCode": "ABC-1234", "quantity": 50, "deliveryDate": "2025-03-15", "specialInstructions": null, "surroundingContext": "50 nos of ABC-1234"},
              {"partCode": "BRG-6205", "quantity": 100, "deliveryDate": "2025-03-15", "specialInstructions": null, "surroundingContext": "100 pcs BRG-6205"}
            ]
            
            If no part codes are found, return an empty array: []
            Respond with ONLY the JSON array, no extra text.
            """;

        String userPrompt = "Extract parts from:\n\n" + truncate(combinedText, 4000);

        try {
            String response = callOpenAi(systemPrompt, userPrompt);
            List<ExtractedPart> parts = objectMapper.readValue(response, new TypeReference<>() {});
            if (parts != null && !parts.isEmpty()) {
                log.info("Extracted {} parts from OpenAI", parts.size());
                return CompletableFuture.completedFuture(parts);
            }
        } catch (Exception e) {
            log.warn("OpenAI Part extraction failed ({}), falling back to local rule-based extractor", e.getMessage());
        }

        List<ExtractedPart> localParts = extractPartsLocally(combinedText);
        log.info("Extracted {} parts via local rule-based extractor", localParts.size());
        return CompletableFuture.completedFuture(localParts);
    }

    public List<ExtractedPart> extractPartsLocally(String combinedText) {
        if (combinedText == null || combinedText.trim().isEmpty()) {
            return Collections.emptyList();
        }

        List<ExtractedPart> result = new ArrayList<>();
        String[] lines = combinedText.split("\\r?\\n");

        // Strategy 1: Key-Value / Block format (e.g. Part No : 123, Qty : 5, OEM : 9999, IPP : 5555)
        String currentPartCode = null;
        String currentPartName = null;
        Integer currentQty = null;
        String currentOem = null;
        String currentIpp = null;
        StringBuilder currentBlock = new StringBuilder();

        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.isEmpty() || trimmed.startsWith("---")) {
                if (currentPartCode != null || currentOem != null || currentIpp != null) {
                    String finalCode = currentPartCode != null ? currentPartCode : (currentOem != null ? currentOem : currentIpp);
                    int qty = (currentQty != null && currentQty > 0) ? currentQty : 1;
                    String notes = "";
                    if (currentPartName != null) notes += "Name: " + currentPartName + " ";
                    if (currentOem != null) notes += "OEM: " + currentOem + " ";
                    if (currentIpp != null) notes += "IPP: " + currentIpp + " ";
                    result.add(ExtractedPart.builder()
                            .partCode(finalCode)
                            .quantity(qty)
                            .specialInstructions(notes.trim().isEmpty() ? null : notes.trim())
                            .surroundingContext(currentBlock.toString().trim())
                            .build());
                    currentPartCode = null;
                    currentPartName = null;
                    currentQty = null;
                    currentOem = null;
                    currentIpp = null;
                    currentBlock.setLength(0);
                }
                continue;
            }

            currentBlock.append(line).append("\n");

            java.util.regex.Matcher partNoMatcher = java.util.regex.Pattern.compile("(?i)^(?:part\\s*(?:no|number|code|#)?|item\\s*(?:no|number|code|#)?)\\s*[:=\\-]\\s*(.+)$").matcher(trimmed);
            if (partNoMatcher.find()) {
                currentPartCode = partNoMatcher.group(1).trim();
                continue;
            }

            java.util.regex.Matcher nameMatcher = java.util.regex.Pattern.compile("(?i)^(?:part\\s*name|description|item\\s*name)\\s*[:=\\-]\\s*(.+)$").matcher(trimmed);
            if (nameMatcher.find()) {
                currentPartName = nameMatcher.group(1).trim();
                continue;
            }

            java.util.regex.Matcher qtyMatcher = java.util.regex.Pattern.compile("(?i)^(?:qty|quantity|nos|count)\\s*[:=\\-]\\s*(\\d+)").matcher(trimmed);
            if (qtyMatcher.find()) {
                try {
                    currentQty = Integer.parseInt(qtyMatcher.group(1).trim());
                } catch (Exception ignored) {}
                continue;
            }

            java.util.regex.Matcher oemMatcher = java.util.regex.Pattern.compile("(?i)^oem\\s*[:=\\-]\\s*(.+)$").matcher(trimmed);
            if (oemMatcher.find()) {
                currentOem = oemMatcher.group(1).trim();
                continue;
            }

            java.util.regex.Matcher ippMatcher = java.util.regex.Pattern.compile("(?i)^ipp\\s*[:=\\-]\\s*(.+)$").matcher(trimmed);
            if (ippMatcher.find()) {
                currentIpp = ippMatcher.group(1).trim();
                continue;
            }
        }

        // Flush last block
        if (currentPartCode != null || currentOem != null || currentIpp != null) {
            String finalCode = currentPartCode != null ? currentPartCode : (currentOem != null ? currentOem : currentIpp);
            int qty = (currentQty != null && currentQty > 0) ? currentQty : 1;
            String notes = "";
            if (currentPartName != null) notes += "Name: " + currentPartName + " ";
            if (currentOem != null) notes += "OEM: " + currentOem + " ";
            if (currentIpp != null) notes += "IPP: " + currentIpp + " ";
            result.add(ExtractedPart.builder()
                    .partCode(finalCode)
                    .quantity(qty)
                    .specialInstructions(notes.trim().isEmpty() ? null : notes.trim())
                    .surroundingContext(currentBlock.toString().trim())
                    .build());
        }

        // Strategy 2: Inline pattern matching if Strategy 1 found nothing (e.g. "quote for 50 nos of ABC-123")
        if (result.isEmpty()) {
            java.util.regex.Matcher inlineMatcher = java.util.regex.Pattern.compile("(?i)(?:quote\\s+for\\s+|need\\s+|require\\s+)?(\\d+)\\s*(?:nos|pcs|units|pieces|qty|items)?\\s*(?:of\\s+)?([A-Za-z0-9\\-_/]{3,})").matcher(combinedText);
            while (inlineMatcher.find()) {
                int qty = 1;
                try {
                    qty = Integer.parseInt(inlineMatcher.group(1));
                } catch (Exception ignored) {}
                String code = inlineMatcher.group(2).trim();
                result.add(ExtractedPart.builder()
                        .partCode(code)
                        .quantity(qty)
                        .surroundingContext(inlineMatcher.group(0))
                        .build());
            }
        }

        return result;
    }

    // ─── UNKNOWN PART MATCHING ───
    @Async("taskExecutor")
    public CompletableFuture<PartMatchSuggestion> suggestPartMatch(String unknownCode,
                                                                     String context,
                                                                     List<MasterPart> masterParts) {
        String partsListStr = masterParts.stream()
                .map(p -> String.format("- %s: %s (%s)", p.getPartCode(), p.getPartName(),
                        p.getDescription() != null ? p.getDescription() : ""))
                .collect(Collectors.joining("\n"));

        String systemPrompt = """
            You are a part-matching expert for a manufacturing company. A customer used a part code that doesn't exist in our database. 
            You must suggest the most likely match from our master parts list.
            
            Consider:
            - Alphanumeric similarity (typos, abbreviations, different naming conventions)
            - Context clues from the surrounding text
            - Industry knowledge about part naming
            
            Respond with ONLY a JSON object:
            {
              "unknownCode": "<the unknown code>",
              "suggestedPartCode": "<best matching master part code, or null if no match>",
              "confidence": <0.0-1.0>,
              "reasoning": "<explain why this is the best match>"
            }
            
            If confidence is below 0.3, set suggestedPartCode to null.
            """;

        String userPrompt = String.format(
                "Unknown code: \"%s\"\nContext: \"%s\"\n\nMaster Parts:\n%s",
                unknownCode, truncate(context, 500), truncate(partsListStr, 3000)
        );

        try {
            String response = callOpenAi(systemPrompt, userPrompt);
            PartMatchSuggestion suggestion = objectMapper.readValue(response, PartMatchSuggestion.class);
            log.info("Part match suggestion for '{}': {} (confidence: {})",
                    unknownCode, suggestion.getSuggestedPartCode(), suggestion.getConfidence());
            return CompletableFuture.completedFuture(suggestion);
        } catch (Exception e) {
            log.error("Part matching failed for '{}': {}", unknownCode, e.getMessage(), e);
            return CompletableFuture.completedFuture(
                    PartMatchSuggestion.builder()
                            .unknownCode(unknownCode)
                            .confidence(0.0)
                            .reasoning("AI call failed")
                            .build()
            );
        }
    }

    // ─── OpenAI API Call ───
    private String callOpenAi(String systemPrompt, String userPrompt) {
        Map<String, Object> request = Map.of(
                "model", model,
                "max_tokens", maxTokens,
                "temperature", temperature,
                "response_format", Map.of("type", "json_object"),
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userPrompt)
                )
        );

        String responseBody = webClient.post()
                .uri("/chat/completions")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        try {
            JsonNode root = objectMapper.readTree(responseBody);
            return root.path("choices").get(0).path("message").path("content").asText();
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse OpenAI response", e);
        }
    }

    private String truncate(String text, int maxLen) {
        if (text == null) return "";
        return text.length() > maxLen ? text.substring(0, maxLen) + "..." : text;
    }
}
