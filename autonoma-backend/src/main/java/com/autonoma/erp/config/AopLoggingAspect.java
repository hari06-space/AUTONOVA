package com.autonoma.erp.config;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Collections;
import java.util.IdentityHashMap;
import java.util.Set;

@Aspect
@Component
public class AopLoggingAspect {

    private static final Logger log = LoggerFactory.getLogger(AopLoggingAspect.class);

    // ThreadLocal to keep track of exceptions that have already been logged in the
    // call stack of the current thread
    private static final ThreadLocal<Set<Throwable>> loggedExceptions = ThreadLocal
            .withInitial(() -> Collections.newSetFromMap(new IdentityHashMap<>()));

    @Pointcut("within(@org.springframework.web.bind.annotation.RestController *) || within(@org.springframework.web.bind.annotation.ControllerAdvice *)")
    public void controllerPointcut() {
    }

    // Restrict aspect to REST controllers to eliminate reflection/proxy overhead on repositories and internal services
    @Pointcut("controllerPointcut()")
    public void applicationFlowPointcut() {
    }

    @Around("applicationFlowPointcut()")
    public Object logAround(ProceedingJoinPoint joinPoint) throws Throwable {
        String className = joinPoint.getSignature().getDeclaringTypeName();
        String methodName = joinPoint.getSignature().getName();
        String args = "";
        if (log.isDebugEnabled()) {
            try {
                args = Arrays.toString(joinPoint.getArgs());
            } catch (Exception e) {
                args = "[Error converting args to string]";
            }
        }

        if (log.isDebugEnabled()) {
            log.debug("Entering: {}.{}() with arguments = {}", className, methodName, args);
        }

        long start = System.currentTimeMillis();
        try {
            Object result = joinPoint.proceed();
            long elapsedTime = System.currentTimeMillis() - start;

            if (log.isDebugEnabled()) {
                String resultStr = result != null ? result.toString() : "null";
                if (resultStr.length() > 200) {
                    resultStr = resultStr.substring(0, 200) + "... [truncated]";
                }
                log.debug("Exiting: {}.{}() - Result = {} - Execution Time: {} ms", className, methodName, resultStr,
                        elapsedTime);
            } else {
                log.debug("Method executed: {}.{}() - Execution Time: {} ms", className, methodName, elapsedTime);
            }

            return result;
        } catch (Throwable throwable) {
            long elapsedTime = System.currentTimeMillis() - start;
            Set<Throwable> loggedSet = loggedExceptions.get();

            // Log exception only if it's the first time we see it in this thread
            if (!loggedSet.contains(throwable)) {
                loggedSet.add(throwable);
                if (throwable.getClass().getName().contains("jsonwebtoken")) {
                    log.warn("JWT validation failed in: {}.{}() after {} ms. Message: {}",
                            className, methodName, elapsedTime, throwable.getMessage());
                } else if (throwable instanceof org.springframework.dao.DataAccessException && className.contains("datamigration")) {
                    log.warn("DataAccessException in migration: {}.{}() after {} ms. Message: {}",
                            className, methodName, elapsedTime, throwable.getMessage());
                } else if (throwable instanceof java.io.FileNotFoundException) {
                    log.warn("File not found in: {}.{}() after {} ms. Message: {}",
                            className, methodName, elapsedTime, throwable.getMessage());
                } else {
                    log.error("Exception in: {}.{}() after {} ms. Message: {} | Stack Trace:",
                            className, methodName, elapsedTime, throwable.getMessage(), throwable);
                }
            } else {
                // Secondary logging at trace level just to record propagating step
                if (log.isTraceEnabled()) {
                    log.trace("Exception propagating through: {}.{}()", className, methodName);
                }
            }

            // If we are at the outermost boundaries of HTTP/Controller/Filter requests,
            // we should eventually clear the loggedExceptions map. However, to be perfectly
            // safe,
            // we will let the ApiLoggingFilter clear MDC and other contexts. Or we can
            // clear it if it's Controller level.
            if (className.contains("controller") || className.contains("Controller")) {
                // Outermost layer reached, clean thread local references to prevent memory
                // leakages
                loggedExceptions.remove();
            }

            throw throwable;
        }
    }
}
