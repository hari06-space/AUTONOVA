package com.autonoma.erp.config;

import com.autonoma.erp.service.realtime.RealtimeDataSyncPublisher;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;

/**
 * RealtimeMutationAspect — System-Wide Real-Time Mutation Interceptor
 * 
 * Automatically intercepts ALL HTTP POST, PUT, DELETE, and PATCH endpoints across
 * ALL REST Controllers in the application. Whenever any user saves, updates, verifies,
 * or deletes data anywhere in the system, this aspect automatically triggers a WebSocket
 * real-time broadcast so every connected browser table auto-fetches data instantly.
 */
@Aspect
@Component
@Slf4j
public class RealtimeMutationAspect {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(RealtimeMutationAspect.class);

    private final RealtimeDataSyncPublisher realtimeDataSyncPublisher;

    public RealtimeMutationAspect(RealtimeDataSyncPublisher realtimeDataSyncPublisher) {
        this.realtimeDataSyncPublisher = realtimeDataSyncPublisher;
    }

    /**
     * Pointcut targeting all mutation endpoints (@PostMapping, @PutMapping, @DeleteMapping, @PatchMapping)
     */
    @Pointcut("@annotation(org.springframework.web.bind.annotation.PostMapping) || " +
              "@annotation(org.springframework.web.bind.annotation.PutMapping) || " +
              "@annotation(org.springframework.web.bind.annotation.DeleteMapping) || " +
              "@annotation(org.springframework.web.bind.annotation.PatchMapping) || " +
              "@annotation(org.springframework.web.bind.annotation.RequestMapping)")
    public void controllerMutationMethods() {}

    @AfterReturning("controllerMutationMethods()")
    public void afterSuccessfulMutation(JoinPoint joinPoint) {
        try {
            String methodName = joinPoint.getSignature().getName();
            String className = joinPoint.getSignature().getDeclaringType().getSimpleName();
            
            // Skip read-only/getter methods if RequestMapping was intercepted
            String lowerName = methodName.toLowerCase();
            if (lowerName.startsWith("get") || lowerName.startsWith("find") || lowerName.startsWith("search") || lowerName.startsWith("fetch") || lowerName.startsWith("list")) {
                return;
            }

            // Skip manual WebSocket trigger endpoints to prevent loops
            if (methodName.contains("triggerNotifications") || methodName.contains("triggerScheduler")) {
                return;
            }

            log.info("[REALTIME_AOP] Mutation intercepted in {}.{} — Broadcasting real-time update", className, methodName);
            realtimeDataSyncPublisher.publishMutation(className, methodName);
        } catch (Exception e) {
            log.error("[REALTIME_AOP_FAILED] Failed to intercept mutation event: {}", e.getMessage());
        }
    }
}
