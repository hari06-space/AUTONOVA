package com.autonoma.erp.security.license;

import java.lang.management.ManagementFactory;
import java.util.List;

public class ExecutionEnvDetector {

    /**
     * Detects if the current process is running in development mode (IDE, Maven, Gradle, or Unit Tests).
     * Enforces license checks only for packaged executable JAR deployments.
     */
    public static boolean isDevOrBuildEnvironment() {
        // 0. Check environment variables and system properties for development profile
        String activeProfile = System.getenv("SPRING_PROFILES_ACTIVE");
        if (activeProfile == null) {
            activeProfile = System.getProperty("spring.profiles.active");
        }
        if (activeProfile != null && activeProfile.toLowerCase().contains("dev")) {
            return true;
        }
        if ("true".equalsIgnoreCase(System.getenv("DEV_MODE")) || "true".equalsIgnoreCase(System.getProperty("dev.mode"))) {
            return true;
        }

        // Class loader check: If the resource URL protocol is not "jar", it's running from raw folder class files (IDE or Maven/Gradle)
        try {
            java.net.URL resource = ExecutionEnvDetector.class.getResource("ExecutionEnvDetector.class");
            if (resource != null && !"jar".equals(resource.getProtocol())) {
                return true;
            }
        } catch (Exception e) {
            // Fallback to signature checks if error occurs
        }

        // 1. Check JVM input arguments for IDE or build tool agents/indicators
        List<String> inputArgs = ManagementFactory.getRuntimeMXBean().getInputArguments();
        for (String arg : inputArgs) {
            String lower = arg.toLowerCase();
            if (lower.contains("idea_rt.jar") || 
                lower.contains("eclipse") || 
                lower.contains("jdwp") || 
                lower.contains("gradle") || 
                lower.contains("surefire") || 
                lower.contains("junit")) {
                return true;
            }
        }

        // 2. Check system properties set by IDEs, Maven, or Gradle
        String classPath = System.getProperty("java.class.path", "").toLowerCase();
        if (classPath.contains("idea") || 
            classPath.contains("eclipse") || 
            classPath.contains("vscode") || 
            classPath.contains("junit") || 
            classPath.contains("surefire") || 
            classPath.contains("maven") || 
            classPath.contains("gradle-launcher")) {
            return true;
        }

        // 3. Inspect stack trace to see if we are spawned by JUnit, Maven, Gradle, or an IDE
        for (StackTraceElement element : Thread.currentThread().getStackTrace()) {
            String className = element.getClassName().toLowerCase();
            if (className.contains("junit") || 
                className.contains("org.testng") || 
                className.contains("maven") || 
                className.contains("gradle") || 
                className.contains("intellij") || 
                className.contains("eclipse") || 
                className.contains("com.microsoft.java.debug")) {
                return true;
            }
        }

        // 4. Check system properties
        if ("true".equalsIgnoreCase(System.getProperty("bypass.license")) ||
            "true".equalsIgnoreCase(System.getProperty("dev")) ||
            System.getProperty("idea.test.cyclic.buffer.size") != null ||
            System.getProperty("eclipse.application") != null ||
            System.getProperty("sun.java.command", "").toLowerCase().contains("maven") ||
            System.getProperty("sun.java.command", "").toLowerCase().contains("gradle") ||
            System.getProperty("sun.java.command", "").toLowerCase().contains("junit")) {
            return true;
        }

        // If none of the dev environments match, assume packaged JAR execution
        return false;
    }
}
