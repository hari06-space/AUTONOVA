package com.autonoma.erp.service.admin;

import com.autonoma.erp.model.admin.AuditTrail;
import com.autonoma.erp.model.admin.CompanyCredential;
import com.autonoma.erp.repository.admin.AuditTrailRepository;
import com.autonoma.erp.repository.admin.CompanyCredentialRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.lang.reflect.Field;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AuditTrailService {

    private static final Logger log = LoggerFactory.getLogger(AuditTrailService.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private AuditTrailRepository auditTrailRepository;

    @Autowired
    private CompanyCredentialService companyCredentialService;

    @Autowired
    private ObjectMapper objectMapper;

    private static Boolean cachedAuditLogEnabled = null;
    private static long cacheTimestamp = 0;
    private static final long CACHE_TTL_MS = 60000; // 1 minute

    /**
     * Saves an audit trail record asynchronously using a bounded task executor.
     */
    @Async("taskExecutor")
    public void saveAuditTrailAsync(String actionType, String tableName, String recordId, String prevVal,
            String currVal, String comments, String userId, String pageName) {
        saveAuditTrail(actionType, tableName, recordId, prevVal, currVal, comments, userId, pageName);
    }

    /**
     * Saves an audit trail record synchronously.
     */
    public void saveAuditTrail(String actionType, String tableName, String recordId, String prevVal,
            String currVal, String comments, String userId, String pageName) {

        // Check if audit logs are globally enabled in the company configuration
        try {
            long now = System.currentTimeMillis();
            if (cachedAuditLogEnabled == null || now - cacheTimestamp > CACHE_TTL_MS) {
                CompanyCredential company = companyCredentialService.getCompanyProfileForCurrentTenant().orElse(null);
                if (company != null) {
                    cachedAuditLogEnabled = company.getAuditLogEnabled();
                } else {
                    cachedAuditLogEnabled = false;
                }
                cacheTimestamp = now;
            }

            if (cachedAuditLogEnabled == null || !cachedAuditLogEnabled) {
                return; // Skip saving the audit trail if it is disabled
            }
        } catch (Exception e) {
            System.err.println("Failed to check audit log configuration: " + e.getMessage());
            return;
        }

        if (pageName == null) {
            pageName = tableName + " Page";
        }

        String sql = "INSERT INTO ad_audit_trail (user_id, page_name, action_type, table_name, record_id, previous_value, current_value, comments, created_DATE, created_by, is_restored) "
                +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, GETDATE(), ?, 0)";

        try {
            jdbcTemplate.update(sql, userId, pageName, actionType, tableName, recordId,
                    prevVal, currVal, comments, userId);
            log.info("[DB_CHANGE] Action: {} | Table: {} | RecordId: {} | User: {} | Comments: {}",
                    actionType, tableName, recordId, userId, comments);
        } catch (Exception e) {
            System.err.println("Failed to save audit trail: " + e.getMessage());
        }
    }

    /**
     * Restores a deleted record from the audit trail.
     */
    @Transactional
    public void restoreRecord(Long auditId) throws Exception {
        AuditTrail log = auditTrailRepository.findById(auditId)
                .orElseThrow(() -> new RuntimeException("Audit log not found"));

        if (!"DELETE".equalsIgnoreCase(log.getActionType())) {
            throw new RuntimeException("Only deleted records can be restored");
        }

        if (log.getIsRestored() != null && log.getIsRestored()) {
            throw new RuntimeException("This record has already been restored.");
        }

        CompanyCredential company = companyCredentialService.getCompanyProfileForCurrentTenant().orElse(null);
        if (company != null) {
            Integer days = company.getRestoreEnableDays();
            if (days != null && days > 0) {
                long diff = new Date().getTime() - log.getCreatedAt().getTime();
                long diffDays = diff / (24 * 60 * 60 * 1000);
                if (diffDays > days) {
                    throw new RuntimeException("Restoration period has expired (" + days + " days)");
                }
            }
        }

        String json = log.getPreviousValue();
        if (json == null || json.isEmpty()) {
            throw new RuntimeException("No backup data found in audit log");
        }

        Map<String, Object> data = objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {
        });

        // Attempt to find the entity class to get the correct table and column names
        String entityClassName = "com.autonoma.erp.model." + log.getTableName();
        Class<?> entityClass;
        try {
            entityClass = Class.forName(entityClassName);
        } catch (ClassNotFoundException e) {
            throw new RuntimeException("Entity class not found: " + entityClassName);
        }

        Table tableAnnotation = entityClass.getAnnotation(Table.class);
        String dbTableName = (tableAnnotation != null) ? tableAnnotation.name() : log.getTableName();

        // Map field names to column names
        Map<String, String> fieldToColumn = new HashMap<>();
        for (Field field : entityClass.getDeclaredFields()) {
            Column col = field.getAnnotation(Column.class);
            if (col != null) {
                fieldToColumn.put(field.getName(), col.name());
            } else {
                fieldToColumn.put(field.getName(), field.getName());
            }
        }

        List<String> columns = new ArrayList<>();
        List<Object> values = new ArrayList<>();

        for (Map.Entry<String, Object> entry : data.entrySet()) {
            String fieldName = entry.getKey();
            Object value = entry.getValue();

            // Skip ID if it's the primary key and we want auto-generation,
            // but usually we want to keep the same ID for history integrity.
            String colName = fieldToColumn.getOrDefault(fieldName, fieldName);
            columns.add(colName);
            values.add(value);
        }

        String colList = String.join(", ", columns);
        String placeholders = columns.stream().map(c -> "?").collect(Collectors.joining(", "));

        boolean hasId = columns.stream().anyMatch(c -> c.equalsIgnoreCase("id"));

        if (hasId) {
            jdbcTemplate.execute("SET IDENTITY_INSERT " + dbTableName + " ON");
        }

        String insertSql = "INSERT INTO " + dbTableName + " (" + colList + ") VALUES (" + placeholders + ")";
        try {
            jdbcTemplate.update(insertSql, values.toArray());
        } catch (org.springframework.dao.DuplicateKeyException e) {
            throw new RuntimeException(
                    "Cannot restore: A record with this ID or a unique field already exists in " + log.getTableName());
        } catch (Exception e) {
            throw new RuntimeException("Database error during restoration: " + e.getMessage());
        }

        if (hasId) {
            jdbcTemplate.execute("SET IDENTITY_INSERT " + dbTableName + " OFF");
        }

        // Update log status
        log.setIsRestored(true);
        log.setRestoredAt(new Date());
        log.setComments(log.getComments() + " (RESTORED ON " + new Date() + ")");
        auditTrailRepository.save(log);
    }
}
