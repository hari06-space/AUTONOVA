package com.autonoma.erp.util;

import java.util.UUID;

public class LogContextHolder {
    private static final ThreadLocal<String> transactionId = new ThreadLocal<>();
    private static final ThreadLocal<String> currentModule = new ThreadLocal<>();

    public static void initContext(String module) {
        transactionId.set("TX-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        currentModule.set(module);
    }

    public static String getTransactionId() {
        String txId = transactionId.get();
        if (txId == null) {
            txId = "TX-SYSTEM";
        }
        return txId;
    }

    public static String getModule() {
        String mod = currentModule.get();
        if (mod == null) {
            mod = "SYSTEM";
        }
        return mod;
    }

    public static void clear() {
        transactionId.remove();
        currentModule.remove();
    }
}
