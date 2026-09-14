package com.autonoma.erp.model.admin;

import com.autonoma.erp.util.SecurityUtils;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "AD_MIGRATION_AUDIT_LOG")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MigrationAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "table_name", length = 100)
    private String tableName;

    @Column(name = "migrated_by", length = 50)
    private String migratedBy;

    @Column(name = "migrated_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date migratedAt;

    @Column(name = "status", length = 50)
    private String status; // SUCCESS, FAILED

    @Column(name = "records_count")
    private Integer recordsCount;

    @Column(name = "execution_time_ms")
    private Long executionTimeMs;

    @Column(name = "message", columnDefinition = "NVARCHAR(MAX)")
    private String message;

    @PrePersist
    protected void onCreate() {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }

        if (migratedAt == null) {
            migratedAt = new Date();
        }
    }

    public String getTableName() { return tableName; }
    public void setTableName(String tableName) { this.tableName = tableName; }
    public String getMigratedBy() { return migratedBy; }
    public void setMigratedBy(String migratedBy) { this.migratedBy = migratedBy; }
    public Date getMigratedAt() { return migratedAt; }
    public void setMigratedAt(Date migratedAt) { this.migratedAt = migratedAt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getRecordsCount() { return recordsCount; }
    public void setRecordsCount(int recordsCount) { this.recordsCount = recordsCount; }
    public Long getExecutionTimeMs() { return executionTimeMs; }
    public void setExecutionTimeMs(long executionTimeMs) { this.executionTimeMs = executionTimeMs; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private Long id; private String tableName; private String migratedBy;
        private Date migratedAt; private String status; private Integer recordsCount;
        private Long executionTimeMs; private String message;
        public Builder id(Long v) { this.id = v; return this; }
        public Builder tableName(String v) { this.tableName = v; return this; }
        public Builder migratedBy(String v) { this.migratedBy = v; return this; }
        public Builder migratedAt(Date v) { this.migratedAt = v; return this; }
        public Builder status(String v) { this.status = v; return this; }
        public Builder recordsCount(Integer v) { this.recordsCount = v; return this; }
        public Builder executionTimeMs(Long v) { this.executionTimeMs = v; return this; }
        public Builder message(String v) { this.message = v; return this; }
        public MigrationAuditLog build() {
            MigrationAuditLog e = new MigrationAuditLog();
            e.id = this.id; e.tableName = this.tableName; e.migratedBy = this.migratedBy;
            e.migratedAt = this.migratedAt; e.status = this.status;
            e.recordsCount = this.recordsCount; e.executionTimeMs = this.executionTimeMs;
            e.message = this.message;
            return e;
        }
    }
}
