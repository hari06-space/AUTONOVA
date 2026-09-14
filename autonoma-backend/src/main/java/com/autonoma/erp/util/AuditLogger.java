package com.autonoma.erp.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class AuditLogger {

    private static final Logger auditLog = LoggerFactory.getLogger("AUDIT_LOGGER");

    /**
     * Logs an audit record.
     *
     * @param action      The name of the business/admin action (e.g. CREATE_USER,
     *                    DELETE_CUSTOMER).
     * @param targetId    The ID of the affected resource or entity.
     * @param status      The result status of the operation (e.g. SUCCESS, FAILED).
     * @param description Short narrative explanation of what was changed.
     */
    public static void log(String action, Object targetId, String status, String description) {
        String msg = String.format("Action: %s | Target: %s | Status: %s | Description: %s",
                action,
                targetId != null ? targetId.toString() : "N/A",
                status,
                description != null ? description : "");
        auditLog.info(msg);
    }
}
