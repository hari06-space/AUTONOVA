package com.autonoma.erp.service.ai;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Detects the language of a user's message.
 * Returns ISO-style codes: EN, TA, HI, TE, ML, KN
 */
@Service
public class LanguageDetectionService {

    @Autowired
    private GeminiService geminiService;

    private static final String SYSTEM_PROMPT =
        "You are a language detector. Analyze the given text and return ONLY a JSON object with two fields:\n" +
        "- 'code': one of EN, TA, HI, TE, ML, KN (English, Tamil, Hindi, Telugu, Malayalam, Kannada)\n" +
        "- 'name': the full language name\n" +
        "Return ONLY the JSON object, nothing else. Example: {\"code\":\"TA\",\"name\":\"Tamil\"}\n" +
        "If the text uses Roman script with Indian words (Tanglish, Hinglish, etc.), detect the base language.\n" +
        "Default to EN if uncertain.";

    /**
     * Detect language of the given text.
     * @return Language code: EN / TA / HI / TE / ML / KN
     */
    public String detectLanguage(String text) {
        if (text == null || text.trim().isEmpty()) {
            return "EN";
        }

        // Fast path: common English greetings
        String lower = text.trim().toLowerCase();
        if (lower.equals("hi") || lower.equals("hello") || lower.equals("hey") || lower.equals("help") || lower.equals("thanks")) {
            return "EN";
        }

        // Fast path: native Tamil script detection
        if (text.chars().anyMatch(c -> Character.UnicodeBlock.of(c) == Character.UnicodeBlock.TAMIL)) {
            return "TA";
        }

        // Fast path: Tanglish keyword detection (Tamil written in Roman script)
        if (lower.contains("vanakkam") || lower.contains("eppadi") || lower.contains("irukk") ||
            lower.contains("sollu") || lower.contains("paathu") || lower.contains("evalvu") ||
            lower.contains("kaattu") || lower.contains("pannu") || lower.contains("nandri") ||
            lower.contains("pathi")) {
            return "TA";
        }

        try {
            String raw = geminiService.generateStructuredResponse(SYSTEM_PROMPT, text);
            raw = raw.trim();

            // Extract "code" from JSON
            int codeStart = raw.indexOf("\"code\"");
            if (codeStart >= 0) {
                int colonIdx = raw.indexOf(':', codeStart);
                int q1 = raw.indexOf('"', colonIdx + 1);
                int q2 = raw.indexOf('"', q1 + 1);
                if (q1 >= 0 && q2 > q1) {
                    String code = raw.substring(q1 + 1, q2).toUpperCase();
                    if (isValidCode(code)) return code;
                }
            }
        } catch (Exception e) {
            // Fall through to default
        }

        return "EN";
    }

    /**
     * Map language code to BCP-47 locale tag for Web Speech API.
     */
    public static String toBcp47(String code) {
        return switch (code) {
            case "TA" -> "ta-IN";
            case "HI" -> "hi-IN";
            case "TE" -> "te-IN";
            case "ML" -> "ml-IN";
            case "KN" -> "kn-IN";
            default   -> "en-US";
        };
    }

    private boolean isValidCode(String code) {
        return VALID_CODES.contains(code);
    }

    private static final java.util.Set<String> VALID_CODES =
        java.util.Set.of("EN", "TA", "HI", "TE", "ML", "KN");
}
