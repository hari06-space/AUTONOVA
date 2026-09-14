package com.autonoma.erp.config;

import com.autonoma.erp.model.admin.AuditTrail;
import com.autonoma.erp.service.admin.AuditTrailService;


import com.autonoma.erp.util.AuditContextHolder;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.hibernate.Interceptor;
import org.hibernate.type.Type;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class GlobalAuditInterceptor implements Interceptor {

    @Autowired
    @Lazy
    private com.autonoma.erp.service.admin.AuditTrailService auditTrailService;

    @Autowired
    @Lazy
    private ObjectMapper objectMapper;

    @Autowired
    @Lazy
    private com.autonoma.erp.modules.qms.checklist.service.ChecklistService checklistService;

    @Override
    public boolean onFlushDirty(Object entity, Serializable id, Object[] currentState, Object[] previousState,
            String[] propertyNames, Type[] types) {
        if (shouldSkip(entity)) {
            return false;
        }

        List<String> changes = new ArrayList<>();
        StringBuilder prevValues = new StringBuilder();
        StringBuilder currValues = new StringBuilder();

        for (int i = 0; i < propertyNames.length; i++) {
            String propName = propertyNames[i];

            // Skip standard audit columns as requested by the user
            if (propName.equalsIgnoreCase("updatedBy") || propName.equalsIgnoreCase("createdBy") ||
                    propName.equalsIgnoreCase("updatedDate") || propName.equalsIgnoreCase("createdDate") ||
                    propName.equalsIgnoreCase("updated_at") || propName.equalsIgnoreCase("created_at")) {
                continue;
            }

            if (previousState != null && isChanged(previousState[i], currentState[i])) {
                changes.add(propName);
                prevValues.append(propName).append(": ").append(previousState[i]).append("; ");
                currValues.append(propName).append(": ").append(currentState[i]).append("; ");
            }
        }

        if (!changes.isEmpty()) {
            String tableName = entity.getClass().getSimpleName();
            String comments = "Updated " + tableName + " - changed fields: " + String.join(", ", changes);
            saveAuditTrail("UPDATE", tableName, id.toString(), prevValues.toString(), currValues.toString(), comments);
            triggerDynamicChecklistAfterCommit("ON_UPDATE", entity);
        }

        return false;
    }

    @Override
    public boolean onSave(Object entity, Serializable id, Object[] state, String[] propertyNames, Type[] types) {
        if (shouldSkip(entity)) {
            return false;
        }

        String tableName = entity.getClass().getSimpleName();
        StringBuilder currValues = new StringBuilder();

        for (int i = 0; i < propertyNames.length; i++) {
            String propName = propertyNames[i];

            // Skip standard audit columns
            if (propName.equalsIgnoreCase("updatedBy") || propName.equalsIgnoreCase("createdBy") ||
                    propName.equalsIgnoreCase("updatedDate") || propName.equalsIgnoreCase("createdDate") ||
                    propName.equalsIgnoreCase("updated_at") || propName.equalsIgnoreCase("created_at")) {
                continue;
            }

            currValues.append(propName).append(": ").append(state[i]).append("; ");
        }

        String identifier = detectIdentifier(state, propertyNames);
        String comments = "Created " + tableName + (identifier.isEmpty() ? "" : ": " + identifier);
        saveAuditTrail("INSERT", tableName, id != null ? id.toString() : "NEW", null, currValues.toString(), comments);
        triggerDynamicChecklistAfterCommit("ON_SAVE", entity);
        return false;
    }

    @Override
    public void onDelete(Object entity, Serializable id, Object[] state, String[] propertyNames, Type[] types) {
        if (shouldSkip(entity)) {
            return;
        }

        String tableName = entity.getClass().getSimpleName();
        String identifier = detectIdentifier(state, propertyNames);
        String jsonState = "";

        try {
            Map<String, Object> stateMap = new HashMap<>();
            // Include ID in the state map for easier restoration
            stateMap.put("id", id);
            for (int i = 0; i < propertyNames.length; i++) {
                stateMap.put(propertyNames[i], state[i]);
            }
            jsonState = objectMapper.writeValueAsString(stateMap);
        } catch (Exception e) {
            // Fallback to simple string if JSON fails
            jsonState = "Serialization Error: " + e.getMessage();
        }

        String comments = "Deleted " + tableName + (identifier.isEmpty() ? "" : ": " + identifier);
        saveAuditTrail("DELETE", tableName, id.toString(), jsonState, null, comments);
    }

    private String detectIdentifier(Object[] state, String[] propertyNames) {
        String identifier = "";
        if (state != null && propertyNames != null) {
            for (int i = 0; i < propertyNames.length; i++) {
                String name = propertyNames[i].toLowerCase();
                // Priority detection: name, code, title, number, no, id
                if (name.contains("name") || name.contains("code") || name.contains("title") ||
                        name.contains("no") || name.contains("number") || name.contains("id")) {

                    if (state[i] != null && !state[i].toString().isEmpty()) {
                        String value = state[i].toString();
                        // If it's a 'name' or 'code', we prefer it immediately
                        if (name.contains("name") || name.contains("code") || name.contains("title")) {
                            return value;
                        }
                        // Otherwise, store it and keep looking for a better one
                        identifier = value;
                    }
                }
            }
        }
        return identifier;
    }

    private boolean isChanged(Object oldVal, Object newVal) {
        if (oldVal == null && newVal == null)
            return false;
        if (oldVal == null || newVal == null)
            return true;
        return !oldVal.equals(newVal);
    }

    private boolean shouldSkip(Object entity) {
        if (com.autonoma.erp.util.AuditContextHolder.isSkipAudit()) {
            return true;
        }

        if (entity instanceof com.autonoma.erp.model.admin.AuditTrail) {
            return true;
        }

        String className = entity.getClass().getSimpleName();
        // Skip session monitoring and user activity data as requested
        if (className.equals("UserSession") ||
                className.equals("UserSessionActivity") ||
                className.equals("EmployeeActivity") ||
                className.equals("UserThemeSetting")) {
            return true;
        }

        // Skip chat/oneconnect messaging and channel details as requested
        if (entity.getClass().getName().startsWith("com.autonoma.erp.model.chat") ||
                className.equals("CommMessage") ||
                className.equals("CommChannel") ||
                className.equals("CommChannelMember") ||
                className.equals("CommUserStatus")) {
            return true;
        }

        return false;
    }

    private void saveAuditTrail(String actionType, String tableName, String recordId, String prevVal, String currVal,
            String comments) {
        // Capture context in the current thread before moving to async
        String userId = AuditContextHolder.getUserId();
        String pageName = AuditContextHolder.getPageName();

        // Ensure audit is only saved if the transaction commits successfully
        if (org.springframework.transaction.support.TransactionSynchronizationManager.isActualTransactionActive()) {
            org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                    new org.springframework.transaction.support.TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            // Hand off to async service ONLY after successful commit
                            auditTrailService.saveAuditTrailAsync(actionType, tableName, recordId, prevVal, currVal,
                                    comments, userId, pageName);
                        }
                    });
        } else {
            // If no active transaction (unlikely in this context), save directly/async
            auditTrailService.saveAuditTrailAsync(actionType, tableName, recordId, prevVal, currVal, comments, userId,
                    pageName);
        }
    }

    private void triggerDynamicChecklistAfterCommit(String eventTrigger, Object entity) {
        String pageName = com.autonoma.erp.util.AuditContextHolder.getPageName();
        if (pageName == null || pageName.trim().isEmpty() || shouldSkip(entity)) {
            return;
        }

        if (org.springframework.transaction.support.TransactionSynchronizationManager.isActualTransactionActive()) {
            org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                    new org.springframework.transaction.support.TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            try {
                                checklistService.triggerDynamicChecklists(pageName, eventTrigger, entity);
                            } catch (Exception e) {
                                System.err.println("Error running dynamic checklist trigger: " + e.getMessage());
                            }
                        }
                    });
        } else {
            try {
                checklistService.triggerDynamicChecklists(pageName, eventTrigger, entity);
            } catch (Exception e) {
                System.err.println("Error running dynamic checklist trigger: " + e.getMessage());
            }
        }
    }
}
