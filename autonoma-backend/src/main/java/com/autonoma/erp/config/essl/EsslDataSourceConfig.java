package com.autonoma.erp.config.essl;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

@Configuration
public class EsslDataSourceConfig {

    @Bean(name = "esslRoutingDataSource")
    public EsslDynamicRoutingDataSource esslRoutingDataSource() {
        EsslDynamicRoutingDataSource routingDataSource = new EsslDynamicRoutingDataSource();
        routingDataSource.setTargetDataSources(new HashMap<>());
        routingDataSource.afterPropertiesSet();
        return routingDataSource;
    }

    @Bean(name = "esslJdbcTemplate")
    public JdbcTemplate esslJdbcTemplate(@Qualifier("esslRoutingDataSource") DataSource esslRoutingDataSource) {
        return new JdbcTemplate(esslRoutingDataSource);
    }
}
