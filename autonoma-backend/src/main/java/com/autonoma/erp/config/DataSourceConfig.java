package com.autonoma.erp.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.boot.context.properties.ConfigurationProperties;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

@Configuration
public class DataSourceConfig {

    @Bean
    @Primary
    @ConfigurationProperties("spring.datasource")
    public DataSourceProperties dataSourceProperties() {
        return new DataSourceProperties();
    }

    @Bean(name = "masterDataSource")
    public DataSource masterDataSource(DataSourceProperties dataSourceProperties) {
        HikariDataSource dataSource = dataSourceProperties.initializeDataSourceBuilder().type(HikariDataSource.class).build();
        String url = dataSource.getJdbcUrl();
        if (url == null) {
            url = dataSourceProperties.getUrl();
        }
        System.out.println("[DataSourceConfig] Found JDBC URL: " + url);
        if (url != null && url.contains("sqlserver")) {
            dataSource.setConnectionInitSql("SET NOCOUNT ON");
        } else {
            System.out.println("[DataSourceConfig] No connection init SQL set for non-SQL Server database");
        }
        dataSource.setMaximumPoolSize(50);
        dataSource.setMinimumIdle(2);
        dataSource.setConnectionTimeout(15000);
        return dataSource;
    }

    @Bean
    @Primary
    public DataSource dataSource(DataSource masterDataSource) {
        DynamicRoutingDataSource routingDataSource = new DynamicRoutingDataSource();
        Map<Object, Object> targetDataSources = new HashMap<>();

        routingDataSource.setDefaultTargetDataSource(masterDataSource);
        targetDataSources.put("AUTONOMA", masterDataSource);

        routingDataSource.setTargetDataSources(targetDataSources);
        routingDataSource.afterPropertiesSet();
        return routingDataSource;
    }

    @Bean
    @Primary
    public org.springframework.jdbc.core.JdbcTemplate jdbcTemplate(DataSource dataSource) {
        return new org.springframework.jdbc.core.JdbcTemplate(dataSource);
    }
}
