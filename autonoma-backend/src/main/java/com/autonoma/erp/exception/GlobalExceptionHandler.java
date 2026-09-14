package com.autonoma.erp.exception;

import com.autonoma.erp.service.admin.BackendErrorLoggerService;
import com.autonoma.erp.util.SecurityUtils;
import com.autonoma.erp.util.LogContextHolder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @Autowired
    private BackendErrorLoggerService backendErrorLoggerService;

    private void logException(Exception ex, WebRequest request, HttpStatus status) {
        try {
            String path = "";
            String method = "";
            if (request instanceof ServletWebRequest) {
                jakarta.servlet.http.HttpServletRequest servletReq = ((ServletWebRequest) request).getRequest();
                path = servletReq.getRequestURI();
                method = servletReq.getMethod();
            } else {
                path = request.getDescription(false);
            }

            String username = SecurityUtils.getCurrentUserId();
            // Trigger asynchronous logging safely to DB
            backendErrorLoggerService.logError(ex, method, path, username, status.value(), null, null);
        } catch (Throwable t) {
            System.err.println("[CRITICAL] GlobalExceptionHandler failed to trigger error log to DB: " + t.getMessage());
        }
    }

    private Map<String, Object> createErrorBody(String userFriendlyMessage, WebRequest request, String transactionId) {
        Map<String, Object> body = new HashMap<>();
        body.put("success", false);
        body.put("timestamp", LocalDateTime.now());
        body.put("message", userFriendlyMessage);
        body.put("transactionId", transactionId);
        if (request instanceof ServletWebRequest) {
            body.put("path", ((ServletWebRequest) request).getRequest().getRequestURI());
        } else {
            body.put("path", request.getDescription(false));
        }
        return body;
    }

    @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
    public Object handleNoResourceFoundException(org.springframework.web.servlet.resource.NoResourceFoundException ex, WebRequest request) {
        String path = "";
        if (request instanceof ServletWebRequest) {
            jakarta.servlet.http.HttpServletRequest servletReq = ((ServletWebRequest) request).getRequest();
            path = servletReq.getRequestURI();
        } else {
            path = request.getDescription(false);
        }

        // For non-API, non-error, non-ws frontend routes, serve index.html to support SPA client-side routing.
        // When path IS /index.html it means the forward itself failed (static resource not resolved
        // by the MVC stack), so we serve the file directly from the classpath to break the loop.
        if (path != null && !path.startsWith("/api/") && !path.startsWith("/error") && !path.startsWith("/ws/") && !path.startsWith("/ws")) {
            if (path.equals("/index.html")) {
                // Serve index.html directly from classpath to avoid forward loop
                try {
                    ClassPathResource resource = new ClassPathResource("static/index.html");
                    if (resource.exists()) {
                        String html = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
                        return ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(html);
                    }
                } catch (IOException ioEx) {
                    log.debug("Failed to serve index.html from classpath: {}", ioEx.getMessage());
                }
                Map<String, Object> body = createErrorBody("Resource not found", request, LogContextHolder.getTransactionId());
                return new ResponseEntity<>(body, HttpStatus.NOT_FOUND);
            }
            return new org.springframework.web.servlet.ModelAndView("forward:/index.html");
        }

        log.warn("Resource not found: {} - Message: {}", path, ex.getMessage());
        Map<String, Object> body = createErrorBody("Resource not found", request, LogContextHolder.getTransactionId());
        return new ResponseEntity<>(body, HttpStatus.NOT_FOUND);
    }

    @org.springframework.web.bind.annotation.ExceptionHandler(BusinessException.class)
    public ResponseEntity<Object> handleBusinessException(BusinessException ex, WebRequest request) {
        log.warn("Business rule violation: {}", ex.getMessage());
        Map<String, Object> body = createErrorBody(ex.getMessage(), request, LogContextHolder.getTransactionId());
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    @org.springframework.web.bind.annotation.ExceptionHandler({
        org.springframework.jdbc.CannotGetJdbcConnectionException.class,
        org.hibernate.exception.JDBCConnectionException.class
    })
    public ResponseEntity<Object> handleDatabaseConnectionException(Exception ex, WebRequest request) {
        String txId = LogContextHolder.getTransactionId();
        log.error("Database Connection Failure. TX: {} | Reason: {}", txId, ex.getMessage(), ex);
        logException(ex, request, HttpStatus.SERVICE_UNAVAILABLE);

        String dbErrorMessage = "Unable to connect to the SQL Server database.\n" +
                "Verify:\n" +
                "- SQL Server service is running.\n" +
                "- Host is reachable.\n" +
                "- TCP/IP is enabled.\n" +
                "- SQL Server is listening on the configured port.\n" +
                "- Firewall allows SQL Server traffic.\n" +
                "- Connection string is correct.\n" +
                "- Remote connections are enabled.";

        Map<String, Object> body = createErrorBody(dbErrorMessage, request, txId);
        return new ResponseEntity<>(body, HttpStatus.SERVICE_UNAVAILABLE);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleAllExceptions(Exception ex, WebRequest request) {
        String txId = LogContextHolder.getTransactionId();
        log.error("Internal Server Error occurred. TX: {} | Reason: {}", txId, ex.getMessage(), ex);
        logException(ex, request, HttpStatus.INTERNAL_SERVER_ERROR);

        Map<String, Object> body = createErrorBody("An internal server error occurred. Please contact the administrator.", request, txId);
        return new ResponseEntity<>(body, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(org.springframework.web.HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Object> handleMethodNotSupported(org.springframework.web.HttpRequestMethodNotSupportedException ex, WebRequest request) {
        String txId = LogContextHolder.getTransactionId();
        log.warn("HTTP Method not supported. TX: {} | Reason: {}", txId, ex.getMessage());
        Map<String, Object> body = createErrorBody("HTTP method not allowed for this endpoint.", request, txId);
        return new ResponseEntity<>(body, HttpStatus.METHOD_NOT_ALLOWED);
    }

    @ExceptionHandler(org.springframework.web.HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<Object> handleHttpMediaTypeNotSupported(org.springframework.web.HttpMediaTypeNotSupportedException ex, WebRequest request) {
        String txId = LogContextHolder.getTransactionId();
        log.warn("Media type not supported. TX: {} | Reason: {}", txId, ex.getMessage());
        Map<String, Object> body = createErrorBody("Content-Type is not supported.", request, txId);
        return new ResponseEntity<>(body, HttpStatus.UNSUPPORTED_MEDIA_TYPE);
    }

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<Object> handleAccessDeniedException(org.springframework.security.access.AccessDeniedException ex, WebRequest request) {
        String txId = LogContextHolder.getTransactionId();
        log.warn("Access denied exception. TX: {} | Reason: {}", txId, ex.getMessage());
        logException(ex, request, HttpStatus.FORBIDDEN);

        Map<String, Object> body = createErrorBody(ex.getMessage() != null ? ex.getMessage() : "Access Denied.", request, txId);
        return new ResponseEntity<>(body, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Object> handleRuntimeException(RuntimeException ex, WebRequest request) {
        String txId = LogContextHolder.getTransactionId();
        log.error("Runtime exception encountered. TX: {} | Reason: {}", txId, ex.getMessage(), ex);
        logException(ex, request, HttpStatus.BAD_REQUEST);

        String msg = (ex.getMessage() != null && !ex.getMessage().trim().isEmpty()) ? ex.getMessage() : "Failed to process request due to a server runtime issue.";
        Map<String, Object> body = createErrorBody(msg, request, txId);
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(com.autonoma.erp.modules.platform.identity.exception.LicenseValidationException.class)
    public ResponseEntity<Map<String, Object>> handleLicenseValidationException(com.autonoma.erp.modules.platform.identity.exception.LicenseValidationException ex, WebRequest request) {
        log.warn("License validation failure: {}", ex.getMessage());
        Map<String, Object> body = createErrorBody(ex.getMessage(), request, LogContextHolder.getTransactionId());
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Object> handleIllegalArgument(IllegalArgumentException ex, WebRequest request) {
        String txId = LogContextHolder.getTransactionId();
        log.warn("Illegal argument exception. TX: {} | Reason: {}", txId, ex.getMessage());
        logException(ex, request, HttpStatus.BAD_REQUEST);

        Map<String, Object> body = createErrorBody(ex.getMessage() != null ? ex.getMessage() : "Invalid argument passed in request.", request, txId);
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<Object> handleDataIntegrityViolation(org.springframework.dao.DataIntegrityViolationException ex, WebRequest request) {
        String txId = LogContextHolder.getTransactionId();
        log.error("Data integrity violation. TX: {} | Reason: {}", txId, ex.getMessage(), ex);
        logException(ex, request, HttpStatus.CONFLICT);

        String userFriendlyMessage = "Database integrity constraint violation (e.g. key duplication, null fields, check constraints).";
        String rootMsg = ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : (ex.getMessage() != null ? ex.getMessage() : "");
        String message = ex.getMessage() != null ? ex.getMessage() : "";
        if (rootMsg.contains("UQ_QMS_MOM_MASTER_SCHEDULE_ID") || message.contains("UQ_QMS_MOM_MASTER_SCHEDULE_ID")) {
            userFriendlyMessage = "Minutes of Meeting has already been created for this Meeting Schedule.";
        } else if (message.contains("UQ_FA_ACCOUNT_LEDGER_SHORT_NAME") || rootMsg.contains("UQ_FA_ACCOUNT_LEDGER_SHORT_NAME")) {
            userFriendlyMessage = "Short Name already exists. Please choose a different Short Name.";
        } else if (message.contains("UQ_FA_ACCOUNT_LEDGER_CODE") || rootMsg.contains("UQ_FA_ACCOUNT_LEDGER_CODE")) {
            userFriendlyMessage = "Reference Code already exists. Please choose a different Reference Code.";
        } else if (message.contains("UQ_FA_ACCOUNT_LEDGER_LEDGER_NAME") || message.contains("UQ_FA_ACCOUNT_LEDGER_NAME") || rootMsg.contains("UQ_FA_ACCOUNT_LEDGER_LEDGER_NAME") || rootMsg.contains("UQ_FA_ACCOUNT_LEDGER_NAME")) {
            userFriendlyMessage = "Name already exists. Please choose a different Name.";
        } else if (message.contains("UQ_MST_COUNTRY_NAME") || rootMsg.contains("UQ_MST_COUNTRY_NAME")) {
            userFriendlyMessage = "Country Name already exists.";
        } else if (rootMsg.contains("Cannot insert duplicate key") || rootMsg.contains("Violation of UNIQUE KEY constraint")) {
            if (rootMsg.contains("FA_ACCOUNT_LEDGER")) {
                userFriendlyMessage = "Already this customer exists.";
            } else if (rootMsg.contains("SALES_ENQUIRY_HEADER")) {
                userFriendlyMessage = "Already this enquiry exists.";
            } else if (rootMsg.contains("SALES_QUOTATION_HEADER")) {
                userFriendlyMessage = "Already this quotation exists.";
            } else {
                userFriendlyMessage = "Duplicate record detected. The record you are trying to create already exists.";
            }
        } else if (rootMsg.contains("Cannot insert the value NULL")) {
            userFriendlyMessage = "A required field is missing: " + rootMsg.substring(0, Math.min(rootMsg.length(), 200));
        } else if (rootMsg.contains("NonUniqueObjectException") || rootMsg.contains("already associated with the session")) {
            userFriendlyMessage = "Session conflict error. Please retry the operation.";
        }

        Map<String, Object> body = createErrorBody(userFriendlyMessage, request, txId);
        body.put("detail", rootMsg.length() > 300 ? rootMsg.substring(0, 300) : rootMsg);
        return new ResponseEntity<>(body, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(org.springframework.web.server.ResponseStatusException.class)
    public ResponseEntity<Object> handleResponseStatusException(org.springframework.web.server.ResponseStatusException ex, WebRequest request) {
        String txId = LogContextHolder.getTransactionId();
        log.warn("Response status exception. TX: {} | Status: {} | Reason: {}", txId, ex.getStatusCode(), ex.getReason());
        Map<String, Object> body = createErrorBody(ex.getReason() != null ? ex.getReason() : "Request processing failed.", request, txId);
        return new ResponseEntity<>(body, ex.getStatusCode());
    }

    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    public ResponseEntity<Object> handleHttpMessageNotReadable(org.springframework.http.converter.HttpMessageNotReadableException ex, WebRequest request) {
        String txId = LogContextHolder.getTransactionId();
        log.error("Malformed HTTP request payload. TX: {} | Reason: {}", txId, ex.getMessage(), ex);
        Map<String, Object> body = createErrorBody("Malformed JSON or request payload format.", request, txId);
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(org.springframework.transaction.TransactionSystemException.class)
    public ResponseEntity<Object> handleTransactionSystem(org.springframework.transaction.TransactionSystemException ex, WebRequest request) {
        logException(ex, request, HttpStatus.BAD_REQUEST);

        Throwable cause = ex.getRootCause();
        String message = "Transaction commit failed: ";
        
        if (cause instanceof jakarta.validation.ConstraintViolationException) {
            jakarta.validation.ConstraintViolationException cve = (jakarta.validation.ConstraintViolationException) cause;
            String violations = cve.getConstraintViolations().stream()
                    .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                    .collect(java.util.stream.Collectors.joining(", "));
            message += "Validation failed: " + violations;
        } else if (cause != null) {
            message += cause.getMessage();
        } else {
            message += ex.getMessage();
        }

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("message", message);
        body.put("details", ex.getMessage());
        body.put("path", request.getDescription(false));

        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(org.springframework.orm.jpa.JpaSystemException.class)
    public ResponseEntity<Object> handleJpaSystem(org.springframework.orm.jpa.JpaSystemException ex, WebRequest request) {
        logException(ex, request, HttpStatus.BAD_REQUEST);
        
        Throwable cause = ex.getRootCause();
        String message = "JPA system error: " + (cause != null ? cause.getMessage() : ex.getMessage());
        
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("message", message);
        body.put("details", ex.getMessage());
        body.put("path", request.getDescription(false));
        
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(org.apache.catalina.connector.ClientAbortException.class)
    public void handleClientAbortException(org.apache.catalina.connector.ClientAbortException ex) {
        log.warn("Client aborted request/connection: {}", ex.getMessage());
    }

    @ExceptionHandler(org.springframework.web.context.request.async.AsyncRequestNotUsableException.class)
    public void handleAsyncRequestNotUsableException(org.springframework.web.context.request.async.AsyncRequestNotUsableException ex) {
        log.warn("Async request not usable (client disconnected): {}", ex.getMessage());
    }
}

