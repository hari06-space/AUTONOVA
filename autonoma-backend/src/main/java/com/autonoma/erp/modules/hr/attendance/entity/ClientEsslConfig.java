package com.autonoma.erp.modules.hr.attendance.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Entity
@Table(name = "CLIENT_ESSL_CONFIG")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClientEsslConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "CLIENT_ID", nullable = false, unique = true, length = 50)
    private String clientId;

    @Column(name = "CLIENT_NAME", nullable = false, length = 200)
    private String clientName;

    @Column(name = "JDBC_URL", nullable = false, length = 500)
    private String jdbcUrl;

    @Column(name = "USERNAME", nullable = false, length = 100)
    private String username;

    @Column(name = "PASSWORD", nullable = false, length = 200)
    private String password;

    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId; }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }
    public String getJdbcUrl() { return jdbcUrl; }
    public void setJdbcUrl(String jdbcUrl) { this.jdbcUrl = jdbcUrl; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getEsslTableName() { return esslTableName; }
    public void setEsslTableName(String esslTableName) { this.esslTableName = esslTableName; }
    public String getEmpCdColumn() { return empCdColumn; }
    public void setEmpCdColumn(String empCdColumn) { this.empCdColumn = empCdColumn; }
    public String getDateColumn() { return dateColumn; }
    public void setDateColumn(String dateColumn) { this.dateColumn = dateColumn; }
    public String getInTimeColumn() { return inTimeColumn; }
    public void setInTimeColumn(String inTimeColumn) { this.inTimeColumn = inTimeColumn; }
    public String getOutTimeColumn() { return outTimeColumn; }
    public void setOutTimeColumn(String outTimeColumn) { this.outTimeColumn = outTimeColumn; }
    public String getSyncMode() { return syncMode; }
    public void setSyncMode(String syncMode) { this.syncMode = syncMode; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public Date getCreatedDate() { return createdDate; }
    public void setCreatedDate(Date createdDate) { this.createdDate = createdDate; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public Date getUpdatedDate() { return updatedDate; }
    public void setUpdatedDate(Date updatedDate) { this.updatedDate = updatedDate; }

    @Column(name = "ESSL_TABLE_NAME", nullable = false, length = 128)
    private String esslTableName = "ESSL_ATTENDANCE_LOG";

    @Column(name = "EMP_CD_COLUMN", nullable = false, length = 64)
    private String empCdColumn = "EMP_CD";

    @Column(name = "DATE_COLUMN", nullable = false, length = 64)
    private String dateColumn = "ATTENDANCE_DATE";

    @Column(name = "IN_TIME_COLUMN", nullable = false, length = 64)
    private String inTimeColumn = "IN_TIME";

    @Column(name = "OUT_TIME_COLUMN", nullable = false, length = 64)
    private String outTimeColumn = "OUT_TIME";

    /** MONTHLY = sync by month/year; POLLING = last 24 hours via CHECKTIME */
    @Column(name = "SYNC_MODE", nullable = false, length = 20)
    private String syncMode = "MONTHLY";

    @Column(name = "IS_ACTIVE")
    private Boolean isActive = true;

    @Column(name = "CREATED_BY", length = 50)
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
        if (createdDate == null) {
            createdDate = new Date();
        }
        if (isActive == null) {
            isActive = true;
        }
        if (syncMode == null || syncMode.isBlank()) {
            syncMode = "MONTHLY";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedDate = new Date();
    }
}
