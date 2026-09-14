package com.autonoma.erp.modules.platform.identity.entity;

import com.autonoma.erp.model.admin.CompanyCredential;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "CLI_CLIENT_DATABASE_CONFIG", indexes = {
    @Index(name = "IDX_CLI_DB_CLIENT_ID", columnList = "CLIENT_ID")
})
public class CliClientDatabaseConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "CLIENT_ID", nullable = false)
    private Long clientId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CLIENT_ID", referencedColumnName = "id", insertable = false, updatable = false, foreignKey = @ForeignKey(name = "FK_CLI_DB_COMPANY"))
    private CompanyCredential companyCredential;

    @Column(name = "DB_TYPE", length = 50)
    private String dbType;

    @Column(name = "DB_HOST", length = 150)
    private String dbHost;

    @Column(name = "DB_PORT")
    private Integer dbPort;

    @Column(name = "DB_NAME", length = 150)
    private String dbName;

    @Column(name = "DB_USERNAME", length = 100)
    private String dbUsername;

    @Column(name = "DB_PASSWORD", length = 500)
    private String dbPassword;

    @Column(name = "ESSL_SYNC_INTERVAL_MINUTES")
    private Integer esslSyncIntervalMinutes = 15;

    @Column(name = "CREATED_BY", length = 50)
    private String createdBy;

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "CREATED_AT", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "UPDATED_AT")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }

    public CompanyCredential getCompanyCredential() { return companyCredential; }
    public void setCompanyCredential(CompanyCredential companyCredential) { this.companyCredential = companyCredential; }

    public String getDbType() { return dbType; }
    public void setDbType(String dbType) { this.dbType = dbType; }

    public String getDbHost() { return dbHost; }
    public void setDbHost(String dbHost) { this.dbHost = dbHost; }

    public Integer getDbPort() { return dbPort; }
    public void setDbPort(Integer dbPort) { this.dbPort = dbPort; }

    public String getDbName() { return dbName; }
    public void setDbName(String dbName) { this.dbName = dbName; }

    public String getDbUsername() { return dbUsername; }
    public void setDbUsername(String dbUsername) { this.dbUsername = dbUsername; }

    public String getDbPassword() { return dbPassword; }
    public void setDbPassword(String dbPassword) { this.dbPassword = dbPassword; }

    public Integer getEsslSyncIntervalMinutes() {
        return (esslSyncIntervalMinutes == null || esslSyncIntervalMinutes < 10) ? 10 : esslSyncIntervalMinutes;
    }
    public void setEsslSyncIntervalMinutes(Integer esslSyncIntervalMinutes) {
        if (esslSyncIntervalMinutes != null && esslSyncIntervalMinutes < 10) {
            this.esslSyncIntervalMinutes = 10;
        } else {
            this.esslSyncIntervalMinutes = esslSyncIntervalMinutes;
        }
    }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
