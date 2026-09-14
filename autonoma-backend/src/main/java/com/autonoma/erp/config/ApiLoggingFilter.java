package com.autonoma.erp.config;

import com.autonoma.erp.util.LogContextHolder;
import com.autonoma.erp.util.SecurityUtils;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Component
public class ApiLoggingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(ApiLoggingFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String uri = request.getRequestURI();
        
        // Skip logging for static assets and streaming/SSE endpoints
        if (uri.startsWith("/static/") || uri.endsWith(".js") || uri.endsWith(".css") || uri.endsWith(".png") || uri.endsWith(".ico")
                || uri.contains("/sse") || uri.contains("/stream") || uri.contains("/download") || uri.contains("/export")
                || uri.startsWith("/api/chat/connect/events")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Determine module name from URI
        String module = "SYSTEM";
        String lowerUri = uri.toLowerCase();
        if (lowerUri.contains("/qms")) {
            module = "QMS";
        } else if (lowerUri.contains("/induction")) {
            module = "INDUCTION";
        } else if (lowerUri.contains("/checklist")) {
            module = "CHECKLIST";
        } else if (lowerUri.contains("/audit")) {
            module = "AUDIT";
        } else if (lowerUri.contains("/admin")) {
            module = "ADMIN";
        } else if (lowerUri.contains("/master")) {
            module = "MASTER";
        } else if (lowerUri.contains("/purchase")) {
            module = "PURCHASE";
        } else if (lowerUri.contains("/sales")) {
            module = "SALES";
        } else if (lowerUri.contains("/inventory")) {
            module = "INVENTORY";
        } else if (lowerUri.contains("/finance")) {
            module = "FINANCE";
        }

        // Initialize LogContextHolder
        LogContextHolder.initContext(module);

        // Populate MDC properties for Logback configuration
        String username = SecurityUtils.getCurrentUserId();
        if (username == null) {
            username = "ANONYMOUS";
        }
        MDC.put("username", username);
        MDC.put("module", module);
        MDC.put("transactionId", LogContextHolder.getTransactionId());
        MDC.put("requestUrl", uri);

        ContentCachingRequestWrapper wrappedRequest = new ContentCachingRequestWrapper(request);
        ContentCachingResponseWrapper wrappedResponse = new ContentCachingResponseWrapper(response);

        long startTime = System.currentTimeMillis();

        try {
            filterChain.doFilter(wrappedRequest, wrappedResponse);
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            
            // Log Request Payload
            String method = wrappedRequest.getMethod();
            String requestPayload = "";
            byte[] requestBody = wrappedRequest.getContentAsByteArray();
            if (requestBody.length > 0) {
                requestPayload = new String(requestBody, StandardCharsets.UTF_8);
                if (requestPayload.length() > 1000) {
                    requestPayload = requestPayload.substring(0, 1000) + "... [truncated]";
                }
            } else {
                requestPayload = "{}";
            }

            log.debug("[HTTP_REQUEST] [{}] [{}] - User: {}, Payload: {}", method, uri, username, requestPayload.replaceAll("\\s+", " "));

            // Log Response Status
            int status = wrappedResponse.getStatus();
            log.debug("[HTTP_RESPONSE] [{}] [{}] - Status: {}, Duration: {}ms", method, uri, status, duration);

            // Copy back cached response content to client
            wrappedResponse.copyBodyToResponse();
            
            // Clean up both ThreadLocal and MDC to prevent memory/thread leakages
            LogContextHolder.clear();
            MDC.clear();
        }
    }
}

