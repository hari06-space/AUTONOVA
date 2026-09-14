package com.autonoma.erp.config.essl;

/**
 * Thread-local holder for the active ESSL client context during multi-tenant sync.
 */
public final class EsslDataSourceContextHolder {

    private static final ThreadLocal<String> contextHolder = new ThreadLocal<>();

    private EsslDataSourceContextHolder() {}

    public static void setClientId(String clientId) {
        contextHolder.set(clientId);
    }

    public static String getClientId() {
        return contextHolder.get();
    }

    public static void clear() {
        contextHolder.remove();
    }
}
