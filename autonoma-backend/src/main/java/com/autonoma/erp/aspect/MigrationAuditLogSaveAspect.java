package com.autonoma.erp.aspect;

import com.autonoma.erp.model.admin.MigrationAuditLog;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class MigrationAuditLogSaveAspect {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Around("execution(* *..MigrationAuditLogRepository.save(..)) && args(auditLog)")
    public Object bypassSave(ProceedingJoinPoint joinPoint, MigrationAuditLog auditLog) throws Throwable {
        if (auditLog == null) {
            return null;
        }
        try {
            String sql = "INSERT INTO AD_MIGRATION_AUDIT_LOG (table_name, migrated_by, migrated_at, status, records_count, execution_time_ms, message) VALUES (?, ?, ?, ?, ?, ?, ?)";
            jdbcTemplate.update(sql,
                    auditLog.getTableName(),
                    auditLog.getMigratedBy(),
                    auditLog.getMigratedAt() != null ? auditLog.getMigratedAt() : new java.util.Date(),
                    auditLog.getStatus(),
                    auditLog.getRecordsCount(),
                    auditLog.getExecutionTimeMs(),
                    auditLog.getMessage());
            return auditLog;
        } catch (Exception e) {
            e.printStackTrace();
            // If the native JDBC insert fails, fall back to the actual JpaRepository save method
            return joinPoint.proceed();
        }
    }
}
