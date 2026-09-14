package com.autonoma.erp.modules.qmt.machineintegration.entity;

import com.autonoma.erp.modules.qmt.entity.Machine;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.util.Date;

@Entity
@Table(name = "QMT_MACHINE_INTEGRATION")
@Getter
@Setter
public class MachineIntegration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "MACHINE_ID_REF", nullable = false)
    private Long machineIdRef;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MACHINE_ID_REF", insertable = false, updatable = false)
    private Machine machine;

    // ---- Machine DB Connection ----
    @Column(name = "DB_TYPE", nullable = false, length = 50)
    private String dbType;

    @Column(name = "DB_HOST", nullable = false, length = 200)
    private String dbHost;

    @Column(name = "DB_PORT", nullable = false)
    private Integer dbPort;

    @Column(name = "DATABASE_NAME", nullable = false, length = 100)
    private String databaseName;

    @Column(name = "DB_USERNAME", nullable = false, length = 100)
    private String dbUsername;

    @Column(name = "DB_PASSWORD", nullable = false, length = 500)
    private String dbPassword;

    @Column(name = "PRODUCTION_TABLE_NAME", nullable = false, length = 100)
    private String productionTableName;

    // ---- Read Configuration ----
    /** Ordered comma-separated list of columns to SELECT from the machine DB table */
    @Column(name = "READ_COLUMNS", length = 2000)
    private String readColumns;

    @Column(name = "READ_SQL_QUERY", columnDefinition = "NVARCHAR(MAX)")
    private String readSqlQuery;

    @Column(name = "CUSTOM_READ_QUERY_ENABLED", nullable = false)
    private Boolean customReadQueryEnabled = false;

    // ---- Send / Write Configuration ----
    /** SQL query to run against our internal AT_NUTECH DB for data to send */
    @Column(name = "SEND_SQL_QUERY", columnDefinition = "NVARCHAR(MAX)")
    private String sendSqlQuery;

    /** TABLE = insert into machine DB table; FILE = write JSON to file path */
    @Column(name = "WRITE_MODE", length = 10)
    private String writeMode = "TABLE";

    /** Table name (for TABLE mode) or absolute file path (for FILE mode) */
    @Column(name = "TARGET_DESTINATION", length = 1000)
    private String targetDestination;

    // ---- Scheduler ----
    @Column(name = "SCHEDULE_ENABLED", nullable = false)
    private Boolean scheduleEnabled = false;

    @Column(name = "SCHEDULE_INTERVAL_SECONDS", nullable = false)
    private Integer scheduleIntervalSeconds = 60;

    @Column(name = "LAST_RUN_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date lastRunDate;

    // ---- Read Scheduler ----
    @Column(name = "READ_SCHEDULE_ENABLED", nullable = false)
    private Boolean readScheduleEnabled = false;

    @Column(name = "READ_SCHEDULE_INTERVAL_SECONDS", nullable = false)
    private Integer readScheduleIntervalSeconds = 60;

    @Column(name = "READ_LAST_RUN_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date readLastRunDate;

    @Column(name = "ACTIVE", nullable = false)
    private Boolean active = true;

    @Column(name = "FILE_LOG_PATH", length = 1000)
    private String fileLogPath;

    @Column(name = "LAST_RUN_MESSAGE", length = 1000)
    private String lastRunMessage;

    @Column(name = "READ_LAST_RUN_MESSAGE", length = 1000)
    private String readLastRunMessage;

    // ---- Audit fields ----
    @Column(name = "CREATED_BY", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "CREATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate;

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedDate;

    @PrePersist
    protected void onCreate() {
        String user = resolveCurrentUser();
        this.createdBy = user;
        this.updatedBy = null;
        this.updatedDate = null;
        this.createdDate = new Date();
        if (this.active == null) this.active = true;
        if (this.scheduleEnabled == null) this.scheduleEnabled = false;
        if (this.writeMode == null) this.writeMode = "TABLE";
    }

    @PreUpdate
    protected void onUpdate() {
        if (this.createdDate != null && (new Date().getTime() - this.createdDate.getTime() < 5000)) {
            return;
        }
        String user = resolveCurrentUser();
        this.updatedBy = user;
        if (this.createdBy == null || this.createdBy.trim().isEmpty()) {
            this.createdBy = user;
        }
        this.updatedDate = new Date();
    }

    private static String resolveCurrentUser() {
        String user = null;
        try { user = com.autonoma.erp.util.SecurityUtils.getCurrentUserId(); } catch (Exception ignored) {}
        return (user != null && !user.trim().isEmpty()) ? user : "Admin";
    }
}
