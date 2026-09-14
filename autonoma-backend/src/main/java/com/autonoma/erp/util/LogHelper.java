package com.autonoma.erp.util;

import org.slf4j.Logger;
import java.util.Map;
import java.util.stream.Collectors;

public class LogHelper {

    public static void info(Logger log, String className, String method, String message, Map<String, Object> metadata) {
        log.info(format("INFO", className, method, message, metadata));
    }

    public static void warn(Logger log, String className, String method, String message, Map<String, Object> metadata) {
        log.warn(format("WARN", className, method, message, metadata));
    }

    public static void error(Logger log, String className, String method, String message, Map<String, Object> metadata) {
        log.error(format("ERROR", className, method, message, metadata));
    }

    public static void error(Logger log, String className, String method, String message, Throwable t, Map<String, Object> metadata) {
        log.error(format("ERROR", className, method, message, metadata), t);
    }

    private static String format(String level, String className, String method, String message, Map<String, Object> metadata) {
        String txId = LogContextHolder.getTransactionId();
        String module = LogContextHolder.getModule();
        String metadataStr = metadata == null ? "{}" : "{" + 
            metadata.entrySet().stream()
                .map(e -> e.getKey() + "=" + (e.getValue() == null ? "null" : e.getValue().toString()))
                .collect(Collectors.joining(", ")) + "}";
        return String.format("[%s] [%s] [%s] [%s] [%s] - Message: %s, Metadata: %s",
            level, txId, module, className, method, message, metadataStr);
    }
}
