package com.autonoma.erp.exception;

/**
 * Exception thrown for business rule violations (e.g. duplicate validation).
 * Returns HTTP 400 Bad Request via GlobalExceptionHandler.
 */
public class BusinessException extends RuntimeException {
    public BusinessException(String message) {
        super(message);
    }
}
