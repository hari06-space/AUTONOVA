package com.autonoma.erp.config;

public class MigrationCredentialsContext {
    private static final ThreadLocal<String> threadLocalIp = new ThreadLocal<>();
    private static final ThreadLocal<String> threadLocalUsername = new ThreadLocal<>();
    private static final ThreadLocal<String> threadLocalPassword = new ThreadLocal<>();

    public static void setCredentials(String ip, String username, String password) {
        threadLocalIp.set(ip);
        threadLocalUsername.set(username);
        threadLocalPassword.set(password);
    }

    public static void clear() {
        threadLocalIp.remove();
        threadLocalUsername.remove();
        threadLocalPassword.remove();
    }

    public static String getIp() {
        return threadLocalIp.get();
    }

    public static String getUsername() {
        return threadLocalUsername.get();
    }

    public static String getPassword() {
        return threadLocalPassword.get();
    }
}
