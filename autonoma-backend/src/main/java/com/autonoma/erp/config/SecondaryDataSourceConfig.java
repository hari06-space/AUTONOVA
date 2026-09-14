package com.autonoma.erp.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

@Configuration
@ConditionalOnProperty(name = "spring.secondary.datasource.url")
public class SecondaryDataSourceConfig {

    @Bean
    @ConfigurationProperties("spring.secondary.datasource")
    public DataSourceProperties secondaryDataSourceProperties() {
        return new DataSourceProperties();
    }

    @Bean(name = "secondaryDataSource")
    public DataSource secondaryDataSource() {
        DataSourceProperties properties = secondaryDataSourceProperties();
        HikariDataSource defaultDataSource = properties
          .initializeDataSourceBuilder()
          .type(HikariDataSource.class)
          .build();
        String url = properties.getUrl();
        if (url != null && url.contains("sqlserver")) {
            defaultDataSource.setConnectionInitSql("SET NOCOUNT ON");
        }
        defaultDataSource.setMaximumPoolSize(20);
        defaultDataSource.setMinimumIdle(2);
        defaultDataSource.setConnectionTimeout(15000);

        return new org.springframework.jdbc.datasource.AbstractDataSource() {
            private final java.util.Map<String, DataSource> dynamicCache = new java.util.concurrent.ConcurrentHashMap<>();

            private DataSource getActualDataSource() {
                String ip = MigrationCredentialsContext.getIp();
                String username = MigrationCredentialsContext.getUsername();
                String password = MigrationCredentialsContext.getPassword();
                
                if (ip == null || ip.trim().isEmpty()) {
                    return defaultDataSource;
                }
                
                String dbName = com.autonoma.erp.modules.qms.checklist.service.MasterChecklistMigrationService.getSecondaryDbName();
                String catalog = (dbName != null && !dbName.trim().isEmpty()) ? dbName : "master";
                String cacheKey = String.format("%s|%s|%s|%s", ip, username, password, catalog);
                
                return dynamicCache.computeIfAbsent(cacheKey, k -> {
                    HikariDataSource ds = new HikariDataSource();
                    String jdbcUrl = String.format("jdbc:sqlserver://%s:1433;databaseName=%s;trustServerCertificate=true;sendStringParametersAsUnicode=true;responseBuffering=adaptive;sendTimeAsDateTime=false", ip, catalog);
                    ds.setJdbcUrl(jdbcUrl);
                    ds.setUsername(username);
                    ds.setPassword(password);
                    ds.setDriverClassName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
                    ds.setConnectionInitSql("SET NOCOUNT ON");
                    ds.setMaximumPoolSize(10);
                    ds.setConnectionTimeout(10000);
                    ds.setValidationTimeout(3000);
                    return ds;
                });
            }

            @Override
            public java.sql.Connection getConnection() throws java.sql.SQLException {
                return getActualDataSource().getConnection();
            }

            @Override
            public java.sql.Connection getConnection(String username, String password) throws java.sql.SQLException {
                return getActualDataSource().getConnection(username, password);
            }
        };
    }

    public static class DynamicCatalogDataSource extends org.springframework.jdbc.datasource.DelegatingDataSource {
        private final java.util.function.Supplier<String> catalogSupplier;

        public DynamicCatalogDataSource(DataSource targetDataSource, java.util.function.Supplier<String> catalogSupplier) {
            super(targetDataSource);
            this.catalogSupplier = catalogSupplier;
        }

        @Override
        public java.sql.Connection getConnection() throws java.sql.SQLException {
            java.sql.Connection conn = super.getConnection();
            String catalog = catalogSupplier.get();
            if (catalog != null && !catalog.trim().isEmpty()) {
                conn.setCatalog(catalog.trim());
            }
            return conn;
        }

        @Override
        public java.sql.Connection getConnection(String username, String password) throws java.sql.SQLException {
            java.sql.Connection conn = super.getConnection(username, password);
            String catalog = catalogSupplier.get();
            if (catalog != null && !catalog.trim().isEmpty()) {
                conn.setCatalog(catalog.trim());
            }
            return conn;
        }
    }

    @Bean(name = "secondaryJdbcTemplate")
    public JdbcTemplate secondaryJdbcTemplate(@Qualifier("secondaryDataSource") DataSource dataSource) {
        DataSource dynamicDataSource = new DynamicCatalogDataSource(dataSource, () -> {
            return com.autonoma.erp.modules.qms.checklist.service.MasterChecklistMigrationService.getSecondaryDbName();
        });
        return new JdbcTemplate(dynamicDataSource);
    }
}
