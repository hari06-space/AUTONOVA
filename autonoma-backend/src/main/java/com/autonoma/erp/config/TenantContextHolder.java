package com.autonoma.erp.config;

public class TenantContextHolder {
    private static final ThreadLocal<String> CONTEXT = new InheritableThreadLocal<>();

    public static void setTenantId(String tenantId) {
        CONTEXT.set(tenantId);
    }

    public static String getTenantId() {
        String t = CONTEXT.get();
        return (t != null && !t.trim().isEmpty()) ? t : AppUtil.AppConstants.DEFAULT_DB_SOURCE_NAME;
    }

    public static void clear() {
        CONTEXT.remove();
    }
}
