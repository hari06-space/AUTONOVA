package com.autonoma.erp.config;

import org.springframework.jdbc.datasource.lookup.AbstractRoutingDataSource;
import javax.sql.DataSource;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class DynamicRoutingDataSource extends AbstractRoutingDataSource {

    private final Map<Object, Object> targetDataSources = new ConcurrentHashMap<>();

    @Override
    protected Object determineCurrentLookupKey() {
        return TenantContextHolder.getTenantId();
    }

    @Override
    public void setTargetDataSources(Map<Object, Object> targetDataSources) {
        this.targetDataSources.putAll(targetDataSources);
        super.setTargetDataSources(this.targetDataSources);
    }

    public void addDataSource(String tenantId, DataSource dataSource) {
        this.targetDataSources.put(tenantId, dataSource);
        super.setTargetDataSources(this.targetDataSources);
        super.afterPropertiesSet();
    }

    public boolean containsDataSource(String tenantId) {
        return targetDataSources.containsKey(tenantId);
    }

    public DataSource getDataSource(String tenantId) {
        return (DataSource) targetDataSources.get(tenantId);
    }
}
