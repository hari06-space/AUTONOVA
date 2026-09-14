package com.autonoma.erp.config;

public class DivisionContextHolder {
    private static final ThreadLocal<Long> CONTEXT = new InheritableThreadLocal<>();

    public static void setDivisionId(Long divisionId) {
        CONTEXT.set(divisionId);
    }

    public static Long getDivisionId() {
        return CONTEXT.get();
    }

    public static void clear() {
        CONTEXT.remove();
    }
}
