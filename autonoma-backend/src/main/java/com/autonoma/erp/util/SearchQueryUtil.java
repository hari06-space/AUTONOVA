package com.autonoma.erp.util;

import java.util.ArrayList;
import java.util.List;

public class SearchQueryUtil {
    /**
     * Converts raw input like "internal audit" to: '"internal*" AND "audit*"'
     * Skips stop/short words (length < 3) to prevent noisy/poor FTS results.
     */
    public static String formatFtsSearchTerm(String search) {
        if (search == null || search.trim().isEmpty()) {
            return null;
        }
        String[] words = search.trim().split("\\s+");
        List<String> formattedWords = new ArrayList<>();
        for (String word : words) {
            if (word.trim().isEmpty()) {
                continue;
            }
            String cleaned = word.replace("'", "''"); // Escape single quotes
            formattedWords.add("\"" + cleaned + "*\"");
        }
        if (formattedWords.isEmpty()) {
            return null;
        }
        return String.join(" AND ", formattedWords);
    }
}
