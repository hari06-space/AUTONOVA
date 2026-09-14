package com.autonoma.erp.util;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class AttachmentUtil {
    public static List<String> parseFileList(String filePaths) {
        if (filePaths == null || filePaths.trim().isEmpty()) {
            return Collections.emptyList();
        }
        String trimmed = filePaths.trim();
        List<String> list = new ArrayList<>();
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                list = mapper.readValue(trimmed, new com.fasterxml.jackson.core.type.TypeReference<List<String>>() {});
            } catch (Exception e) {
                // Ignore and fallback
            }
        }
        if (list == null || list.isEmpty()) {
            String[] parts = trimmed.split(",");
            for (String part : parts) {
                if (!part.trim().isEmpty()) {
                    list.add(part.trim());
                }
            }
        }
        return list;
    }

    public static String toJsonString(List<String> list) {
        if (list == null || list.isEmpty()) {
            return null;
        }
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            return mapper.writeValueAsString(list);
        } catch (Exception e) {
            return String.join(",", list);
        }
    }
}
