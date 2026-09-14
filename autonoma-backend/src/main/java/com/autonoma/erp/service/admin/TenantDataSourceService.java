package com.autonoma.erp.service.admin;

import com.autonoma.erp.config.DynamicRoutingDataSource;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;

@Service
public class TenantDataSourceService {

    @Autowired
    private DataSource dataSource;

    @Autowired
    @org.springframework.beans.factory.annotation.Qualifier("masterDataSource")
    private DataSource masterDataSource;

    @Autowired
    private DataSourceProperties dataSourceProperties;

    public String resolveActualDatabaseName(String tenantId) {
        if (tenantId == null || tenantId.trim().isEmpty()) {
            return "AUTONOMA";
        }
        String tid = tenantId.trim();

        try {
            String masterUrl = dataSourceProperties.getUrl();
            if (masterUrl != null && masterUrl.contains("sqlserver")) {
                org.springframework.jdbc.core.JdbcTemplate masterJdbcTemplate = new org.springframework.jdbc.core.JdbcTemplate(
                        masterDataSource);

                // 1. Dynamic lookup from AD_COMPANY_CREDENTIAL table in database
                try {
                    java.util.List<String> dbSourceNames = masterJdbcTemplate.queryForList(
                            "SELECT TOP 1 DB_SOURCE_NAME FROM AD_COMPANY_CREDENTIAL WHERE (UPPER(SHORT_NAME) = UPPER(?) OR UPPER(CLIENT_CODE) = UPPER(?) OR UPPER(DB_SOURCE_NAME) = UPPER(?)) AND DB_SOURCE_NAME IS NOT NULL AND LTRIM(RTRIM(DB_SOURCE_NAME)) <> ''",
                            String.class, tid, tid, tid);
                    if (dbSourceNames != null && !dbSourceNames.isEmpty() && dbSourceNames.get(0) != null && !dbSourceNames.get(0).trim().isEmpty()) {
                        String matchedDb = dbSourceNames.get(0).trim();
                        Integer count = masterJdbcTemplate.queryForObject(
                                "SELECT COUNT(1) FROM sys.databases WHERE state_desc = 'ONLINE' AND UPPER(name) = UPPER(?)",
                                Integer.class, matchedDb);
                        if (count != null && count > 0) {
                            return matchedDb;
                        }
                    }
                } catch (Exception ignored) {
                }

                // 2. Check if tenantId directly matches an ONLINE database in SQL Server
                try {
                    java.util.List<String> directDb = masterJdbcTemplate.queryForList(
                            "SELECT name FROM sys.databases WHERE state_desc = 'ONLINE' AND UPPER(name) = UPPER(?)",
                            String.class, tid);
                    if (directDb != null && !directDb.isEmpty()) {
                        return directDb.get(0);
                    }
                } catch (Exception ignored) {
                }
            }
        } catch (Exception ignored) {
        }

        return tid;
    }

    public void createTenantDataSource(String tenantId) {
        if (tenantId == null || tenantId.trim().isEmpty() || !(dataSource instanceof DynamicRoutingDataSource)) {
            return;
        }

        DynamicRoutingDataSource routingDataSource = (DynamicRoutingDataSource) dataSource;

        if (routingDataSource.containsDataSource(tenantId)) {
            return;
        }

        synchronized (this) {
            if (routingDataSource.containsDataSource(tenantId)) {
                return;
            }

            String masterUrl = dataSourceProperties.getUrl();
            if (masterUrl == null)
                return;

            String dbName = resolveActualDatabaseName(tenantId);
            String tenantUrl = masterUrl.replaceAll("(?i)databaseName=[^;]*", "databaseName=" + dbName);

            // Ensure no duplicate databaseName parameters if replacement was tricky
            if (!tenantUrl.toLowerCase().contains("databasename=" + dbName.toLowerCase())) {
                tenantUrl = masterUrl + ";databaseName=" + dbName;
            }

            HikariDataSource tenantDs = dataSourceProperties.initializeDataSourceBuilder()
                    .type(HikariDataSource.class)
                    .build();

            tenantDs.setJdbcUrl(tenantUrl);
            tenantDs.setPoolName(tenantId.trim() + "-Pool");
            tenantDs.setConnectionInitSql("SET NOCOUNT ON");

            // Optimization for Multi-Tenancy
            tenantDs.setMinimumIdle(2);
            tenantDs.setMaximumPoolSize(50);
            tenantDs.setIdleTimeout(300000); // 5 minutes
            tenantDs.setConnectionTimeout(15000);
            tenantDs.setValidationTimeout(5000);
            tenantDs.setKeepaliveTime(30000);
            tenantDs.setLeakDetectionThreshold(60000);

            routingDataSource.addDataSource(tenantId, tenantDs);
            System.out.println("Lazy-initialized connection pool for tenant: " + tenantId + " -> DB: " + dbName);

            // Execute SQL Migrations in background so incoming HTTP requests don't block
            java.util.concurrent.CompletableFuture.runAsync(() -> {
                try {
                    org.springframework.jdbc.core.JdbcTemplate tenantJdbcTemplate = new org.springframework.jdbc.core.JdbcTemplate(
                            tenantDs);
                    com.autonoma.erp.config.SqlMigrationRunner runner = new com.autonoma.erp.config.SqlMigrationRunner(
                            tenantJdbcTemplate);
                    runner.runMigrations(tenantJdbcTemplate);
                    System.out.println("Successfully migrated database schema for tenant: " + tenantId + " (" + dbName + ")");
                } catch (Exception e) {
                    System.err.println("Failed to migrate database schema for tenant: " + tenantId + ": " + e.getMessage());
                }
            });
        }
    }
}
